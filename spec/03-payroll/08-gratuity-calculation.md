# 08 — Gratuity Calculation

## Purpose

Gratuity is a statutory long-service benefit under the Payment of Gratuity Act, 1972 (and Code on Social Security 2020 § 53–58). Payable to an employee on cessation of employment (after 5 years of continuous service) — except in cases of death or disablement, where the 5-year rule is waived.

This file specifies eligibility rules, formula, accrual, payout, tax exemption, and Form L issuance.

## Applicability

The Act applies to:

- Every factory, mine, oilfield, plantation, port, railway, motor transport undertaking
- Every shop/establishment with 10+ employees on any day in 12 months preceding `[VERIFY]`
- Every other establishment notified by Central / State Government

`[CA-REVIEW]` Code on Social Security 2020 broadened applicability and introduced gig worker provisions.

## Eligibility

Employee is eligible if:

1. **Continuous service of 5 years** (explained below)
2. Cessation of employment due to:
   - Superannuation (retirement)
   - Resignation
   - Termination (other than misconduct that disqualifies — limited)
   - Death (5-year rule waived)
   - Disablement due to accident or disease (5-year rule waived)

### Continuous service definition (§ 2A)

Employee is "in continuous service for 5 years" if:

- Employee has worked for the employer for **240 days** in the preceding 12 months for that year, AND
- This applies for 5 consecutive years

For mines: 190 days in preceding 12 months (instead of 240) `[VERIFY]`.

### Effective rule for 5-year computation

> An employee with 4 years and 240 days of continuous service is eligible — Madras HC ruling (2018) and judgment endorsed by other HCs `[CA-REVIEW]`

So "5 years" is approximately 4 years 240 days.

`[CA-REVIEW]` Recent rulings on gig workers under SS Code may extend eligibility further. CA review essential.

## Formula

### Standard formula (most employees)

```
Gratuity = (Last drawn (Basic + DA) ÷ 26) × 15 × completed years of service
```

- `Last drawn (Basic + DA)`: last monthly salary's Basic + DA, on the date of separation
- `÷ 26`: assumed working days per month
- `× 15`: 15 days' wages per year of service
- `× completed years`: rounded up if last year's service ≥ 6 months; else rounded down

### For piece-rated employees

```
Gratuity = (Avg daily wages of last 3 months) × 15 × completed years
```

Average daily wages excludes overtime.

### For seasonal employees

```
Gratuity = Daily wage × 7 days × completed seasons
```

(Less common; specific industries.)

`[VERIFY]` Code on Social Security 2020 § 53 retains this; subtle changes in some states.

## Tax exemption (Income Tax Act § 10(10))

Gratuity received is exempt up to a ceiling:

- **Government employees**: fully exempt
- **Non-government employees covered by Gratuity Act**: lesser of three:
  1. Actual gratuity received
  2. ₹20,00,000 (statutory cap; raised from ₹10L to ₹20L on March 29, 2018) `[VERIFY current cap]`
  3. (Last drawn salary × 15 × completed years) ÷ 26

Excess over exempt amount is taxable as salary in the year of receipt.

`[VERIFY]` Tax cap may have been revised post-2018; check IT Act 2025.

## Schema

