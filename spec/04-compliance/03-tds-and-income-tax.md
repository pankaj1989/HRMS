# 03 — TDS & Income Tax

## Purpose

Section 192 of the Income-tax Act mandates employer to deduct tax at source (TDS) from salary at average rate. Quarterly Form 24Q filing. Annual Form 16 + Form 12BA to employee. With IT Act 2025 effective April 1, 2026, this is the most consequential statutory module for FY 2026-27.

## Section 192 — TDS on Salaries

> Any person responsible for paying any income chargeable under the head 'Salaries' shall, at the time of payment, deduct income-tax on the amount payable at the average rate of income-tax computed on the basis of the rates in force for the financial year in which the payment is made, on the estimated income of the assessee under this head for that financial year.

Key implications:

1. TDS deducted at the time of payment, not accrual
2. Computed on **average rate** of tax on full FY income
3. Estimate-based; can be revised through the year
4. Final adjustment in last month based on actuals

## IT Act 2025 vs IT Act 1961 — high-level

`[VERIFY]` Critical change for FY 2026-27. Confirm via Finance Act notification.

| Aspect | IT Act 1961 (old & new regime) | IT Act 2025 |
|---|---|---|
| Default regime | New regime default since FY 2023-24 | New regime default |
| Slabs | Old & new each had own slabs | Simplified slabs |
| Standard deduction | ₹50K old; ₹75K new (post-2024) | ₹75K (likely) |
| Section 80C | ₹1.5L old; not in new | Generally consolidated |
| HRA exemption (10(13A)) | Available in old | Likely retained |
| LTA (10(5)) | Available in old | Likely retained |
| Rebate (87A) | Up to ₹7L net taxable in new (FY24-25) | TBC |
| Surcharge | 10/15/25/37% on income | Likely simplified |
| Cess | 4% Health & Education | Likely retained |

`[CA-REVIEW]` Confirm slabs and exemptions under IT Act 2025 before April 1, 2026 launch.

## Slab structure (illustrative; verify under IT Act 2025)

### New regime (default for FY 2026-27)

| Income slab | Tax rate |
|---|---|
| Up to ₹4,00,000 | Nil |
| ₹4,00,001 – ₹8,00,000 | 5% |
| ₹8,00,001 – ₹12,00,000 | 10% |
| ₹12,00,001 – ₹16,00,000 | 15% |
| ₹16,00,001 – ₹20,00,000 | 20% |
| ₹20,00,001 – ₹24,00,000 | 25% |
| Above ₹24,00,000 | 30% |

`[VERIFY]` Slabs under IT Act 2025; above is illustrative based on Budget 2025 announcements.

### Old regime (still available?)

`[VERIFY]` Whether old regime continues under IT Act 2025. Some indications it's phased out.

If retained:

| Income slab | Tax rate |
|---|---|
| Up to ₹2,50,000 | Nil |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

For senior citizens (60+): basic exemption ₹3L
For super seniors (80+): basic exemption ₹5L (under 1961)

### Surcharge

| Income | Old & new (1961) | IT Act 2025 |
|---|---|---|
| ₹50L – ₹1Cr | 10% | likely retained |
| ₹1Cr – ₹2Cr | 15% | likely retained |
| ₹2Cr – ₹5Cr | 25% (was 25% for old, 25% for new) | likely simplified |
| Above ₹5Cr | 37% (old); 25% (new from FY 23-24) | likely 25% cap |

### Health and Education Cess

4% on (tax + surcharge). Continues.

## Monthly TDS computation

Engine logic (in [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md)):

