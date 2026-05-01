# 02 — ESI Act & Formulas

## Purpose

Employees' State Insurance Act, 1948 — provides medical, sickness, maternity, disablement, and dependants' benefits to insured employees and their families. Mandatory contributions from employee + employer.

## Applicability

ESI Act applies to:

- **Factories**: covered if 10+ employees (some states 20+) and using power; 20+ if not using power. Threshold reduced over time.
- **Establishments** notified by appropriate government:
  - Shops & commercial estabs (10+ in most states)
  - Hotels, restaurants
  - Cinema theatres
  - Newspaper estabs
  - Motor transport undertakings
  - Educational institutions, medical institutions

Geographic coverage: notified ESIC areas (most urban + many rural districts now).

`[VERIFY]` Code on Social Security 2020 retains 10+ threshold for factories; broader establishment list. Check current notifications per state.

### Wage threshold for ESI coverage

- Employee with monthly wages ≤ **₹21,000** is "insured employee"
- Increased from ₹15,000 to ₹21,000 effective Jan 1, 2017
- Employees with disabilities: threshold ₹25,000
- Above threshold: not in ESI scheme

`[VERIFY]` Threshold may have been updated; check ESIC.

## Contribution rates (current FY 2026-27)

`[VERIFY]` ESIC may have revised:

| Component | Rate |
|---|---|
| Employee share | 0.75% of gross wages |
| Employer share | 3.25% of gross wages |
| **Total** | **4.00%** |

History:
- Pre-2019: Employee 1.75%, Employer 4.75%, Total 6.5%
- Effective July 1, 2019: reduced to 4.00% total

## "Wages" for ESI

ESI Act § 2(22) "wages" means all remuneration paid to employee, **including**:

- Basic, DA, HRA
- Allowances
- Bonus (production bonus, attendance bonus)
- OT
- Cash equivalent of food/canteen subsidy

**Excluded**:

- Contribution by employer to PF/pension/gratuity fund
- Travelling allowance / travelling concession
- Sum paid to defray special expenses
- Gratuity payable on discharge

`[CA-REVIEW]` ESI wage definition is broader than PF. Most allowances flow into ESI wage. Some interpretation around "production bonus" vs "annual statutory bonus" — generally bonus paid frequently is wages; annual statutory bonus is debated.

The HRMS has explicit `countsForEsi` flag per component.

## Contribution periods (special concept)

ESI has **contribution periods** and **benefit periods**:

| Contribution Period | Benefit Period |
|---|---|
| April 1 – September 30 | January 1 – June 30 (next year) |
| October 1 – March 31 | July 1 – December 31 (same year) |

Once an employee enters a contribution period (with wages ≤ threshold at start), they remain insured for that entire period **even if wages rise above threshold** during the period.

This is a key nuance: a salary hike mid-period doesn't immediately disable ESI coverage.

```typescript
function isEsiApplicable(employee, period: PayrollPeriod): boolean {
  const contributionPeriod = computeContributionPeriod(period.endDate);
  const wagesAtStart = getEmployeeWagesAt(employee, contributionPeriod.startDate);
  
  if (wagesAtStart.lte(esiThreshold)) {
    return true;                           // continuous through period regardless of mid-period changes
  }
  return false;
}
```

When new contribution period starts, re-evaluate based on wages at that date.

`[BLUE-COLLAR]` Most factory workers earn within ESI threshold. Most white-collar IT employees exceed threshold and are NOT in ESI.

## Employee-side contribution

```
Employee ESI = Gross ESI Wages × 0.75%
```

Rounded per ESIC convention `[VERIFY]` (typically rounded up to nearest paisa or rupee).

## Employer-side contribution

```
Employer ESI = Gross ESI Wages × 3.25%
```

## Worked example

Anil, factory worker:
- Gross monthly: ₹18,000 (within ESI threshold)
- Worked all days; no LOP

```
ESI Wages = 18,000
Employee ESI = 18,000 × 0.75% = ₹135
Employer ESI = 18,000 × 3.25% = ₹585
Total challan for Anil: ₹720
```

For 50 such workers, monthly challan ~₹36,000.

## ESIC challan and filing

### Monthly contribution payment

Due by **15th of next month** (e.g., April contributions paid by May 15).

### Challan generation

ESIC provides online challan generation:
1. Login to ESIC portal
2. Generate challan based on declared wages
3. Pay via netbanking/UPI

The HRMS:
- Auto-computes per-employee ESI from PayrollLines
- Aggregates to total
- HR uploads challan PDF reference + payment confirmation

### Half-yearly return

Per § 44 of Act: every employer to submit half-yearly return:
- Period 1: April-September (return due by November 11) `[VERIFY current deadline]`
- Period 2: October-March (return due by May 11)

Format:
- List of insured persons
- Wages and contributions
- New joiners and exits

The HRMS auto-generates from PayrollLines.

## Schema for tracking

