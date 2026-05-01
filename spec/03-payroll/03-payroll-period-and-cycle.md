# 03 — Payroll Period & Cycle

## Purpose

Defines the calendar of payroll runs: when periods start/end, when inputs lock, when computation runs, when disbursement happens, when statutory filings follow. The period structure is foundational because every PayrollLine, every challan, every Form 16 references a specific period.

## Concepts

| Term | Meaning |
|---|---|
| Payroll period | The time window the run covers (e.g., April 2026, week 17 of 2026) |
| Pay cycle | The recurring pattern (monthly, weekly, fortnightly) |
| Pay date | The day employees receive money |
| Cut-off date | Last day to submit pre-payroll inputs |
| Lock date | After this, payroll is final and immutable |
| Processing window | Days between cutoff and pay date for computation, review, approval |

## PayrollPeriod schema

```typescript
interface PayrollPeriod extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  // identity
  periodCode: string;                      // 'ACME-IND-2026-04' (entity-month) or 'ACME-IND-W17-2026'
  
  // calendar
  cycleType: 'monthly' | 'fortnightly' | 'weekly' | 'bi-monthly' | 'daily-piece-rated';
  fyCode: string;                          // 'FY-2026-27'
  
  startDate: string;                       // YYYY-MM-DD inclusive
  endDate: string;                         // YYYY-MM-DD inclusive
  
  // key dates
  attendanceCutoffDate?: string;           // beyond this, attendance for the period is closed
  inputCutoffDate: string;                 // pre-payroll inputs closed
  computationDate?: string;                // engine runs
  reviewDeadline?: string;                 // HR must review by
  payDate: string;                         // disbursement to employees
  filingDeadlines?: {
    pfEcrDue?: string;                     // 15th of next month [VERIFY]
    esiChallanDue?: string;                // 15th of next month
    tdsForm24QDue?: string;                // quarterly: 31st July, Oct, Jan, May (for Q4)
    ptDue?: string;                        // varies per state
    lwfDue?: string;                       // varies per state
  };
  
  // status
  status: PayrollPeriodStatus;
  
  // workdays
  totalCalendarDays: number;
  totalWorkingDays: number;                // excludes weekly offs and holidays
  totalHolidays: number;
  totalWeeklyOffs: number;
  
  // run linkage
  payrollRunIds: ObjectId[];               // multiple runs may happen (initial, retro, F&F)
  primaryPayrollRunId?: ObjectId;          // the main run for the period
  
  // metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}

type PayrollPeriodStatus =
  | 'planned'                              // future period
  | 'attendance-open'                      // attendance being captured
  | 'inputs-open'                          // attendance closed; one-time inputs being collected
  | 'inputs-locked'                        // ready for run
  | 'computing'                            // engine running
  | 'review'                               // HR reviewing output
  | 'approved'                             // HR approved
  | 'disbursing'                           // bank file being processed
  | 'disbursed'                            // money sent
  | 'locked'                               // period closed; statutory filings begin
  | 'filed'                                // all statutory filings done
  | 'reopened';                            // rare; with senior approval
```

## Mandatory indexes

```typescript
{ tenantId: 1, entityId: 1, periodCode: 1 }, unique
{ tenantId: 1, entityId: 1, status: 1 }
{ tenantId: 1, entityId: 1, startDate: 1 }
{ tenantId: 1, entityId: 1, fyCode: 1 }
```

## Period lifecycle

```mermaid
stateDiagram-v2
    [*] --> Planned: created N months ahead
    Planned --> AttendanceOpen: period start arrives
    AttendanceOpen --> InputsOpen: attendance cutoff (e.g., 25th)
    InputsOpen --> InputsLocked: input cutoff (e.g., 28th)
    InputsLocked --> Computing: HR triggers run
    Computing --> Review: computation done
    Review --> Computing: input changed; re-run
    Review --> Approved: HR approves
    Approved --> Disbursing: bank file sent
    Disbursing --> Disbursed: settlement confirmed
    Disbursed --> Locked: month-end (e.g., last day of month)
    Locked --> Filed: statutory deposits + ECR/Challan/24Q done
    Filed --> [*]: archived
    
    Locked --> Reopened: with tenant admin approval
    Reopened --> Computing
```

## Standard cycles

### Monthly (default)

The most common.

- Period: 1st to last day of calendar month
- Attendance cutoff: typically 25th
- Input cutoff: typically 28th
- Pay date: typically 1st of next month (or last working day of current)
- Lock date: 7th of next month (after disbursement settles)

`[ASSUMPTION]` Tenant configures specific dates.

### 26th-to-25th cycle

Some companies pay 26th-of-prior-month to 25th-of-current-month and pay on 1st.

- Period: April 26 to May 25 (named "May" payroll)
- Inputs cutoff: 26th
- Pay date: 1st of next month
- Useful when payroll team needs more time after period close

### Weekly (blue-collar)

Common in factories paying weekly:

- Period: Monday to Sunday
- Cutoff: Sunday EOD
- Compute: Monday
- Pay date: Tuesday or Wednesday

13 weeks per quarter; 52 weeks per year (with adjustments for leap years).

### Fortnightly

Period: 14 calendar days. Pay every other Friday.
26 fortnightly cycles per year.

### Daily piece-rated

`[BLUE-COLLAR]` Workers paid daily based on pieces produced. Daily PayrollLine. Aggregated into weekly summary for bank disbursement.

## Period generation

The system pre-creates periods 12 months ahead so that:
- Attendance can reference future periods
- Reports / forecasts have horizon
- Statutory filing reminders can be scheduled

```typescript
async function generatePeriodsAhead(entity: Entity, monthsAhead: number = 12): Promise<void> {
  const lastPeriod = await PayrollPeriod.findOne({
    tenantId, entityId,
  }).sort({ endDate: -1 });
  
  const nextStart = lastPeriod ? nextDay(lastPeriod.endDate) : entity.firstPayrollStart;
  
  for (let i = 0; i < monthsAhead; i++) {
    const period = computePeriodFor(nextStart, entity.payrollCycleType);
    await PayrollPeriod.create({...period});
    nextStart = nextDay(period.endDate);
  }
}
```

This runs as a daily background job per entity.

## Multi-entity coordination

A tenant with multiple entities has separate PayrollPeriods per entity. They may have:
- Same cycles (typical) — all entities monthly, same dates
- Different cycles (mixed) — tenant has factory entity weekly + corporate entity monthly

The HRMS handles each entity independently. Cross-entity reporting aggregates after-the-fact.

## Calendar conventions

### Indian FY (April–March)

```
FY 2026-27 starts April 1, 2026
FY 2026-27 ends March 31, 2027
AY 2027-28 (Assessment Year for FY 2026-27)
```

All periods belong to a FY. Leap year (2024-25, 2028-29 etc.) impacts:
- Days in February
- Leap-year-specific accrual nuances (negligible)

### Holidays in period

Holidays are part of the period but not "working days" for attendance / wage calculation.

## Run relationships

A `PayrollPeriod` has one or more `PayrollRun`s:

- **Primary run**: the main monthly run. Most employees processed here.
- **Retro run**: applies retroactive corrections from prior periods.
- **F&F run**: full-and-final settlement for separated employees. Can run any time, references separation date.
- **Off-cycle bonus run**: e.g., annual statutory bonus paid in November.