```typescript
function computeMonthlyTds(employee, payrollLine, declarations, runContext): Decimal128 {
  // Step 1: Project annual income
  const ytdGrossSoFar = sumYtdGross(employee, runContext.fyCode, runContext.upToPeriod);
  const projectedFutureGross = projectFutureMonths(employee, runContext.fyCode, runContext.fromPeriod);
  const projectedAnnualGross = ytdGrossSoFar.plus(payrollLine.earningsGross).plus(projectedFutureGross);
  
  // Step 2: Apply exemptions / deductions
  let taxableIncome = projectedAnnualGross;
  
  // Standard deduction
  taxableIncome = taxableIncome.minus(standardDeduction);  // ₹75K for FY26-27 [VERIFY]
  
  // HRA exemption (if applicable; old regime only)
  if (declarations.regime === 'old' && declarations.rentMonthly.gt(0)) {
    const hraExempt = computeHraExemption(employee, declarations);
    taxableIncome = taxableIncome.minus(hraExempt);
  }
  
  // LTA (only when claimed)
  // Section 24 home loan interest (old regime, up to ₹2L)
  // Section 80C, 80D, 80E, etc. (old regime)
  
  if (declarations.regime === 'old') {
    taxableIncome = taxableIncome.minus(declarations.section80CTotal);  // capped at 1.5L
    taxableIncome = taxableIncome.minus(declarations.section80D_self.plus(declarations.section80D_parents));
    // ... etc
    taxableIncome = taxableIncome.minus(declarations.homeLoanInterestAnnual.lte(200000) ? declarations.homeLoanInterestAnnual : Decimal128.from(200000));
  }
  
  // Step 3: Compute annual tax
  let annualTax = applySlabs(taxableIncome, declarations.regime, employee.age);
  
  // Step 4: Apply surcharge
  if (taxableIncome.gt(5000000)) {
    annualTax = applySurcharge(annualTax, taxableIncome);
  }
  
  // Step 5: Apply 87A rebate (if applicable, new regime)
  if (declarations.regime === 'new' && taxableIncome.lte(700000)) {
    annualTax = Decimal128.from(0);        // [VERIFY current 87A under IT Act 2025]
  }
  
  // Step 6: Add 4% cess
  annualTax = annualTax.times(1.04);
  
  // Step 7: TDS allocation across months
  const tdsAlreadyDeductedYtd = sumYtdTds(employee, runContext.fyCode, runContext.upToPriorPeriod);
  const tdsRemaining = annualTax.minus(tdsAlreadyDeductedYtd);
  const monthsRemaining = monthsLeftInFy(runContext.upToPeriod);
  
  return tdsRemaining.div(monthsRemaining);
}
```

## HRA exemption (Section 10(13A))

`[VERIFY]` Likely retained under IT Act 2025 in some form for old regime.

Exemption is the lesser of three:

1. Actual HRA received
2. 50% of (Basic + DA) for metro cities (Delhi, Mumbai, Kolkata, Chennai); 40% for others
3. Rent paid - 10% of (Basic + DA)

```typescript
function computeHraExemption(employee, declarations): Decimal128 {
  const basicDa = computeAnnualBasicDa(employee);
  const hraReceived = computeAnnualHra(employee);
  const isMetro = ['DL', 'MH', 'WB', 'TN'].includes(employee.workLocation.state);  // Delhi, Mumbai, Kolkata, Chennai
  const cityFactor = isMetro ? 0.50 : 0.40;
  const tenPercentBasicDa = basicDa.times(0.10);
  const rentPaidAnnual = declarations.rentMonthly.times(12);
  
  const limit1 = hraReceived;
  const limit2 = basicDa.times(cityFactor);
  const limit3 = rentPaidAnnual.minus(tenPercentBasicDa);
  
  return min(limit1, limit2, limit3).max(Decimal128.from(0));
}
```

`[CA-REVIEW]` Bangalore is officially "non-metro" for HRA purposes, despite being a major city. Mumbai, Delhi, Kolkata, Chennai are the four "metro" for this exemption. Tenant should clarify if doubt.

`[VERIFY]` Rent above ₹1,00,000/year requires landlord PAN; without PAN, exemption may be denied.

## Form 24Q — Quarterly TDS Statement

Filed with NSDL (CPC-TDS, after 2018 transitioned to Income Tax e-filing portal).

### Quarters

| Quarter | Months | Filing deadline |
|---|---|---|
| Q1 | Apr-May-Jun | 31 Jul |
| Q2 | Jul-Aug-Sep | 31 Oct |
| Q3 | Oct-Nov-Dec | 31 Jan |
| Q4 | Jan-Feb-Mar | 31 May |

### Annexure I (every quarter)

