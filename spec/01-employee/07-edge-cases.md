# 07 — Edge Cases

## Purpose

Real-world employee scenarios that break naive data models. Each case includes how the schema handles it, what UX accommodates it, and what audit/compliance implications follow.

This is not theoretical — every case here has happened to real customers of competing HRMS products.

## EC1 — Rehire (same person, returns to same tenant)

Pankaj joined Acme Industries Pvt Ltd on Jan 5, 2022. Resigned Sept 30, 2024. Rejoins Apr 1, 2026.

**Handling:**

1. Lookup by PAN hash — finds existing Employee record
2. Confirm "is this the same person?" with HR via dialog showing prior employment summary
3. Same Employee record retained: PAN, Aadhaar, family info, prior education, prior experience including the prior Acme stint
4. Prior `EmploymentRecord` (sequenceNumber=1) remains with status=Separated
5. New `EmploymentRecord` (sequenceNumber=2) created with `joiningSource='rehire'`, `joiningSourceRefId=<prior>`
6. New `CompensationRecord` for new role
7. Employee code: tenant-configurable. Either reuse old code (some prefer for continuity) or assign new
8. PF: same UAN; new Member ID at Acme's establishment under same UAN
9. Gratuity continuity: `[CA-REVIEW]` not by default; some companies treat as continuous if break < 1 year

**Schema implications:**
- Employee is mostly tenantId-scoped; `pfMemberIds` list grows
- `priorExperience` array conceptually includes the first Acme stint, but it's also represented as the prior EmploymentRecord — avoid duplicate
- Convention: prior employments at the **same tenant** are tracked via EmploymentRecord history; `priorExperience` array stores employments at **other employers** only

**UI:**
- HR sees "This person worked here before. Rehire?" with old employment summary
- "Restore prior data?" toggle: copy bank account, family, education from prior record
- Audit log notes both records linked

**Edge sub-cases:**
- Rehire after termination for misconduct → blocked unless rehire eligibility allows
- Rehire after legal dispute → requires legal clearance flag
- Different department / role on rehire → fully supported via new EmploymentRecord

## EC2 — Backdated joining

Manesh joined April 5 but HR was on leave; record created April 12 with `joinedOn=April 5`.

**Handling:**
- Allowed via "backdate joining" flow with HR approval if > 7 days back
- Payroll for April pro-rates from joinedOn correctly (system uses joinedOn, not record creation date)
- PF / ESI enrollment back-dated; statutory deposits include April 5 onwards
- Audit log: `recordedAt > joinedOn` flagged

**Risks:**
- If April payroll already ran with April 5 as start, no issue
- If April payroll already ran assuming employee started later, retro is owed
- If PF deposit was already made, may need to file revised ECR (rare scenario)

## EC3 — Forward-dated joining (advance offer)

Priya signs offer on Feb 15. Joining date Apr 1.

**Handling:**
- Employee record created Feb 15 with `joinedOn = Apr 1`, status=preJoining
- Sign-on bonus may be paid Feb 20 (per offer terms)
- Onboarding kit / asset preparation in March
- Auto-transition to active on Apr 1
- April payroll picks her up automatically

**Sub-case:** Joining date pushed back twice (now June 1). Update `expectedJoiningDate`; multiple updates audit-logged.

## EC4 — No-show

Anjali signed offer for Apr 1. Doesn't show up. Hasn't communicated.

**Handling:**
- Day 1 (Apr 1): expected to join, didn't
- Day 1–7: HR follow-up; status remains `preJoining`
- Day 8: mark as `Withdrawn` with reason `no-show`; sign-on bonus clawback initiated
- Audit log

If she resurfaces later → New offer flow, new Employee record (or restoration of withdrawn).

## EC5 — Inter-entity transfer mid-month

Pankaj works at Acme Industries Pvt Ltd. On Apr 15 transferred to Acme Trading LLP.

**Handling per [02-employment-record.md](./02-employment-record.md):**
- Source EmploymentRecord: `lastWorkingDay = Apr 14`, status=Separated
- New EmploymentRecord at LLP: `joinedOn = Apr 15`, `joiningSource = inter-entity-transfer`
- Apr payroll splits:
  - Pvt Ltd payroll: 14 days (Apr 1–14) at old structure
  - LLP payroll: 16 days (Apr 15–30) at new structure
