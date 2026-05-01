# 06 — Lifecycle State Machine

## Purpose

Defines the complete employee lifecycle from offer to archive — every state, every transition, every workflow trigger. The state machine combines `Employee.isActive` and `EmploymentRecord.employmentStatus` into a unified model.

## High-level lifecycle

```mermaid
stateDiagram-v2
    [*] --> Recruited: candidate accepts offer
    
    Recruited --> PreJoining: offer signed, before join date
    PreJoining --> Joined: join date reached, employee shows up
    PreJoining --> Withdrawn: candidate withdraws / employer rescinds
    
    Joined --> Probation: standard for permanent hire
    Joined --> ActiveDirect: skipping probation (rehire / senior hire)
    
    Probation --> Confirmed: confirmation
    Probation --> ProbationExtended: extension
    Probation --> Terminated: termination during probation
    Probation --> Resigned: voluntary exit during probation
    ProbationExtended --> Confirmed
    ProbationExtended --> Terminated
    ProbationExtended --> Resigned
    
    ActiveDirect --> Confirmed: alias
    Confirmed --> ActiveSteady: ongoing employment
    
    ActiveSteady --> OnLeaveLong: maternity / sabbatical / extended medical
    OnLeaveLong --> ActiveSteady: returns
    OnLeaveLong --> Resigned: doesn't return
    OnLeaveLong --> Terminated: ML extension denied / abandonment
    
    ActiveSteady --> Resigned: voluntary
    ActiveSteady --> Absconding: stops showing
    ActiveSteady --> Terminated: involuntary
    ActiveSteady --> InterEntityTransfer: moves to another entity
    ActiveSteady --> OnHold: investigation / legal hold
    
    Absconding --> Terminated: due process completed
    Absconding --> ActiveSteady: returned, accepted back
    
    OnHold --> ActiveSteady: cleared
    OnHold --> Terminated
    OnHold --> Resigned
    
    InterEntityTransfer --> [*]: source closed; new EmploymentRecord opens
    
    Resigned --> NoticePeriod
    Terminated --> Separated
    NoticePeriod --> Separated: lastWorkingDay reached
    NoticePeriod --> ActiveSteady: resignation withdrawn
    
    Separated --> FnfPending: F&F triggered
    FnfPending --> FnfCompleted: F&F paid
    FnfCompleted --> Archived: 7-year retention period
    
    ActiveSteady --> Retired: superannuation
    Retired --> FnfPending
    
    ActiveSteady --> Deceased: death in service
    Deceased --> FnfPending: F&F goes to nominees; gratuity 5-yr rule waived
    
    Archived --> [*]
```

## States in detail

### Recruited

The candidate has accepted an offer. An EmploymentRecord may not yet exist — this state is primarily managed in the recruitment module (`/05-recruitment/`).

In v1, the Employee record is created when `joiningSource = fresh-hire` and offer is signed. Until then, candidate data lives in the Recruitment collection.

### PreJoining

Employee record exists but `joinedOn` is in the future. State reflects:
- Documents being collected
- Asset preparation (laptop ordered, accommodation arranged)
- BGV in progress
- Welcome activities scheduled

`Employee.isActive = false` (not yet active in payroll)
`EmploymentRecord.employmentStatus = 'pre-joining'`

Workflow triggers:
- Joining checklist sent to employee + HR
- Asset request to IT
- BGV initiated (v2 — auto; v1 — manual)
- Welcome email scheduled for joining date

### Joined → Probation / ActiveDirect

On `joinedOn`:
- `Employee.isActive = true`
- `EmploymentRecord.employmentStatus = 'active'` (or `'probation'` if probationary)
- Trigger:
  - PF / ESI enrollment
  - Bank account verification (penny drop)
  - Asset handover signed
  - Onboarding workflow starts
  - Manager 1:1 scheduled
  - Buddy assigned (if tenant config)

### Probation

For permanent hires with probation. Duration: `probationDurationMonths` (typically 3 or 6).

`probationEndDate = joinedOn + probationDurationMonths`

Workflow triggers:
- Mid-probation feedback prompt to manager
- Confirmation review prompt 7 days before end
- Auto-confirm OR explicit confirmation per tenant config

