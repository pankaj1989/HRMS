# 05 — Overtime Engine

## Purpose

Computes overtime hours and OT pay per applicable statutes. OT is one of the highest-risk areas for compliance because:

- **Factories Act § 59** mandates OT at twice the ordinary rate for adult workers exceeding 9 hours/day or 48 hours/week
- **Code on Wages 2019 § 14** carries forward this rate
- **Plantation, mines, contract labour** have their own OT rules
- Mis-computed OT is a common cause of EPFO/labour inspector show-cause notices

The engine treats OT eligibility as **configurable but bounded by statute**: tenants cannot offer LESS than statutory minimum; they may offer more.

## Eligibility model

OT eligibility is determined per employee, per shift, per day:

```typescript
function isOtEligibleForDay(employee, employmentRecord, dailyAttendance): boolean {
  // Rule 1: Employee marked exempt (managerial / supervisory)
  if (employee.isExemptFromOvertime) return false;
  
  // Rule 2: Confirmed by tenant config — "exempt categories"
  const tenantOtConfig = await getTenantOtConfig(tenantId);
  if (tenantOtConfig.exemptDesignations?.includes(employmentRecord.designation)) return false;
  
  // Rule 3: Employee is contract labour — depends on contractor's policy
  if (employmentRecord.isContractLabour) {
    // CLRA: contract labour OT typically follows principal employer rules
    // But specific rules in CLRA Rules 1971
    // [CA-REVIEW]
  }
  
  // Rule 4: Employment type
  if (['consultant', 'gig-worker'].includes(employmentRecord.employmentType)) return false;
  
  // Default: eligible
  return true;
}
```

`[CA-REVIEW]` Defining "managerial / supervisory" position is contentious. Code on Wages § 2(k) defines "wages" excluding workers above ₹16,000 monthly wage cap for OT — but not all states notify the same threshold. Labour codes change this. Need legal opinion per tenant's industry.

## OT calculation rules

### Base rule (Factories Act § 59)

> Where a worker works in a factory for more than nine hours in any day or for more than forty-eight hours in any week, he shall, in respect of overtime work, be entitled to wages at the rate of twice his ordinary rate of wages.

Two triggers:
- **Daily**: >9 hours/day OR >shift's netWorkingMinutes
- **Weekly**: >48 hours/week (Mon–Sun aggregate)

### Daily OT

```
otMinutesDaily = MAX(0, totalWorkedMinutes - shift.netWorkingMinutes)
                where totalWorkedMinutes excludes unpaid breaks
```

But also bounded by:
- `shift.maxOtMinutesPerDay` (e.g., 120 = 2 hours statutory max OT/day in many states)
- Statutory absolute cap: typically `[VERIFY]` 50 hours per quarter under Factories Act § 64

### Weekly OT (when daily not crossed but week is)

```
weeklyTotalMinutes = SUM(totalWorkedMinutes for Mon–Sun)
weeklyOtMinutes = MAX(0, weeklyTotalMinutes - 48 × 60)
                  - (sum of daily OT already credited that week)
```

### Special-rate OT

Weekly off worked: typically 2× rate (mandatory statutory) plus comp-off (varies by company)
Holiday worked: typically 2× plus optional comp-off
Night shift: night allowance separate from OT (not the same)

```typescript
interface OtComputation {
  date: string;
  employeeId: ObjectId;
  
  // raw data
  shiftId?: ObjectId;
  shiftNetMinutes: number;
  totalWorkedMinutes: number;
  
  // computed OT slices
  regularOtMinutes: number;                // beyond shift on a regular work day
  weeklyOffOtMinutes: number;              // worked on weekly off
  holidayOtMinutes: number;                // worked on gazetted holiday
  nightOtMinutes: number;                  // OT during night shift hours (after net hours)
  
  // total (pay-applicable)
  totalOtMinutes: number;
  otRate: 'normal' | 'double' | 'triple' | 'tenant-config';
  otRateMultiplier: number;                // 1.5, 2.0, 2.5
  
  // cap status
  exceedsStatutoryDailyCap: boolean;
  exceedsStatutoryWeeklyCap: boolean;
  exceedsStatutoryQuarterlyCap: boolean;
  
  // pay computation
  ordinaryHourlyRate: Decimal128;          // (Basic+DA)/(workingDaysPerMonth × 8)
  otAmount: Decimal128;
  
  // approvals
  isPreApproved: boolean;
  preApprovalRequestId?: ObjectId;
  postApproved: boolean;
  postApprovedBy?: ObjectId;
  
  computedAt: Date;
}
```