```typescript
interface GratuityComputation extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeId: ObjectId;
  
  // employment
  employmentRecordId: ObjectId;
  joinedOn: string;                        // YYYY-MM-DD
  separationDate: string;
  separationReason: SeparationReason;
  
  // continuous service computation
  continuousServiceDetail: {
    yearsCompleted: number;
    monthsBeyondLastFullYear: number;
    daysBeyondLastFullYear: number;
    isEligible: boolean;
    eligibilityRule: '5-year-completed' | '4-year-240-days' | 'death-disablement-waiver' | 'continuous-service-mining';
    
    // year-by-year breakdown
    yearByYearService: Array<{
      yearStartDate: string;
      yearEndDate: string;
      daysWorked: number;
      meetsThreshold: boolean;             // 240 (or 190 for mines)
    }>;
  };
  
  // wage basis
  lastDrawnBasic: Decimal128;
  lastDrawnDa: Decimal128;
  lastDrawnBasicAndDa: Decimal128;
  
  // computation
  formulaUsed: 'standard' | 'piece-rated' | 'seasonal' | 'mining';
  daysFactor: number;                      // 15 (default)
  daysPerMonth: number;                    // 26 (default)
  
  computedYears: number;                   // completed years for formula (rounded)
  
  computedGratuity: Decimal128;
  
  // tax
  isCoveredByAct: boolean;
  exemptionAmount: Decimal128;             // lesser of 3 (or fully exempt for govt)
  taxableAmount: Decimal128;
  tdsOnTaxablePortion: Decimal128;
  
  // payment
  scheduledPaymentDate: string;            // within 30 days of separation per Act § 7
  paidInPayrollLineId?: ObjectId;          // typically in F&F run
  paidOn?: string;
  
  // form L
  formLGenerated: boolean;
  formLDocumentId?: ObjectId;
  
  // disputes
  isDisputed: boolean;
  disputeReason?: string;
  
  // status
  status: 'draft' | 'computed' | 'approved' | 'paid' | 'disputed' | 'forfeited';
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

## Worked example

### Case 1: Standard 10-year resignation

Pankaj joined April 1, 2016. Resigned March 31, 2026. Last drawn Basic+DA: ₹50,000.

```
Continuous service: 10 complete years (April 2016 to March 2026)
Eligible: yes (≥ 5 years)

Gratuity = (50,000 ÷ 26) × 15 × 10
        = 1923.08 × 15 × 10
        = ₹2,88,461.54

Tax exemption (non-govt):
  1. Actual: ₹2,88,461.54
  2. Cap: ₹20,00,000
  3. Formula × actual:  1923.08 × 15 × 10 = ₹2,88,461.54
  
  Lesser of 3 = ₹2,88,461.54 → fully exempt

Taxable: ₹0
TDS: 0
Net to employee: ₹2,88,461.54
```

### Case 2: 7 years 7 months (rounding up)

Anil joined Sep 1, 2018. Separated April 30, 2026. Last drawn ₹40,000.

```
Service: 7 years 7 months 30 days
Last full year: 7
Beyond: 7 months → ≥ 6 months → round UP to 8 years

Gratuity = (40,000 ÷ 26) × 15 × 8
        = 1538.46 × 15 × 8
        = ₹1,84,615.38

Fully exempt (well under ₹20L)
```

### Case 3: 6 years 4 months (rounding down)

Sunita joined Jan 1, 2020. Separated May 1, 2026. Last drawn ₹35,000.

```
Service: 6 years 4 months
Last full year: 6
Beyond: 4 months → < 6 months → round DOWN to 6 years

Gratuity = (35,000 ÷ 26) × 15 × 6
        = 1346.15 × 15 × 6
        = ₹1,21,153.85

Fully exempt
```

### Case 4: Death after 2 years

Ravi joined Aug 1, 2024. Died March 1, 2026. Last drawn ₹30,000.

```
Service: 1 year 7 months
5-year rule waived for death

Completed years: 1 (months < 6 → round down)
But wait — for death, even partial year counts? `[CA-REVIEW]`

Standard interpretation: "completed years" = full years completed (1), but some interpretations pro-rate partial year. Conservative: round to nearest year.

Gratuity = (30,000 ÷ 26) × 15 × 2 (rounded up due to 7 months)
        = 1153.85 × 15 × 2
        = ₹34,615.38

Paid to nominees per nomination form.
```

`[CA-REVIEW]` Death cases: gratuity computation has nuances; exact rounding interpretation varies by court / industry.

### Case 5: 25-year retirement (high tax exposure)

Veteran employee retires after 25 years. Last drawn ₹150,000 (Basic+DA).

```
Gratuity = (150,000 ÷ 26) × 15 × 25
        = 5769.23 × 15 × 25
        = ₹21,63,461.54

Tax exemption:
  1. Actual: ₹21,63,461.54
  2. Cap: ₹20,00,000
  3. Formula: same as actual
  Lesser: ₹20,00,000

