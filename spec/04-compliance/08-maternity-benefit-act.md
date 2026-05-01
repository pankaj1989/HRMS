# 08 — Maternity Benefit Act

## Purpose

Maternity Benefit Act 1961 (amended 2017) regulates paid maternity leave, related benefits, and protections for women employees. Subsumed under Code on Social Security 2020 § 59-72.

## Key provisions

### Eligibility (§ 5)

Woman is eligible for maternity benefit if she has worked **at least 80 days** in 12 months preceding the date of expected delivery.

### Quantum of benefit (§ 5, post-2017 amendment)

| Scenario | Duration | Notes |
|---|---|---|
| Childbirth (first 2 children) | 26 weeks | 8 weeks pre + 18 weeks post-natal |
| Childbirth (3rd onwards) | 12 weeks | 6 weeks pre + 6 weeks post |
| Adoption (legally adopted child < 3 months at handover) | 12 weeks | from date of handover |
| Commissioning mother (surrogacy) | 12 weeks | from date of child handover |
| Miscarriage / medical termination | 6 weeks | from date of MTP/miscarriage |
| Tubectomy operation | 2 weeks | post-operative rest |
| Pregnancy-related illness (additional) | 1 month | beyond regular ML |

### Payment rate (§ 5)

> Rate of average daily wage for the period of actual absence

"Average daily wage" = total wages earned in 3 calendar months immediately preceding the date of absence ÷ number of days actually worked.

```typescript
function computeAverageDailyWage(employee, asOfDate): Decimal128 {
  const threeMonthsPrior = subMonths(asOfDate, 3);
  const wagesEarned = sumPayrollLineGross(employee, threeMonthsPrior, asOfDate);
  const daysWorked = countWorkedDays(employee, threeMonthsPrior, asOfDate);
  return wagesEarned.div(daysWorked);
}
```

`[CA-REVIEW]` "Wages" definition for ML pay; per § 3(n) excludes bonus, OT, etc.

### Employer obligations (§ 11, § 12)

- Cannot dismiss/discharge during ML or due to pregnancy
- Cannot reduce wages during ML
- Cannot ask for "arduous work / long hours of standing" in 6 months pre-delivery
- Provide nursing breaks (2 daily) until child is 15 months
- Crèche facility (mandatory for 50+ employees per 2017 amendment)
- Post-2017: option to work from home where possible

### Notice requirement (§ 6)

Woman should give written notice at least 6 weeks before expected delivery (or as soon as possible if shorter notice needed).

The HRMS ESS has notice form; routes to manager + HR.

## Schema

```typescript
interface MaternityClaim extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeId: ObjectId;
  
  claimCode: string;                       // 'MB-2026-04-001234'
  claimType: 'childbirth-1st-2nd' | 'childbirth-3rd-plus' | 'adoption' | 'surrogacy-commissioning' | 'miscarriage' | 'tubectomy' | 'pregnancy-illness';
  
  // expected dates
  expectedDeliveryDate?: string;           // YYYY-MM-DD
  actualDeliveryDate?: string;
  childbirthCount?: number;                // employee's count of childbirths
  
  // adoption / surrogacy
  childHandoverDate?: string;
  childAgeAtHandover?: number;             // in months
  
  // medical events
  miscarriageDate?: string;
  tubectomyDate?: string;
  pregnancyIllnessFromDate?: string;
  pregnancyIllnessToDate?: string;
  
  // eligibility
  daysWorkedInPrior12Months: number;
  isEligible: boolean;
  ineligibilityReason?: string;
  
  // entitlement
  entitledDays: number;                    // 182 (26 wks), 84 (12 wks), 42 (6 wks), 14 (2 wks)
  preNatalDays: number;
  postNatalDays: number;
  
  // pay
  averageDailyWage: Decimal128;
  totalBenefit: Decimal128;
  
  // dates
  leaveFromDate: string;
  leaveToDate: string;
  
  // notification
  noticeSubmittedAt?: Date;
  formDocumentId?: ObjectId;               // signed Form / certificate
  
  // medical certificate
  medicalCertificateDocumentId?: ObjectId;
  
  // payment tracking
  preNatalPaidAt?: Date;
  postNatalPaidAt?: Date;
  totalPaid: Decimal128;
  
  // status
  status: 'draft' | 'submitted' | 'approved' | 'in-progress' | 'partially-paid' | 'completed' | 'rejected' | 'cancelled';
  approvedBy?: ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // post-natal nursing breaks
  nursingBreaksApplicable: boolean;        // till child is 15 months old
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

## Forms

### Form A — Notice of Pregnancy (employee)

Submitted by employee at least 6 weeks before EDD.

### Form B — Application for Maternity Benefit

For payment claim. Signed by employee.

### Form C — Application by claimant

In case of death of employee in childbirth, by next of kin.

### Form D — Notice of payment by employer

Acknowledges payment.

The HRMS provides ESS forms for employees; auto-generates internal forms for HR.

## Worked example

Pinky, white-collar engineer, joined April 2024. EDD: October 15, 2026. Last 3 months wages (Jul-Sep 2026): ₹3,60,000 (₹120K/month). Days worked: 66.

```
Average daily wage = 3,60,000 / 66 = ₹5,454.55
This is her first pregnancy → 26 weeks ML

