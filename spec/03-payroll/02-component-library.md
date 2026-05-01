# 02 — Component Library

## Purpose

Catalog of every salary component the platform recognizes, with statutory tagging and tax treatment. Tenants pick from this catalog when building structures; they can add custom components but cannot redefine statutory tagging.

## Component definition schema

```typescript
interface ComponentDefinition extends BaseDocument {
  _id: ObjectId;
  // tenantId optional; system-defined components are global
  tenantId?: ObjectId;
  
  // identity
  code: string;                            // 'BASIC', 'HRA', 'TENANT_CUSTOM_001'
  name: string;
  category: ComponentCategory;
  
  // type
  componentType: ComponentType;
  payoutFrequency: PayoutFrequency;
  
  // statutory defaults (can be overridden in salary structure)
  statutoryFlags: {
    countsForPf: boolean;
    countsForEsi: boolean;
    countsForGratuity: boolean;
    countsForBonus: boolean;
    countsForCtc: boolean;
    countsForGross: boolean;
    isTaxable: boolean;
    taxExemptionSection?: string;
    taxExemptionMaxAnnual?: Decimal128;
    proRateOnLop: boolean;
  };
  
  // statutory citations
  statutoryCitations?: {
    actName?: string;
    section?: string;
  }[];
  
  // tenant-defined or system-defined
  isSystemDefined: boolean;
  
  // status
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
  isDeleted: boolean;
}

type ComponentCategory =
  | 'core-earning'                         // Basic, DA
  | 'allowance-tax-exempt'                 // HRA, LTA, Children Edu, Hostel
  | 'allowance-special'                    // Special, Performance, Position
  | 'reimbursement'                        // Phone, Internet, Books, Fuel
  | 'fbp'                                  // FBP pool and sub-components
  | 'shift-allowance'                      // Night shift, hardship, hazard
  | 'incentive'                            // Production, attendance bonus
  | 'one-time'                             // Sign-on, retention, ad-hoc
  | 'reward'                               // Performance bonus, ESOP value
  | 'statutory-deduction'                  // PF, ESI, PT, LWF, TDS
  | 'employer-cost'                        // Employer PF, gratuity, insurance
  | 'recovery'                             // Loan, advance, asset recovery
  | 'lop-and-arrears';

type PayoutFrequency =
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'annual'
  | 'one-time'
  | 'on-availment';                        // pays only when claimed (LTA, reimbursements)
```

## System-defined components

The following components ship with the platform and cannot be modified.

### Core earnings

| Code | Name | PF | ESI | Gratuity | Bonus | Tax | Pro-rate on LOP | Notes |
|---|---|---|---|---|---|---|---|---|
| `BASIC` | Basic Salary | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | The most important component |
| `DA` | Dearness Allowance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Common in PSU / blue-collar |
| `WAGES` | Wages (under Wage Code) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Equivalent to Basic+DA in Wage Code definition |
| `RETAINING_ALLOWANCE` | Retaining Allowance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Per Wage Code §2(y) |

### Tax-exempt allowances (old regime; mostly subsumed in new regime)

| Code | Name | Section | Cap (FY26-27) | Notes |
|---|---|---|---|---|
| `HRA` | House Rent Allowance | 10(13A) | min(actual, 50% of (basic+DA) for metro / 40% non-metro, rent paid - 10% of (basic+DA)) | Most claimed exemption |
| `LTA` | Leave Travel Allowance | 10(5) | actual fare | 2 trips per 4-year block; domestic only |
| `CHILDREN_EDU_ALLOWANCE` | Children's Education Allowance | 10(14) | ₹100/child/month, max 2 children | ₹2,400/year max |
| `CHILDREN_HOSTEL_ALLOWANCE` | Children's Hostel Subsidy | 10(14) | ₹300/child/month, max 2 children | ₹7,200/year max |
| `MEAL_ALLOWANCE` | Meal Coupons / Allowance | 17(2) | ₹50/meal × meals served | Sodexo, Zaggle, etc. |
| `UNIFORM_ALLOWANCE` | Uniform Allowance | 10(14) | actual | If uniform mandatory |
| `TRANSPORT_ALLOWANCE_PWD` | Transport for PWD employees | 10(14) | ₹3,200/month | For physically handicapped |
| `OFFICE_BOOKS_PERIODICALS` | Books & Periodicals | 17(2) | actual reimbursement | If business-related |

