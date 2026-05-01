# 01 — Salary Structure Builder

## Purpose

A `SalaryStructure` is a tenant-defined template that describes how a CTC is broken into components, what statutory flags apply to each, and what formulas compute their values. Multiple employees share the same structure; per-employee CompensationRecord stores actual computed values.

This file specifies: structure schema, component rule expressions, applicability rules, structure versioning, and migration when a structure changes.

## Schema

```typescript
interface SalaryStructure extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  // identity
  structureCode: string;                   // 'STRUCT-ENG-FY26'
  name: string;                            // 'Standard Engineer Structure FY26-27'
  description?: string;
  
  // versioning
  versionNumber: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  supersededBy?: ObjectId;
  supersedes?: ObjectId;
  
  // applicability
  applicableTo?: {
    employmentTypes?: EmploymentType[];
    designationLevels?: string[];
    departments?: ObjectId[];
    locations?: ObjectId[];
    employeeCategories?: ('white-collar' | 'blue-collar')[];
    ctcRange?: { from: Decimal128; to: Decimal128 };
    minServiceMonths?: number;             // e.g., post-confirmation only
    customConditions?: any;                // for v2 advanced filters
  };
  
  // pay rule
  payCycle: 'monthly' | 'bi-monthly' | 'fortnightly' | 'weekly' | 'daily-piece-rated';
  payCalendarBasis: 'calendar-month' | 'fixed-day-cycle' | 'weekly-cycle';
  payCycleStart?: number;                  // day of month for fixed-day-cycle (e.g., 26 = 26th to 25th next month)
  
  // workdays definition (for LOP / pro-ration)
  workdaysBasis: 'calendar-days' | 'working-days' | 'fixed-26' | 'fixed-30';
  // calendar-days: 28/29/30/31 depending on month
  // working-days: actual working days in the month (excludes weekly offs and holidays)
  // fixed-26: always 26 (factory standard, used in OT calculation)
  // fixed-30: always 30 (some companies use this for simplicity)
  
  // components
  components: SalaryComponentRule[];
  
  // statutory flags (overrides per structure if needed)
  pfWageBasis?: 'basic-da-only' | 'wage-code-broad' | 'tenant-config';
  esiWageBasis?: 'gross-minus-exclusions' | 'tenant-config';
  
  // status
  isActive: boolean;
  isDefault: boolean;                      // default for new hires matching applicability
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}

interface SalaryComponentRule {
  // identity
  componentCode: string;                   // 'BASIC', 'HRA', 'SPECIAL'
  componentName: string;                   // display
  componentLibraryRefId: ObjectId;         // ref to ComponentDefinition (component library)
  
  // ordering (computation sequence)
  sequence: number;                        // lower = computed first
  
  // type
  componentType: ComponentType;
  payoutFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'annual' | 'one-time' | 'on-availment';
  
  // computation
  computationMethod: ComputationMethod;
  formulaExpression?: string;              // for 'formula'
  fixedAmount?: Decimal128;                // for 'fixed'
  percentageOf?: 'basic' | 'gross' | 'ctc' | 'basic-da' | string;
  percentageValue?: number;                // 0.40 = 40%
  cappedAt?: Decimal128;                   // hard cap
  flooredAt?: Decimal128;                  // hard floor
  
  // statutory flags (overrides component library defaults if specified)
  countsForPf?: boolean;
  countsForEsi?: boolean;
  countsForGratuity?: boolean;
  countsForBonus?: boolean;
  countsForCtc?: boolean;
  countsForGross?: boolean;
  isTaxable?: boolean;
  taxExemptionSection?: string;
  
  // pro-ration on LOP
  proRateOnLop: boolean;                   // most components yes; some (LTA, FBP) no
  
  // visibility
  showOnPayslip: boolean;
  payslipDisplayName?: string;             // override display name for payslip
  payslipDisplayOrder?: number;
  
  // FBP sub-component
  isFbpSubComponent: boolean;
  fbpParentCode?: string;                  // 'FBP_POOL'
  
  // notes
  notes?: string;
}

type ComponentType =
  | 'earning'                              // adds to gross
  | 'deduction'                            // employee-borne, reduces net
  | 'employer-cost'                        // not in gross, in CTC
  | 'reimbursement'                        // bills required
  | 'fbp-pool'                             // employee splits
  | 'arrears'                              // retro-pay
  | 'one-time';                            // ad-hoc additions/deductions

type ComputationMethod =
  | 'fixed'                                // hardcoded amount
  | 'formula'                              // expression eval
  | 'percentage-of-basic'
  | 'percentage-of-gross'
  | 'percentage-of-ctc'
  | 'percentage-of-basic-da'
  | 'balance'                              // whatever is left after all other components
  | 'rule-engine'                          // call statutory rules engine
  | 'custom-table'                         // lookup table (e.g., HRA % by city)
  | 'employee-input';                      // employee declares (FBP)
```

