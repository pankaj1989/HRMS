# 02 — Decision Log

## Purpose

All `[DECISION]` items locked in across the spec. Each decision records:

- The decision made
- Rationale
- Date locked
- Owner
- Reversibility (can it be changed easily later?)
- Affected files

This log is the source of truth for "why does the spec say X?" — useful for new team members, audit trails, and revisits.

## Architectural decisions

### D1 — Multi-entity from day one

**Decision**: Spec assumes multi-entity tenancy from v1. Single-entity tenants are a special case with `entities.length === 1`.

**Rationale**: Indian SMEs commonly have 2-5 entities (factory + sales office + R&D LLP). Retrofitting multi-entity later is expensive. Single-entity tenants pay no complexity penalty.

**Alternatives considered**: Single-entity v1, multi-entity v2. Rejected — the cost of retrofit is severe.

**Affects**: Every schema includes `entityId`. RBAC scoped by entity. Reports default to entity scope.

**Reversibility**: Low. Once data model uses `entityId`, removing it is breaking.

### D2 — Both white-collar and blue-collar in v1

**Decision**: Ship full support for both employee categories in v1.

**Rationale**: Indian SMEs frequently have both (factory floor + corporate office). Forcing tenants to use two systems defeats the value proposition. Most "Indian HRMS" systems do one well; doing both is the differentiation.

**Alternatives considered**: White-collar v1, blue-collar v2. Rejected — limits market.

**Affects**: All modules have `[BLUE-COLLAR]` and `[WHITE-COLLAR]` tags. Attendance has shift management. Payroll handles minimum wage statutorily. Compliance includes Factories Act, CLRA, MB Act.

**Reversibility**: Medium. Adding blue-collar later requires schema changes (shifts, allocations) but doesn't break existing.

### D3 — Indian-only

**Decision**: Hard-code Indian statutory rules. No multi-country abstraction.

**Rationale**: Indian compliance is the moat. Generalizing the engine for other countries adds 10× complexity without 10× value. SaaS for Indian SMEs is the focus.

**Alternatives considered**: Multi-country abstraction layer. Rejected — premature.

**Affects**: All compliance modules hard-code Indian rules. Currency Decimal128 in INR. Date formats DD-MM-YYYY. Statutory rule engine evaluates per-state Indian rules.

**Reversibility**: Low. Re-architecting for multi-country is a v3+ exercise.

### D4 — MongoDB as primary store

**Decision**: MongoDB for OLTP and lighter OLAP. Read models for analytical queries. No separate SQL warehouse in v1.

**Rationale**: Aligns with tenant's stack (Bilpaid, etc.). Document model fits HR data well (employees with nested employment, comp, KYC). Aggregation pipeline handles 90% of reports. Simplicity in v1.

**Alternatives considered**: PostgreSQL primary, MongoDB for documents only. Considered but adds dual-write complexity.

**Affects**: All schemas use MongoDB types (ObjectId, Decimal128, encrypted strings). Aggregation pipelines for reports. Change streams for read model sync.

**Reversibility**: Low. Migrating data store post-launch is multi-year.

### D5 — Money as Decimal128 or paise integers

**Decision**: All monetary values stored as `Decimal128` (preferred) or integer paise. NEVER `number` (floating-point).

**Rationale**: Float arithmetic causes 0.1 + 0.2 ≠ 0.3 errors; in payroll context, this is unacceptable (regulatory + employee trust).

**Alternatives considered**: Number with rounding at display. Rejected — accumulating errors.

**Affects**: Every monetary field across all schemas. Payroll engine uses BigDecimal-style arithmetic.

**Reversibility**: Very low. Pervasive throughout codebase.

### D6 — Workflow engine: build, not buy (v1)

**Decision**: Build lightweight workflow engine in v1. Consider Temporal/Camunda for v2 if complex orchestration needed.

**Rationale**: HRMS workflows are mostly approval chains with conditions. Heavy BPM platforms add operational burden. Simple state machine + event handlers covers 95%.

**Alternatives considered**: Temporal.io, Camunda. Both excellent but overkill for v1.

**Affects**: `/08-workflow/` defines simple engine. All modules integrate via callbacks.

**Reversibility**: Medium. Engine can be replaced in v2 with adapter layer.

