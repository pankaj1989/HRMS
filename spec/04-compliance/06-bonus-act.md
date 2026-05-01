# 06 — Bonus Act (Compliance)

## Purpose

Statutory references, registers, and forms for Payment of Bonus Act 1965. Computation logic is in [/03-payroll/07-bonus-calculation.md](../03-payroll/07-bonus-calculation.md); this file focuses on compliance: applicability evidence, statutory registers (Form A, B, C, D), and labour department filings.

## Statutory citations

| Section | Provision |
|---|---|
| § 1(3) | Applicability: 20+ employees during accounting year |
| § 2(13) | Definition of "employee" — wages ≤ ₹21,000/month threshold |
| § 8 | Eligibility: 30 working days |
| § 10 | Minimum bonus: 8.33% |
| § 11 | Maximum bonus: 20% |
| § 12 | Calculation salary cap: ₹7,000/month or minimum wage |
| § 19 | Time limit: within 8 months of FY end |
| § 20-25 | Allocable surplus, set-on/set-off, accounting year provisions |
| § 26 | Maintenance of registers |
| § 28 | Penalties for non-compliance |

## Applicability tracking

```typescript
interface BonusApplicability extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  fyCode: string;
  
  // applicability evidence
  totalEmployeeCount: {
    monthly: Array<{ month: string; count: number }>;
    maxInFy: number;
  };
  isApplicable: boolean;                   // 20+ at any point
  applicabilityFirstTriggeredOn?: string;  // date when first crossed 20
  
  // continuing applicability
  isContinuingApplicability: boolean;       // even if currently < 20, was once 20+
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

`[CA-REVIEW]` Once Bonus Act becomes applicable, it continues even if employee count drops below 20 (per § 1(5)).

## Form A — Computation of Allocable Surplus

Required if employer chooses to compute bonus % based on surplus (not flat 8.33%).

Sections of Form A:

1. Gross profit (from P&L)
2. Less: depreciation
3. Less: development rebate / allowance
4. Less: direct tax (current year + deferred)
5. Less: development reserve
6. = Available surplus
7. × 67% (60% for banking) = Allocable surplus

Then:

8. Add: set-on from prior years
9. Less: set-off to prior shortfalls
10. = Net allocable surplus for distribution

If net allocable > minimum bonus liability: distribute up to 20%, set-on remainder.
If net allocable < minimum bonus liability: pay 8.33%, set-off shortfall to future years.

`[CA-REVIEW]` Set-on / set-off rules complex. Most SMEs avoid by paying flat 8.33%. Larger / public companies compute.

The HRMS:
- Provides Form A as fillable PDF/Excel
- Captures inputs from financial statements (manual; tenant doesn't have accounting integration in HRMS scope)
- Computes allocable surplus
- Applies set-on/set-off

## Form B — Set-on and Set-off

Year-by-year tracking:

| Year | Allocable surplus | Allocable for bonus | Set-on B/F | Set-off C/F |
|---|---|---|---|---|
| 2024-25 | ₹X | ₹Y | 0 | 0 |
| 2025-26 | ₹X' | ₹Y' | A | B |

Maintained for at least 4 years (accumulation periods under § 15).

## Form C — Bonus paid statement

Per-employee statement of bonus paid for the year:

| Employee Code | Name | Designation | Monthly wages | Months worked | Bonus payable | Bonus paid | Date of payment |
|---|---|---|---|---|---|---|---|
| EMP00100 | Ravi Kumar | Operator | 12000 | 12 | 7000 (8.33%) | 7000 | 15-Nov-2026 |

Auto-generated from `EmployeeBonusEntitlement` records.

## Form D — Annual Return

Filed with Inspector under Bonus Act within **30 days** of bonus payment per Rule 5 of Payment of Bonus Rules 1975.

Contents:
- Establishment details
- Total employees (avg + max)
- Total wages paid in FY
- Statutory bonus paid
- Other bonus paid (performance, festival)
- Bonus % calculated
- Set-on / set-off
- Authority signature

The HRMS auto-generates Form D from financial + bonus data.

## Schema for tracking filings

```typescript
interface BonusActFiling extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  fyCode: string;
  
  // forms
  formA?: { generated: boolean; documentId?: ObjectId; };
  formB?: { generated: boolean; documentId?: ObjectId; };
  formC?: { generated: boolean; documentId?: ObjectId; };
  formD?: { generated: boolean; documentId?: ObjectId; submittedAt?: Date; acknowledgmentRef?: string; };
  
  // payment status
  bonusPaymentDeadline: Date;              // 8 months after FY end
  bonusPaidOn?: Date;
  isBonusPaymentLate: boolean;
  
  // filing status
  formDFilingDeadline: Date;               // 30 days after payment
  isFormDFilingLate: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

## Penalties (§ 28)

- Non-payment of bonus: imprisonment up to 6 months OR fine up to ₹1,000 OR both
- Failure to maintain register: similar penalty
- Continuing offence: ₹100/day additional fine

`[VERIFY]` Penalty amounts under Code on Wages 2019. Likely revised.

## Inspector mode

Bonus Act inspector visits typically request:
- Form A (if applicable)
- Form B (set-on/set-off history)
- Form C (employee-wise bonus paid)
- Form D (annual return acknowledgment)
- Wage register for the FY (to verify wages for bonus eligibility)
- Bonus payment evidence (challan / bank reference)

Inspection pack assembles all these.

## Open questions

`[OPEN]` Code on Wages § 26-41 covers bonus. Form formats may have been updated. `[VERIFY]` current form numbers / contents post-Code notification.

`[OPEN]` Performance bonus reporting under Bonus Act: does "other bonus" need separate disclosure? Recommend: yes, distinct line in Form D.

`[OPEN]` Bonus disputes / appeals (Section 22): if employee disputes amount, escalation. Recommend: HRMS captures disputes; case management.

## Cross-references

- [/03-payroll/07-bonus-calculation.md](../03-payroll/07-bonus-calculation.md) — bonus computation
- [/00-foundations/06-statutory-rules-engine.md](../00-foundations/06-statutory-rules-engine.md) — Bonus Act rules
- [12-statutory-registers.md](./12-statutory-registers.md) — register catalog
- [15-statutory-deadlines-calendar.md](./15-statutory-deadlines-calendar.md) — bonus deadlines
