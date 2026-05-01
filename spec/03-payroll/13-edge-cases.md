# 13 — Payroll Edge Cases

## Purpose

Real-world payroll scenarios that break naive models. Each case includes the spec'd handling.

## EC1 — Mid-month joiner

Pankaj joins April 15. April has 30 days; 22 working days. From April 15 to 30 = 16 calendar days, ~12 working days.

**Handling:**
- workdaysBasis = 'working-days'
- workedDays = 12 (Apr 15-30 working days)
- proRationFactor = 12 / 22 = 0.5454
- Earnings × 0.5454 (where `proRateOnLop=true`)
- LTA / annual components: not pro-rated by default (full-month component)
- TDS: monthly TDS computed on annualized projection minus already-deducted YTD (which is 0 for new joiner)

PF / ESI applies from joining date.

## EC2 — Mid-month separation

Pankaj resigns; LWD April 15. April has 30 days; 22 working days. From April 1 to 15 = 15 calendar days, ~11 working days.

**Handling:**
- workedDays = 11
- proRationFactor = 11 / 22 = 0.5
- Last regular payroll for April: pro-rated to 0.5
- F&F triggers in May for any encashment, gratuity, etc.
- April PF / ESI on pro-rated wages

## EC3 — Joining and leaving in same month

Quick-exit: joined April 5, left April 25. 21 calendar days, ~16 working days.

**Handling:**
- Treated as both new joiner and separation in same period
- Earnings pro-rated for ~16 days
- Statutory contributions on actual days
- F&F may run in same month or next
- PF: very short tenure, < 2 months → no employer share to EPS (just EPF) `[VERIFY]`
- Gratuity: not eligible (< 5 years)

## EC4 — LOP exceeds working days

Pankaj on extended sick leave. April has 22 working days; he was absent 25 days (sick all month).

**Handling:**
- workedDays = 0
- LOP days = 22 (or less if some were paid SL)
- Earnings = 0 (if all LOP)
- Net pay = 0 OR negative (if recoveries exist)
- Negative case: per tenant config, cap at 0 or carry-forward
- Statutory: employer PF still owed if at least 1 day was paid (rules around "intermittent service" `[VERIFY]`)
- Long-leave employees: LOP > 1 month may trigger separate processing

## EC5 — Backdated termination

Pankaj's termination effective March 25, processed April 10. April payroll runs April 28.

**Handling:**
- April payroll: Pankaj NOT included (already separated)
- F&F generated for March 25 LWD
- Any pay paid March 25 onwards: marked as overpaid → recovery in F&F
- Statutory contributions for late period: not made; or made and reversed
- TDS adjustment: previously deducted on assumed working → may need refund via F&F

## EC6 — Negative net pay (recovery > earnings)

Pankaj has loan EMI ₹5,000 and only worked 5 days due to LOP. Earnings: ₹20,000. Loan + PF + TDS exceed ₹20,000.

**Handling:**
- Default: cap recovery at remaining net (after statutory deductions)
- Carry-forward unrecovered loan amount to next month
- Audit log entry
- Anomaly flag for HR review
- Tenant config: alternative is "let it go negative" (rare)

## EC7 — Double-paid in error

System bug or human error: Pankaj got April salary twice.

**Handling:**
- Discovered in May reconciliation
- May payroll: ARREARS line = -April amount (recovery)
- F&F if employee separates with unrecovered balance
- Audit log: incident, root cause, remediation
- If discovered after FY end: revised Form 16 (CA review)

## EC8 — Employee with multiple bank accounts

Pankaj wants 70% to HDFC, 30% to ICICI.

**Handling:**
- Employee master has multiple bank accounts with split config
- Bank file: 2 entries for Pankaj, summing to net pay
- Statement consistency: gross/deductions same; only disbursement split

## EC9 — PF wage increase mid-FY

EPFO raises ceiling from ₹15,000 to ₹25,000 effective Sep 1, 2026.

**Handling:**
- Statutory rules engine: new PF rule version effective Sep 1
- Aug 2026 payroll: old ceiling ₹15K
- Sep 2026 payroll: new ceiling ₹25K (employer contribution increases)
- All employees with PF wages > ₹15K but ≤ ₹25K: both employee and employer PF rise
- Notification to employees of increased deduction
- HR-facing report: cost impact estimation pre-implementation

## EC10 — Employee transfers cross-entity mid-month

Pankaj at Entity A till April 15; transferred to Entity B effective April 16.

