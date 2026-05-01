# 06 — Arrears & Retros

## Purpose

Real-world payroll has **backdated changes**. Salary revision approved June 15, effective April 1. Late attendance arrives after period locked. Tax declaration submitted after the cutoff. Promotion paperwork delayed. These create **arrears** — adjustments to past pay that flow into a current-period payroll.

This file specifies how the engine computes and applies retros without breaking determinism, audit, or compliance filings.

## Concepts

| Term | Meaning |
|---|---|
| Backdated | An effective date earlier than the discovery date |
| Arrears | The difference owed (or to be recovered) due to backdated change |
| Retro period | The historical period(s) the change affects |
| Carry-back | Recompute prior PayrollLines (locked → unlocked) — risky, rare |
| Carry-forward | Compute the difference and apply in next available period — preferred |
| Retro PayrollLine | A line in the current period representing the retro amount |

## Default approach: Carry-forward

The platform's default is **carry-forward**:

- Prior period PayrollLines are NOT modified
- The difference is computed and added as `ARREARS` line item in current period
- Statutory contributions on retro wages are computed and deposited in current month's challans
- TDS on retro is computed considering it's "paid in current month" but pertaining to past months — special tax treatment

This approach:
- Preserves determinism of past PayrollLines (audit trail intact)
- Doesn't require re-opening locked periods
- Doesn't require revising already-filed PF ECR / 24Q
- Aligns with most companies' practice

## When carry-back is required

Rare. Used only when:

- Major data correction discovered (employee paid wrong by ₹50K+)
- Audit finding requires restatement
- Legal compliance demands

Carry-back requires:
- Tenant Admin approval
- Re-opening prior PayrollPeriod
- Revising statutory filings (file revised ECR / 24Q)
- Audit log captures full chain

`[DECISION]` v1 supports only carry-forward. Carry-back implemented in v2 with separate workflow.

## Retro types

### Type 1: Compensation retro (salary revision)

Most common. New CompensationRecord with effectiveFrom in past.

```
Pankaj's CTC ₹12L → ₹15L effective April 1.
Approved May 25.
April payroll already ran with ₹12L.
May payroll computes April retro:
  April old gross = X (already paid)
  April new gross = Y (recomputed under new structure)
  April retro = Y - X
  Added to May payroll line as 'ARREARS - April Salary Revision'
```

### Type 2: Attendance retro

Late attendance event corrected after period lock.

```
Pankaj absent April 5; biometric was offline. Marked as LOP.
Manager regularizes May 15.
May payroll: 1 day LOP refund for April 5 + employer PF on that day.
```

### Type 3: One-time payment retro

Approved bonus that should have been paid earlier.

```
Performance bonus ₹50K approved May 20, supposed to be in April payroll.
Added to May payroll as one-time addition (no retro complexity; just delayed payment).
```

This is technically not a retro — just a delayed one-time payment.

### Type 4: Statutory retro

Statutory rule changed mid-year retroactively (rare but happens — e.g., DA hike notification effective from past date).

```
State minimum wage notification April 30 raises minimum wage effective April 1.
Workers below new minimum need DA increment.
April payroll already ran.
May payroll: arrears for April for affected workers.
```

### Type 5: Tax declaration retro

Employee submits investment proofs in February. April-Jan TDS was computed on projected investments; actuals differ.

```
Pankaj projected ₹150,000 80C investments at start of FY.
Actual proofs in Feb: only ₹80,000.
Tax liability higher than projected.
Difference added to remaining months' TDS (Feb, Mar) — increase deduction.
```

This is **TDS adjustment**, computed within the engine's TDS step — see [05-payroll-engine.md](./05-payroll-engine.md). No new "ARREARS" line; just higher monthly TDS.

## Retro computation

### Step 1: Identify retro events

When a backdated change occurs:

```typescript
interface RetroEvent extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeId: ObjectId;
  
  retroType: 'compensation' | 'attendance' | 'statutory' | 'tax-declaration' | 'one-time';
  
  // affected period range
  retroFromDate: string;                   // earliest affected date
  retroToDate: string;                     // typically end of period preceding current
  
  // source
  triggerEntity: 'CompensationRecord' | 'RegularizationRequest' | 'StatutoryRule' | 'TaxDeclaration';
  triggerEntityId: ObjectId;
  triggerEffectiveFrom: Date;
  triggerEnteredAt: Date;
  
  // status
  status: 'pending-computation' | 'computed' | 'applied-to-run' | 'cancelled';
  
  // computed amounts (filled when retro is calculated)
  computedAmounts?: {
    arrearsGross: Decimal128;
    arrearsPf: Decimal128;
    arrearsEsi: Decimal128;
    arrearsTds: Decimal128;
    arrearsPt: Decimal128;
    arrearsLwf: Decimal128;
    arrearsEmployerPf: Decimal128;
    arrearsEmployerEsi: Decimal128;
    arrearsNetPay: Decimal128;
    breakdownByPeriod: Array<{
      payrollPeriodId: ObjectId;
      periodCode: string;
      oldGross: Decimal128;
      newGross: Decimal128;
      delta: Decimal128;
    }>;
  };
  
  // application
  appliedToPayrollRunId?: ObjectId;
  appliedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

### Step 2: Compute retro amounts

For compensation retro:

```typescript
async function computeCompensationRetro(employeeId, retroFromDate, retroToDate, runContext): Promise<RetroAmounts> {
  // Find all completed payroll periods in the retro window
  const periods = await PayrollPeriod.find({
    employeeId, // (joins through entity)
    startDate: { $gte: retroFromDate },
    endDate: { $lte: retroToDate },
    status: 'locked',
  });
  
  let totalArrearsGross = Decimal128.from(0);
  let totalArrearsPf = Decimal128.from(0);
  // ... etc
  
  for (const period of periods) {
    // The original PayrollLine
    const originalLine = await PayrollLine.findOne({ employeeId, payrollPeriodId: period._id, status: { $ne: 'superseded' } });
    
    // Recompute "what would have been" with the new compensation
    const recomputedLine = await runEngineForEmployeeInPeriod(
      employeeId, period, /* using NEW CompensationRecord */
    );
    
    const delta = recomputedLine.netPay.minus(originalLine.netPay);
    totalArrearsGross = totalArrearsGross.plus(recomputedLine.earningsGross.minus(originalLine.earningsGross));
    totalArrearsPf = totalArrearsPf.plus(recomputedLine.deductionsByCode('EMPLOYEE_PF').minus(originalLine.deductionsByCode('EMPLOYEE_PF')));
    // ... and so on
  }
  
  return { arrearsGross: totalArrearsGross, ... };
}
```

This is computationally expensive but accurate. Caching at run level helps.

### Step 3: Apply to current run

Retro amounts are added as one-time entries to current period's PrePayrollInput:

```typescript
oneTimeAdditions.push({
  componentCode: 'ARREARS',
  amount: retroAmounts.arrearsGross,
  description: `Salary revision arrears - April to June 2026 (revised CTC ₹15L → effective ${effectiveDate})`,
  isTaxable: true,
  countsForPf: true,                       // arrears wages count for PF
  countsForEsi: true,
  effectiveDate: currentPeriod.endDate,
  source: 'retro-event',
  retroEventId: retroEvent._id,
});
```

When engine processes current period:
- Arrears appears as a line in earnings
- PF / ESI on arrears computed (already paid prior periods' employer costs need to be uplifted too — separate `EMPLOYER_PF_ARREARS` line in employer costs)
- TDS on arrears handled per Section 192 — full retro included in current month's gross for cumulative TDS computation

## TDS treatment of arrears

Income Tax Act § 89 + Rule 21A allows employees to compute tax on arrears using the formula:

> Tax on (Total Income including arrears) - Tax on (Total Income excluding arrears) - Tax that would have been payable in the year to which the arrears pertain

This relief is claimed by the employee at ITR filing, NOT during monthly TDS.

For monthly TDS purposes:

- Arrears are included in current month's gross
- Annual projected income recomputed
- TDS for current month adjusts upward
- Employer notes "arrears paid this month" in Form 16 / 24Q

`[CA-REVIEW]` Form 24Q Annexure II (annual statement) requires breakdown of "Salary as per provisions of Section 17(1)" which includes arrears in the year of receipt. Form 16 reflects this. Section 89 relief is employee's claim.

## Statutory contribution on arrears

EPFO / ESIC rules:

- Employer must contribute PF on arrears (since arrears are wages)
- Deposit timing: with current month's challan
- ECR includes arrears wages
- Late deposit if delayed beyond 15th of next month → interest under § 7Q + penalty under § 14B

The HRMS auto-computes:
- Employee PF on arrears (from employee's pay)
- Employer PF + admin + EDLI on arrears (additional employer cost)
- Adds to current month's PF deposit

## Worked example — Salary revision retro

Pankaj's CTC ₹12L → ₹15L effective April 1, 2026. Revision approved May 20. May payroll runs May 28.

### Original April PayrollLine (already locked, ₹12L CTC)

| Component | Amount |
|---|---|
| BASIC | ₹40,000 |
| HRA | ₹20,000 |
| LTA monthly | ₹2,667 |
| TRANSPORT | ₹160 |
| SPECIAL | ₹33,007 |
| **Earnings Gross** | **₹95,834** |
| Employee PF | ₹1,800 |
| PT | ₹200 |
| TDS (under old projection) | ₹4,000 |
| Net Pay | ₹89,834 |

### Recomputed April under new ₹15L CTC

| Component | Amount |
|---|---|
| BASIC | ₹50,000 |
| HRA | ₹25,000 |
| LTA monthly | ₹3,333 |
| TRANSPORT | ₹200 |
| SPECIAL | ₹41,262 |
| **Earnings Gross** | **₹119,795** |
| Employee PF | ₹1,800 (capped) |
| PT | ₹200 |
| TDS (with revised projection) | ₹7,313 |
| Net Pay | ₹110,482 |

### April retro

```
arrearsGross    = 119,795 - 95,834 = 23,961
arrearsEmployeePf = 1,800 - 1,800 = 0  (both capped at ₹15,000 wage)
arrearsPt       = 200 - 200 = 0
arrearsTds      = 7,313 - 4,000 = 3,313
arrearsNetPay   = 110,482 - 89,834 = 20,648
arrearsEmployerPf = same as before, 0
arrearsEmployerEsi = 0 (not applicable, gross > 21K)
arrearsEmployerGratuity = (50K * 0.0481) - (40K * 0.0481) = 2,405 - 1,924 = 481
```

### May PayrollLine (with retro)

May runs at ₹15L CTC (new comp record). May earnings as in worked example earlier.

Plus one-time additions:
| Component | Amount |
|---|---|
| ARREARS - April Salary Revision | ₹23,961 |

May earnings now = 119,795 (regular) + 23,961 (arrears) = 143,756

Statutory:
- PF wages = 50,000 (basic, capped at ₹15K) + arrears wages 10K? — Actually arrears is added to current month's PF wage:
  ```
  Effective PF wage May = May basic + April arrears basic = 50,000 + 10,000 = 60,000
  Capped at ceiling: still 15,000 → ₹1,800 PF (same)
  ```
  So no extra employee PF in May because already at ceiling.
- TDS recomputed:
  ```
  YTD gross: April actual (95,834) + May (119,795) + April arrears (23,961) = 239,590
  Annualized projection: bumped up (since now CTC is ₹15L going forward)
  Cumulative TDS = annual tax × (months elapsed / 12)
  May TDS = cumulative target - already-deducted YTD
  ```

Detailed in [/04-compliance/03-tds-and-income-tax.md](../04-compliance/03-tds-and-income-tax.md) Phase 3.

## Audit chain

For every retro:

1. Original PayrollLine: unchanged, audit-tagged with "supersession not applied; retro in next period instead"
2. RetroEvent: created, computed
3. Current PayrollRun: includes retro one-time addition; audit links to RetroEvent
4. Statutory filings: PF ECR for current month includes arrears wages; ECR submission audit-tagged

A query "show me all retros applied to Pankaj" returns chronological list.

## Multi-period retros

Sometimes retros span multiple periods:

```
Revision effective April 1; approved June 25.
April + May payroll already locked.
June payroll has retro for both April + May.
```

```typescript
breakdownByPeriod: [
  { period: '2026-04', oldGross: 95834, newGross: 119795, delta: 23961 },
  { period: '2026-05', oldGross: 95834, newGross: 119795, delta: 23961 },  // assuming May also ran at old CTC
]
totalArrears: 47,922
```

Single ARREARS line in June: ₹47,922 with breakdown in description.

## Negative retros (reduction)

Rare but real. Salary corrected DOWNWARD with backdated effect.

```
Pankaj's CTC was supposed to be ₹12L, accidentally entered as ₹15L. Corrected May 20 effective April 1.
April payroll ran with ₹15L → overpaid.
April retro: NEGATIVE (₹23,961).
May PayrollLine includes ARREARS = -23,961 (a deduction).
```

Negative retros recover from current month's pay. If recovery > current month's net (rare), spread over multiple months per tenant config.

`[CA-REVIEW]` Recovery of overpaid wages requires employee acknowledgment / consent in some interpretations. Spec: tenant policy.

## Retro on departed employees

If retro applies to an employee who has separated:

- F&F was already done
- Cannot deduct via current payroll (no current pay)
- Process:
  - HR initiates supplementary F&F
  - Bank transfer for arrears (with supplementary payslip)
  - Statutory contributions: re-deposited if applicable
  - Form 16 may need revision if FY hasn't ended

Edge case; manual approval required.

## Retro on PF ECR

PF ECR for current month includes arrears wages with reference to original month:

```
Pankaj's May ECR row:
  pfWages: 60000 (original 50K + arrears 10K basic)
  But ECR also tracks "month of pay accrual"
  