`[VERIFY]` Caps under Income Tax Act 1961 vs Income Tax Act 2025. New regime (default for FY 2026-27 under IT Act 2025) eliminates most of these exemptions in favor of higher slab structure + standard deduction.

### Special allowances (taxable)

| Code | Name | Notes |
|---|---|---|
| `SPECIAL_ALLOWANCE` | Special Allowance | Balance/leftover; fully taxable |
| `CITY_COMPENSATORY` | City Compensatory Allowance | For specific cities |
| `POSITION_ALLOWANCE` | Position-based allowance | Senior roles |
| `RESEARCH_ALLOWANCE` | Research Allowance | Academic / R&D |

### Shift / hardship allowances

| Code | Name | Typical | Notes |
|---|---|---|---|
| `NIGHT_SHIFT_ALLOWANCE` | Night Shift Allowance | ₹200-500 / shift | [BLUE-COLLAR] mostly |
| `HARDSHIP_ALLOWANCE` | Hardship / Hazard | varies | Hot environment, heavy work |
| `WASHING_ALLOWANCE` | Uniform Washing Allowance | ₹200-500 / month | [BLUE-COLLAR] |
| `TIFFIN_ALLOWANCE` | Tiffin / Food Allowance | varies | Some factories |
| `CONVEYANCE_ALLOWANCE` | Conveyance Allowance | varies | Less relevant after standard deduction (new regime) |
| `MOBILE_ALLOWANCE` | Mobile Allowance | ₹500-2000 / month | Reimbursement-based often |

### Reimbursements

| Code | Name | Bills required | Notes |
|---|---|---|---|
| `FUEL_REIMBURSEMENT` | Fuel Reimbursement | yes | Motor + driver expenses |
| `PHONE_REIMBURSEMENT` | Phone & Internet | yes | |
| `BROADBAND_REIMBURSEMENT` | Broadband (WFH) | yes | |
| `BOOKS_REIMBURSEMENT` | Books & Periodicals | yes | |
| `MEDICAL_REIMBURSEMENT` | Medical Reimbursement | yes | Up to ₹15K (old regime, subsumed in new) |
| `LTA_REIMBURSEMENT` | LTA against actual travel | yes (travel proofs) | |

### FBP (Flexible Benefits Plan)

| Code | Name | Notes |
|---|---|---|
| `FBP_POOL` | FBP Pool | Gross pool amount per FY |
| `FBP_LTA` | FBP - LTA | Sub-component |
| `FBP_FUEL` | FBP - Fuel | Sub-component |
| `FBP_MEAL` | FBP - Meal | Sub-component |
| `FBP_PHONE` | FBP - Phone | Sub-component |
| `FBP_BOOKS` | FBP - Books | Sub-component |
| `FBP_DRIVER` | FBP - Driver Salary | Sub-component |
| `FBP_PROF_DEV` | FBP - Professional Development | Sub-component |

### Variable / incentive

| Code | Name | Frequency | Notes |
|---|---|---|---|
| `PERFORMANCE_BONUS` | Performance Bonus | annual / quarterly | Fully taxable |
| `STATUTORY_BONUS` | Statutory Bonus (Bonus Act) | annual | Min 8.33%, max 20% |
| `ATTENDANCE_BONUS` | Attendance Bonus | monthly / quarterly | Counts for ESI (depends on definition) |
| `PRODUCTION_INCENTIVE` | Production Incentive | varies | Output-based |
| `SALES_INCENTIVE` | Sales Incentive / Commission | monthly | Variable pay |
| `RETENTION_BONUS` | Retention Bonus | scheduled | Clawback if early exit |
| `SIGN_ON_BONUS` | Sign-on Bonus | one-time | At joining; clawback typical |
| `REFERRAL_BONUS` | Referral Bonus | one-time | When referred candidate joins |
| `ESOP_VALUE` | ESOP Notional Value | one-time / annual | Notional CTC inclusion |

### Statutory deductions