## Mandatory indexes

```typescript
{ tenantId: 1, entityId: 1, structureCode: 1 }, unique
{ tenantId: 1, entityId: 1, isActive: 1, isDefault: 1 }
{ tenantId: 1, entityId: 1, effectiveFrom: 1, effectiveTo: 1 }
```

## Formula expressions

Formula language is a small, safe DSL. Supported operations:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `>`, `>=`, `<`, `<=`, `==`, `!=`
- Logical: `&&`, `||`, `!`
- Functions: `MIN`, `MAX`, `IF`, `ROUND`, `CEIL`, `FLOOR`, `ABS`
- Variables (read-only):
  - `ctcAnnual`, `ctcMonthly`
  - `basic`, `da`, `hra`, `gross`
  - `applicableDays`, `lopDays`, `workedDays`, `daysInMonth`
  - `pfApplicableWage`, `esiApplicableWage`
  - Statutory references: `PF_CEILING`, `ESI_CEILING`, `MIN_WAGE`
  - State / location: `STATE`, `IS_METRO`, `LOCATION`
  - Employee: `EMPLOYEE_CATEGORY`, `EMPLOYEE_AGE`, `EMPLOYEE_GENDER`
  - Tenant: `TENANT_CONFIG.<key>`

Examples:

```
basic = ctcAnnual * 0.40
hra = basic * (IS_METRO ? 0.50 : 0.40)
employerPf = MIN(basic + da, PF_CEILING) * 0.12
specialAllowance = ctcAnnual / 12 - basic / 12 - hra / 12 - lta / 12 - employerPfMonthly - gratuityProvisionMonthly - groupHealthMonthly
```

The DSL is evaluated by a deterministic interpreter — no `eval()`, no JavaScript injection. Parsing produces an AST; evaluation walks the AST with bound variables.

`[v2]` UI builder generates these formulas visually; advanced users can write directly.

## Computation sequence

Components have `sequence` numbers. Engine computes in ascending order. Earlier components are available as variables for later ones.

Typical sequence:

```
10  BASIC                (percentage-of-ctc)
20  DA                   (fixed or percentage; rare in white-collar)
30  HRA                  (percentage-of-basic)
40  TRANSPORT_ALLOWANCE  (fixed)
50  LTA                  (fixed)
60  FBP_POOL             (computed from total, declared by employee)
70  EMPLOYER_PF          (rule-engine: PF strategy)
80  EMPLOYER_ESI         (rule-engine: ESI strategy if applicable)
90  EMPLOYER_GRATUITY    (formula: 4.81% of basic)
95  GROUP_HEALTH_INSURANCE  (fixed employer cost)
100 SPECIAL_ALLOWANCE    (balance)

200 EMPLOYEE_PF          (rule-engine, deduction)
210 EMPLOYEE_ESI         (rule-engine, deduction)
220 PT                   (rule-engine, deduction per state)
230 LWF                  (rule-engine, deduction per state)
240 TDS                  (rule-engine, monthly TDS)
250 OTHER_DEDUCTIONS     (one-time inputs: loan, advance, etc.)
```

## Worked example — Engineer structure FY26-27

