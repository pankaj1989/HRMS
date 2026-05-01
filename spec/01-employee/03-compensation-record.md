# 03 — Compensation Record

## Purpose

`CompensationRecord` defines what an employee earns, how it's structured into components, and how it changes over time. The record is **time-versioned**: every salary revision creates a new version with `effectiveFrom` set to the revision date. Old versions are never overwritten.

The actual monthly payroll math (LOP deduction, statutory deductions, perquisites, retros) lives in `/03-payroll/`. This file defines the compensation **structure**.

## Schema

```typescript
interface CompensationRecord extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeId: ObjectId;
  employmentRecordId: ObjectId;             // ref EmploymentRecord

  // versioning
  versionNumber: number;                     // 1, 2, 3 ...
  effectiveFrom: Date;                       // start of this version
  effectiveTo: Date | null;                  // end (null = current)
  supersededBy?: ObjectId;
  supersedes?: ObjectId;

  // change context
  revisionType: RevisionType;
  revisionReason?: string;
  revisionApprovalId?: ObjectId;             // ref ApprovalInstance
  revisionRequestedBy?: ObjectId;
  revisionApprovedBy?: ObjectId;
  revisionLetterDocumentId?: ObjectId;

  // pay frequency
  payCycle: 'monthly' | 'bi-monthly' | 'weekly' | 'fortnightly' | 'daily-piece-rated';
  // [BLUE-COLLAR] daily/weekly are common; [WHITE-COLLAR] almost always monthly

  // currency
  currency: 'INR';                           // v1 only

  // top-line numbers
  ctcAnnual: Decimal128;                     // Cost To Company per annum
  ctcMonthly: Decimal128;                    // ctcAnnual / 12
  
  // salary structure
  salaryStructureId: ObjectId;              // ref SalaryStructure (template + customization)
  // The salary structure breaks CTC into components (Basic, HRA, etc.)
  // Computed components are stored here for fast read; recomputed if structure changes
  componentBreakdown: ComponentValue[];

  // derived totals (DERIVED — recomputed from componentBreakdown)
  grossMonthly: Decimal128;                  // monthly fixed gross (excluding employer-borne)
  netMonthlyEstimate: Decimal128;            // approximate take-home (gross - deductions estimate)
  basicMonthly: Decimal128;
  hraMonthly: Decimal128;
  
  // employer-borne
  employerPfContributionMonthly: Decimal128;
  employerEsiContributionMonthly: Decimal128;
  employerGratuityProvisionMonthly: Decimal128;
  employerInsuranceMonthly: Decimal128;     // group health, term life

  // variable / bonus components (annual)
  performanceBonusAnnualTarget?: Decimal128; // target value
  performanceBonusAnnualMax?: Decimal128;    // max if over-achievement
  performanceBonusFrequency?: 'monthly' | 'quarterly' | 'half-yearly' | 'annual';
  performanceBonusPayoutMonth?: number;      // month it's paid (e.g., 5 = May)
  
  signOnBonus?: {                            // joining bonus
    amount: Decimal128;
    payoutDate: string;                      // YYYY-MM-DD
    clawbackTermsMonths: number;             // if exits within X months, must repay
    clawbackTermsAmount: Decimal128;
    paid: boolean;
    paidOn?: string;
  };
  
  retentionBonus?: Array<{                   // periodic retention payouts
    amount: Decimal128;
    payoutDate: string;
    paid: boolean;
    paidOn?: string;
    clawbackTermsMonths?: number;
  }>;

  // FBP (Flexible Benefits Plan) — pool that can be split
  fbpPoolMonthly?: Decimal128;
  fbpDeclarations?: FBPDeclaration[];        // employee's choice for current FY
  fbpDeclarationLockedDate?: string;         // FBP declarations may be locked after a date
  
  // ESOP / equity (informational; actual grants tracked separately)
  hasEsop?: boolean;
  esopGrantValueAnnual?: Decimal128;         // notional inclusion in CTC; not paid
  esopVestingDetails?: any;                  // out of scope for v1
  
  // overrides
  pfApplicableWageBasis?: 'ceiling' | 'actuals'; // override entity default
  pfOptedIn: boolean;                        // some employees may opt out (rare; high earner schemes)
  esiOptedIn: boolean;
  ptOptedIn: boolean;                        // typically yes if state has PT
  ptStateCode?: StateCode;                   // determines which PT slab (employee's work state)
  lwfOptedIn: boolean;
  
  // VPF (employee's voluntary additional PF)
  vpfRate?: number;                          // 0-0.88, percentage of basic
  vpfAmount?: Decimal128;                    // alternative: fixed amount
  
  // tax preferences
  taxRegime: 'old' | 'new';
  
  // allowances under tax exemption
  taxDeclarations?: {
    rentPaidMonthly?: Decimal128;            // for HRA exemption (old regime)
    rentRecipientPan?: EncryptedString;      // required if rent > ₹1L/yr
    livesInMetro?: boolean;                  // for HRA computation
    
    homeLoanInterestAnnual?: Decimal128;     // 24(b) deduction
    homeLoanPrincipalAnnual?: Decimal128;    // 80C
    
    section80CInvestments?: Decimal128;
    section80DInsurance?: Decimal128;        // self + family
    section80DInsuranceParents?: Decimal128;
    section80EEducationLoanInterest?: Decimal128;
    section80GDonations?: Decimal128;
    section80GGGRent?: Decimal128;
    
    nationalPensionAnnualSelf?: Decimal128;  // 80CCD(1B)
    nationalPensionAnnualEmployer?: Decimal128; // 80CCD(2)
    
    declarationLockedDate?: string;
    declarationsDocumentIds?: ObjectId[];    // proofs uploaded
  };

  // metadata
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  updatedBy: ObjectId;
  version: number;
  isDeleted: boolean;
}

interface ComponentValue {
  componentId: ObjectId;                     // ref SalaryComponent
  componentCode: string;                     // 'BASIC', 'HRA', 'SPECIAL', 'LTA', etc.
  componentName: string;                     // 'Basic Salary', 'House Rent Allowance'
  componentType: 'earning' | 'deduction' | 'reimbursement' | 'employer-cost' | 'fbp-pool';
  payoutFrequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  computationMethod: 'fixed' | 'formula' | 'percentage-of';
  formulaExpression?: string;                // e.g., "0.40 * ctcAnnual"
  monthlyValue: Decimal128;
  annualValue: Decimal128;

  // statutory flags
  countsForPf: boolean;                      // typically only Basic + DA
  countsForEsi: boolean;                     // typically all earnings except specific exclusions
  countsForGratuity: boolean;                // Basic + DA only (post-Code on Wages, broader definition)
  countsForBonus: boolean;                   // 'Wages' under Bonus Act
  isPartOfGross: boolean;
  isPartOfCtc: boolean;
  isTaxable: boolean;
  taxExemptionSection?: string;              // '10(13A)', '10(5)', '80C', etc.
  
  // for reimbursement components
  isReimbursable?: boolean;                  // requires bills
  reimbursementMaxAnnual?: Decimal128;
  reimbursementClaimingDeadline?: string;    // YYYY-MM-DD
}

interface FBPDeclaration {
  componentId: ObjectId;                     // FBP sub-component
  componentCode: string;                     // 'FBP_LTA', 'FBP_FUEL', 'FBP_MEAL'
  amountAnnual: Decimal128;
  declaredOn: Date;
  approvedBy?: ObjectId;
  approvedOn?: Date;
  documentsRequired?: boolean;
  documentsSubmitted?: boolean;
  documentIds?: ObjectId[];
}

type RevisionType =
  | 'initial-hire'
  | 'annual-revision'                        // appraisal
  | 'promotion'
  | 'demotion'
  | 'lateral-transfer'
  | 'role-change'
  | 'retention-adjustment'
  | 'market-correction'
  | 'cost-of-living-adjustment'              // DA-style adjustment
  | 'data-correction'                        // fixing data error
  | 'transfer-inter-entity'
  | 'manual-override'
  | 'mass-revision';                         // bulk update e.g., minimum wage hike
```