```typescript
interface PayrollRun extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  payrollPeriodId: ObjectId;
  
  runCode: string;                         // 'ACME-IND-2026-04-PRI' (primary), 'ACME-IND-2026-04-FNF', etc.
  runType: 'primary' | 'retro' | 'fnf' | 'bonus' | 'arrear-only' | 'ad-hoc';
  
  // sequence
  sequenceWithinPeriod: number;            // 1, 2, 3 within same period
  
  // scope
  appliesToEmployeeIds?: ObjectId[];       // null = all employees in period; non-null = subset
  excludedEmployeeIds?: ObjectId[];
  
  // timing
  triggeredAt?: Date;
  triggeredBy?: ObjectId;
  computedAt?: Date;
  computedDurationMs?: number;
  reviewedAt?: Date;
  reviewedBy?: ObjectId;
  approvedAt?: Date;
  approvedBy?: ObjectId;
  lockedAt?: Date;
  lockedBy?: ObjectId;
  disbursedAt?: Date;
  
  // status
  status: 'draft' | 'computing' | 'computed' | 'reviewing' | 'approved' | 'locked' | 'disbursed' | 'failed';
  
  // outputs
  totalEmployeesProcessed: number;
  totalGrossEarnings: Decimal128;
  totalDeductions: Decimal128;
  totalNetPay: Decimal128;
  totalEmployerCost: Decimal128;
  
  // pinned context (for replay)
  rulesSnapshot: {                         // pinned rule IDs by statute
    pfRuleId?: ObjectId;
    esiRuleId?: ObjectId;
    tdsRuleId?: ObjectId;
    ptRuleIds?: { state: StateCode; ruleId: ObjectId }[];
    lwfRuleIds?: { state: StateCode; ruleId: ObjectId }[];
    bonusRuleId?: ObjectId;
    gratuityRuleId?: ObjectId;
    overtimeRuleId?: ObjectId;
  };
  
  // outputs hashes
  outputHashes?: {
    payslipsBundleHash?: string;
    bankFileHash?: string;
    jvFileHash?: string;
    pfEcrHash?: string;
    tds24QHash?: string;
  };
  
  // error tracking
  errorCount: number;
  errors?: { employeeId: ObjectId; errorCode: string; message: string }[];
  
  // metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

## Period locking

When a period is `locked`:
- No new PayrollLines can be created for that period
- Existing PayrollLines are immutable
- Re-running the engine for a locked period is blocked unless explicit re-open
- Statutory filings can proceed
- Audit trail captures locker user

Re-opening a locked period is a high-privilege operation:
- Requires tenant admin approval
- Reason logged
- Audit log
- Affects already-deposited statutory amounts (may need ECR amendment, etc.)

## Pre-payroll calendar

The HRMS shows a 12-month calendar visualizing:

- Period start / end / pay date for each entity
- Statutory deposit due dates (PF 15th, ESI 15th, TDS quarterly, etc.)
- Filing deadlines (Form 24Q, Form 16, Bonus Form D)
- Public holidays falling on/around key dates

This calendar drives notifications and reminders.

## Disbursement timing

The pay date governs:
- Bank file generation timing (typically T-1 day for NEFT same-day; T-2 for some banks)
- Employee notification timing (payslip delivered on pay date)
- Cash flow planning (CFO sees outflow forecast)

`[ASSUMPTION]` Pay date is the date employees expect money in account. Bank file generated 1 working day prior (or per bank's NEFT cutoff).

## Statutory filing deadlines (key dates)

| Filing | Due | Notes |
|---|---|---|
| PF ECR + payment | 15th of next month | Late fee per § 14B + interest per § 7Q |
| ESI Challan + payment | 15th of next month | Late fee + interest |
| TDS payment | 7th of next month | Section 192 |
| TDS Form 24Q | Quarterly: 31 Jul, 31 Oct, 31 Jan, 31 May `[VERIFY]` | NSDL FVU file |
| Form 16 (TDS certificate) | 15 Jun (after FY end) | To employees |
| Form 12BA (perquisites) | 15 Jun | Annexed to Form 16 |
| PT | Per state — typically by 21st of next month | State-specific |
| LWF | Half-yearly: 30 Jun, 31 Dec (varies by state) | State-specific |
| Bonus payment | Within 8 months of FY end | Bonus Act § 19 |
| Bonus Form D (annual return) | Within 30 days of bonus payment | |
| Gratuity payment | Within 30 days of becoming payable | Gratuity Act § 7 |

The HRMS auto-creates filing tasks per period with deadlines. Reminders 7, 3, 1 day before due.

`[VERIFY]` Specific dates may vary by year; check current EPFO / NSDL / state notifications.

## Re-run scenarios

### Late attendance arrives

Biometric was offline; events come 3 days late. Period inputs already locked.

Options:
1. Re-open inputs, re-run, re-disburse difference (rare; complex)
2. Process in next period as retro (preferred)
3. If period is already locked: must use retro mechanism

`[DECISION]` Default: retro in next period. Re-open only for high-impact cases (>5% of employees affected).

### Backdated salary revision

Detailed in [06-arrears-and-retros.md](./06-arrears-and-retros.md).

### Backdated separation

Employee resigned April 1, but processed on April 20. April payroll was already running.

- F&F initiated for that employee
- Their April PayrollLine: marked as superseded
- New F&F run produces complete final settlement
- Audit log captures both

## Off-cycle runs

Sometimes runs happen outside the regular cycle:

- **Bonus pre-payment**: Diwali bonus paid in October separately from regular Oct salary
- **Mid-month adjustment**: Government announces emergency DA hike retroactive to current month
- **Ex-gratia payment**: One-time payment (CSR, anniversary)

Off-cycle runs are still tied to a `PayrollPeriod` (typically the current month) but produce a separate `PayrollRun` with different `runType`.

## Year-end rollover

March 31 → April 1 transition:

- Last period of FY locks
- Form 24Q Q4 generated (due May 31)
- Form 16 generation begins (due Jun 15)
- New FY rules engine activated (TDS slabs etc.)
- Employees prompted for new FY tax declarations
- FBP declarations roll over per policy

## Open questions

`[OPEN]` Period code format. `'ACME-IND-2026-04'` vs `'2026-04-ACME-IND'`. Recommend: `'YYYY-MM-{ENTITY_SHORTCODE}-{RUN_TYPE}'` for sortability.

`[OPEN]` Pay date when 1st falls on weekend or holiday. Default: previous working day. Tenant config.

`[OPEN]` Should we support partial-month pay dates (some employees on 1st, some on 7th)? Recommend: no in v1; one pay date per period per entity.

`[OPEN]` Year-end automation: how aggressive should we be in auto-generating Form 16, etc.? Recommend: generate drafts; HR reviews and releases.

`[OPEN]` Multi-state employer cycle: PF deposit per establishment code. If entity has 3 PF codes, 3 separate deposits but same payroll. Recommend: handled via filings module aware of multiple codes.

## Cross-references

- [05-payroll-engine.md](./05-payroll-engine.md) — engine consumes period
- [06-arrears-and-retros.md](./06-arrears-and-retros.md) — retro mechanism
- [09-fnf-settlement.md](./09-fnf-settlement.md) — F&F runs
- [/04-compliance/15-statutory-deadlines-calendar.md](../04-compliance/15-statutory-deadlines-calendar.md) — full deadline calendar