EPFO ECR format supports "arrears" tagging  [VERIFY current ECR spec]
```

`[VERIFY]` EPFO ECR file format current version. Has fields for arrears wages disclosure to EPFO.

## Retro on Form 24Q

Form 24Q quarterly return: arrears reported in the quarter of payment, not accrual.

`[CA-REVIEW]` Form 24Q + Annexure II reflect arrears in receipt year per Section 17(1).

## Open questions

`[OPEN]` How long after a period close can retros apply? Recommend: up to 6 months in general; FY boundary respected (no retros across FY for routine cases).

`[OPEN]` Should retros affect already-issued Form 16? If FY hasn't been finalized, yes (Form 16 reissued). If finalized: revised Form 16 (rare; CA review needed).

`[OPEN]` Bulk salary revisions causing mass retros (e.g., 500 employees revised in May effective April). Performance: each retro = full recomputation. Recommend: parallelize; cache rules; commit batch.

`[OPEN]` Section 89 relief — auto-compute and surface to employee at ITR season? Recommend: employee tool in v2 ESS module.

`[OPEN]` Customer-visible retro reasons. "Why did I get ₹23K extra this month?" Payslip should clearly explain. Recommend: detailed retro breakdown on payslip with month + reason.

## Cross-references

- [05-payroll-engine.md](./05-payroll-engine.md) — engine handles arrears via one-time entries
- [04-pre-payroll-inputs.md](./04-pre-payroll-inputs.md) — retro events feed inputs
- [10-payslip-format.md](./10-payslip-format.md) — payslip retro display
- [/04-compliance/03-tds-and-income-tax.md](../04-compliance/03-tds-and-income-tax.md) — TDS treatment
- [/04-compliance/01-pf-act-and-formulas.md](../04-compliance/01-pf-act-and-formulas.md) — PF on arrears