## Mandatory indexes

```typescript
{ tenantId: 1, employeeId: 1, isCurrent: 1 }
{ tenantId: 1, employeeId: 1, effectiveFrom: -1 }
{ tenantId: 1, entityId: 1, isCurrent: 1 }
{ tenantId: 1, employmentRecordId: 1 }
{ tenantId: 1, effectiveFrom: 1, effectiveTo: 1 }   // for point-in-time queries
{ tenantId: 1, isCurrent: 1, ctcAnnual: 1 }         // for compensation reports
```

## Validation rules

| Field | Rule |
|---|---|
| `ctcAnnual` | Required; must be > 0; must be ≥ minimum wage applicable for state + skill level (`[CA-REVIEW]` for blue-collar) |
| `effectiveFrom` | Required; cannot be before EmploymentRecord.joinedOn |
| `effectiveFrom` | Cannot conflict with another version (no overlap) |
| `componentBreakdown[].monthlyValue` | Sum of (countsForCtc=true, payoutFrequency=monthly) must equal ctcMonthly within tolerance of ₹1 |
| `pfApplicableWageBasis` | If 'actuals' and basicMonthly > entity.pfRegistration.epfWageCeiling, require explicit acknowledgment |
| `taxRegime` | Must be 'old' or 'new'; can change at FY start if regimeChangeAllowedThisFy |
| `taxDeclarations.rentRecipientPan` | Required if `rentPaidMonthly * 12 > 100000` |

