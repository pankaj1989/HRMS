# 08 — Recruitment Edge Cases

## Purpose

Edge cases that break naive recruitment models. Handling specifications below.

## EC1 — Same candidate applies to two requisitions

Pankaj applies for SDE in March; rejected. Applies for Senior SDE in October.

**Handling:**
- Single Candidate record (deduped by email/phone)
- Two Application records
- Recruiter sees full history of applications by this candidate
- Old rejection reason informs new evaluation
- New application starts fresh in pipeline

## EC2 — Recruiter starts hiring without approved requisition

Some recruiters source candidates before formal requisition (anticipating hiring).

**Handling:**
- Candidates added to talent pool with `inTalentPool=true`
- Once requisition opens, candidates from pool quickly applied
- Audit trail
- Bypass requisition flow not allowed for offer extension (offer requires requisition)

## EC3 — Candidate ghosts after multiple rounds

Pankaj cleared 3 rounds; no response to 4th interview scheduling for 2 weeks.

**Handling:**
- After 7 days no response: 1st reminder
- After 10 days: 2nd reminder + manager call attempt
- After 14 days: marked withdrawn-by-candidate (auto)
- Application closed
- Risk flag on candidate (note for future)

## EC4 — Internal applicant rejected

Senior employee applies internally; not selected.

**Handling:**
- Sensitive: avoid demotivating
- Manager-private rejection note
- Verbal communication preferred
- Status updated to rejected with internal-confidential reason
- Candidate (employee) gets factual update via ESS

## EC5 — Offer extended; manager changes mind

Manager pushes back on hiring decision after offer sent.

**Handling:**
- Critical legal exposure if offer accepted
- Withdrawal flow with mandatory legal review
- Compensation for candidate (typically 1-2 months pay if accepted)
- Audit of decision reversal
- Pattern monitoring (managers flip-flopping)

## EC6 — Candidate accepts, then accepts another offer

Pankaj accepts Acme. Two weeks later, accepts CompetitorCo's offer (verbal commitment to Acme broken).

**Handling:**
- Pankaj informs Acme HR
- HRMS marks application as `withdrawn-by-candidate`
- Joining bonus / advance recovered (if paid)
- Counter-offer logged for analytics
- Candidate flagged for `do-not-rehire` consideration

## EC7 — BGV finds discrepancy in degree

BGV reveals Pankaj's claimed MBA from XYZ University doesn't exist.

**Handling:**
- BGV report flagged
- HR manager notified
- Decision matrix:
  - Minor (year mismatch): proceed with note
  - Major (fake institution): withdraw offer, blacklist
- Candidate notified with clear reason
- Offer withdrawn formally

## EC8 — Notice period far longer than expected

Pankaj said 30 days; current employer requires 90 days. Joining date pushed.

**Handling:**
- HR negotiates with Pankaj
- Options: serve full notice, buyout
- Joining date changed (with limit; e.g., max 60 days extension)
- If extension > limit: offer reviewed; may be withdrawn
- Acme can offer to pay buyout (if candidate value justifies)

## EC9 — Hiring manager unavailable for interviews

Manager on long leave / sabbatical during recruitment.

**Handling:**
- Delegated approver in interview panel
- Skip-level manager covers
- Can pause requisition if not urgent
- Audit log of delegation

## EC10 — Interview panel mismatch (panel doesn't show)

Schedule conflict; panel member misses interview.

**Handling:**
- Conduct with available panel
- Reschedule for missing member
- If unable to reschedule: rely on present panel's feedback
- Audit log
- Coaching for chronic absenteeism

## EC11 — Candidate provides fake reference

Reference person says they don't know candidate or contradicts info.

**Handling:**
- BGV flag
- HR investigates alternate references
- If pattern of misinformation: offer withdrawn
- Blacklist consideration

## EC12 — Compensation gap discovered post-offer

Negotiated CTC of ₹15L. Later discovers competitor pays similar role ₹20L. Or: candidate negotiates further demand.

**Handling:**
- Re-negotiation flow
- Approval re-routed if revised CTC > original approved range
- New offer version
- Original superseded

## EC13 — Candidate claims to be returning ex-employee

Pankaj worked at Acme 2018-2020; left. Now reapplying.

**Handling:**
- Detect via email / phone match
- Reference prior employment record
- Rehire workflow
- Background: prior performance, exit reason, eligibility for rehire (some companies have 6-month / 1-year cool-off)
- Compensation: prior CTC + market adjustment

## EC14 — Multiple recruiters working same candidate

Pankaj applied via Naukri (Recruiter A) and via referral (Recruiter B) for same role.