- TDS: each entity computes for its portion; employee files Form 12B if there are tax implications
- PF: prior member ID closed at Pvt Ltd's PF code; new member ID at LLP's PF code; same UAN
- Form 16: two Form 16s issued (one per entity per FY)

**Pre-condition checks:**
- Both entities active in same tenant
- No pending payroll lock at either entity
- Manager re-assignment in target entity confirmed
- Salary structure at target entity confirmed
- Effective date mutually agreed

## EC6 — Concurrent employment (v2)

A director draws salary from holding co. and operating co. simultaneously.

**v1: Not supported.** Defer to v2.

When supported (v2):
- Two `EmploymentRecord`s active simultaneously, same Employee
- One marked `isPrimary=true` (for ESI, primary residence, default reporting)
- Two CompensationRecords
- Two payslips per month (one per entity)
- Two PF member IDs (under same UAN)
- ESI: only at primary entity (can be deducted at one; per ESIC rule)
- Income tax: employee declares secondary income via Form 12B; primary employer computes consolidated TDS
- Form 16: two issued

## EC7 — Employee on maternity leave during inter-entity transfer

Niharika on maternity leave (started Mar 1, ends Aug 24, 26 weeks). Tenant decides to move her to a different entity effective Apr 15.

**Handling:**
- Maternity leave straddles transfer
- Maternity Benefit Act `[CA-REVIEW]` — continuity of service for ML purposes is typically maintained for transfer within group
- Source EmploymentRecord: end on Apr 14 with reason `inter-entity-transfer`
- ML period: Mar 1 – Aug 24
  - Source entity pays ML for Mar 1 – Apr 14 (45 days) `[CA-REVIEW]`
  - Target entity continues ML payment Apr 15 – Aug 24 (132 days)
  - Total 26 weeks paid maternity preserved
- PF: contributions continue at target entity (ML is paid leave, PF wages apply)

**Spec implications:**
- Leave balance "transfer" between entities for ML
- Configuration: `groupContinuousServiceForMaternity = true | false` per tenant

## EC8 — Manager-reportee both resign with overlapping notice

Manager Anil resigns Apr 1, lastWorkingDay = May 31. Reportee Priya resigns Apr 15, lastWorkingDay = Jun 14.

**Handling:**
- Anil's exit triggers reportee re-assignment
- Per tenant config:
  - Re-assign to skip-level immediately, or
  - Re-assign on lastWorkingDay
- Priya's leave / approval flows reroute to new manager
- Knowledge transfer plan covers both (overlapping)
- Audit log captures manager change

## EC9 — Resignation withdrawn

Pankaj resigns Apr 1, lastWorkingDay = May 31. On May 15, withdraws.

**Handling:**
- HR approval required (multi-level: manager + HR + senior management)
- EmploymentRecord: `noticeStartedOn` and `lastWorkingDay` cleared; `employmentStatus = active`
- Audit log: withdrawal recorded
- Replacement requisition (if raised) cancelled

If by May 15 a replacement was already hired → cannot withdraw (or HR negotiates)

## EC10 — Death in service

Suresh, active employee, dies Apr 5 in road accident.

**Handling:**
- Special compassionate workflow — sensitive
- Death certificate uploaded
- EmploymentRecord: `lastWorkingDay = Apr 4` (last day actually worked or alive); `employmentStatus = separated` with `separationCategory = death`
- F&F:
  - Salary up to lastWorkingDay
  - Gratuity: 5-year minimum service rule waived (per Payment of Gratuity Act § 4)
  - PF: balance + EDLI (life insurance, max ₹7L `[VERIFY]`)
  - Group Term Life payout
  - Group Personal Accident (if accident)
  - Leave encashment
- Nominees: per nomination forms; if not nominated, follows succession law `[CA-REVIEW]`
- Family pension under EPS (if EPS member > 10 years contributory)
- Communication: through HR + manager personally; not automated