## Salary structure relationship

A `SalaryStructure` is a template that defines how CTC is broken into components. The same structure is shared by many employees, with per-employee component values computed from the structure rules.

Schema (covered in detail in `/03-payroll/01-salary-structure-builder.md`, Phase 3):

```typescript
interface SalaryStructure extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  name: string;                              // 'Standard Engineer Structure FY26'
  applicableTo?: {
    employmentTypes?: EmploymentType[];
    designationLevels?: string[];
    locations?: ObjectId[];
    departments?: ObjectId[];
    ctcRange?: { from: Decimal128; to: Decimal128 };
  };
  
  components: SalaryComponentRule[];         // ordered list of components with formulas
  // ...
}

interface SalaryComponentRule {
  componentCode: string;                      // 'BASIC'
  computationMethod: 'fixed' | 'formula' | 'percentage-of-basic' | 'percentage-of-gross' | 'percentage-of-ctc' | 'balance';
  formulaExpression?: string;                 // 'ctcAnnual * 0.40'
  // 'balance' means "whatever is left after all other components"
}
```

When a CompensationRecord is created or revised, the engine evaluates each component rule against the chosen `ctcAnnual`, producing the `componentBreakdown`.

## Worked example — Salary structure breakdown

Employee with **CTC ₹12,00,000 per annum** on a "Standard Engineer Structure FY26" template:

| Component | Method | Formula | Annual | Monthly | Notes |
|---|---|---|---|---|---|
| Basic | percentage-of-ctc | `ctcAnnual * 0.40` | ₹4,80,000 | ₹40,000 | counts for PF, gratuity, bonus |
| HRA | percentage-of-basic | `basic * 0.50` | ₹2,40,000 | ₹20,000 | tax exempt under 10(13A) (old regime) |
| Special Allowance | balance | `ctc - basic - hra - lta - employerPF - employerGratuity - groupHealth` | ₹3,17,520 | ₹26,460 | fully taxable |
| LTA | fixed | `40,000` | ₹40,000 | ₹3,333 | exempt for 2 trips per 4-year block |
| Employer PF (12% of Basic, capped at ₹15K) | formula | `MIN(basic/12, 15000) * 0.12 * 12` | ₹21,600 | ₹1,800 | employer cost, not in gross |
| Employer Gratuity provision | formula | `basic * 0.0481` (4.81% per actuarial) `[VERIFY]` | ₹23,088 | ₹1,924 | employer cost |
| Group Health Insurance | fixed | `12,000` | ₹12,000 | ₹1,000 | employer cost |
| **Total CTC** | | | **₹12,00,000** | **₹1,00,000** | |

### Derived monthly figures (for new regime, no investments declared):