CTC = ₹15,00,000/year. Standard structure for tech engineer at Bangalore (metro).

```yaml
SalaryStructure: STRUCT-ENG-FY26
  payCycle: monthly
  workdaysBasis: working-days
  
  components:
    - code: BASIC
      sequence: 10
      method: percentage-of-ctc
      percentageValue: 0.40
      countsForPf: true
      countsForGratuity: true
      countsForBonus: true
      proRateOnLop: true
      
    - code: HRA
      sequence: 30
      method: formula
      formula: 'basic * (IS_METRO ? 0.50 : 0.40)'
      countsForEsi: true
      taxExemptionSection: '10(13A)'
      proRateOnLop: true
      
    - code: LTA
      sequence: 50
      method: fixed
      fixedAmount: 40000
      payoutFrequency: annual
      taxExemptionSection: '10(5)'
      proRateOnLop: false
      
    - code: TRANSPORT_ALLOWANCE
      sequence: 40
      method: fixed
      fixedAmount: 2400  # annual; ₹200/month
      proRateOnLop: true
      
    - code: EMPLOYER_PF
      sequence: 70
      method: rule-engine
      ruleKey: 'pf:central:default'
      componentType: employer-cost
      countsForCtc: true
      
    - code: EMPLOYER_GRATUITY
      sequence: 90
      method: formula
      formula: 'basic * 0.0481'  # 4.81% actuarial
      componentType: employer-cost
      countsForCtc: true
      
    - code: GROUP_HEALTH_INSURANCE
      sequence: 95
      method: fixed
      fixedAmount: 12000  # annual
      componentType: employer-cost
      countsForCtc: true
      
    - code: SPECIAL_ALLOWANCE
      sequence: 100
      method: balance  # whatever is left
      countsForEsi: true
      proRateOnLop: true
```

### Computed values for Pankaj at ₹15L CTC, Bangalore

```
ctcAnnual = 1500000
ctcMonthly = 125000

basic     = 1500000 × 0.40                         = 600000 / yr   →  50000 / mo
hra       = 600000 × 0.50 (Bangalore is metro)     = 300000 / yr   →  25000 / mo
lta       = 40000 / yr (paid annually as one-time) →                    3333 / mo (notional)
transport = 2400 / yr                              →                     200 / mo
employerPf = MIN(50000, 15000) × 0.12 × 12         = 21600 / yr    →   1800 / mo
employerGratuity = 600000 × 0.0481                 = 28860 / yr    →   2405 / mo
groupHealth = 12000 / yr                           →                    1000 / mo

Subtotal of fixed earnings + employer costs
  = 600000 + 300000 + 40000 + 2400 + 21600 + 28860 + 12000
  = 1004860

specialAllowance (balance) = 1500000 - 1004860      = 495140 / yr  →  41262 / mo

Verify CTC:
  600000 + 300000 + 40000 + 2400 + 495140 + 21600 + 28860 + 12000
  = 1500000 ✓

Monthly gross (excluding employer costs):
  basic + hra + lta-monthly-equiv + transport + special
  = 50000 + 25000 + 3333 + 200 + 41262 = 119795

Monthly fixed gross (excluding LTA which is one-time):
  basic + hra + transport + special = 116462

CTC monthly = 125000 = 116462 + 1800 + 2405 + 1000 + 3333 ✓
```

## Multi-currency

`[v3]` Currently INR only. Schema supports `Money = { amount: Decimal128, currency: 'INR' }` for forward compat.

## Structure inheritance

Tenant can have a "global" structure (defined at tenant level) and entity-specific overrides:

- Tenant defines base structure
- Entity may override specific components (e.g., Bangalore office uses higher HRA %)
- Resolution: merge with entity overrides taking precedence

`[OPEN]` Should we also support employee-level overrides (one specific employee gets a custom structure)? Recommend: yes for senior hires; HR-only operation; audited.

## Structure changes mid-FY

Tenant updates structure (e.g., HRA % changes from 40% to 50%). Two scenarios:

### Scenario A: New version effective from a future date

- New SalaryStructure version with `effectiveFrom = future date`
- Existing CompensationRecords continue using old version
- New hires after `effectiveFrom`: use new version
- Old employees on old structure: unaffected unless transitioned

### Scenario B: Mass migration

- All employees on old structure migrated to new structure
- Each migration creates new `CompensationRecord` for the employee with `effectiveFrom = migration date`
- Retro effects: typically, structure migration happens at FY start; if mid-FY, retros apply

`[OPEN]` Auto-migrate or HR-confirm-each? Recommend: auto-migrate with HR review batch.

## Validation rules

| Rule | Description |
|---|---|
| Sum of monthly | Sum of (`countsForCtc=true` components, scaled to monthly) must equal ctcMonthly within ₹1 tolerance |
| Basic floor | `basic >= MIN_WAGE × 26` for the state (Minimum Wages Act) `[CA-REVIEW]` |
| HRA cap | HRA shouldn't exceed `basic` (would be tax-questionable) |
| Special is balance | Only one component can be 'balance' method |
| No circular refs | Component A formula referencing B which references A is rejected |
| PF wage definition | At least one component must `countsForPf=true` (else no PF) |

## Templates shipped with HRMS

The product ships with starter templates per common industry / category:

| Template | Industry | Notes |
|---|---|---|
| `STARTER-IT-WHITE-COLLAR` | IT services | Basic 40%, HRA 50% (metro), special balance |
| `STARTER-MANUFACTURING-BLUE-COLLAR` | Manufacturing | Basic 60%, DA per state DA notification, fewer allowances |
| `STARTER-RETAIL-MIXED` | Retail | Hybrid for shop floor + corporate |
| `STARTER-STARTUP-EARLY` | Startup | Lean structure, minimal employer cost |
| `STARTER-STARTUP-FUNDED` | Startup with funding | ESOP integration, more employer benefits |
| `STARTER-FACTORY-FACTORIES-ACT` | Factory under Factories Act | Includes shift allowances, statutory adders |
| `STARTER-CONTRACT-LABOUR` | CLRA-engaged | Wage as per principal employer rate, separate FF |

Tenants can copy a template, customize, save as their structure.

## Per-employee structure deviation

Most employees: standard structure → CompensationRecord uses that structure.

Sometimes (senior hires, special cases): HR overrides specific component values for a specific employee, deviating from structure.

```typescript
// In CompensationRecord
structureOverrides?: Array<{
  componentCode: string;
  overrideMethod: 'fixed' | 'formula' | 'absolute-amount';
  overrideValue: any;
  reason: string;
  approvedBy: ObjectId;
  approvedAt: Date;
}>;
```

When engine computes for this employee, it applies overrides on top of structure.

## Audit and compliance

- Every structure change is audit-logged
- Structure versions never deleted; superseded only
- Migration of employees to new structure: audit batch ID
- Per-employee deviation: requires explicit approval, audit log

## Open questions

`[OPEN]` Visual structure builder (drag-drop in v2)? Or YAML-based? Recommend: YAML in v1; visual in v2 generates same YAML.

`[OPEN]` What happens when DA is mandated by state notification (factory)? DA changes periodically. Recommend: DA component can reference statutory rules engine for current rate; auto-revises.

`[OPEN]` Should we allow tenants to copy structures from other tenants (anonymized)? Marketplace-style. Recommend: no in v1; community templates in v3.

`[OPEN]` Per-state customization (HRA differs by metro / non-metro). Default: tenant defines structure with conditional formulas; alternative is per-state structures. Recommend: conditional formulas in single structure; cleaner.

## Cross-references

- [02-component-library.md](./02-component-library.md) — component catalog
- [05-payroll-engine.md](./05-payroll-engine.md) — engine consuming structure
- [/01-employee/03-compensation-record.md](../01-employee/03-compensation-record.md) — CompensationRecord
- [/00-foundations/06-statutory-rules-engine.md](../00-foundations/06-statutory-rules-engine.md) — rule-engine method