**UI:**
- Death not selectable from regular separation menu — separate compassionate workflow
- Confirmation by senior HR/legal
- Notification suppression: typical "exit announcement" emails don't auto-send
- Sensitive language in any system communications

## EC11 — Employee's PAN gets inoperative due to Aadhaar non-linking

Pankaj had PAN linked to Aadhaar; due to ITAct deadline, PAN became inoperative.

**Handling:**
- Verification service flags `panInoperative = true`
- TDS computation switches to higher rate (section 206AA — typically 20% or applicable rate, whichever is higher)
- Notification to employee with action steps
- Once employee re-links and verifies, flag clears, TDS reverts

## EC12 — Employee changes name (marriage, legal change)

Niharika gets married Apr 5; legally changes surname.

**Handling:**
- New name documents uploaded (gazette notification, marriage certificate, new PAN, new Aadhaar)
- Manual review required by HR
- Employee record updated:
  - `personal.fullLegalName` updated (versioned)
  - `personal.lastName` updated
  - `personal.maritalStatus` may also change
  - Old name retained in `EmployeeVersion` history
- Statutory implications:
  - Form 16 for that FY may have name mismatch (PAN must update first)
  - PF KYC needs re-verification with new name
  - Bank account name change required

**Spec:** support flag `nameChangePending` blocks payroll lock until statutory ID names match.

## EC13 — Employee changes gender

Vihaan transitions; legally updates documents.

**Handling:**
- Same flow as name change
- Sensitive — HR handles confidentially
- Audit log access restricted to specific roles
- Religious-category fields preserved unless explicitly updated

## EC14 — Address change with state implications

Pankaj moves from Maharashtra to Karnataka (work-from-home; same employer location is in Maharashtra).

**Handling:**
- `Employee.contact.addresses.current` updated (versioned)
- PT applicability: depends on **work state**, not residence state. PT continues at MH `[CA-REVIEW]`
- HRA exemption (old regime): based on rent paid + city of residence (metro vs non-metro). Bangalore is metro → 50% HRA basis vs 40% non-metro
- LWF: depends on entity registration, not employee
- Bank: account in MH may continue; tenant may suggest local bank for convenience

**Spec:** distinguish `currentAddress.state` (residence) from `EmploymentRecord.locationId` (work). PT calculation uses work state.

## EC15 — Branch closure

Acme's Pune branch closes Jul 31. 25 employees.

**Handling:**
- Each employee's EmploymentRecord: action depends on outcome
  - Transferred to another branch → location change (versioned)
  - Made redundant → terminated with reason `redundancy`; retrenchment compensation applies (if workmen)
- Branch flag: `isOperational = false`
- Cannot assign new hires to closed branch
- Statutory: factory closure (if applicable) requires Form notification to inspector `[CA-REVIEW]`

## EC16 — Entity closure / merger

Acme Trading LLP being wound up; employees transferred to Acme Industries Pvt Ltd.

**Handling:**
- Mass inter-entity transfer (covered in EC5 multiplied by N employees)
- Bulk operation with single approval
- Source entity: status → WindingUp → Closed when employee count = 0
- Statutory filings at source entity continue until closure
- Form 16 for source entity issued for FY-up-to-transfer-date

## EC17 — Acquisition: tenant gains employees from acquired company

Acme acquires BetaCorp. 80 BetaCorp employees become Acme employees overnight.

**Handling:**
- Bulk employee import with `joiningSource = acquisition`
- Service continuity rules:
  - Date of joining can be either:
    - Date of acquisition (no continuity), or
    - Date of original BetaCorp joining (continuity preserved — gratuity, leave, etc.)
  - Default: continuity preserved per acquisition agreement
- PF: complex; either (a) employees withdraw from BetaCorp PF and start fresh at Acme, or (b) PF establishment is also acquired
- TDS: BetaCorp's prior salary in same FY should be declared via Form 12B for accurate annual TDS

`[CA-REVIEW]` major review needed; tax/legal consequences are complex.

## EC18 — Bulk salary revision

April 1 cycle: 1,200 employees get revisions, varying by performance + department.

