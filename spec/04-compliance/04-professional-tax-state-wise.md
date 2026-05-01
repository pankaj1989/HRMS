# 04 — Professional Tax (State-wise)

## Purpose

Professional Tax (PT) is a state-level tax on income from profession, trade, calling or employment. Levied under each state's Professions, Trades, Callings and Employments Act. NOT a central tax. Each state has its own slabs, deposit cycles, return forms.

This is a famous pain point for HRMS: a tenant operating in 5 states must comply with 5 different PT regimes. The platform abstracts this away.

## Constitutional basis

Article 276 of Constitution permits states to levy PT, capped at **₹2,500 per person per annum**. States cannot exceed this aggregate.

## States that levy PT (vs not)

PT is levied in 17 states + UTs (varies; check current notifications):

**Levying states**: Maharashtra, Karnataka, Tamil Nadu, West Bengal, Andhra Pradesh, Telangana, Kerala, Gujarat, Madhya Pradesh, Assam, Odisha, Chhattisgarh, Tripura, Sikkim, Puducherry, Meghalaya, Manipur, Mizoram, Nagaland, Bihar, Jharkhand `[VERIFY current list]`

**Non-levying states** (no PT): Delhi, Haryana, Punjab, Uttar Pradesh, Rajasthan, Uttarakhand, Himachal Pradesh, Goa, J&K, Arunachal Pradesh `[VERIFY]`

## Determination of applicable state

PT is determined by **employee's place of work**, not residence:

```typescript
function getApplicablePtState(employee, period): StateCode | null {
  const workLocation = getEmploymentLocation(employee, period);
  return workLocation?.state;              // null if state doesn't levy PT
}
```

Multi-state employees (transfers, frequent travel):
- PT applies in current location's state
- If transferred mid-month: pro-rate or full month per state's rules

## Slab structure (per state)

### Maharashtra

`[VERIFY]` Slabs (typical):

| Monthly salary | PT (₹/month) |
|---|---|
| Up to ₹7,500 | 0 |
| ₹7,501 – ₹10,000 | 175 |
| Above ₹10,000 | 200 |
| March (extra) | 300 (special — to total ₹2,500/yr) |

Maharashtra is unique: 11 months × 200 = ₹2,200 + March ₹300 = ₹2,500.

### Karnataka

| Monthly salary | PT (₹/month) |
|---|---|
| Up to ₹15,000 | 0 |
| Above ₹15,000 | 200 |

`[VERIFY]` Karnataka had ₹15,000 threshold with ₹200 flat. Some employees may have lower / higher.

### Tamil Nadu (Half-yearly)

Half-yearly slabs (April-September; October-March):

| Half-yearly salary | PT |
|---|---|
| Up to ₹21,000 | 0 |
| ₹21,001 – ₹30,000 | 135 |
| ₹30,001 – ₹45,000 | 315 |
| ₹45,001 – ₹60,000 | 690 |
| ₹60,001 – ₹75,000 | 1,025 |
| Above ₹75,000 | 1,250 |

`[VERIFY]` Half-yearly cycle, paid in October and April.

### West Bengal

| Monthly salary | PT |
|---|---|
| Up to ₹10,000 | 0 |
| ₹10,001 – ₹15,000 | 110 |
| ₹15,001 – ₹25,000 | 130 |
| ₹25,001 – ₹40,000 | 150 |
| Above ₹40,000 | 200 |

### Andhra Pradesh / Telangana

| Monthly salary | PT |
|---|---|
| Up to ₹15,000 | 0 |
| ₹15,001 – ₹20,000 | 150 |
| Above ₹20,000 | 200 |

### Kerala (Half-yearly)

Half-yearly:

| HY salary | PT |
|---|---|
| Up to ₹11,999 | 0 |
| ₹12,000 – ₹17,999 | 120 |
| ₹18,000 – ₹29,999 | 180 |
| ₹30,000 – ₹44,999 | 300 |
| ₹45,000 – ₹59,999 | 450 |
| ₹60,000 – ₹74,999 | 600 |
| ₹75,000 – ₹99,999 | 750 |
| ₹100,000 – ₹124,999 | 1,000 |
| Above ₹125,000 | 1,250 |