Per-employee TDS deducted in that quarter:
- PAN
- Name
- Total amount paid in quarter
- Total TDS deducted
- Date of deduction
- Date of deposit
- BSR code of bank
- Challan serial number
- ...

### Annexure II (only Q4 — annual statement)

Per-employee annual statement:
- Salary as per § 17(1)
- Perquisites as per § 17(2)
- Profits in lieu as per § 17(3)
- Less: HRA (10(13A)), LTA, etc.
- Less: § 16 deductions (standard deduction, profession tax)
- Income from house property
- Other income reported by employee
- Gross total income
- Deductions (Chapter VI-A: 80C, 80D, etc.)
- Taxable income
- Tax on taxable income
- Surcharge, cess
- Rebate (87A)
- Tax payable
- TDS deducted
- Refund / additional payable

### Format

NSDL FVU file (File Validation Utility output):
- Plain TXT with fixed-width fields
- Generated by RPU (Return Preparation Utility) → validated by FVU → uploaded to e-filing portal

The HRMS:
- Generates source data
- Either:
  - Exports to FVU-compatible TXT
  - Or generates RPU-readable Excel for manual run through RPU
- Tracks acknowledgment

`[VERIFY]` Current FVU version. Quarterly updates by NSDL.

### Schema

```typescript
interface Form24QFiling extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  fyCode: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  
  filingDeadline: Date;
  
  // employer details
  employerTan: string;                     // Tax Account Number (TAN)
  employerPan: string;
  
  // file
  fvuFileDocumentId?: ObjectId;
  rpuExcelDocumentId?: ObjectId;
  
  // submission
  submittedAt?: Date;
  acknowledgmentReference?: string;        // 15-digit token from e-filing portal
  
  // contents
  totalEmployeesReported: number;
  totalSalaryPaid: Decimal128;
  totalTdsDeducted: Decimal128;
  
  // Annexure II (Q4 only)
  isAnnexureIIIncluded: boolean;
  annexureIIRecords?: number;
  
  // status
  status: 'draft' | 'fvu-validated' | 'submitted' | 'acknowledged' | 'late' | 'rejected';
  
  // late
  isLate: boolean;
  daysLate?: number;
  lateFeeUnder234E?: Decimal128;           // ₹200 per day max
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

### Late filing penalty

- Section 234E: ₹200/day late fee (capped at TDS amount)
- Section 271H: penalty ₹10K – ₹1L for incorrect / non-filing

## Form 16 — Annual TDS certificate to employee

Issued by employer to employee by **15 June** following FY end.

### Two parts

#### Part A (downloaded from TRACES)

- Employer + employee details
- Quarterly TDS deducted and deposited
- Receipt numbers
- Generated by NSDL/CPC-TDS portal (TRACES)
- Employer downloads after Form 24Q is filed

#### Part B

- Detailed annual statement (similar to Annexure II of Form 24Q-Q4)
- Salary breakdown
- Exemptions and deductions
- Tax computation
- Generated by employer (HRMS)

The HRMS:
- Auto-generates Part B from PayrollLine aggregates
- Pulls Part A from TRACES `[v2]` (or HR uploads after downloading manually)
- Combines into single Form 16 PDF
- Distributes to employees (in-app + email)

### Form 12BA — Statement of perquisites

If employee receives perquisites (company car, accommodation, ESOP, etc.), Form 12BA annexed to Form 16.

The HRMS auto-generates from CompensationRecord + perquisites tracking.

## Section 206AA — TDS at higher rate without PAN

If employee doesn't have PAN, or PAN is "inoperative" (not linked with Aadhaar), TDS at:

- 20% (rate for salaries) or
- Twice the rate per slab, whichever is higher

`[VERIFY]` Aadhaar-PAN linkage deadline was extended multiple times. As of 2024, unlinked PANs were rendered inoperative. Many employees still affected.

The HRMS:
- Validates PAN format at onboarding
- Verifies via NSDL PAN verification API `[v2]`
- Checks PAN-Aadhaar linkage status `[v2]`
- If inoperative: TDS at 20% with notification to employee
- HR override allowed (with employee's submitted Aadhaar-PAN linking proof)

## Section 89 — Relief for arrears

When employee receives arrears:

- Tax liability higher in receipt year (could push into higher slab)
- Section 89 + Rule 21A allows employee to compute tax in arrears year as if received in proper year
- Claim relief at ITR; not in monthly TDS

The HRMS:
- Surfaces arrears clearly in Form 16
- Provides calculator (in `/07-ess-mobile/`) for employee to estimate § 89 relief

## Investment proof verification

Employee declares investments at FY start; submits proofs in Q4 (typically Jan-Feb).

The HRMS:
- ESS form for declarations
- Document upload for proofs (PPF, ELSS, insurance, rent receipts, home loan certificate)
- HR review and approval
- Approved proofs reflect in TDS computation
- Rejected: original projection prevails (likely higher tax)

```typescript
interface InvestmentProof extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  employeeId: ObjectId;
  fyCode: string;
  
  proofType: '80c' | '80d' | '80e' | 'rent-receipt' | 'home-loan' | 'lta' | 'medical' | 'other';
  proofSubType?: string;                   // 'ppf-passbook' | 'elss-statement'
  
  amount: Decimal128;
  documentId: ObjectId;                    // proof attachment
  
  submittedAt: Date;
  
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'partially-approved';
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  approvedAmount?: Decimal128;             // could be less than declared
  
  createdAt: Date;
  isDeleted: boolean;
}
```

## TDS deposit

Per § 192 + Rule 30:
- TDS deducted in current month deposited by **7th of next month**
- Last month's TDS (March): by 30 April

Late deposit:
- Interest @ 1.5% per month under § 201(1A)
- Penalty under § 271C up to amount of TDS

The HRMS:
- Generates challan amount
- HR pays via TIN-NSDL portal
- Captures BSR code, challan serial
- Reconciles with Form 24Q quarterly

## Self-service for employees (ESS)

In `/07-ess-mobile/`:

- View TDS deducted YTD
- Update tax declarations
- Submit investment proofs
- Switch tax regime (within window)
- Download Form 16
- Estimate tax liability
- Form 12BB (employee declaration of HRA, LTA, deductions)

## Edge cases and complexity

### EC1: Employee with multiple employers in FY

Joins new employer mid-FY. Submit Form 12B to declare prior salary. New employer considers prior income in TDS computation.

`[CA-REVIEW]` Without Form 12B, new employer assumes zero prior income; under-deducts TDS; employee owes IT department at ITR.

### EC2: Tax regime switching

Salaried employee can switch regime once per FY at start; may switch in subsequent years. Specific rules under IT Act 2025 to be verified.

### EC3: Senior citizen tax slab

Different basic exemption (₹3L for 60+, ₹5L for 80+). Auto-applied by HRMS based on DOB.

### EC4: Resident vs non-resident

Different tax rules. HRMS assumes resident by default; non-resident handling out of v1 scope.

### EC5: Foreign income

If employee has foreign income, needs to declare. HRMS doesn't compute foreign income tax; employee handles via ITR.

## Open questions

`[OPEN]` IT Act 2025 implementation details: confirm slabs, deductions, exemptions, surcharge, rebate before April 1, 2026. Recommend: dedicated CA review project.

`[OPEN]` Old regime continuation under IT Act 2025. If discontinued, all TDS computed under new regime only. If retained, employee chooses.

`[OPEN]` PAN-Aadhaar linkage status checking automation. NSDL has API; integration in v1 or v2?

`[OPEN]` E-verification of Form 16 generated by employer (some employers' systems aren't recognized; employees raise queries). Recommend: digital signature on Form 16 PDF.

`[OPEN]` Form 24Q TDS deposit reconciliation: HRMS auto-reconcile vs CPC TDS data via TRACES `[v2]`.

## Cross-references

- [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md) — TDS computation
- [/03-payroll/04-pre-payroll-inputs.md](../03-payroll/04-pre-payroll-inputs.md) — declarations
- [/03-payroll/06-arrears-and-retros.md](../03-payroll/06-arrears-and-retros.md) — TDS on arrears
- [13-statutory-files-and-formats.md](./13-statutory-files-and-formats.md) — FVU format
- [15-statutory-deadlines-calendar.md](./15-statutory-deadlines-calendar.md) — TDS deadlines
