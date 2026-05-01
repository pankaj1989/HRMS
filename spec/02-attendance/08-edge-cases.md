# 08 — Edge Cases

## Purpose

Real-world attendance scenarios that break naive models. Each case includes how the spec handles it.

## EC1 — Cross-midnight shift attendance

Pankaj punches in 22:00 on April 29 and out 06:00 on April 30. Single shift S3.

**Handling:**
- Convention: night shift "belongs" to start date (April 29)
- DailyAttendance for April 29: status=present, totalWorkedMinutes=480
- DailyAttendance for April 30: status=weekly-off (or whatever was scheduled)
- Engine handles by: when computing April 29's pairs, search for matching out-event up to 12 hours after start
- If out-event found in April 30, attribute to April 29's record

**Sub-case:** Shift start is 22:00 but employee punches in at 21:30 (early). Pairing engine handles "punch within 1 hour before scheduled shift start" as belonging to that shift.

## EC2 — Shift change mid-day

Anil scheduled S2 (14-22) on April 15. Manager changes him to S1 (06-14) on April 14 evening. Anil already off-roster signal.

**Handling:**
- Roster reassignment for April 15: shift S2 → S1
- Audit trail captures the swap
- DailyAttendance pre-computation refreshes
- Notification to Anil

If Anil already punched in for S2 expecting it to start 14:00, but actually was supposed to start 06:00:
- Punch-in at 14:00 against S1 (06-14) is "8 hours late"
- System flags suspicious — clearly miscommunication
- Manager intervention required; regularization or shift re-revert

## EC3 — Punch-in twice without punch-out (sandwich)

Pankaj's biometric registered punch-in at 09:00. He went out at 11:00 for break (no punch-out) and came back at 11:30 punching in again.

**Handling:**
- Two punch-in events with no out between
- Pairing engine handles by:
  - First in (09:00) auto-paired with the next observed out (e.g., 18:00)
  - Second in (11:30) flagged as `unmatched-pair-in-in` suspicious
- Worked minutes computed from first in to last out
- Suspicious flag prompts HR review or employee regularization

## EC4 — Punch-out without punch-in

Employee forgot to punch in but punched out at 18:00.

**Handling:**
- Suspicious event: `unmatched-pair-out-only`
- DailyAttendance status: 'unknown' or 'absent' depending on shift expectations
- Employee files regularization for missed punch
- HR / manager approves with assumed in-time

## EC5 — Multiple punches per shift (shop floor)

Factory worker punches: 06:00 in, 08:30 out (tea), 08:45 in, 11:00 out (lunch), 11:30 in, 14:00 out.

**Handling:**
- Three punch pairs
- Total worked: (08:30-06:00) + (11:00-08:45) + (14:00-11:30) = 2.5 + 2.25 + 2.5 = 7.25 hours
- Tea break (15 min): if shift defines "tea break is paid", add 15 min back; if not, leave deducted
- Lunch break (30 min): typically unpaid in factory, deduct
- Net working time validated against shift's `netWorkingMinutes`
- If matches: status='present'

## EC6 — Geo-fence violation but legitimate

Anjali was at customer site outside geo-fence. Punched in at 09:00 from there.

**Handling:**
- Geo-fence policy = `allow-with-flag`
- Attendance event stored with `geoFenceMatched=false, suspiciousReasons=['geo-fence-mismatch']`
- DailyAttendance status: present
- Manager review reveals legitimate (matches expense entry / calendar event)
- Manager marks resolved; suspicious flag cleared

## EC7 — Two simultaneous logins from different cities

Pankaj's account punches in from Mumbai at 09:00, then from Pune at 09:15.

**Handling:**
- 200 km in 15 min — geographically impossible
- System flags `geographically-impossible` suspicious
- Possible: account compromised, or shared account, or test
- Auto-action: logout one session, force re-authentication, alert HR / security

## EC8 — DST / timezone drift

India doesn't observe DST. But devices in cross-border ops may. Or device clock drift.

**Handling:**
- Server stores UTC always
- Device timestamps validated against server time at receipt; drift > 5 minutes flagged
- Spec assumes Asia/Kolkata for all Indian operations; timezone changes are extremely rare

## EC9 — Late-arriving event after payroll lock

Biometric device offline May 15-31. Comes online June 5, sends buffered events for that period. May payroll already locked May 31.

**Handling:**
- Events stored in AttendanceEvents collection
- DailyAttendance for May dates updated (recomputed)
- Difference vs locked PayrollLine triggers retro entry in next payroll
- Audit log marks "late-arriving event triggered retro"