### Gujarat

| Monthly salary | PT |
|---|---|
| Up to ₹12,000 | 0 |
| Above ₹12,000 | 200 |

### Madhya Pradesh

| Monthly salary | PT |
|---|---|
| Up to ₹15,000 | 0 |
| ₹15,001 – ₹17,500 | 125 |
| ₹17,501 – ₹20,000 | 167 (₹208 in March) |
| Above ₹20,000 | 208 |

`[VERIFY]` All slabs — verify each state's current PT Act + amendments. State PT slabs change occasionally.

## Schema

```typescript
interface PtSlabRule extends StatutoryRule {
  ruleKey: `pt:${StateCode}:default`;
  rulePayload: {
    state: StateCode;
    cycleType: 'monthly' | 'half-yearly' | 'annual';
    cycleStart?: 'apr-sep' | 'oct-mar' | 'cy';   // for half-yearly
    
    slabs: Array<{
      salaryFrom: number;                  // in INR
      salaryTo: number | 'infinity';
      ptAmount: number;
    }>;
    
    // special rules
    marchAdjustment?: {
      extraDeduction: number;              // Maharashtra adds extra in March
    };
    
    // exemptions
    exemptions?: Array<{
      type: 'senior-citizen' | 'disabled' | 'parent-of-disabled' | 'widow' | 'serviceman';
      threshold?: any;
    }>;
    
    // filing
    monthlyFilingFormCode: string;         // 'PT-Form-V' or similar
    annualFilingFormCode?: string;
    paymentFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'annual';
    paymentDeadline: string;               // '21st of next month' | etc.
    
    // registration
    enrollmentRequired: boolean;
    enrolmentNumber?: string;              // employer's PT enrollment number
  };
}
```

## Per-employee PT deduction

```typescript
function computePt(employee, payrollLine, ptRule): Decimal128 {
  const grossSalary = payrollLine.earningsGross;
  
  // Find applicable slab
  const slab = ptRule.slabs.find(s =>
    grossSalary.gte(s.salaryFrom) && (s.salaryTo === 'infinity' || grossSalary.lte(s.salaryTo))
  );
  
  if (!slab) return Decimal128.from(0);
  
  let ptAmount = Decimal128.from(slab.ptAmount);
  
  // Maharashtra March extra
  if (ptRule.marchAdjustment && period.month === 3) {
    ptAmount = ptAmount.plus(ptRule.marchAdjustment.extraDeduction);
  }
  
  // Exemptions
  if (employee.disabilityStatus.isDisabled && ptRule.exemptions?.some(e => e.type === 'disabled')) {
    return Decimal128.from(0);
  }
  
  return ptAmount;
}
```

## Half-yearly states (TN, KL)

For Tamil Nadu / Kerala:
- Wages aggregated over 6 months
- Slab applied to half-yearly aggregate
- PT collected once per half-year (typically October for Apr-Sep; April for Oct-Mar) `[VERIFY exact cycles]`

```typescript
function computeHalfYearlyPt(employee, halfYear): Decimal128 {
  const halfYearWages = sumWagesForHalfYear(employee, halfYear);
  const slab = findSlab(halfYearWages, ptRule);
  return Decimal128.from(slab.ptAmount);
}
```

The HRMS:
- Tracks per-employee half-year accumulation
- Generates one-time PT deduction in payroll line at end of half-year
- Or: distributes ₹X / 6 across each month (advance accrual; tenant config)

## Filing and deposit

### Maharashtra (PTRC Filing)

- Monthly: by 21st of next month
- Online filing on Maharashtra PT portal
- Form III-B return + payment
- Annual: Form V filed by April 30 of next FY
- TIN-Maharashtra registration required

### Karnataka

- Monthly: by 20th of next month
- Online via Karnataka PT portal (CTD-PT)
- Annual return: Form 5

