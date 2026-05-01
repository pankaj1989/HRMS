# 01 — Open Questions (Decision Needed)

## Purpose

Every `[OPEN]` flag in the spec consolidated. These require tenant decision, CA opinion, or product team decision before / during implementation.

Organized by category with severity (CRITICAL / HIGH / MEDIUM / LOW) and recommended decision direction.

## CRITICAL — Must decide before launch

### CR1 — IT Act 2025 tax slabs

**Question**: Confirm exact tax slabs for FY 2026-27 under IT Act 2025 (effective Apr 1, 2026).

**Why critical**: Drives entire TDS engine. Wrong slabs = wrong TDS = legal exposure.

**Recommendation**: Lock with CA opinion + Finance Act 2025 reading.

**Status**: PENDING — assumed slabs `[ASSUMPTION]` 0/4L/8L/12L/16L/20L/24L+ at 0/5/10/15/20/25/30%. CA must confirm.

### CR2 — Old regime under IT Act 2025

**Question**: Is old regime retained under IT Act 2025 or fully phased out?

**Why critical**: If retained, entire HRA / 80C / 80D logic still applies. If phased out, simplification.

**Recommendation**: CA confirmation. Default: retained as option.

**Status**: PENDING

### CR3 — PF wage basis default (Wage Code post-notification)

**Question**: Default `pfWageBasis`: `basic-da-only` (conservative, pre-2019 SC ruling) or `wage-code-broad` (post-Wage Code 50% rule)?

**Why critical**: Drives PF contribution calculation. Wrong basis = legal exposure (excess or deficit contribution).

**Recommendation**: Default `basic-da-only` for FY 26-27 unless state has clearly notified Code on Wages Rules. Tenant config to override.

**Status**: PENDING

### CR4 — F&F 2-day SLA realistic

**Question**: Is the 2-day F&F SLA achievable in practice for SME tenants?

**Why critical**: Whole F&F design depends on this commitment (early clearance, pre-computed estimate, etc.). Failure to meet SLA = legal exposure (Wage Code mandates timely settlement).

**Recommendation**: Tenant configurable; 2-day default but allow extension to 7 days with reason.

**Status**: PENDING

### CR5 — Encashment exemption formula post-2023

**Question**: Section 10(10AA) leave encashment exemption — confirm calculation under Finance Act 2023+ amendments (₹25 lakh cap for non-government employees per CBDT notification).

**Recommendation**: CA review.

**Status**: PENDING

### CR6 — Form 16 schema under IT Act 2025

**Question**: Are there structural changes to Form 16 / Form 12BA / Form 24Q formats under IT Act 2025?

**Recommendation**: Wait for CBDT notifications + verify with CA.

**Status**: PENDING

## HIGH — Important; decide early

### H1 — Code transition rule defaults

**Question**: When state hasn't notified Code Rules, default to old (subsumed acts) or new (Codes)?

**Recommendation**: Old until state notification. Per-state per-rule versioning.

### H2 — Auto-deposit to authorities via API

**Question**: Should HRMS auto-pay PF/ESI/TDS challans, or only prepare files for HR to upload?

**Recommendation**: HR-triggered; HRMS prepares, doesn't auto-pay. Auto-pay too high-stakes.

### H3 — Multi-state employee PT split

**Question**: When employee works across states mid-month, PT split or full deduction in primary state?

**Recommendation**: Full deduction in state where employee works at end of month. Per-state rule check.

### H4 — Gig worker gratuity under SS Code

**Question**: Implementation of SS Code 2020 § 53(2) gratuity for fixed-term contract workers — pro-rata calculation.

**Recommendation**: CA review per state notifications.

### H5 — Payroll for blue-collar 26th-25th cycle

**Question**: 26th-25th cycle: how to handle "March extra" and statutory deadlines aligned to calendar months?

**Recommendation**: Tenant choice; default to monthly cycle. 26th-25th supported but with constraints.

### H6 — Multi-tenant on mobile

**Question**: Same employee with accounts at multiple tenants (consultant pattern). Single app or separate?

**Recommendation**: Single app with tenant switcher.

### H7 — Recruitment as paid add-on

**Question**: Should recruitment module be paid add-on or included in base?

**Recommendation**: Include in base; lightweight v1.

### H8 — PMS for blue-collar

**Question**: Full PMS or simplified for blue-collar?

**Recommendation**: Simplified version (supervisor + attendance based); skip formal review cycle.

### H9 — Forced distribution / bell curve

**Question**: Default to enforce or not?

**Recommendation**: Tenant config; default not enforced. Calibration suggested.

### H10 — Rating scale default

**Question**: 5-point or 4-point default?

**Recommendation**: 5-point default; tenant configurable to 4 or 3.

### H11 — Old regime mid-year switch

**Question**: Allow employees to switch tax regime mid-year?

**Recommendation**: No (per IT department guidance); only at FY start. Tenant config.

### H12 — Anonymous 360 feedback

**Question**: Default anonymous or named?

**Recommendation**: Anonymous for peers; named for managers.

## MEDIUM — Defer to v2 or tenant config

### M1 — Decimal precision for balance days

**Question**: Half-day allowed (0.5)? Quarter-day (0.25)?

**Recommendation**: Half-day (0.5); not quarter.

### M2 — Accrual on probation extension

**Question**: Continue accrual during probation extension or pause?

**Recommendation**: Continue (transparency); tenant config.

### M3 — Religion-specific holidays

**Question**: Per-employee religion-based holiday calendar?

**Recommendation**: V1: tenant location-based; v2: opt-in per-employee.