### D7 — PWA for v1, React Native for v2

**Decision**: Mobile experience starts as PWA in v1; React Native (with web code sharing) in v2; Native for performance-critical paths in v3.

**Rationale**: PWA ships fast (4-6 weeks). RN unlocks better offline + biometric + push. Native reserved for hot paths.

**Alternatives considered**: Native v1. Rejected — too slow to ship.

**Affects**: `/07-ess-mobile/` describes PWA-first architecture. APIs designed for both web + mobile.

**Reversibility**: High. PWA → RN is incremental migration.

## Statutory engineering decisions

### D8 — Statutory rule engine versioning

**Decision**: All statutory rules versioned by date. Historical periods always evaluate against the rules in force at that time.

**Rationale**: Compliance retrospective changes (e.g., recomputing past periods) must use historical rules. Hard-coding current rules makes retrospective wrong.

**Affects**: `/00-foundations/01-rule-engine.md`, all compliance calculations.

**Reversibility**: Low.

### D9 — Tax regime defaults to new

**Decision**: Default tax regime for new employees is new (post-2020 simplified). Old retained as opt-in.

**Rationale**: New regime is government default per Finance Act 2023+. Most employees benefit. Lower friction.

**Note**: `[CA-REVIEW]` whether old regime even available under IT Act 2025 — `[OPEN]` CR2.

**Affects**: TDS engine, declaration forms, payslips.

**Reversibility**: High (just a default).

### D10 — PF wage basis: tenant-config, default basic-da-only

**Decision**: PF wage calculation basis is tenant-configurable. Default `basic-da-only` for FY 26-27 unless state has notified Code on Wages Rules.

**Rationale**: 2019 Supreme Court ruling + Code on Wages 50% rule create ambiguity. Conservative default reduces under-contribution risk; tenants needing Wage Code basis can opt in.

**Note**: `[CA-REVIEW]` per state, per tenant. `[OPEN]` CR3.

**Affects**: `/03-payroll/05-payroll-engine.md`, `/04-compliance/01-pf-and-uan.md`.

**Reversibility**: High (config flag).

### D11 — Form 16 generation: post-FY only

**Decision**: Form 16 generated only after FY close (after Q4 24Q filing).

**Rationale**: Standard practice. Earlier issuance = incorrect data.

**Affects**: `/04-compliance/03-tds-and-income-tax.md`.

**Reversibility**: High.

### D12 — Gratuity continuous service: 4 years 240 days

**Decision**: Gratuity entitlement at 5 years (or 4 years 240 days for last year per Madras HC line). Continuous service rule.

**Rationale**: Court-established interpretation. Conservative approach favors employee (lower legal risk).

**Note**: `[CA-REVIEW]` for new SS Code 2020 (gig + fixed-term gratuity).

**Affects**: `/04-compliance/06-gratuity.md`, `/03-payroll/09-fnf-settlement.md`.

**Reversibility**: Medium (formulae changes).

## Module decisions

### D13 — Recruitment included in base

**Decision**: Recruitment module included in base license (not paid add-on).

**Rationale**: Indian SMEs typically don't budget separately for ATS. Including recruitment increases stickiness. Lightweight v1 keeps it cheap to operate.

**Alternatives considered**: Paid add-on. Rejected — would limit adoption.

**Affects**: `/05-recruitment/`, pricing page.

**Reversibility**: High (pricing change).

### D14 — Performance: hybrid annual + continuous default

**Decision**: Default PMS = formal annual cycle + lightweight quarterly check-ins.

**Rationale**: Pure annual = stale. Pure continuous = no anchor. Hybrid is industry best practice.

**Affects**: `/06-performance/`.

**Reversibility**: High (tenant config).

### D15 — 5-point rating scale default

**Decision**: 5-point rating scale (Outstanding / Exceeds / Meets / Needs Improvement / Unsatisfactory).

**Rationale**: Industry standard. Sufficient differentiation. Tenant can override to 4-point or 3-point.

**Affects**: `/06-performance/04-rating-and-calibration.md`.

**Reversibility**: High.

### D16 — Forced distribution NOT enforced by default

**Decision**: Bell curve / forced distribution is configurable but NOT default.

