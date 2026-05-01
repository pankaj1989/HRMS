# 05 — Labour Welfare Fund (State-wise)

## Purpose

Labour Welfare Fund (LWF) is a state-level fund for welfare of workers — medical aid, education, recreational facilities, housing assistance, etc. Levied under each state's Labour Welfare Fund Act. Both employee and employer contribute small amounts; collected by state Labour Welfare Board.

## Constitutional / legal basis

State subject. Each state has its own LWF Act. Code on Social Security 2020 includes provisions for unorganised workers' welfare; states retain LWF for organised workers.

## States that levy LWF (vs not)

LWF is levied in 16 states (varies; check current notifications):

**Levying states**: Andhra Pradesh, Telangana, Maharashtra, Karnataka, Tamil Nadu, Kerala, West Bengal, Odisha, Madhya Pradesh, Chhattisgarh, Goa, Punjab, Haryana, Delhi, Gujarat `[VERIFY]`

**Non-levying states**: Most North-East, J&K, Bihar, Jharkhand, Rajasthan, UP, Uttarakhand, HP

`[VERIFY]` State list per LWF Acts in force.

## Contribution structure (per state)

LWF contributions are typically very small (₹6 to ₹50 range) — flat per employee per cycle, not %-based.

### Maharashtra

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Half-yearly (Jun, Dec) | ₹6 | ₹18 | ₹24 |

Deducted in June and December. Total ₹48/year per employee.

### Karnataka

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Annual (December) | ₹20 | ₹40 | ₹60 |

Deducted in December salary (or December cycle).

### Tamil Nadu

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Annual | ₹10 | ₹20 | ₹30 |

### Andhra Pradesh / Telangana

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Annual (Dec) | ₹30 | ₹70 | ₹100 |

`[VERIFY]` Andhra and Telangana may have separate amounts now (post-bifurcation 2014).

### Kerala

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Half-yearly | ₹50 | ₹50 | ₹100 |

`[VERIFY]` Kerala LWF amounts.

### Delhi

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Half-yearly (Jun, Dec) | ₹0.75 | ₹2.25 | ₹3.00 |

Smallest LWF in country.

### West Bengal

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Half-yearly | ₹3 | ₹15 | ₹18 |

### Madhya Pradesh / Chhattisgarh

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Half-yearly | ₹10 | ₹30 | ₹40 |

### Punjab

| Cycle | Employee | Employer | Total |
|---|---|---|---|
| Monthly | ₹5 | ₹20 | ₹25 |

`[VERIFY]` All amounts. State LWF Acts have specific amendment trail.

## Determination of applicable state

Same as PT — by employee's place of work.

## Schema

```typescript
interface LwfRule extends StatutoryRule {
  ruleKey: `lwf:${StateCode}:default`;
  rulePayload: {
    state: StateCode;
    cycleType: 'monthly' | 'half-yearly' | 'annual';
    cycleMonths: number[];                 // months when LWF deducted
    
    employeeContribution: Decimal128;
    employerContribution: Decimal128;
    totalContribution: Decimal128;
    
    // applicability
    applicableTo: {
      minMonthlyWages?: number;
      maxMonthlyWages?: number;
      employmentTypes?: string[];
      excludeManagerial?: boolean;
    };
    
    // exemptions
    exemptions?: Array<{ type: string }>;
    
    // filing
    filingFormCode: string;
    paymentDeadline: string;
  };
}
```

## Per-employee deduction

Generally, LWF is deducted only in the cycle months (not every month):

```typescript
function isLwfDeductibleMonth(state: StateCode, period): boolean {
  const rule = getLwfRule(state);
  const month = period.endDate.getMonth() + 1;  // 1-12
  return rule.cycleMonths.includes(month);
}

function computeLwf(employee, period, lwfRule): { employee: Decimal128; employer: Decimal128 } {
  if (!isLwfDeductibleMonth(employee.workLocation.state, period)) {
    return { employee: 0, employer: 0 };
  }
  
  if (!isLwfApplicable(employee, lwfRule)) {
    return { employee: 0, employer: 0 };
  }
  
  return {
    employee: lwfRule.employeeContribution,
    employer: lwfRule.employerContribution,
  };
}
```

## Filing

Each state has its own LWF Form (typically Form A or Form II). Filed half-yearly or annually.

### Maharashtra

- Half-yearly: by 31 January (for July-Dec period) and 31 July (for Jan-June)
- Form A-1 with employee list and amounts
- Online via Maharashtra Labour Welfare Board portal

### Karnataka

- Annual: by 15 January
- Form D
- Online via Karnataka LWF portal

### Tamil Nadu

- Annual: by 31 January
- Form A

`[VERIFY]` Filing deadlines per state.

## Schema for tracking

```typescript
interface LwfFiling extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  state: StateCode;
  lwfRegistrationNumber: string;
  
  filingType: 'half-yearly' | 'annual';
  filingForPeriod: string;
  filingDeadline: Date;
  
  // amounts
  totalEmployees: number;
  totalEmployeeContribution: Decimal128;
  totalEmployerContribution: Decimal128;
  totalContribution: Decimal128;
  
  // file
  formCode: string;
  fileDocumentId?: ObjectId;
  
  // submission
  submittedAt?: Date;
  paidAt?: Date;
  challanReference?: string;
  
  // status
  status: 'draft' | 'submitted' | 'paid' | 'late' | 'failed';
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

## Worked example

Acme Bangalore (Karnataka) has 80 employees in scope.

December 2026 payroll:
- Per employee: Rs 20 deducted from each
- Employer: ₹40 × 80 = ₹3,200
- Total to LWB: ₹60 × 80 = ₹4,800

Filing: Form D filed online by January 15, 2027.

## Multi-state tenant

Same as PT: separate registration per state, separate filings.

```typescript
interface EntityLwfRegistration extends BaseDocument {
  tenantId: ObjectId;
  entityId: ObjectId;
  state: StateCode;
  
  lwfRegistrationNumber: string;
  registrationDate: Date;
  
  isActive: boolean;
  
  createdAt: Date;
  isDeleted: boolean;
}
```

## Reports

- **LWF Liability Report**: per-state per-cycle
- **LWF Filing Status**: pending / done
- **LWF Audit Trail**: deductions per employee with cycle context

## Late filing

Per state — typical:
- Maharashtra: ₹50 + interest 1.5%/month
- Karnataka: ₹100 + interest 12%/year

## Open questions

`[OPEN]` LWF for non-permanent (contract) workers: per state rules. Recommend: tenant config; default include for any worker on rolls.

`[OPEN]` Auto-renewal of LWF registration: each state has its own renewal cycle. Recommend: tracking calendar feature.

`[OPEN]` LWF benefits utilization tracking — does HRMS surface to employees? Most aren't aware of LWF benefits (medical aid, scholarships). Recommend: ESS info section.

`[OPEN]` Mid-cycle joiner: pro-rate or full LWF? Per state — most: full deduction in cycle month even for partial period.

## Cross-references

- [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md) — LWF computation
- [/00-foundations/06-statutory-rules-engine.md](../00-foundations/06-statutory-rules-engine.md) — LWF rules
- [04-professional-tax-state-wise.md](./04-professional-tax-state-wise.md) — similar state-wise pattern
- [15-statutory-deadlines-calendar.md](./15-statutory-deadlines-calendar.md) — LWF deadlines