**Handling:**
- Two PayrollLines for April:
  - Entity A: Apr 1-15, prorated
  - Entity B: Apr 16-30, prorated
- Same UAN; PF deposit aggregated under correct establishment code
- Single Form 16 (per employer; if same legal entity / different PF code)
- F&F NOT triggered (intra-tenant transfer)
- Audit chain: transfer event → both lines

## EC11 — Salary revision retroactive 6 months

Pankaj's CTC revision from Jan 1, approved June 25. 6 months retro.

**Handling:**
- Detailed in [06-arrears-and-retros.md](./06-arrears-and-retros.md)
- May/June payroll: ARREARS for Jan-Apr (4 months × monthly delta)
- PF / ESI on arrears: paid with current month's challan
- TDS: full retro included in current month gross for cumulative TDS
- Section 89 relief: employee claims at ITR

## EC12 — Tax regime change mid-year

Pankaj declared 'old' regime in April; in October submits proofs for very low investments. Wants to switch to 'new' regime.

**Handling:**
- For salaried, regime can be changed once per year typically `[VERIFY current rules]`
- New regime more beneficial → switch
- Recompute YTD tax under new regime
- Adjust remaining months' TDS to align cumulative
- Form 16 reflects new regime

`[CA-REVIEW]` IT Act 2025 may have specific rules on switching.

## EC13 — Death in service

Pankaj dies during employment April 15.

**Handling:**
- F&F triggers immediately
- Beneficiaries: per employee master family records + Form F nomination
- Gratuity: 5-year rule waived; pro-rated computation
- Leave encashment: full balance encashed; § 10(10AA) tax exemption
- ESI death benefit (if ESI member) processed separately
- EDLI claim under PF Act
- Workmen's Compensation if accident at work `[BLUE-COLLAR]`
- Special death JV
- Insurance claims: HRMS files with insurer
- Sensitive: handle with care; manager + HR coordinate with family

## EC14 — Maternity leave overlapping payroll

Anjali on ML April 1 to Sep 30 (26 weeks). 6 monthly payrolls during.

**Handling:**
- Each month's PayrollLine reflects ML
- Earnings computed at full salary (Maternity Benefit Act § 5: full average daily wage)
- Statutory contributions continue (PF on ML wages)
- TDS: ML earnings are taxable (no specific exemption for ML pay)
- Leave balance: ML is event-based; no EL accrual during ML (varies by tenant)

`[CA-REVIEW]` Per Maternity Benefit Act § 5: "average daily wage" = average of woman's earnings in 3 months prior. The HRMS computes this and pays accordingly. Some interpretations: must continue at last drawn rate.

## EC15 — Long sabbatical (unpaid 6 months)

Pankaj on sabbatical July-Dec; unpaid.

**Handling:**
- 6 months of zero earnings
- PF / ESI / Gratuity: no contributions during unpaid period (since no wages)
- Service continuity: depends on tenant policy + Maternity Benefit / Factories Act for paid breaks
- Gratuity service: typically NOT counted for sabbatical period
- Insurance: tenant policy on continuation during sabbatical
- TDS: zero TDS for 0 income; FY total tax may decrease

## EC16 — Employee with two PAN cards (rare, illegal)

Discovery: employee has two PANs.

**Handling:**
- Per IT rules, only one PAN allowed per individual
- HR notifies employee to surrender duplicate PAN
- If primary PAN inoperative: TDS at 20% per § 206AA until corrected
- Audit: PAN verification at hire would catch this (NSDL PAN verification API)

## EC17 — Wrong PF UAN linked

Pankaj's UAN linked to wrong identity (data entry error). Discovered after months of contributions.

**Handling:**
- Stop contributions to wrong UAN immediately
- Correct UAN linked
- Wrong contributions: claim refund/transfer through EPFO Form 13 / dispute mechanism
- HRMS supports "PF deposit dispute" flow; tracks correction
- Audit log captures error and remediation

`[BLUE-COLLAR]` Common in informal labour where Aadhaar-UAN seeding issues exist.

## EC18 — Bonus paid pre-FY-end (advance)

Diwali bonus ₹50K paid October 2026 (FY 2026-27).

**Handling:**
- October payroll: ARREARS or specific BONUS one-time addition
- TDS on bonus: included in Oct gross; cumulative TDS recomputed
- Year-end (March 2027): no additional bonus action needed; already paid
- Form 16: shows bonus in salary

## EC19 — Performance bonus subject to clawback

Sign-on bonus ₹2L with 12-month retention clause. Pankaj resigns at month 8 — must pay back pro-rata.