**Rationale**: Modern HR thinking moves away from forced ranking. Tenants who want it can enable.

**Affects**: `/06-performance/`.

**Reversibility**: High.

### D17 — Email approval via signed token

**Decision**: Email-based approval supported via short-lived signed JWT tokens.

**Rationale**: Massive UX win for approvers. Token-based security is industry standard.

**Affects**: `/08-workflow/01-workflow-engine.md`.

**Reversibility**: High.

### D18 — Single mobile app, role-based UI

**Decision**: One mobile app for all users. Role-based UI toggle (manager vs employee view).

**Rationale**: Reduces ops burden. Single code base. Common pattern (Workday, etc.).

**Affects**: `/07-ess-mobile/`.

**Reversibility**: Medium.

### D19 — Encryption: KYC and bank fields encrypted at rest

**Decision**: PAN, Aadhaar, Bank A/c stored as `EncryptedString` (envelope encryption with tenant KMS key).

**Rationale**: DPDPA compliance. Database breach doesn't expose these.

**Affects**: All schemas with sensitive fields.

**Reversibility**: Low (data migration).

### D20 — Audit log: hash-chained, immutable

**Decision**: Audit log entries hash-chained (current entry references prior entry's hash). Immutable.

**Rationale**: Tamper-evident. Critical for legal / regulatory audits.

**Affects**: `/00-foundations/04-audit-and-compliance-hooks.md`.

**Reversibility**: Low.

## Operational decisions

### D21 — Payroll cycle: tenant choice (1st-31st default)

**Decision**: Payroll cycle is tenant-configured. Default 1st-31st calendar month. 26th-25th supported for blue-collar.

**Rationale**: Most Indian SMEs use calendar month. Some manufacturing units use 26th-25th historical reasons.

**Affects**: `/03-payroll/`, `/02-attendance/`.

**Reversibility**: Medium (cycle change mid-year is disruptive).

### D22 — F&F SLA: 2 days default, configurable

**Decision**: Default F&F SLA = 2 days. Tenant can extend to up to 7 days.

**Rationale**: Wage Code mandates timely settlement. 2 days aspirational. 7 days realistic in practice.

**Note**: `[OPEN]` CR4 — verify realistic.

**Affects**: `/03-payroll/09-fnf-settlement.md`.

**Reversibility**: High.

### D23 — Probation: 3-6 months default, configurable

**Decision**: Standard probation 3 months (junior) to 6 months (mid/senior). Tenant config.

**Affects**: `/01-employee/02-employment-record.md`.

**Reversibility**: High.

### D24 — Notice period: tenant policy

**Decision**: Notice period defined per employment contract. Common: 60-90 days post-confirmation; 30 days probation.

**Affects**: Throughout.

**Reversibility**: High.

### D25 — Document retention: 7 years post-separation default

**Decision**: Default retention for separated employee data = 7 years. Tenant can extend.

**Rationale**: IT Act audit retention typically 6-7 years. PF / ESI: longer in some cases. 7 years covers most.

**Affects**: All modules.

**Reversibility**: High (config).

## Process decisions

### D26 — Spec versioning: SemVer

**Decision**: Spec follows SemVer-like versioning (0.x for pre-launch, 1.0 at launch).

**Rationale**: Standard practice. Breaking changes increment major; additions minor.

### D27 — All `[OPEN]` items consolidated in `01-open-questions.md`

**Decision**: Maintain single source for unresolved questions. Track resolution.

**Affects**: This appendix.

### D28 — `[CA-REVIEW]` items separate from `[OPEN]`

**Decision**: Statutory items needing CA opinion tagged `[CA-REVIEW]`. Listed in `04-ca-review-checklist.md`.

**Affects**: This appendix.

## How to add new decisions

When a decision is made (during implementation, post-CA review, etc.):
1. Lock decision with `[DECISION]` tag in spec
2. Add to this log with rationale
3. Update affected files
4. Mark related `[OPEN]` as resolved in `01-open-questions.md`

## Cross-references

- [01-open-questions.md](./01-open-questions.md) — pending questions
- [04-ca-review-checklist.md](./04-ca-review-checklist.md) — CA opinion items
- [/README.md](../README.md) — main spec navigation