**Handling:**
- Bulk revision tool: HR uploads CSV with `employeeCode, revisionType, ctcAnnual, effectiveFrom, reason`
- System validates each row
- Preview shows before/after for each
- Approval workflow (single approval for whole batch, or per-employee)
- Atomic: all-or-nothing within a batch (or per-employee with aggregate report)
- Each row creates new `CompensationRecord`
- Retros computed if effectiveFrom < today
- Revision letters generated as PDFs (templated, mail-merge)
- Audit log: bulk operation tagged

## EC19 — Backdated salary revision causing retro

Employee's revision approved May 15 effective April 1. April payroll already locked.

**Handling:**
- New CompensationRecord with effectiveFrom = April 1
- April payroll line is *not* amended (it's locked)
- Retro for April: difference between new and old structure × applicable days
- Retro added to May payroll as separate line items:
  - "Arrears - April Salary" (taxable)
  - "Arrears - April PF" (statutory contribution on retro wages)
  - "Arrears - April PT recalc" (if applicable)
- TDS impact: cumulative annual income is higher, so TDS for May increases proportionally
- Form 16: retro reflects in respective month per tax rules `[CA-REVIEW]`

Detailed in /03-payroll/06-arrears-and-retros.md (Phase 3).

## EC20 — Promotion + transfer + revision simultaneously

Pankaj promoted from L4 to L5, transferred from Bangalore to Pune, revised from ₹15L to ₹20L, all effective May 1.

**Handling:**
- Single change request capturing all three
- Three records updated in single transaction:
  - EmploymentRecord: new designation, new location (or new entity if cross-entity)
  - CompensationRecord: new revision
  - Manager change (Bangalore manager → Pune manager)
- Single combined letter (Promotion + Transfer + Revision)
- Multiple notifications (manager, employee, HR, payroll, IT for relocation, admin for new desk)

## EC21 — Probation extension followed by termination

Probation extended Apr 5 by 3 months. By Jun 15 still not meeting bar. Terminated.

**Handling:**
- `probationExtensionHistory` array contains the extension
- Termination during extended probation: typically without notice or with shortened notice
- Retrenchment compensation: typically not applicable for non-confirmed employees `[CA-REVIEW]`
- F&F: standard

## EC22 — Employee terminated for misconduct mid-notice-period

Already on notice (lastWorkingDay = May 31). On May 10, found guilty of misconduct.

**Handling:**
- Investigation completed, finding established
- EmploymentRecord: `lastWorkingDay` may be revised to May 10 (immediate termination)
- F&F: dues forfeited per Standing Orders / per company policy `[CA-REVIEW]`
- Audit log: termination overrides resignation
- Letter: termination letter, not relieving letter

## EC23 — Two employees with the same name

Two Pankaj Sharmas in the tenant.

**Handling:**
- Name is not a unique key. PAN is.
- Employee code disambiguates
- UI: search by employee code or PAN; if both Pankaj Sharmas appear, show DOB or other distinguishing field
- No data integrity issue, but UX nuance

## EC24 — Aadhaar-PAN name mismatch

Aadhaar says "Pankaj Kumar Sharma", PAN says "Pankaj Sharma".

**Handling:**
- Both stored
- Verification service flags mismatch
- HR review: legitimate variations (middle name expansion, abbreviations) vs error
- KYC status: can be marked verified with note

## EC25 — Employee opens dispute against employer

Pankaj files a Labour Commissioner / industrial tribunal case post-separation.

**Handling:**
- `EmploymentRecord` flagged with `legalHold = true`
- All historical records related to Pankaj cannot be deleted (override of DPDPA right-to-erasure during dispute)
- Audit log marked for legal hold
- Inspection mode may apply
- Records retained until dispute resolved + standard retention

## EC26 — Cross-entity reporting line

Manager A is in Entity X. Reportee B is in Entity Y. Both same tenant.

**Handling:**
- Allowed via `EmploymentRecord.reportingManagerId` cross-entity
- A can read B's data
- A cannot write to B's HR / payroll / employment records (those belong to Entity Y's HR)
- A can approve B's leave (cross-entity workflow)

## EC27 — Employee with multiple bank accounts (split salary)

Pankaj wants 60% to bank A, 40% to bank B.