### Ordinary rate calculation

The "ordinary rate" for OT is contentious. Possibilities:

- `(Basic + DA) / 26 / 8` — most common
- `(Basic + DA + Retaining Allowance) / 26 / 8` — Code on Wages broader
- `(Gross Wages excluding HRA, Bonus) / total-working-hours-in-month`

`[CA-REVIEW]` Code on Wages § 14 defines wages broadly for OT. Definition includes: basic, DA, retaining allowance. Excludes: bonus, OT itself, HRA, leave encashment, gratuity.

Default formula:
```
ordinaryHourlyRate = (Basic + DA) / (workingDaysInMonth × 8)
otAmount = otMinutes / 60 × ordinaryHourlyRate × otRateMultiplier
```

Tenant configures `ordinaryRateBasis: 'basic-da' | 'wage-code-definition' | 'custom'`.

## Worked example

Pankaj (factory worker):
- Basic + DA: ₹20,000/month
- April 2026 working days: 26
- Shift S1: 06:00–14:00 (8 hours, 30-min unpaid lunch → 7.5 hours net)
- April 5: punched in 06:00, out 14:00 — 8 hours total, 7.5 hours net
- April 10: punched in 06:00, out 18:00 — 12 hours total, 11.5 hours net
- April 11 (weekly off): worked 06:00 to 14:00 — 7.5 hours

### Daily OT — April 5
```
totalWorkedMinutes = 450 (7.5 hours)
shiftNetMinutes = 450
regularOt = 0
```

### Daily OT — April 10
```
totalWorkedMinutes = 690 (11.5 hours, less 30 min lunch)
shiftNetMinutes = 450
regularOt = 690 - 450 = 240 minutes (4 hours)
exceedsStatutoryDailyCap = true (max 120 typically)
flag: "OT exceeded statutory cap; needs explanation"
otAmount = 4 hours × (20000 / 26 / 8) × 2 = 4 × 96.15 × 2 = ₹769.23
```

### Weekly off worked — April 11
```
totalWorkedMinutes = 450 (7.5 hours)
weeklyOffOtMinutes = 450 (entire day counts)
otAmount = 7.5 × 96.15 × 2 = ₹1442.31
+ comp-off granted (1 day) per tenant policy
```

### Total April OT pay
```
= 0 (April 5) + 769.23 (April 10) + 1442.31 (April 11) = ₹2211.54
```

Plus comp-off balance increased by 1 day for April 11.

## OT pre-approval workflow

To prevent uncontrolled OT, most companies require pre-approval:

```mermaid
sequenceDiagram
    actor Supervisor
    participant App
    participant Manager
    participant DB
    
    Supervisor->>App: request OT for employee X on date Y, ~3 hours expected
    App->>DB: create OtApprovalRequest (status=pending)
    App->>Manager: notify
    Manager->>App: approve / reject
    App->>DB: update status
    
    Note over App: Day Y arrives; employee works extended hours
    App->>App: capture actual OT minutes
    App->>App: compare actual vs approved
    
    alt actual ≤ approved + buffer
        App->>DB: OT auto-credited
    else actual > approved + buffer
        App->>Manager: post-approval needed
        Manager->>App: post-approve / reject excess
        App->>DB: credit approved portion
    end
```

`[ASSUMPTION]` Buffer = 30 minutes. Beyond approved + buffer requires explicit post-approval.

```typescript
interface OtApprovalRequest extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeId: ObjectId;
  date: string;
  
  // request
  requestedMinutes: number;
  reason: string;
  workType: 'production' | 'maintenance' | 'urgent-delivery' | 'other';
  
  // approval
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: ObjectId;
  approvedMinutes?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // actual outcome
  actualOtMinutes?: number;
  variance?: number;                       // actual - approved
  postApprovalNeeded?: boolean;
  postApprovedBy?: ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

## Statutory caps

Under Factories Act:

| Cap | Limit | Notification |
|---|---|---|
| Daily OT | Generally not exceeding 2 hours (varies by state notification) | State Factories Rules |
| Weekly hours including OT | Total ≤ 60 hours `[VERIFY]` | Factories Act § 64 |
| Quarterly OT total | 50 hours per quarter `[VERIFY current notification]` | Factories Act § 64 |
| Spread-over (start to end of shift) | 10.5 hours | Factories Act § 56 |

Engine enforces these:
- Daily cap exceeded → flag, but allow (user might have legitimate reason)
- Weekly cap exceeded → flag, payroll notes
- Quarterly cap → tracked across rolling quarter; alerts when nearing

`[BLUE-COLLAR]` Mining (Mines Act), plantations (Plantation Labour Act), motor transport (MTW Act) have separate OT limits. Out of scope for v1.

## Comp-off vs OT pay

Working on weekly off / holiday: many companies offer choice:

- **OT pay only** — no comp-off
- **Comp-off only** — no OT pay (but worker gets a future day off)
- **Both** — payment + comp-off
- **Choice** — employee chooses per occasion (within tenant policy)

```typescript
interface CompOffOrOtChoice {
  date: string;
  employeeId: ObjectId;
  workedOnHolidayOrWeeklyOff: 'holiday' | 'weekly-off';
  hoursWorked: number;
  