**Handling:**
- F&F: recovery = ₹2L × (12 - 8) / 12 = ₹66,667
- Recovery added to F&F deductions
- Tax: previously deducted TDS on bonus; recovery reduces F&F gross; no automatic refund (employee claims via ITR)
- Documentation: clawback per offer letter terms

## EC20 — TDS short-deducted (employer error)

YTD TDS deducted ₹40,000 but should have been ₹60,000. Discovered Q4.

**Handling:**
- Catch up in remaining months: increase monthly TDS
- If FY end approaches and unable to catch up: deduct full residual at FNF or last month
- If employee separates before catching up: short-deduction settled via ITR + employee owes IT department
- Disclosure to employee; audit trail

## EC21 — Employee rejoining (rehire)

Pankaj separated December 2024; rehired April 2026.

**Handling:**
- New EmploymentRecord (different employmentId; same Employee record per `/01-employee/02-employment-record.md`)
- Service continuity: typically NOT continuous (gratuity restarts; leave accruals fresh)
- Tenant policy: some retain prior service if < 6 months gap
- New PF UAN reuse: same UAN (per UAN rules); new PF member ID under same UAN
- PT, ESI: fresh start in new period
- F&F from prior tenure: should already be settled

## EC22 — Cross-state move with PT change

Pankaj transferred from Bangalore (Karnataka PT) to Mumbai (Maharashtra PT) on April 15.

**Handling:**
- April payroll: PT from Karnataka for April 1-15; Maharashtra for April 16-30
- Each state has its own slab and deposit cycle
- Two PT entries on payslip if states differ significantly; one if simple
- PT deposits: filed separately per state
- Year-end PT (Maharashtra has March extra): apply to whichever state Pankaj is in March

## EC23 — Salary in foreign currency `[v3]`

Tenant pays foreign-deputed Indian employee in USD.

**Handling:**
- Out of v1 / v2 scope
- v3: multi-currency support; FX conversion at payroll date or set rate
- Tax: per IT Act for foreign-deputed Indians; complex

## EC24 — Government holiday declared retroactively

Cabinet declares April 15 holiday on April 14 evening (election, mourning). Some employees came in.

**Handling:**
- Holiday calendar updated retroactively
- April 15 DailyAttendance recomputed: status = holiday
- Workers who came: status = holiday-worked (eligible for OT/comp-off)
- Workers on leave April 15: leave refunded
- Audit captures retro change

## EC25 — Employee disputes deductions

Pankaj disputes TDS deduction. Claims his investment proof was submitted.

**Handling:**
- HR investigates: was proof actually received? Approved?
- If proof should have been considered: recompute, refund excess via next payroll
- If proof was rejected (insufficient): explain; no change
- Audit trail: dispute log
- If escalated: Industrial Disputes Act dispute; legal process

## EC26 — Employer error in salary structure

Tenant set up wrong HRA % for some structure. Affects 200 employees over 3 months.

**Handling:**
- Discovery → correction
- Retros for 200 employees × 3 months = 600 retro events
- Bulk retro processing (parallelized)
- Cumulative arrears computed
- One-time addition in current month for affected employees
- Affected statutory contributions: deposited with current challan
- Communication to employees explaining

## EC27 — Public sector DA hike

Government DA rate revision (e.g., DA hiked from 28% to 32% effective March; notification April).

**Handling:**
- Statutory rules engine: new DA rule effective March
- April payroll: includes April DA at new rate + March arrears
- ARREARS line for March
- PF / ESI / Bonus: all on revised wages

`[BLUE-COLLAR]` Common in PSU; less common in private. Rules engine handles.

## EC28 — TDS rectification for separated employee

Pankaj separated December 2025. April 2026: identified ₹5,000 TDS over-deducted.

**Handling:**
- Cannot deduct/refund through current payroll (Pankaj no longer on rolls)
- Communication to employee: will be reflected in revised Form 16
- File revised TDS return (Form 24Q correction) for the affected quarter
- Issue revised Form 16
- Employee gets refund via ITR (not from employer)

## EC29 — Maternity benefit shortfall

Anjali's last 3 months pre-ML wages averaged below current month wage. Maternity Benefit pays at "average daily wage" (lower).

**Handling:**
- Per § 5 of MB Act: paid at avg of last 3 months
- HRMS computes average and pays accordingly
- Anjali might dispute: tenant can pay at current wage as enhanced policy (above statutory minimum)
- Tenant policy controls; default = statutory minimum (avg of last 3 months)