### ProbationExtended

Manager + HR decide probation needs more time. Stored in `probationExtensionHistory[]`.

```typescript
{
  extendedOn: '2026-07-01',
  extendedTill: '2026-09-30',
  reason: 'Performance below expectation; additional 3 months for improvement',
  extendedBy: ObjectId('hrUser123')
}
```

Notification to employee with extension letter.

### Confirmed → ActiveSteady

Successful probation. Trigger:
- Confirmation letter generated and sent
- Salary may revise (if tenant has confirmation-revision policy)
- Full leave entitlements activate (some tenants give pro-rated leave during probation)
- Employee fully eligible for benefits (some are restricted during probation)

### OnLeaveLong

Long-term leave (maternity, sabbatical, extended medical). Triggers when LeaveApplication is approved with duration > tenant threshold (e.g., 30 days).

`Employee.isActive = true` (still employed, just not working)
`EmploymentRecord.employmentStatus = 'on-leave-long-term'`

Special handling:
- Payroll: paid as per leave type (ML is paid leave per Maternity Benefit Act; sabbatical may be unpaid)
- PF / ESI: contributions continue if paid leave; pause if unpaid
- Insurance: continues
- Notice period: doesn't apply

Return-to-work flow:
- Employee notifies HR of return date
- Pre-return check-in
- Adjust assignments / role
- Status flips back to active

Doesn't-return flow:
- HR follow-up after expected return date
- If no response in 30 days `[ASSUMPTION]` — initiate abandonment process

### ActiveSteady

Default state for confirmed employees. Most employees are here most of the time.

### Resigned → NoticePeriod

Employee submits resignation. State:
- `EmploymentRecord.noticeStartedOn = today`
- `EmploymentRecord.lastWorkingDay = today + noticePeriodDays`
- `EmploymentRecord.employmentStatus = 'notice-period'`
- `EmploymentRecord.separationReason = chosen`

Workflow triggers:
- Manager notified
- HR notified
- Resignation acceptance letter generated
- Knowledge transfer plan initiated
- Replacement requisition raised (if applicable)
- Exit checklist initiated

### Absconding

Employee disappears without resignation. Multi-day process documented in [02-employment-record.md](./02-employment-record.md).

### OnHold

Legal hold or investigation. State:
- `EmploymentRecord.employmentStatus = 'on-hold'`
- Salary may be held (per tenant policy + legal advice)
- All approvals frozen
- Cannot transfer / promote / change role
- Audit log entries flagged

### Terminated

Employer-initiated separation. Workflow varies by category:

#### Performance-based termination

- Documented PIP must precede `[CA-REVIEW]` (mostly customary but some Standing Orders require)
- Notice period typically waived or paid out
- Termination letter generated
- Final settlement initiated

#### Misconduct-based termination

- Show-cause notice
- Domestic inquiry (per Standing Orders / company policy) `[CA-REVIEW]` — required for industrial workmen under IR Code 2020
- Inquiry report
- Termination letter
- Possibly without notice / without F&F dues (subject to dispute)

#### Redundancy / business closure

- Retrenchment compensation per IR Code 2020 (for workmen with 1+ year service): 15 days' average pay × completed years
- Last-in-first-out principle for retrenchment per IR Code section 25(F) `[VERIFY]`
- Notice period or pay in lieu
- Government notification for >100 workmen `[VERIFY threshold]`

### InterEntityTransfer

Special state — atomically closes one EmploymentRecord, opens another. Detailed in [02-employment-record.md](./02-employment-record.md).

### Retired

Superannuation. Triggered automatically when employee reaches retirement age (default 58 for general; 60 for some industries `[VERIFY]`; tenant-configurable).

Pre-retirement workflow:
- 6 months before retirement date: prep meeting with HR
- 3 months before: PF withdrawal options explained, gratuity calculation shared
- 1 month before: handover plan
- Retirement: formal farewell

Post-retirement:
- F&F includes:
  - Gratuity (typically larger, due to longer tenure)
  - PF withdrawal (or transfer to pension)
  - Leave encashment
  - Final salary