| Code | Name | Notes |
|---|---|---|
| `EMPLOYEE_PF` | Employee PF | 12% of (Basic+DA), capped at ₹15,000 (or actuals if employer agreed) |
| `EMPLOYEE_PF_VPF` | Employee VPF | Voluntary; up to 88% of basic |
| `EMPLOYEE_ESI` | Employee ESI | 0.75% of gross if applicable |
| `PT` | Professional Tax | Per state slab |
| `LWF` | Labour Welfare Fund | Per state |
| `TDS` | Tax Deducted at Source | Per IT Act slabs (old or new regime) |
| `TDS_HIGHER_206AA` | TDS at 20% (PAN missing/inoperative) | Section 206AA |

### Employer costs

| Code | Name | Notes |
|---|---|---|
| `EMPLOYER_PF` | Employer PF | 12% of (Basic+DA); 8.33% to EPS, 3.67% to EPF |
| `EMPLOYER_PF_ADMIN` | EPF Admin Charges | 0.5% paid by employer |
| `EMPLOYER_EDLI` | EDLI Charges | 0.5% paid by employer (capped at ₹15,000 wage) |
| `EMPLOYER_ESI` | Employer ESI | 3.25% of gross if applicable |
| `EMPLOYER_GRATUITY_PROVISION` | Gratuity Provision | ~4.81% of basic; actuarial |
| `GROUP_HEALTH` | Group Health Insurance | Fixed; per family member |
| `GROUP_TERM_LIFE` | Group Term Life | Fixed |
| `GROUP_PERSONAL_ACCIDENT` | Group Personal Accident | Fixed |
| `WORKMEN_COMPENSATION` | Workmen Compensation | Per Workmen's Compensation Act for [BLUE-COLLAR] |

### Recoveries

| Code | Name | Notes |
|---|---|---|
| `LOAN_REPAYMENT` | Loan EMI | Tenant-issued loan to employee |
| `SALARY_ADVANCE` | Salary Advance Repayment | One-time advance recovery |
| `ASSET_RECOVERY` | Asset Recovery | Damaged / lost asset |
| `NOTICE_RECOVERY` | Notice Period Recovery | If employee exits without serving notice |
| `EXCESS_PAY_RECOVERY` | Excess Pay Recovery | Recover overpayment |

### LOP & arrears

| Code | Name | Notes |
|---|---|---|
| `LOP_DEDUCTION` | Loss of Pay | computed: lopDays × dailyRate |
| `ARREARS` | Salary Arrears | Retro pay for backdated revisions |
| `ARREARS_PF` | PF on Arrears | Statutory contribution on retro wages |
| `ARREARS_TDS` | TDS on Arrears | Tax on retro |

## Tenant-defined components

Tenants can add custom components for tenant-specific needs:

```typescript
{
  code: 'TENANT_CUSTOM_PROJECT_ALLOWANCE',
  name: 'Project Allowance',
  isSystemDefined: false,
  componentType: 'earning',
  category: 'allowance-special',
  statutoryFlags: {
    countsForPf: false,
    countsForEsi: true,
    countsForCtc: true,
    isTaxable: true,
    proRateOnLop: true,
  },
  ...
}
```

Tenant-custom components:
- Cannot override system-defined statutory tagging
- Must declare statutory treatment explicitly
- Available only within that tenant
- HR Manager role required to create

## Component-tagging matrix (key reference)

This table is consulted by the engine to determine PF / ESI / TDS treatment.