## EC10 — Employee on approved leave punches in

Pankaj approved EL April 15-20. On April 18 he comes to office (urgent), punches in.

**Handling:**
- Event stored
- Suspicious flag: `punch-during-leave`
- HR review: was leave actually canceled? Is this on-duty? Should leave be partially refunded?
- Outcomes:
  - If leave canceled retrospectively: leave balance refunded, day marked present
  - If considered on-duty: leave retained, day marked on-duty
  - If just visit: day still leave; punch ignored

## EC11 — Manager approves leave but date overlaps with company-mandated working day

Anjali requests EL on company offsite (mandatory attendance). Manager approves anyway.

**Handling:**
- Tenant can configure "mandatory days" — can't apply leave
- If allowed: leave proceeds, employee misses offsite
- If blocked: system rejects at application

## EC12 — Worker on roster S1 but actually works S3 (swap not recorded)

Worker A and B swapped shifts informally; not logged.

**Handling:**
- A's events appear during S3 hours (when A's roster shows S1)
- Daily Attendance: shift mismatch flagged
- Two punch events: suspicious `outside-shift-window`
- Manager regularization: record swap retroactively, reassign roster days
- Audit: swap noted post-fact

## EC13 — Maternity leave straddling FY boundary

ML April 1 (start of FY26-27) goes back to events earlier (qualifying period in FY25-26).