Exempt: ₹20,00,000
Taxable: ₹1,63,461.54
TDS at applicable slab on this excess: depends on employee's overall income
```

The HRMS computes both exempt and taxable portions; TDS applies on taxable portion.

## Gratuity provisioning (financial accounting)

While employees accrue gratuity, the company must **provision** for the future liability on books. Standard actuarial provision rate:

```
Annual provision = Basic × 4.81%
where 4.81% ≈ 15 / (12 × 26)
```

This is the rate at which gratuity accrues per the formula — assuming employee will eventually take all completed years.

The HRMS:
- Computes provisioning per employee per month (in employer cost components)
- Aggregates for accounting export
- Does NOT pay out provisioning until actual separation
- Provides actuarial reports on gratuity liability

`[v2]` Integration with actuarial firms (BSR, KPMG actuarial) for AS 15 / Ind AS 19 compliance.

## Disqualifications

Per § 4(6): gratuity may be **forfeited** if employee is terminated for:

- Riotous or disorderly conduct or any act of violence
- Any act involving moral turpitude in the course of employment
- Damage / loss / destruction of employer's property (forfeiture limited to extent of loss)

Forfeiture requires:
- Disciplinary inquiry per Standing Orders
- Documented finding of misconduct
- Audit trail

The HRMS supports forfeiture (full or partial) with HR + legal sign-off.

## Payment timeline

Per § 7:
- Within **30 days** of becoming payable (i.e., from separation date)
- Interest payable at simple interest rate notified by Central Government (currently 10%) for any delay beyond 30 days `[VERIFY]`

The HRMS:
- F&F includes gratuity by default
- 2-day F&F SLA includes gratuity payout
- Interest auto-calculated if delayed (rare with our SLA)

## Form L (Notice of payment)

Per Payment of Gratuity Rules 1972 Rule 8: employer must issue Form L to employee specifying:

- Name and address of employer
- Name of employee
- Date of joining and separation
- Reason of separation
- Period of service (years, months, days)
- Last drawn wages
- Amount of gratuity
- Date of payment
- Mode of payment

The HRMS auto-generates Form L on gratuity payment.

## Form K (Application by employee)

If employee applies for gratuity (e.g., not auto-paid), they file Form K. The HRMS allows employees to file Form K via ESS; auto-routes to HR.

## Nomination (Form F)

Employee can nominate dependents to receive gratuity in case of death. Form F filed at joining and updated periodically.

The HRMS:
- Employee fills Form F at joining (employee master family section)
- Updates allowed via ESS
- For death: payout goes to nominees per Form F shares

## Insurance (Group Gratuity Scheme)

Many companies use insurance-backed gratuity schemes (LIC's Group Gratuity Plan, HDFC Life, etc.):

- Employer pays premium to insurer
- Insurer manages fund
- On employee separation: insurer disburses gratuity

The HRMS:
- Records insurance scheme reference per entity
- Provisioning shown as insurance premium (not direct provisioning)
- Settlement: HRMS triggers insurer; insurer disburses

`[v2]` Integration with major insurers' APIs for direct settlement.

## Reports

- **Gratuity Liability Report**: total provisioning per FY
- **Eligibility Cohort**: employees crossing 5-year mark in next 12 months (anniversary alert)
- **Gratuity Disbursement Register**: paid per period
- **Forfeiture Log**: cases where gratuity forfeited (audit-sensitive)

## Open questions

`[OPEN]` Tax exemption cap of ₹20L: confirm current under IT Act 2025. Some sources mention possible revision. Recommend: rule engine handles current cap.

`[OPEN]` Code on Social Security gig worker provisions: when fully implemented, gig workers may be entitled to gratuity. Recommend: monitor notifications; rule engine version.

`[OPEN]` Continuous service for fixed-term contract employees: pro-rated under SS Code 2020 § 53(2)? `[CA-REVIEW]`. Recommend: implement carefully with CA review.

`[OPEN]` Inter-entity transfer continuity: Should service at Entity A + B (same group) count as continuous? Default: no (each entity separate). Tenant config can override for specific transfers.

`[OPEN]` Re-employment after retirement: does prior service count? `[CA-REVIEW]` Generally no (separate engagement); tenant config.

## Cross-references

- [05-payroll-engine.md](./05-payroll-engine.md) — gratuity in F&F payroll line
- [09-fnf-settlement.md](./09-fnf-settlement.md) — F&F includes gratuity
- [02-component-library.md](./02-component-library.md) — EMPLOYER_GRATUITY component
- [/01-employee/06-lifecycle-state-machine.md](../01-employee/06-lifecycle-state-machine.md) — separation triggers gratuity
- [/04-compliance/07-gratuity-act.md](../04-compliance/07-gratuity-act.md) — full Gratuity Act details + Form L, K, F