**Handling:**
- `Employee.bank.accounts[]` supports multiple
- For salary disbursement, configure split percentages
- Bank file generation produces separate transactions
- Form 16: one TAN, one PAN; bank split is operational only, not statutory

`[v2]` Some companies don't support split. v1: `splitDisbursement = false` for tenant; v2: configurable.

## EC28 — Salary adjusted for foreign assignment

Pankaj on 6-month assignment to UK. Allowance changes; tax treatment changes (DTAA, foreign tax credit).

**Handling:**
- Out of scope for v1 (Indian-only)
- Mark in employment record as `internationalAssignment` flag
- Manual adjustment per case

## EC29 — Employee on maternity returns part-time

Niharika returns from ML, requests part-time arrangement.

**Handling:**
- New EmploymentRecord with `employmentType = permanent-part-time`, OR
- Same EmploymentRecord, type changed (versioned)
- New CompensationRecord with reduced CTC (50% of full-time, etc.)
- Statutory implications: PF / ESI continue; some allowances pro-rated
- Tenant decides: `partTimeAfterMaternityPolicy`

## EC30 — Long-term medical leave with eventual termination

Anil on extended medical leave from Jan 1; ML / SL exhausted; on LOP from May 1. By Sept his condition makes return impossible.

**Handling:**
- Status: `OnLeaveLong` since Jan
- LOP from May → no salary
- Insurance continues (some policies)
- Termination flow: per tenant policy, may include medical board certification, severance, gratuity, pension
- Audit log: timeline reconstruction critical

## EC31 — Employee with disability changes accommodation request

Vihaan, declared PWD, requests workplace accommodation change.

**Handling:**
- Tracked in `personal.physicallyHandicapped`
- HR + accessibility team workflow
- Tax exemption Section 80U (for self) / 80DD (for dependent) applies
- ESI ceiling for PWD: ₹25,000 instead of ₹21,000 `[VERIFY]`

## EC32 — Female employee returning from maternity transferred at her request

Allowed; standard transfer flow.

**Maternity Benefit Act:**
- Cannot be transferred to a job that is detrimental to her or her child during/post-pregnancy
- Tenant flag: `maternityProtectedFromTransfer` prevents auto-transfers during sensitive period
- Override requires explicit consent + HR approval

## EC33 — Multiple sequential resignations within the same month

Employee resigns May 1 (lastWorkingDay May 31). May 15 withdraws. May 20 resigns again with 60-day notice.

**Handling:**
- Each resignation is a state change with audit log entry
- Withdrawal is a separate state change
- New resignation creates new lastWorkingDay = May 20 + 60 = July 19
- HR may flag for unusual pattern

## EC34 — Employee on PIP

`EmploymentRecord` not directly affected; but `performance.activePip = true` (covered in `/06-performance/`).

**Implications:**
- Confirmation deferred if in probation
- Salary revision typically restricted during PIP
- Promotion blocked

## EC35 — Suspension without pay

Disciplinary action: suspended for 7 days, no pay.

**Handling:**
- LOP marked for 7 days in attendance
- Audit log: suspension reason
- May or may not be in `EmploymentRecord` (covered as attendance event)
- For longer suspensions (investigation): `OnHold` state

## EC36 — Employee under contractor's payroll, but works in our office

Contract Labour under CLRA. Distinct from regular employees.

**Handling:**
- Separate Employee record with `isContractLabour=true`
- `clraDetails` populated
- Not counted in regular headcount for some statutory thresholds (Bonus Act, Gratuity Act)
- May or may not be on our payroll (depends on engagement model)
- CLRA Form V, XII, XIII apply

Detailed in /04-compliance/09-clra-contract-labour.md (Phase 3).

## Cross-references

- See [02-employment-record.md](./02-employment-record.md) for state transitions
- See [06-lifecycle-state-machine.md](./06-lifecycle-state-machine.md) for full state diagram
- See [/03-payroll/06-arrears-and-retros.md](../03-payroll/06-arrears-and-retros.md) (Phase 3) for retro handling
- See [/04-compliance/](../04-compliance/) (Phase 3) for statute references