### M4 — Custom tenant leave types

**Question**: How many custom leave types per tenant?

**Recommendation**: Up to 10 custom leave types.

### M5 — Unlimited PTO

**Question**: Support unlimited PTO model (no balance tracking)?

**Recommendation**: Yes in v2; rare in Indian SME context.

### M6 — Time-off-in-lieu

**Question**: Comp-off model variations (single day worked = single day off)?

**Recommendation**: Tenant config; default 1:1.

### M7 — Leave during notice period

**Question**: Allow EL/CL during notice or block?

**Recommendation**: Tenant config; default allow with HR approval.

### M8 — 30-second dedup window for biometric

**Question**: 30-second debounce on biometric punches; tenant config?

**Recommendation**: Default 30s; configurable 5-60s.

### M9 — Auto-renewal of registrations

**Question**: HRMS should remind or auto-file registration renewals?

**Recommendation**: Remind; manual file in v1.

### M10 — Inter-entity transfers gratuity

**Question**: Continuity of service across entities for gratuity?

**Recommendation**: Default no (separate establishments); tenant config.

### M11 — Group gratuity insurance vs direct

**Question**: Tenant declares; HRMS supports both.

**Recommendation**: Both; tenant declares at setup.

### M12 — Maternity adoption beyond 3 months

**Question**: Extend voluntary beyond statutory 3 months?

**Recommendation**: Yes; tenant policy can extend.

### M13 — Same-sex partner / non-binary parent leave

**Question**: Inclusive policies?

**Recommendation**: Tenant policy supersedes (more inclusive); statutory minimum preserved.

### M14 — Recruitment: anti-discrimination filtering

**Question**: Enforce no decisions based on protected attributes?

**Recommendation**: Audit log of decisions; v2 ML-based bias detection.

### M15 — BGV cost paid by

**Question**: Employer / candidate / split?

**Recommendation**: Default employer; tenant config.

### M16 — Counter-offer detection

**Question**: ML-based detection of counter-offer risk during pre-joining?

**Recommendation**: V2.

### M17 — Calibration session voluntary

**Question**: Voluntary discussion or mandatory ratings change?

**Recommendation**: Tenant config; default voluntary with strong nudges.

### M18 — AI-suggested rating

**Question**: ML rating suggestion based on goals + feedback + attendance?

**Recommendation**: V2; advisory not authoritative.

### M19 — Mid-cycle calibration

**Question**: Add mid-cycle calibration check?

**Recommendation**: Optional in v2.

### M20 — Public-facing rating distribution

**Question**: Show org-wide aggregated ratings?

**Recommendation**: Yes at aggregate; never individual.

### M21 — Promotion budget visibility

**Question**: Should HRMS show tenant promotion budget %?

**Recommendation**: Tenant policy; visible to leadership.

### M22 — Skip-level promotion

**Question**: Allow jumping 2 levels?

**Recommendation**: Yes; senior approval required.

### M23 — Auto-attendance via geofence

**Question**: Auto check-in when entering office geo-fence?

**Recommendation**: Opt-in v2.

### M24 — Leave conflict prevention

**Question**: Block if > 50% of team on leave?

**Recommendation**: Warning, not block.

### M25 — Multilingual support

**Question**: Hindi v1; regional v2?

**Recommendation**: English + Hindi in v1; Tamil/Telugu/Marathi/Kannada/Bengali/Gujarati in v2.

### M26 — In-app chat / DM

**Question**: Build internal communication?

**Recommendation**: Out of v1; integrate with Slack/Teams in v2.

### M27 — AI-based document recognition

**Question**: Extract amount from receipt automatically?

**Recommendation**: V2.

### M28 — Pre-filled HRA receipts

**Question**: Recurring template for monthly rent?

**Recommendation**: Yes; recurring template.

### M29 — Sensitive ticket anonymity

**Question**: Pseudo-anonymous (HR head only sees identity)?

**Recommendation**: Tenant config.

### M30 — Knowledge base maintenance

**Question**: Who creates / updates articles?

**Recommendation**: HR ops + community wiki for v2.

## LOW — Nice to have / experimental

### L1 — Cross-tenant candidate visibility

Marketplace for talent pool. NO; privacy concerns.

### L2 — Auto-tag candidates by ML

V2 with caution; bias risk.

### L3 — Candidate self-service portal

V2; v1 email.

### L4 — Cross-tenant aggregation (consultants)

Out of v1.

### L5 — Sports / wellness portal

Out of scope.

### L6 — AR features (virtual office tour)

Out of scope.

### L7 — Watch / wearable app

V3.

### L8 — Voice assistant

V3.

### L9 — Dashboard sharing by URL

V2.

### L10 — Custom widget development

V3.

### L11 — TV mode (large display)

V2.

### L12 — Anonymous engagement surveys

V2.

### L13 — Cross-tenant benchmarking

V3 with explicit consent.

### L14 — AI-suggested approval

V3 (workflow).

### L15 — Smart timing for distributions

V3.

### L16 — Workflow simulation

V2.

### L17 — Real-time event streaming

V3.

### L18 — Industry-specific bundles

V2.

## How to manage open questions

For each open question:
1. Tag in spec with `[OPEN]`
2. Add to this file with category + recommendation
3. Track decision in `02-decision-log.md` once made
4. Update spec with `[DECISION]` flag and date
5. Implementation can proceed with default; revisit per priority

## Cross-references

- All spec files contain `[OPEN]` flags
- [02-decision-log.md](./02-decision-log.md) — locked decisions
- [04-ca-review-checklist.md](./04-ca-review-checklist.md) — for CA opinion