**Handling:**
- Eligibility: 80 days worked in 12 months prior — query attendance across FYs
- ML accrual / consumption: per ML policy (event-based; doesn't accrue like EL)
- FY rollover: ML doesn't carry forward (event-based)
- Statutory register: ML days counted as worked for service purposes

## EC14 — Encashment requested mid-FY but no exit

Some companies offer interim encashment. Pankaj requests encashment of 5 EL days in November.

**Handling:**
- Policy must allow `encashment.onlyOn` includes `'on-request'`
- Eligibility: minimum balance, minimum service met
- HR approval
- Movement: balance debited, encashment credit to next payroll
- Tax: encashment exemption Section 10(10AA) doesn't apply to interim encashment (only on retirement / resignation)

## EC15 — Comp-off claimed but the work-day was on company-declared leave

Employee worked April 26 (Saturday); tenant has alternate Saturdays as off. April 26 is "off Saturday".

**Handling:**
- DailyAttendance for April 26: was scheduled as weekly-off
- Worker came in: status = 'weekly-off-worked'
- Eligible for comp-off OR OT
- Comp-off claim approved → 1 day comp-off credit

## EC16 — Holiday declared retrospectively

Government declares June 20 as holiday on June 19 evening (rare but happens — election day, mourning).

**Handling:**
- Holiday calendar updated post-fact
- DailyAttendance for June 20 of all employees: recompute
- Workers who came in: status = 'holiday-worked'
- Eligibility for OT or comp-off triggered
- Employees who took leave that day: leave refunded back to balance
- Audit: holiday-declared-late event

## EC17 — Half-day morning, then work afternoon (mixed status)

Pankaj applies half-day leave morning. After lunch, comes in and works.

**Handling:**
- DailyAttendance: status = 'half-day' with leavePortion = 'first-half'
- Punch-in 14:00, out 19:00 → 5 hours worked second half
- Worked minutes (5h) > halfDayMinimum (e.g., 4h) → counts as second-half present
- Daily totals: 0.5 day leave + 0.5 day worked = 1 day total

## EC18 — Continuous shift over multiple calendar days (24+ hours)

Worker on emergency overtime, on shift from April 5 06:00 to April 6 14:00 (32 hours).

**Handling:**
- Health & safety violation (Factories Act § 56 spread-over 10.5 hours)
- System flags severe alert
- Punch pair would span 32 hours — pairing engine breaks at 24 hours, splits across days
- Audit: forced split with anomaly flag

This is a compliance violation not a data model issue. System catches and prevents (or at least loudly alerts).

## EC19 — Employee not on payroll but punches biometric

Recently terminated employee has biometric template still in device, punches.

**Handling:**
- Event arrives, employeeId resolved → terminated
- Event stored with `employmentStatus=Separated` flag
- Suspicious: `punch-after-separation`
- Alert to security / HR
- Device sync job ensures terminated employees removed from devices within 24 hours

## EC20 — Daily attendance for inactive employee

Employee on long sabbatical (3 months unpaid). Punches?

**Handling:**
- Sabbatical = approved long leave; no punches expected
- If punches arrive: suspicious `punch-during-leave`
- DailyAttendance for sabbatical days: status='on-leave-long-term'
- LOP / unpaid: doesn't accrue regular EL during sabbatical (per tenant policy)

## EC21 — Backdated regularization affecting closed payroll

Pankaj regularizes April 5 (LOP correction) on June 10. April payroll locked May 31.

**Handling:**
- Regularization approved → DailyAttendance for April 5 updated
- April PayrollLine remains immutable
- Retro: difference between revised and locked → added to June payroll
- Audit chain: regularization → retro entry → payroll lines

## EC22 — Female employee on night shift in restricted state

Some states still restrict / regulate female workers in night shift (Factories Act § 66).

**Handling:**
- State rules engine: per-state female-night-shift policies
- If restricted and tenant doesn't have notification of compliance (transport, security):
  - Roster assignment to female employee in night shift: blocked or warning
- If allowed: roster proceeds; safety conditions verified

## EC23 — Punch pairs that cross multiple shifts (unusual)

Worker punches at 09:00 (S1 end), 17:00 (after S1 ended). System sees no S1 punches, then 17:00 alone.

**Handling:**
- 09:00 punch when S1 was 06-14: 3 hours late for S1
- 17:00 punch is outside S1 entirely
- Suspicious: `outside-shift-window` for 17:00
- Likely: shift was changed but events came stale
- Manager review

## EC24 — Regularization stuck pending past month-close

Pankaj submitted regularization on May 30. Manager hasn't approved by June 5 (May payroll locking). Regularization for May 15 day.

**Handling:**
- Pending regularization beyond grace period: escalate
- Auto-escalation: pending > 7 days notify skip-level + HR
- If still pending at payroll lock: payroll runs without correction
- If regularization later approved: retro to next payroll
- Reduces incentive for regularization to sit pending

## EC25 — Punch from device but biometric verify failed

Device reports the punch but couldn't verify biometric (low confidence score 0.4).

**Handling:**
- Event stored with `biometricVerified=false, biometricScore=0.4`
- Suspicious flag: `low-biometric-score`
- Possibilities: dirty fingerprint sensor, employee changed appearance, fraud (someone else punching)
- Manager review or HR follow-up

## EC26 — Manual muster with disputed entries

Supervisor uploaded muster CSV. Worker disputes — was actually present, marked absent.

**Handling:**
- Worker submits regularization
- Approved → status changes from absent to present
- Audit: original entry preserved, correction applied
- Supervisor pattern monitored — if frequent disputes, training intervention

## EC27 — Roster published, then employee transferred

Pankaj rostered in Bangalore for April. Transferred to Pune effective April 10. Bangalore April 10-30 roster invalid.

**Handling:**
- Pre-transfer date: Bangalore roster honored
- Post-transfer: Bangalore RosterAssignments inactivated; Pune assignments created
- Daily attendance during transition: per-day evaluation
- Audit: transfer triggers roster reassignment

## EC28 — Two leaves of different types overlapping

Pankaj applied EL April 5-10. Then realized April 7 he was sick — wants to convert that to SL.

**Handling:**
- Two leave applications:
  1. EL: April 5, 6, 8, 9, 10 (4 days)
  2. SL: April 7 (1 day)
- First EL must be partially cancelled (April 7 removed)
- Then SL applied for April 7
- Approval for both required
- Balance impact: EL refunded 1 day; SL deducted 1 day

## EC29 — Mass biometric failure

Device firmware update broke; no events for 2 days. 200 employees affected.

**Handling:**
- HR / IT triggers "device outage" event
- Bulk regularization tool: select date range + employees
- Default action: mark all as present (assuming they came; verified via secondary signals like access card, manager attestation)
- Audit: bulk action with reason

## EC30 — Time-stamp manipulation attempt

Manager tries to change a worker's punch-out from 18:00 to 22:00 to inflate OT.

**Handling:**
- AttendanceEvents are **immutable** — cannot be modified
- "Correcting" an event = creating a new event flagged as correction, with reference to original
- Audit log: who tried, what changed, when
- High-volume manipulation triggers alert to security
- Suspicious manager activity reported to senior management

## EC31 — Pregnant employee's hours need to be capped

Maternity Benefit Act § 4: no employer shall knowingly employ a woman during the 6 weeks immediately following her delivery, miscarriage or medical termination of pregnancy. § 4(3): women shall not be required to work in the prescribed period before or after delivery in arduous work or work involving long hours of standing.

**Handling:**
- Employee marked pregnant (sensitive, restricted access)
- 10 weeks before EDD onwards: alerts to manager about hour limits
- Cannot be assigned night shift (post-2017 amendment unless protections in place)
- 6 weeks pre-delivery: only light duties allowed
- 6 weeks post-delivery: cannot work `[CA-REVIEW]`
- System flags non-compliance attempts

## EC32 — Attendance dispute leading to legal proceedings

Terminated employee files industrial tribunal case claiming unpaid wages for working days he claims he was present.

**Handling:**
- All AttendanceEvents preserved (immutable)
- Audit log preserved
- Legal hold marker on employee
- Inspection mode for tribunal-appointed person if applicable
- Statutory timeline can show: who was where, when, attendance status, with sources

## EC33 — Punch from VPN (work from non-office IP)

Employee on WFH punches from home IP. WFH not formally approved.

**Handling:**
- Event stored
- IP doesn't match office subnet → flag `ip-mismatch`
- If WFH allowed for employee per shift / employment record: status='wfh', not suspicious
- If WFH not allowed: HR review
- Tenant config: strict / lenient on remote punches

## EC34 — Holiday-worker comp-off expires before claimed

Worker worked Independence Day (Aug 15). Earned 1 comp-off, valid 30 days. Forgot to use, expires Sep 14.

**Handling:**
- Comp-off ledger: -1 day (expiry)
- Notification to employee 7 days before expiry
- Once expired: cannot be reinstated
- Audit log

## EC35 — Roster published, holiday declared, weekly off shifts

Roster pattern has off Saturday. Government declares Friday holiday. Worker should now be off Fri+Sat?

**Handling:**
- Holiday on Friday: DailyAttendance status=holiday
- Saturday weekly off: status=weekly-off
- Worker has 2 days off in row
- No additional comp-off; holiday + weekly-off is normal

If worker comes in on Friday (worked on holiday): status=holiday-worked, eligible for OT/comp-off.

## EC36 — Employee's shift assignment doesn't match employment record's defaultShift

EmploymentRecord says defaultShift=GEN (9-6). Roster assigns S2 (14-22). For one day.

**Handling:**
- Roster overrides default
- DailyAttendance uses S2 for that day's evaluation
- Default shift for unassigned days

## EC37 — Compulsory paid holiday on weekly off

Holiday + weekly off coincide. Common (Republic Day Jan 26 falls on Sunday).

**Handling:**
- DailyAttendance: holiday=true AND isWeeklyOff=true
- Display: "Holiday on Weekly Off"
- No double pay typically (holiday already off)
- Some companies grant alternate paid holiday in next week (rare)

## EC38 — Probation employee accruing leave

Pankaj on probation, has restricted leave entitlement. Apr-May: probation. June: confirmed.

**Handling:**
- Apr-May accrual: per probation policy (e.g., 0 EL, 4 CL/year pro-rated)
- June onwards: per confirmed policy (21 EL, 7 CL)
- Transition: opening balance for confirmed period = whatever accrued during probation
- Some tenants: "fresh start" on confirmation, balance reset

## EC39 — Worker accrues leave on previous-employer service via inter-entity transfer

Pankaj transferred from Entity A to Entity B in same tenant. Accrued 10 EL at A. Tenant policy: transfer balance.

**Handling:**
- Entity A balance closed at transfer
- Entity B balance opens with 10 EL transferred
- Movement records: 'transfer-in' at B, 'transfer-out' at A
- F&F not run at A (it's not a separation, it's a transfer)
- Continuity preserved

## EC40 — Punch in 4:00 AM (not part of any defined shift)

Worker arrives at 04:00 (no shift starts there). What does it mean?

**Handling:**
- Suspicious: `outside-shift-window`
- If worker has S1 (06:00) scheduled: 2 hours early
  - Some tenants: "early in" allowed, just stays in lobby; pair with later out
  - Pairing engine waits for matching out and treats as long shift
- Could also be punch error (meant to punch out previous shift)

## Cross-references

- [01-attendance-capture.md](./01-attendance-capture.md) — event handling
- [02-shifts-and-rosters.md](./02-shifts-and-rosters.md) — shift logic
- [03-leave-types-and-policies.md](./03-leave-types-and-policies.md) — leave handling
- [04-leave-accrual-engine.md](./04-leave-accrual-engine.md) — accrual edge cases
- [05-overtime-engine.md](./05-overtime-engine.md) — OT edge cases
- [06-regularization-workflow.md](./06-regularization-workflow.md) — corrections
- [07-statutory-attendance-registers.md](./07-statutory-attendance-registers.md) — compliance impact