| Component | PF wage | ESI wage | Gratuity | Bonus Act | Taxable |
|---|---|---|---|---|---|
| BASIC | ✓ | ✓ | ✓ | ✓ | ✓ |
| DA | ✓ | ✓ | ✓ | ✓ | ✓ |
| HRA | ✗ | ✓ | ✗ | ✗ | partial (10(13A) exempt) |
| Special Allowance | ✗ ✪ | ✓ | ✗ ✪ | ✗ ✪ | ✓ |
| LTA | ✗ | ✓ | ✗ | ✗ | partial (10(5) exempt) |
| Conveyance | ✗ | ✓ | ✗ | ✗ | ✓ (was exempt up to ₹19,200/yr in old regime; now in standard deduction) |
| Performance Bonus | ✗ | ✗ ✪ | ✗ | ✗ | ✓ |
| Statutory Bonus | ✗ | ✓ | ✗ | n/a | ✓ |
| OT | ✗ | ✓ | ✗ | ✗ | ✓ |
| Reimbursements | ✗ | ✗ ✪ | ✗ | ✗ | non-taxable if bills submitted |
| Employer PF | ✗ | ✗ | ✗ | ✗ | exempt (employer's contribution to PF up to 12% is exempt) |
| Group Health | ✗ | ✗ | ✗ | ✗ | exempt |

✪ = contested / interpretation-dependent. See `[CA-REVIEW]` notes.

`[CA-REVIEW]` Multiple Supreme Court rulings (2019 onwards: SBI vs RPFC, Vivekananda Vidya Mandir, etc.) have interpreted "wages" for PF broadly. Notably, the 2019 ruling held that "special allowance" paid universally and ordinarily forms part of basic wages. Many tenants now include special allowance in PF wage. The platform supports both interpretations via `pfWageBasis` config.

## Statutory wage definitions (reference)

### "Wages" under Code on Wages 2019 (§ 2(y))

> Includes: basic pay, dearness allowance, retaining allowance.
> Excludes: any bonus payable, value of any house-accommodation, contribution by employer to any pension or provident fund, conveyance allowance, sum paid to defray special expenses, house rent allowance, remuneration payable under any award/settlement, overtime, commission payable on amount of sales, gratuity, retrenchment compensation, statutory ex-gratia.

The 50% rule: if any of the excluded items (HRA, conveyance, etc.) exceeds 50% of total remuneration, the excess is included in "wages".

This is the most consequential definition for PF. The HRMS must implement the 50% inclusion rule.

```typescript
function computePfWageUnderWageCode(componentBreakdown): Decimal128 {
  const basicAndDA = sum of components flagged 'wages-under-wage-code-§2y'
  const totalRemuneration = sum of all earnings
  const excludedItems = totalRemuneration - basicAndDA
  
  const excessExcludedOver50 = MAX(0, excludedItems - totalRemuneration * 0.5)
  
  return basicAndDA + excessExcludedOver50
}
```

`[VERIFY]` § 2(y) interpretation; precise calculation depends on judicial guidance on Wage Code which is recent (2019-2025).

### "Wage" under ESI Act § 2(22)

Broader than PF. Includes most components except specific exclusions:
- Excluded: contribution by employer to any pension/PF fund, traveling allowance, sum paid to defray special expenses, gratuity payable on discharge, OT (debatable).

Most allowances flow into ESI wage. The HRMS uses a clear `countsForEsi` flag per component.

### "Salary" under Income Tax Act § 17

Different again. For tax computation. Includes most things; exemptions are specific (10(13A) HRA, 10(5) LTA, etc.).

## Component versioning

Component definitions can change over time:
- Tax exemption rules (e.g., new IT Act 2025 changes)
- Statutory cap changes

Version the ComponentDefinition with `effectiveFrom`. Engine looks up version applicable at payroll period.

## Open questions

`[OPEN]` Performance Bonus / Statutory Bonus: should we keep separate components or merge? Statutory differences make separate cleaner. Recommend: separate.

`[OPEN]` ESOP value in CTC. Notional inclusion only or actual value at grant / vesting? Many companies show ESOP value at grant date in CTC. Recommend: notional, with separate ESOP module tracking actual grants/vesting.

`[OPEN]` Tax exemption sections under IT Act 2025: which old exemptions survive? 10(13A) HRA: appears retained. 10(5) LTA: retained. Most "minor" exemptions: subsumed. CA review essential before Apr 1, 2026 payroll.

`[OPEN]` Component-level audit (every change tracked vs structure-level)? Recommend: structure-level audit; component itself versioned.

`[OPEN]` Should we support negative components (income going OUT not as deduction but as adjustment)? E.g., bonus claw-back. Recommend: model as negative-amount one-time component.

## Cross-references

- [01-salary-structure-builder.md](./01-salary-structure-builder.md) — components in structure
- [05-payroll-engine.md](./05-payroll-engine.md) — engine using components
- [/04-compliance/01-pf-act-and-formulas.md](../04-compliance/01-pf-act-and-formulas.md) — PF wage definition
- [/04-compliance/02-esi-act-and-formulas.md](../04-compliance/02-esi-act-and-formulas.md) — ESI wage
- [/04-compliance/03-tds-and-income-tax.md](../04-compliance/03-tds-and-income-tax.md) — Tax computation
