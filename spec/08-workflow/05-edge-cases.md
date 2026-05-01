# 05 — Workflow Edge Cases

## Purpose

Edge cases for workflow engine.

## EC1 — Approver no longer in role

Pankaj approved as Engineering Manager. By the time approval reaches him, he's promoted to Director (different role).

**Handling:**
- Approver resolution evaluated at workflow start (not at decision time)
- If role changed mid-flight: existing approval still valid (Pankaj is the named approver)
- New requests use new role-holder
- Audit log shows role at time of approval

## EC2 — Approver leaves company

Pankaj resigns mid-flight on a workflow he's approving.

**Handling:**
- Active workflows with him as pending approver: auto-escalated to skip-level / replacement
- Audit log
- HR notification

## EC3 — Requester resigns mid-flight

Pankaj applies for leave; resigns next day.

**Handling:**
- Existing workflow continues (manager / HR may reject given new context)
- F&F workflow takes priority
- Audit log

## EC4 — Workflow timeout / orphaned

Approver inactive; never responds.

**Handling:**
- SLA escalation triggers
- Auto-escalate per policy
- Eventually: HR override or auto-reject (last resort)

## EC5 — Concurrent workflows on same entity

Two leave requests by same employee for overlapping dates.

**Handling:**
- Optimistic concurrency at WorkflowInstance level
- Application-level validation (leave overlap check) prevents
- One rejected before approval

## EC6 — Workflow loop (re-routes back)

Approver A reverts to requester; requester resubmits; gets routed back to A.

**Handling:**
- Counter for revert-resubmit cycles
- Limit: 3 cycles before manual intervention required
- Pattern flagged for HR

## EC7 — Workflow definition changed mid-flight

Tenant updates leave workflow while instances pending.

**Handling:**
- Pinned version: existing instances complete with old config
- New instances use new config
- Audit shows version per instance

## EC8 — Approver impersonation

Audit shows Pankaj approved at 2am while he was on flight.

**Handling:**
- Audit log captures IP, device, location
- Anomaly detection
- HR investigation
- Token / credential security review

## EC9 — Mass approval (admin acting at scale)

HR Manager approving 100 leaves at once (e.g., team-wide off).

**Handling:**
- Bulk approval supported
- Each approval audited individually
- Rate limiting if > 1000 in short time

## EC10 — Cross-entity workflow

Employee in entity A wants to transfer to entity B.

**Handling:**
- Workflow spans both entities
- Approvers from both
- Audit captured in both entity logs

## EC11 — Approver in vacation; no delegation

SLA breach because approver on unannounced leave.

**Handling:**
- Standard SLA escalation
- Auto-escalate to skip-level
- HR notified
- Coaching for delegation setup

## EC12 — Email approval link expired

Approver clicks email link 2 weeks later; token expired.

**Handling:**
- Redirect to login + workflow page
- Approve from app
- New token if needed

## EC13 — Email link forwarded

Approver forwards approval email; recipient clicks.

**Handling:**
- Token bound to approver email/identity
- Recipient prompted to login
- Cannot approve as someone else

## EC14 — Unicode / RTL in approval comments

Comment in Tamil / Hindi / Arabic.

**Handling:**
- Unicode storage (always)
- RTL detection for display
- No truncation issues

## EC15 — Conditional escape hatch

Approval needed only if amount > X. Amount changes mid-flight.

**Handling:**
- Conditions evaluated at workflow start
- If amount changes during pending: tenant policy
  - Option 1: continue (snapshot at start)
  - Option 2: re-evaluate (some flows allow)

## EC16 — Tenant admin / system override

HR Head force-approves stuck workflow.

**Handling:**
- Special "override" capability
- Reason required (mandatory comment)
- Audit log clearly marks override
- Notification to original approver

## EC17 — Webhook delivery failure

Module callback fails (transient error).

**Handling:**
- Retry with exponential backoff (3 attempts)
- After failure: dead-letter queue
- Workflow state preserved
- Manual intervention possible

## EC18 — Time zone confusion

Approver in different time zone; SLA computed in tenant tz.

**Handling:**
- All workflow times in UTC
- Display in user's time zone
- SLA computed in tenant tz
- Audit log shows multiple zones if relevant

## EC19 — Approver shares device / account

2 people use same phone / account.

**Handling:**
- HRMS doesn't enforce uniqueness; relies on company policy
- Audit log captures device fingerprint
- Patterns analyzed

## EC20 — Workflow has no eligible approver

Resolution returns empty (e.g., no employee with role in entity).

**Handling:**
- Workflow blocked at creation; error
- Admin notified to fix role assignment
- Until fixed: action cannot proceed

## EC21 — Cyclic delegation chain

A delegates to B; B delegates to A.

**Handling:**
- Detection on delegation creation
- Block creation
- Inform user of cycle

## EC22 — Self-approval (approver is requester)

Employee is in the chain (e.g., applying as own manager).

**Handling:**
- Auto-skip with audit
- Or route to next-level
- Tenant config

## EC23 — Approver retired but profile active

Old workflow lists retired approver who hasn't been deactivated.

**Handling:**
- Detect: approver's employment status = separated
- Auto-route to replacement (if defined) or skip-level
- HR cleanup needed

## EC24 — Massive escalation cascades

Critical urgency triggers escalations to many people simultaneously.

**Handling:**
- Rate limiting on notifications
- Don't spam everyone
- Targeted escalation
- Aggregated reminders

## EC25 — Workflow data privacy

Approver sees salary data they shouldn't.

**Handling:**
- Field-level RBAC at workflow display
- Sensitive fields masked unless approver has permission
- Audit log of viewing
- Need-to-know principle

## Cross-references

All other workflow files contain handling logic.
- [/00-foundations/03-identity-and-rbac.md](../00-foundations/03-identity-and-rbac.md) — RBAC
- [/00-foundations/04-audit-and-compliance-hooks.md](../00-foundations/04-audit-and-compliance-hooks.md) — audit