**Handling:**
- Deduplication catches; flagged
- Single application; primary recruiter assigned (typically first contacted candidate or referral source if higher quality)
- Referral bonus eligibility verified

## EC15 — Candidate from same skill but different requisition

Pankaj rejected for Senior Engineer; later, similar Senior Engineer requisition opens.

**Handling:**
- Recruiter notified (talent pool match)
- Pankaj contacted; can re-apply easily
- Prior interview feedback informs (don't re-interview same competencies if recently done)

## EC16 — Recruiter manipulating ratings

Recruiter consistently rates candidates higher to push through pipeline.

**Handling:**
- Pattern detection (rating distribution analysis)
- Manager / HR review
- Coaching / disciplinary

## EC17 — Bias in interview ratings

Pattern: female candidates rated lower by male interviewer.

**Handling:**
- Diversity analytics flag
- Bias training
- Panel composition policy (mixed panels)
- Audit panel decisions

## EC18 — Job posting attracts wrong candidates

Senior role posted; mostly junior applicants applying.

**Handling:**
- JD review (clarity issues)
- Channel mismatch (post on different platforms)
- Filtering at screening stage

## EC19 — Mass hiring (50+ blue-collar workers)

Need 50 production workers in 2 weeks for new line.

**Handling:**
- High-volume pipeline (walk-in interviews, group sessions)
- Streamlined documents (Aadhaar-only basic verification)
- Fast offer-on-the-spot for cleared candidates
- Bulk operations (multiple offers sent simultaneously)
- Consolidated joining day

## EC20 — Walk-in candidate vs scheduled

Walk-in shows up for tech role (no appointment).

**Handling:**
- HR discretion: either schedule for later or accommodate
- Most companies: schedule unless manager available now
- Walk-in tracking; some pipelines designed for walk-ins (blue-collar)

## EC21 — Candidate visa / legal status

Foreign national applying. Or someone needing visa sponsorship.

**Handling:**
- Out of v1 core scope (most Indian SMEs hire residents)
- Light support: capture visa status, sponsorship needed flag
- Tenant policy on sponsorship

## EC22 — Offer withdrawn after acceptance (employer side)

Tenant withdraws offer after candidate has resigned current job.

**Handling:**
- High legal risk
- Compensation typically required (1-3 months pay)
- Legal counsel involvement
- Withdrawal letter on letterhead
- Audit trail

## EC23 — Candidate failure to provide documents

Repeated reminders ignored. Joining date approaches.

**Handling:**
- Final reminder with deadline
- Joining held until docs received
- Conditional joining (e.g., 30 days to submit; else employment terminated)
- Some companies: don't allow joining without all docs (strict)

## EC24 — Salary structure change between offer and joining

Acme's salary structure for engineers updated (higher HRA %) between offer in October and joining in December.

**Handling:**
- Default: structure as on offer date applies
- New employees join under new structure
- Tenant may apply new structure to existing acceptances (positive change typically; communicated)

## EC25 — Joining bonus already paid; candidate doesn't join

Acme paid ₹50K joining bonus; candidate no-show.

**Handling:**
- Recovery via legal demand notice
- Small claim court if refused
- Often unrecoverable in practice
- Future: structure joining bonus as paid in tranches (50% on Day 1, 50% post-3-months)

## EC26 — Candidate background found social media red flags

Public posts indicate concerns (extreme views, harassment).

**Handling:**
- Documented in BGV
- HR + legal review
- Decision: proceed, dialogue with candidate, withdraw
- Sensitive — privacy considerations

## EC27 — Reference from candidate's relative (false claim)

Reference is candidate's brother-in-law, not former colleague.

**Handling:**
- BGV vendor verifies reference identity (LinkedIn, prior employer database)
- Discrepancy flagged
- Alternative references requested

## EC28 — Multiple offers from same tenant

Pankaj applies for 2 different roles; receives offers for both.

**Handling:**
- Both offers visible
- Pankaj chooses one
- Other automatically declined
- Hiring managers coordinated

## EC29 — Compensation revealed accidentally to candidate

Recruiter shares a higher band than approved.

**Handling:**
- HR review
- Honor commitment if candidate accepted (legal exposure)
- Coach recruiter on confidentiality
- Audit pattern

## EC30 — Candidate re-applies after blacklisting

Blacklisted candidate (no-show after offer) applies via different email.

**Handling:**
- Phone-based deduplication catches
- Auto-flagged
- Recruiter sees blacklist; can choose to engage or reject
- If re-engaging: must justify and HR review

## Cross-references

- All other files in `/05-recruitment/` contain handling logic
- [/01-employee/07-edge-cases.md](../01-employee/07-edge-cases.md) — onboarding edge cases