```
basicMonthly                          = ₹40,000
hraMonthly                            = ₹20,000
specialMonthly                        = ₹26,460
ltaMonthly (notional, paid annually)  = ₹3,333
grossMonthly = basic + hra + special + lta = ₹89,793
employerPf monthly                    = ₹1,800
employerGratuity monthly              = ₹1,924
employerInsurance monthly             = ₹1,000
ctcMonthly = gross + employer costs   = ₹94,517 + ₹1,800 + ₹1,924 + ₹1,000 ≈ ₹1,00,000 ✓
```

(LTA is included in gross conceptually since it's fixed pay, but typically paid as one annual installment in some companies, monthly in others. Tenant configures.)

### Monthly payroll calculation:

```
grossMonthly                                          ₹89,793
- Employee PF (12% of MIN(basic, 15000)) = 15000*0.12 = -₹1,800
- ESI: not applicable (gross > ₹21,000 ceiling)       -₹0
- PT (Maharashtra, gross > ₹10,000):                  -₹200 [VERIFY]
- TDS (new regime, FY26-27, slab applied):           -[varies]
= netTakeHome (approximate)                           ≈ ₹86,500 (before TDS)
```

This calculation is performed by the payroll engine in `/03-payroll/05-payroll-engine.md` (Phase 3). CompensationRecord stores the *structure*; payroll engine computes the *monthly result* including LOP and TDS.

## Behavior

### Creating an initial CompensationRecord (on hire)

1. EmploymentRecord must exist
2. SalaryStructure chosen (from tenant's templates, or custom)
3. CTC entered
4. Engine evaluates structure → produces componentBreakdown
5. Validate sum of monthly values matches ctcMonthly
6. Save with effectiveFrom = EmploymentRecord.joinedOn
7. isCurrent=true
8. Audit log

### Salary revision (annual appraisal)

1. New CompensationRecord created with effectiveFrom = revisionDate
2. Previous record updated: effectiveTo = revisionDate - 1ms, isCurrent=false
3. New record: isCurrent=true, supersedes=previousRecordId, supersededBy=null
4. Previous record: supersededBy=newRecordId
5. Update Employee.cached_currentCompensation
6. If revisionDate is in current/past payroll month, retro is owed (handled in /03-payroll/06)
7. Generate revision letter (PDF)
8. Audit log
9. Notify employee

### Forward-dated revision

Common: revision approved in March, effective April 1.

- Record created with effectiveFrom = April 1
- isCurrent = **false** (because today is March)
- A scheduled job activates it on April 1 (sets isCurrent=true; previous record's effectiveTo)

### Backdated revision

Sometimes approvals come late. E.g., revision approved May 15 effective from April 1.

- Create CompensationRecord with effectiveFrom = April 1
- April payroll has already run with old structure
- → A retro is owed for April: difference between new and old structure
- Retro is computed and added to next payroll run (May payroll)
- Audit log: revision was backdated, retro pending

### Mid-month effectiveness

CTC change effective from 15th of month.

- Two CompensationRecords are active in same month
- Payroll engine pro-rates: 14 days at old rate, remaining at new rate
- Each component pro-rated separately

`[ASSUMPTION]` Pro-ration unit: per-day. Workdays-based pro-ration is also used by some companies; configurable per entity.

### CTC reduction (rare but real)

E.g., performance issues, demotion, voluntary salary reduction.

- New CompensationRecord with lower CTC
- Manager + HR + Tenant Admin all required to approve (multi-level)
- Statement signed by employee acknowledging reduction
- Stored as document
- Audit log: reduction reason recorded

`[CA-REVIEW]` Some statutes prevent unilateral reduction. Requires employee consent. Code on Wages 2019 has implications.

## FBP (Flexible Benefits Plan)

Many companies offer an FBP pool. The employee chooses how to split it among components for tax efficiency.

Example: ₹60,000 annual FBP pool. Employee chooses:
- ₹30,000 → LTA (tax-exempt for 2 trips per 4-year block)
- ₹15,000 → Fuel Reimbursement
- ₹10,000 → Meal Coupons (tax-exempt up to ₹50/meal × 250 days = ₹12,500/yr `[VERIFY]`)
- ₹5,000 → Books & Periodicals

Each FBP item has:
- Annual cap (statutory or company-policy-driven)
- Bill submission requirement
- Claim deadline

Unutilized FBP at year-end: rolls over OR forfeits OR pays out as taxable (tenant configures).

## Components catalog

Common Indian salary components — each tenant can use these or define custom ones:

### Earnings (most common)

| Code | Name | Typical % of Basic | Statutory flags |
|---|---|---|---|
| BASIC | Basic Salary | 100% | Counts for PF, Gratuity, Bonus, ESI |
| DA | Dearness Allowance | varies (PSU, blue-collar) | Counts for PF, Gratuity, Bonus, ESI |
| HRA | House Rent Allowance | 40-50% | Counts for ESI; tax exempt under 10(13A) |
| SPECIAL | Special Allowance | balance | Counts for ESI; fully taxable |
| LTA | Leave Travel Allowance | varies | Tax exempt under 10(5) |
| MEDICAL | Medical Allowance | varies | Tax exempt up to ₹15K/yr (old regime, withdrawn for new) |
| CONVEYANCE | Conveyance Allowance | varies | Standard deduction subsumed in new regime |
| MEAL | Meal Allowance / Coupons | varies | Tax exempt up to ₹50/meal |
| FUEL | Fuel Reimbursement | varies | Tax treatment varies |
| BOOKS | Books & Periodicals | varies | Reimbursement, not taxable if business-related |
| PHONE | Phone / Internet Reimbursement | varies | Reimbursement |
| EDUCATION | Children's Education Allowance | varies | Tax exempt up to ₹100/child/month, max 2 |
| HOSTEL | Hostel Subsidy | varies | Tax exempt up to ₹300/child/month, max 2 |
| TRANSPORT | Transport Allowance | varies | Differently-abled exemption |
| BONUS_PERF | Performance Bonus | annual | Fully taxable |
| BONUS_STAT | Statutory Bonus | annual | Min ₹100/month avg, max as per Bonus Act |
| OT | Overtime | varies | [BLUE-COLLAR] common |

### Deductions

| Code | Name | Notes |
|---|---|---|
| EMP_PF | Employee PF | 12% of (Basic+DA), capped |
| EMP_ESI | Employee ESI | 0.75% of gross if applicable |
| PT | Professional Tax | Per state slab |
| LWF | Labour Welfare Fund | Per state |
| TDS | Tax Deducted at Source | Computed monthly |
| ADV | Salary Advance | Repayment |
| LOAN | Loan EMI | Repayment |
| LOP | Loss of Pay | Days * (CTC / workdays) |

### Employer costs (in CTC, not in gross)

| Code | Name | Notes |
|---|---|---|
| EMR_PF | Employer PF | 12% of (Basic+DA), capped, includes EPS+EPF |
| EMR_PF_ADMIN | PF Admin Charges | 0.5% (paid by employer to EPFO) |
| EMR_EDLI | EDLI Charges | 0.5% (paid by employer) |
| EMR_ESI | Employer ESI | 3.25% of gross |
| EMR_GRATUITY | Gratuity Provision | ~4.81% of Basic (actuarial) |
| EMR_HEALTH | Group Health Insurance | Fixed |
| EMR_LIFE | Group Term Life | Fixed |
| EMR_ACCIDENT | Group Personal Accident | Fixed |

## Cross-references

- See [02-employment-record.md](./02-employment-record.md) for employment relationship
- See [01-employee-master-schema.md](./01-employee-master-schema.md) for employee master
- See [/00-foundations/06-statutory-rules-engine.md](../00-foundations/06-statutory-rules-engine.md) for statutory rules consumed
- See [/03-payroll/01-salary-structure-builder.md](../03-payroll/01-salary-structure-builder.md) (Phase 3) for structure builder
- See [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md) (Phase 3) for monthly computation
- See [/03-payroll/06-arrears-and-retros.md](../03-payroll/06-arrears-and-retros.md) (Phase 3) for retro handling