Pre-natal ML start: October 1, 2026 (8 weeks before, but employee can choose)
Total leave: 182 days
Leave end: ~April 1, 2027

Total maternity benefit = 182 × 5454.55 = ₹9,92,727
Paid as part of monthly payroll during ML period (full salary during ML)
```

`[CA-REVIEW]` Tenants typically pay last-drawn salary (which is higher than statutory average). Statutory minimum is average wage; tenant policy can be more generous.

## Crèche facility (§ 11A, post-2017)

Establishments with 50+ employees must provide crèche:
- Within prescribed distance from establishment
- Adequate facilities for children
- 4 visits/day allowed for mother (incl. nursing breaks)

The HRMS:
- Tracks crèche facility provision
- Audit log for compliance
- Reports for inspector

## ESI overlap

If employee is also covered under ESI, maternity benefit is provided by ESIC, not by employer (avoiding double benefit). Employer continues paying salary; can recover from ESIC.

`[CA-REVIEW]` Specific handling depends on ESI eligibility + maternity benefit interplay. Generally:
- Employee in ESI: benefit from ESIC (Section 50 of ESI Act)
- Employee not in ESI: benefit from employer (MB Act)

## Penalties (§ 21)

- Imprisonment up to 1 year + fine
- For not paying benefit: amount owed + further penalty

`[VERIFY]` Code on SS 2020 may have revised.

## Anti-discrimination provisions

- § 12(1): cannot dismiss during pregnancy/ML/illness
- § 12(2): cannot give notice of dismissal to expire during ML
- Burden of proof on employer to show dismissal was unrelated to pregnancy

The HRMS:
- Restricts termination workflows for pregnant employees (warning + escalation)
- Audit log for any termination attempts
- Flag for legal review

## Restrictions on work types (§ 4)

Pregnant women not to:
- Be employed in any work that's "of an arduous nature" 
- Work involving "long hours of standing"
- Work likely to interfere with pregnancy or normal development of fetus
- Be assigned to night shift `[VERIFY]` (general; some states specific)

Period: 6 weeks pre-delivery, but employee can request light work even earlier.

`[BLUE-COLLAR]` Critical for factory floor pregnant workers. Manager / HR notified; light-duty assignment.

## Inspector mode

Maternity Benefit inspector typically requests:
- Notice of pregnancy (Form A) on file
- Maternity benefit payment records
- Crèche facility evidence (if 50+ employees)
- Termination history during ML period
- Post-ML reinstatement evidence

Inspection pack includes.

## Code on Social Security transition

SS Code § 59-72 covers maternity benefits. Most provisions retained from MB Act 1961.

`[VERIFY]` Specific changes under SS Code 2020 implementation.

## Open questions

`[OPEN]` Surrogacy / commissioning mother: extensive case law evolving. Recommend: tenant config; default per latest amendment.

`[OPEN]` Adoption beyond 3 months age of child: not eligible per § 5(4). Should HRMS allow tenant to extend voluntarily? Recommend: yes, as enhanced policy beyond statutory.

`[OPEN]` Same-sex partner adoption / non-binary parent leave: SS Code may evolve. Currently MB Act gendered. Recommend: tenant policy supersedes (more inclusive); statutory minimum preserved.

`[OPEN]` Continuation of employment-based PF / ESI / gratuity service during ML: counts. Confirmed.

## Cross-references

- [/02-attendance/03-leave-types-and-policies.md](../02-attendance/03-leave-types-and-policies.md) — ML leave type
- [/02-attendance/04-leave-accrual-engine.md](../02-attendance/04-leave-accrual-engine.md) — ML accrual / event-based
- [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md) — ML pay
- [02-esi-act-and-formulas.md](./02-esi-act-and-formulas.md) — ESI maternity overlap
- [14-2026-labour-codes.md](./14-2026-labour-codes.md) — SS Code transition