```typescript
interface EsiFiling extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  esiCode: string;                         // ESIC employer code, e.g., '12-34567-89'
  
  filingType: 'monthly-contribution' | 'half-yearly-return-1' | 'half-yearly-return-2' | 'employee-registration';
  
  filingForPeriod: string;                 // '2026-04' for monthly, 'CP-2026-1' for contribution period 1
  filingDeadline: Date;
  
  // wages and contributions
  totalWages: Decimal128;
  employeeContribution: Decimal128;
  employerContribution: Decimal128;
  totalContribution: Decimal128;
  
  // file
  fileFormat: 'esic-rc' | 'pdf' | 'xls';
  fileDocumentId?: ObjectId;
  
  // submission
  submittedAt?: Date;
  submittedBy?: ObjectId;
  challanReference?: string;
  paidAt?: Date;
  
  // status
  status: 'draft' | 'submitted' | 'paid' | 'late' | 'failed';
  
  isLate: boolean;
  daysLate?: number;
  
  // late penalty
  interestPenaltyAmount?: Decimal128;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

## Insured Person (IP) registration

When new employee joins and is in ESI scope:

### Form 1 (Declaration form)

Submitted within 10 days of employment commencement.

Required:
- Personal details (name, DOB, address, family)
- Identity (Aadhaar)
- Bank details
- Employer details
- Nominee details
- Family particulars (for benefits)

Once registered, employee receives **Insurance Number** and **ESI Pehchan card** (or e-card via biometrics).

### Schema

```typescript
interface EsiMember extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  employeeId: ObjectId;
  
  // ESIC ids
  insuranceNumber: string;                 // 10-digit; primary identifier
  pehchanCardId?: string;
  
  // registration
  registrationDate: string;
  form1SubmittedAt?: Date;
  
  // dispensary
  dispensaryCode?: string;                 // assigned medical service location
  dispensaryName?: string;
  
  // family
  family: Array<{
    name: string;
    relationship: string;                  // 'spouse' | 'son' | 'daughter' | 'father' | 'mother'
    dob: string;
    isDependent: boolean;
  }>;
  
  // status
  status: 'active' | 'pending-registration' | 'separated' | 'transferred' | 'inactive';
  separationReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

## Benefits provided by ESI

### 1. Medical benefit

- Free medical care to insured + family
- Through ESI dispensaries, hospitals, panel doctors
- No cap on actual medical expenses

### 2. Sickness benefit

- Cash benefit if unable to work due to illness
- 70% of average daily wages
- For up to 91 days in two consecutive benefit periods
- Eligibility: contributions for at least 78 days in immediately preceding contribution period

### 3. Maternity benefit (also under MB Act)

- 26 weeks paid leave
- Coordinated with Maternity Benefit Act

### 4. Disablement benefit

- Temporary disablement: 90% of average daily wages from day 1
- Permanent disablement: lifelong pension

### 5. Dependants' benefit

- If insured dies due to employment injury
- Pension to widow + children

### 6. Funeral expenses

- Maximum ₹15,000 to family on death of insured

### 7. Other benefits

- Vocational rehabilitation
- Confinement expenses
- Unemployment allowance (RGSKY) for involuntary loss of employment

The HRMS:
- Tracks employee's ESI status
- Helps employee navigate benefit claims (in `/07-ess-mobile/`)
- Logs benefit utilization for analytics

## Integration with attendance

NCP days affect ESI just like PF:

```
ESI Wages for employee (period) = Wages × (paidDays / totalCalendarDays)
```

Long absence may affect contribution but doesn't disable insurance status mid-period.

## State-specific implementations

ESIC operates across India with regional offices. Some states have:

- ESIC hospitals (most major cities)
- Tied-up panel hospitals (where ESIC dispensaries unavailable)
- Special schemes (e.g., COVID benefit during pandemic)

The HRMS:
- Region/state context per employee
- Dispensary assignment
- Hospital network reference

## Reporting

- ESI Contribution Report: monthly per-employee + aggregate
- New IP Registrations: monthly batch
- Separations: notify ESIC
- Benefit Utilization: which employees used ESI services
- Compliance Status: % timely deposits

## Exemptions

Some employers can be exempted from ESI if they provide superior medical/insurance coverage:

- Apply for exemption under § 87 of ESI Act
- Approval by ESIC
- Continued compliance auditing

The HRMS:
- Stores exemption certificate
- If exempted: skips ESI computation
- Audits show exempted status

## Code on Social Security transition

SS Code 2020 § 28-44 covers ESI. Key changes:

- Threshold may be revised
- Procedural changes
- Digital-first compliance

`[VERIFY]` Status of SS Code Chapter on ESI implementation as of FY 2026-27.

## Open questions

`[OPEN]` Mid-period wage hike: confirm "remains insured for full period" interpretation. ESIC has clarified multiple times. Recommend: implement per latest circular; provide tenant override flag.

`[OPEN]` ESI on bonus and one-time payments: include or not? ESIC's general view: regular wages-like payments yes; one-time annual bonus no. Recommend: tenant config; default per ESIC interpretation.

`[OPEN]` Direct ESIC API integration. Limited availability. Recommend: file upload in v1; API in v2.

`[OPEN]` Disabled employee threshold ₹25,000 — automatic detection or HR-flagged? Recommend: HR flags via disability status in employee master.

## Cross-references

- [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md) — ESI computation
- [/03-payroll/02-component-library.md](../03-payroll/02-component-library.md) — ESI-related components
- [/01-employee/04-statutory-ids.md](../01-employee/04-statutory-ids.md) — Insurance Number
- [13-statutory-files-and-formats.md](./13-statutory-files-and-formats.md) — ESIC formats
- [15-statutory-deadlines-calendar.md](./15-statutory-deadlines-calendar.md) — ESI deadlines
- [14-2026-labour-codes.md](./14-2026-labour-codes.md) — SS Code transition