### Tamil Nadu

- Half-yearly: by October 30 (Apr-Sep) and April 30 (Oct-Mar)
- Form 1 (return) + Form 2 (challan)

### Schema

```typescript
interface PtFiling extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  state: StateCode;
  ptEnrolmentNumber: string;
  
  filingType: 'monthly' | 'half-yearly' | 'annual';
  filingForPeriod: string;
  filingDeadline: Date;
  
  // amounts
  totalEmployees: number;
  totalPtCollected: Decimal128;
  
  // file
  formCode: string;
  fileDocumentId?: ObjectId;
  
  // submission
  submittedAt?: Date;
  challanReference?: string;
  paidAt?: Date;
  
  // status
  status: 'draft' | 'submitted' | 'paid' | 'late' | 'failed';
  isLate: boolean;
  lateFee?: Decimal128;
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

## Multi-entity / multi-state tenant

Tenant Acme has entities in:
- Mumbai (Maharashtra) — 50 employees
- Bangalore (Karnataka) — 80 employees
- Delhi (no PT) — 30 employees

Each state requires separate:
- PT registration
- Monthly/half-yearly filings
- Deposits

The HRMS maintains separate `PtEnrolmentNumber` per state per entity.

```typescript
interface EntityPtRegistration extends BaseDocument {
  tenantId: ObjectId;
  entityId: ObjectId;
  state: StateCode;
  
  ptEnrolmentNumber: string;
  registrationDate: Date;
  registeredAddress: string;
  
  // for Maharashtra: PT employer registration certificate
  ptrcNumber?: string;
  // PT enrollment certificate (employee's own, when employee pays self)
  ptecApplicable?: boolean;
  
  isActive: boolean;
  
  createdAt: Date;
  isDeleted: boolean;
}
```

## Worked example

Acme has 80 employees in Bangalore (Karnataka). For April 2026 payroll:

| Wage range | Employees | PT each | Subtotal |
|---|---|---|---|
| < ₹15,000 | 12 | 0 | 0 |
| ≥ ₹15,000 | 68 | 200 | 13,600 |
| **Total** | **80** | | **₹13,600** |

Karnataka monthly PT challan: ₹13,600 paid by May 20, 2026.

## Reports

- **PT Liability Report**: per-state per-month per-entity
- **PT Compliance Status**: filings done / pending / late
- **PT Deduction Audit**: per-employee PT deducted with state context

## Late filing penalty

Per state — typical:
- Maharashtra: ₹300/return + interest @ 1.25%/month
- Karnataka: ₹250 + interest 1.25%/month
- Tamil Nadu: 2% per month interest

The HRMS:
- Auto-flags pending PT
- Computes late fee on overdue
- Surfaces in compliance dashboard

## State-specific exemptions

Some states exempt:
- Senior citizens (60+)
- Persons with disability
- Widows
- Servicemen (Maharashtra)
- Parents/guardians of disabled persons
- Members of armed forces

The HRMS:
- Captures exemption status from employee master
- Auto-applies exemption per state rule
- Audit log

## Open questions

`[OPEN]` Per-state slab updates: maintaining accuracy is operational burden. Recommend: dedicated state-rule update process; quarterly review.

`[OPEN]` PT applicable when employee works remotely (WFH from non-PT state)? CA opinion varies. Some say "place of work" = registered office. Recommend: tenant config; default = employee's primary work location.

`[OPEN]` Inter-state movement mid-month: does PT split between states? Some states allow pro-rate, others require full deduction. Recommend: per-state rule; default monthly state at end of month wins.

`[OPEN]` Auto-file in state portals via API? Few states have. Recommend: file-upload model in v1.

## Cross-references

- [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md) — PT computation
- [/00-foundations/06-statutory-rules-engine.md](../00-foundations/06-statutory-rules-engine.md) — PT rules
- [00-overview.md](./00-overview.md) — compliance overview
- [15-statutory-deadlines-calendar.md](./15-statutory-deadlines-calendar.md) — PT deadlines per state