- Status: `Retired` then `FnfPending` then `FnfCompleted`

### Deceased

Death in service. Special handling:

- F&F goes to nominees (per nomination forms)
- Gratuity: 5-year minimum service rule waived; gratuity payable from day 1 of service
- ML / PF / ESI may have death benefits
- EDLI (Employees' Deposit Linked Insurance) — life insurance from PF, max ₹7,00,000 `[VERIFY current cap]`
- Group term life insurance payout
- Compassionate appointment to family member (some tenants offer)
- Communication is sensitive — separate compassionate workflow

### FnfPending

Exit done, F&F not finalized.

### FnfCompleted

F&F payment made. After this:
- Employee receives Form 16 by May 31 of the AY (statutory deadline)
- Last payslip shared
- Experience letter / relieving letter dispatched
- ESI hospital card collected back if applicable
- Asset return verified

Wedge feature: **2-day F&F SLA**. Most companies take 30–90 days. We aim for 2 days from lastWorkingDay (assuming clean exit, no disputes). Achievable via:
- Pre-computed projected F&F (run nightly during notice period; final on lastWorkingDay)
- Auto-clearance for IT / Library / Admin (via integrations)
- Manager + Finance sign-off via mobile in 24h
- Direct bank transfer same day after sign-off

### Archived

Statutory retention period elapsed. PII purged from active DB; statutory archive retained per [/00-foundations/04-audit-and-compliance-hooks.md](../00-foundations/04-audit-and-compliance-hooks.md).

## Transition validation rules

| From | To | Required | Auto / Manual | Notes |
|---|---|---|---|---|
| PreJoining | Joined | joinedOn = today | Auto (scheduled job) | Triggers PF/ESI enrollment |
| PreJoining | Withdrawn | candidate decision OR rescind decision | Manual | Audit log; refund any sign-on bonus paid |
| Probation | Confirmed | manager rec + HR approval | Manual (or auto-confirm if tenant config) | Confirmation letter |
| Probation | Terminated | manager + HR + tenant admin | Manual | Termination letter |
| ActiveSteady | Resigned | resignation submission | Self-service | Resignation letter |
| ActiveSteady | Absconding | 3+ unauthorized absences | Manual | Show-cause notice required |
| Absconding | Terminated | 14-day no response to show-cause | Manual after due process | Termination letter |
| ActiveSteady | OnLeaveLong | leave application approved with duration > 30 days | Auto | Insurance / PF continuation policy |
| OnLeaveLong | ActiveSteady | return-from-leave | Manual | Re-onboarding |
| OnLeaveLong | Resigned | employee submits while on leave | Manual | Notice period applies |
| NoticePeriod | Separated | lastWorkingDay reached | Auto (scheduled job) | Triggers F&F |
| NoticePeriod | ActiveSteady | resignation withdrawn (with HR approval) | Manual | Audit log; manager + HR sign |
| Separated | FnfPending | F&F initiated | Auto on Separated | Pre-computed |
| FnfPending | FnfCompleted | F&F payment confirmed | Manual or auto | Form 16 generated |
| FnfCompleted | Archived | 7 years elapsed | Auto (scheduled job) | PII scrubbed |

## Workflows attached to transitions

Each transition can trigger one or more workflows. Defined in `/08-workflow/`. Examples:

| Transition | Workflows |
|---|---|
| PreJoining → Joined | Asset handover, ID card creation, system access provisioning, welcome buddy assignment |
| Probation → Confirmed | Confirmation letter generation, salary revision (if applicable), benefits activation |
| ActiveSteady → Resigned | Knowledge transfer, replacement requisition, exit interview, asset return |
| ActiveSteady → Terminated | Investigation closure, termination letter, security access removal, F&F |
| NoticePeriod → Separated | Final attendance lock, F&F computation, last payslip, Form 16 generation, experience letter |

## Backdated transitions

Sometimes paperwork is processed late and transitions need to be backdated. Examples:

- Employee actually joined on April 1 but record created April 10
- Resignation effective April 1 but submitted April 15
- Termination effective immediately but processed next day

Spec: backdated transitions allowed with these rules:

1. Transitions can be backdated up to 30 days `[ASSUMPTION]`
2. Backdating triggers retro processing for any payroll already run
3. Audit log clearly marks `actualOccurredAt < recordedAt`
4. Approvals required: backdating > 7 days requires HR Manager approval; > 14 days requires tenant admin approval
5. Some transitions cannot be backdated (e.g., death — must be reported on actual date)

## Forward-dated transitions

Common for resignations and confirmations.

Resignation effective May 31 with notice period 60 days → submitted today, lastWorkingDay = today + 60.

Confirmation effective on probationEndDate → can be confirmed in advance.

Spec: forward-dated transitions:

1. Allowed up to 6 months in future `[ASSUMPTION]`
2. State remains current until effective date
3. Scheduled job activates the transition on effective date
4. Can be cancelled before effective date
5. Notification reminders sent at intervals

## Rehire flow

Detailed in [07-edge-cases.md](./07-edge-cases.md). Summary:

If `rehireEligibility` is `eligible` or `with-approval` (from prior employment):
- Same Employee record reactivated (preserves PAN, Aadhaar, prior compensation history visible)
- New EmploymentRecord with `joiningSource = 'rehire'`, `joiningSourceRefId = priorRecordId`
- New CompensationRecord for new role
- Continuity decisions configurable:
  - PF: same UAN; new Member ID at re-employed entity
  - Gratuity: continuity per Payment of Gratuity Act `[CA-REVIEW]` — typically not continuous unless tenant config; depends on break duration
  - Leave balances: not carried unless explicit tenant config
  - Employee code: typically new; tenant configurable to reuse old

## State persistence

State is derived from EmploymentRecord and Employee fields, not stored as a separate enum value:

```typescript
function getEmployeeState(employee: Employee, currentEmployment?: EmploymentRecord): EmployeeState {
  if (!employee.isActive && !currentEmployment) return 'archived';
  if (!currentEmployment) return 'inactive';
  if (currentEmployment.employmentStatus === 'pre-joining') return 'preJoining';
  // ... etc
}
```

This avoids state-flag desync bugs. State is computed from authoritative fields.

## State change audit

Every transition emits an audit log event:

```typescript
{
  action: 'employee.state.transitioned',
  resource: { type: 'Employee', id: employeeId },
  changes: [{
    field: 'state',
    oldValue: 'ActiveSteady',
    newValue: 'NoticePeriod',
  }],
  context: {
    employmentRecordId: ObjectId,
    transitionReason: 'voluntary-resignation',
    transitionedBy: userId,
  },
}
```

This builds a clean timeline for reporting and inspector mode.

## Reports

Lifecycle reports:
- New joiners (filtered by date range)
- Confirmations due / overdue
- Probation extensions
- Active employees (snapshot date)
- Notice period board (employees in notice; sortable by lastWorkingDay)
- Recent separations
- F&F pipeline
- Tenure-based reports (anniversaries, retirement projection)
- Attrition (resignations / terminations / total exits per period, by reason, by department)

## Open questions

`[OPEN]` What's the exact retirement age policy? Default 58, configurable per entity per role. Some industries have higher (e.g., professors: 65). Tenant overrides at role level.

`[OPEN]` Auto-confirm vs explicit confirmation. Some tenants want auto-confirm (no action needed at probation end → automatically confirmed). Others want HR to actively confirm. Tenant config: default behavior.

`[OPEN]` Compassionate appointment workflow. Some companies offer employment to a family member of a deceased employee. Special workflow needed in v2.

`[OPEN]` Outplacement support for terminated employees. Optional benefit some tenants offer. v2 module.

## Cross-references

- See [02-employment-record.md](./02-employment-record.md) for EmploymentRecord schema
- See [01-employee-master-schema.md](./01-employee-master-schema.md) for Employee.isActive
- See [07-edge-cases.md](./07-edge-cases.md) for edge cases in transitions
- See [/03-payroll/09-fnf-settlement.md](../03-payroll/09-fnf-settlement.md) (Phase 3) for F&F flow
- See [/08-workflow/](../08-workflow/) (Phase 5) for triggered workflows