  choice?: 'comp-off' | 'ot-pay' | 'both';
  chosenAt?: Date;
  
  // outcomes
  compOffCredited?: number;                // days
  otPayAmount?: Decimal128;
}
```

`[CA-REVIEW]` For weekly off worked: Factories Act § 52 mandates compensatory holiday within 3 days of weekly off OR within the same month (state-specific). Cannot only pay OT and skip comp-off. Verify state rules.

## Night shift handling

A "night shift" (e.g., 22:00–06:00) is normally compensated at higher rate via:

1. **Night shift allowance** — flat per-shift bonus (not OT)
2. **OT applies if hours exceed shift duration** — separate from allowance

The engine doesn't conflate these. Night shift allowance is configured in salary structure as a component; OT is computed separately.

`[BLUE-COLLAR]` Female workers in night shift: Factories Act § 66 historically prohibited; states have notified exceptions with safety conditions (transportation, security, washroom facilities). The engine respects per-state rules.

## Excess hours alert

Real-time alert if employee's daily worked exceeds 11 hours:

- Notification to manager
- Notification to safety officer
- Audit log
- HR dashboard alert

This is a safety mechanism, not just compliance.

## Output: feeds payroll

The OT engine produces a `PayrollPreInputOt` record per employee per pay period:

```typescript
interface PayrollPreInputOt {
  payrollPeriodId: ObjectId;
  employeeId: ObjectId;
  
  totalRegularOtMinutes: number;
  totalWeeklyOffOtMinutes: number;
  totalHolidayOtMinutes: number;
  
  totalApprovedOtMinutes: number;
  totalUnapprovedOtMinutes: number;        // not paid; flag for review
  
  computedOtAmount: Decimal128;
  
  alertsRaised: string[];                  // ['daily-cap-exceeded', 'quarterly-cap-near']
  
  computedAt: Date;
}
```

Payroll module (`/03-payroll/`) consumes this.

## Reports

- OT trend by department
- Top OT consumers (employees / departments)
- Statutory cap warnings
- Approval-vs-actual variance
- Cost analysis (OT as % of payroll)
- Quarterly OT register (Form for Factories Act inspection)

## Open questions

`[OPEN]` "Casual / on-demand OT" without pre-approval — allow? Some industries can't predict OT. Recommend: tenant config; if disabled, all OT requires pre-approval; if enabled, OT auto-credited up to a cap with manager post-approval.

`[OPEN]` Half-hour granularity OT vs minute-level OT? Some companies round up to half-hour. Recommend: minute-level computation, configurable rounding for display / payment.

`[OPEN]` OT during company-declared "comp-off" days (e.g., bridging holidays): typically comp-off is treated as paid working day, OT applies if hours worked > shift. Recommend: tenant config.

`[OPEN]` OT while traveling or working remotely. Hard to verify hours. Recommend: requires manager pre-approval explicitly.

`[OPEN]` "Stand-by allowance" or "on-call duty" — some employees must be reachable but may not be working. OT? Allowance? Different. Recommend: separate allowance category in v2.

## Cross-references

- [01-attendance-capture.md](./01-attendance-capture.md) — captures actual punches
- [02-shifts-and-rosters.md](./02-shifts-and-rosters.md) — defines shift expected hours
- [03-leave-types-and-policies.md](./03-leave-types-and-policies.md) — comp-off mechanism
- [/03-payroll/05-payroll-engine.md](../03-payroll/05-payroll-engine.md) (Phase 3) — OT pay calculation
- [/04-compliance/](../04-compliance/) (Phase 3) — Factories Act compliance