## EC30 — Lockdown / pandemic-style shutdown

Multi-week shutdown; tenant decides to pay 50% (per government advisory or own policy).

**Handling:**
- Special "shutdown allowance" component (50% of normal)
- Statutory contributions: typically continue at full PF wage `[CA-REVIEW]`
- Gratuity service: shutdown counted as continuous service per Industrial Disputes Act § 25-O
- Leave: tenant policy on whether shutdown days are paid leave or LOP

## EC31 — Final-month F&F with bonus payable

Pankaj resigns; statutory bonus accrued for current FY, FY ends in 4 months.

**Handling:**
- F&F includes pro-rated statutory bonus (Bonus Act § 8 mandate)
- Computed: 8.33% × (current FY wages capped at ₹7K) for months worked
- Paid in F&F payroll line
- Eligible for tax (taxable in receipt year)

## EC32 — Salary revision with reduction

Rare but happens (demotion, pay cut as alternative to layoff).

**Handling:**
- New CompensationRecord with lower CTC effective some date
- Going forward: pro-rated to new rate
- No retro (no negative arrears for past months)
- Statutory: PF contributions reduce going forward
- Communication: typically with employee acknowledgment

## EC33 — Notice period waiver by employer

Employer asks employee to leave immediately; waives notice from both sides.

**Handling:**
- F&F: no notice recovery, no notice buyout
- Just regular settlement
- Documentation: explicit waiver letter

## EC34 — Notice buyout by employer (involuntary termination)

Employer terminates without cause; pays 90 days' salary in lieu.

**Handling:**
- F&F includes NOTICE_BUYOUT one-time addition
- 90 days × daily rate
- Taxable as salary
- TDS applies
- PF on buyout: contentious; default no PF on buyout `[CA-REVIEW]`

## EC35 — Multiple FNF runs (corrections)

Initial F&F run had issues. Need to redo.

**Handling:**
- Original F&F status = 'reopened'
- New F&F run created, references original
- Differences computed
- Supplementary bank transfer (positive or negative)
- Communication to employee
- Audit chain

## EC36 — Salary advance recovery extending past separation

Pankaj got ₹50K advance in March; recovering ₹10K/month over 5 months. Resigns May.

**Handling:**
- May F&F: outstanding balance = 30K (5K already recovered in April; 5K in May regular; before F&F)
- F&F deductions: 30K recovery
- If F&F net < 30K: cap at F&F net; collect remainder via separate process / write-off per tenant policy

## EC37 — Pankaj's bonus reversed after declared

Tenant declared 8.33% bonus; later wants to reduce to minimum. Bonus already accrued in books.

**Handling:**
- Cannot reduce statutory minimum (legally protected)
- Performance bonus: can be revised pre-payment with proper communication
- If post-payment: clawback only if contractual; otherwise unrecoverable
- Update accruals; reverse if needed

## EC38 — Joining FY mid-month with prior employer

Pankaj joins April 15. Worked at prior employer Apr 1-14.

**Handling:**
- New employer: TDS computation considers prior employer income IF Pankaj submits Form 12B (declaration of prior salary)
- Without Form 12B: new employer assumes zero prior income; Pankaj responsible for adjustment via ITR
- HRMS: collect Form 12B at onboarding; integrate into TDS projection
- Form 16 from prior employer also referenced

`[CA-REVIEW]` Form 12B is critical. Most tenants ignore; leads to under-withholding and employee tax surprises.

## EC39 — Employee on LWP returns mid-month

Anjali on LWP April 1-10; returns April 11.

**Handling:**
- DailyAttendance per day:
  - Apr 1-10: status = LOP / unpaid leave
  - Apr 11-30: status = present
- workedDays = 14 (assuming working days), LOP days = 8
- Pro-rated earnings
- Statutory contributions on actual wages

## EC40 — Tenant changes payroll cycle mid-FY

Tenant moves from monthly to fortnightly mid-FY.

**Handling:**
- Migration period: handle carefully
- Old monthly periods: closed
- New fortnightly periods: started
- Communication to employees
- F&F mid-cycle if needed
- One-off transition month with prorated earnings
- Statutory filings continue at calendar month boundaries (PF/ESI deposit by 15th regardless of cycle)

## Cross-references

- All other files in `/03-payroll/` contain handling specifics
- [/02-attendance/](../02-attendance/) — attendance edge cases that feed payroll
- [/04-compliance/](../04-compliance/) — statutory implications
