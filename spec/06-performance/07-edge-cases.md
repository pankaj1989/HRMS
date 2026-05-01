# 07 — Performance Edge Cases

## Purpose

Edge cases for performance management. These break the simple "annual review → rating → bonus" model.

## EC1 — Mid-cycle joiner

Pankaj joined in October; annual cycle starts April. By March, he has 6 months tenure.

**Handling:**
- Include in cycle if 3+ months tenure (config)
- Pro-rated assessment (only what's observable)
- Lighter review form
- Goals: limited to last 6 months
- Bonus: pro-rated

## EC2 — Mid-cycle separator

Pankaj resigns in February; cycle ends in April.

**Handling:**
- Final assessment at separation (mini-review)
- Performance bonus pro-rated
- F&F includes prorated bonus
- No participation in standard cycle

## EC3 — Manager change mid-cycle

Pankaj's manager changes 6 months into cycle.

**Handling:**
- Both managers contribute to review
- Old manager: assessment of first 6 months
- New manager: assessment of next 6 months
- Aggregated by HR / skip-level
- Audit log

## EC4 — Cross-functional / matrix reporting

Pankaj reports to Engineering Manager (line) AND Product Manager (functional).

**Handling:**
- Both provide feedback
- Line manager makes final assessment
- Functional manager input weighted (e.g., 30%)
- Calibration considers both inputs

## EC5 — On long leave during cycle

Pankaj on 6-month sabbatical / medical leave.

**Handling:**
- Excluded from current cycle (no rating)
- Carry forward goals from prior cycle
- Bonus: pro-rated for months active
- No PIP if low performance pre-leave
- Re-engagement plan on return

## EC6 — On maternity / paternity leave

Maternity protections (MB Act):
- No PIP during ML
- Cannot demote / hold off promotion based on ML
- Bonus pro-rated only for active months
- Performance preserved at pre-ML levels (no penalty for ML duration)

`[CA-REVIEW]` Strict adherence to MB Act § 12 protections.

## EC7 — Disability / accommodations affecting performance

Employee on accommodations (reduced hours, modified duties).

**Handling:**
- Performance assessed against modified expectations
- Reasonable accommodation evidence
- Cannot penalize for accommodation usage
- Sensitive HR handling

## EC8 — Performance affected by personal circumstances

Pankaj's parent passed away; performance dipped for 3 months.

**Handling:**
- Manager judgment / sensitivity
- Often: rating same despite dip ("contextual underperformance, not normal pattern")
- HR support / EAP referral
- Possibly: defer formal review by 1 cycle

## EC9 — Manager bias against specific employee

Manager rates Pankaj harshly despite peer feedback being positive.

**Handling:**
- Calibration session catches outliers
- Skip-level review for confirmation
- HR review if disagreement raised
- Possible rating adjustment
- Coaching for manager

## EC10 — Two reportees at same level, same role, different ratings

Manager has 5 senior engineers, all delivered similar output, but rates 1 as 5 and others as 3.

**Handling:**
- Calibration questions: justification?
- Manager defends or adjusts
- Differentiation should reflect real differences
- Adjustments based on calibration

## EC11 — Self-rating drastically different from manager

Pankaj rates himself 5; manager rates 3.

**Handling:**
- Discrepancy flagged
- Discussion required between manager and reportee
- Manager rationale documented
- Unresolved: HRBP mediation
- Sometimes: gap in expectations communication

## EC12 — Goals unclear or impossible

Goals set without ambiguity OR market shifted, making them irrelevant.

**Handling:**
- Mid-cycle goal modification (with approval)
- Achievement assessed against revised goals
- "Stretch impossible" flagged for org learning

## EC13 — Refused PIP acknowledgment

Employee refuses to sign PIP acknowledgment.

**Handling:**
- Manager + HR meeting
- PIP plan still effective (unilateral; documented in policy)
- HR letter sent
- Refusal noted (legal documentation)
- PIP proceeds

## EC14 — PIP failure followed by long medical leave

Employee fails PIP; immediately takes long medical leave to delay termination.

**Handling:**
- Medical leave honored (legal requirement)
- Termination process paused
- Returns: implementation continues
- Limit: tenant policy (e.g., 6 months max paused)
- HR + Legal coordinate

## EC15 — Refusing performance discussion

Employee won't engage in 1:1 / review discussion.

**Handling:**
- Document attempts
- HRBP intervention
- Implication: review proceeds without employee input
- Pattern: signal of disengagement

## EC16 — Stack ranking conflict

Department forced to rank employees 1-N. Two equally good performers; one must be ranked higher.

**Handling:**
- Calibration helps differentiate (subtle factors)
- Tie-breaker rules (tenure, breadth of contribution)
- Discomfort in implementing
- `[OPEN]` Default: avoid forced ranking; use rating distribution if needed

## EC17 — Promotion blocked by budget

Pankaj qualifies for promotion; budget doesn't allow CTC increase.

**Handling:**
- Promotion deferred to next cycle (with commitment)
- Employee communication critical
- Risk: attrition
- Alternative: title promotion without significant CTC increase (rare)

## EC18 — Counter-offer leading to promotion

Pankaj has competing offer; tenant promotes + raises CTC to retain.

**Handling:**
- Out-of-cycle promotion
- Promotion criteria met regardless?
- HR caution: precedent ("threaten to leave to get raise")
- Documented as retention promotion

## EC19 — Demotion due to role change

Restructuring eliminates role; Pankaj moved to lower-level role.

**Handling:**
- Voluntary if possible
- Compensation typically maintained (or partially)
- Title change documented
- Communication careful (face-saving)

## EC20 — Departing manager's pending reviews

Manager resigns mid-cycle without completing reviews.

**Handling:**
- Skip-level manager completes reviews
- New manager (if assigned) provides input from limited window
- HR-facilitated to ensure fairness
- Documentation thorough

## EC21 — Calibration session reveals sensitive pattern

Bias against specific demographic discovered during calibration.

**Handling:**
- Aggregate analysis only
- HR investigates with affected manager(s)
- Diversity training
- Process improvements
- No individual accusations without due process

## EC22 — Probation extension

New hire's probation review inconclusive; extended for 3 more months.

**Handling:**
- Documented reasons
- Specific improvement targets
- Reduced flexibility on extension (cannot extend repeatedly)
- HR + Manager + Employee aligned
- Final outcome at end of extended probation

## EC23 — Confirmation rejected (probation fail)

End of probation: manager recommends not confirming.

**Handling:**
- Termination during probation easier (typically 1-month notice)
- Documented reasons
- F&F per probation contract
- Less compensation than post-confirmation termination

## EC24 — Performance bonus deferral

High performance bonus eligibility but tenant cash flow issues.

**Handling:**
- Communication with employee
- Deferred payment with interest
- Or: stock / equity
- Documentation as agreed delayed payment

## EC25 — Reviewer conflict of interest

Reportee is reviewer's relative.

**Handling:**
- Disclose at relationship onset
- Skip-level provides primary review
- Direct manager input only secondary

## Cross-references

All other files in `/06-performance/` reference handling logic.
