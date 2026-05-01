# HRMS Functional Specification

> Comprehensive functional specification for an Indian-compliance-first HRMS platform.
> Multi-entity, multi-tenant SaaS. White-collar primary, blue-collar fully supported.
> Built on Next.js 15 + Express/TypeScript + MongoDB + BullMQ + GraphQL.

---

## Document conventions

This spec is organized as a folder of markdown files, one concern per file, navigable in any text editor, IDE, or via GitHub/GitLab rendering. Mermaid diagrams render in GitHub, Obsidian, VS Code (with extension), and most modern markdown viewers.

### Tag legend

Throughout the spec, the following inline tags appear:

| Tag | Meaning |
|---|---|
| `[VERIFY]` | A specific number, format, or rule that I am not 100% certain about. Must be confirmed against primary source (EPFO circular, Income Tax notification, NSDL RPU manual, state government PT slab notification) before code is written. |
| `[ASSUMPTION]` | A product / business decision I have made on your behalf because the strategy doc didn't specify. You must accept, reject, or refine. |
| `[DECISION]` | A point where two reasonable approaches exist and I picked one with a stated rationale. |
| `[v1]` `[v2]` `[v3]` | Scoping marker. v1 = Months 0–9, v2 = Months 10–18, v3 = Months 19–30. Untagged items are v1 by default. |
| `[BLUE-COLLAR]` | Specific to factory / retail / field workforce — different rules, formats, or workflows. |
| `[WHITE-COLLAR]` | Specific to office / IT / services workforce. |
| `[CA-REVIEW]` | Statutory interpretation that should be confirmed by a Chartered Accountant or labor lawyer before going live. |
| `[OPEN]` | Open question that needs business decision from you. |

### Statutory references

All statutory rules in this spec reference Indian law as of April 2026:
- Income Tax Act, 1961 (and Income Tax Act, 2025, effective April 1, 2026 for FY 2026–27)
- Employees' Provident Funds & Miscellaneous Provisions Act, 1952
- Employees' State Insurance Act, 1948
- Payment of Gratuity Act, 1972
- Payment of Bonus Act, 1965
- Payment of Wages Act, 1936
- Code on Wages, 2019
- Industrial Relations Code, 2020
- Code on Social Security, 2020
- Occupational Safety, Health and Working Conditions Code, 2020
- Maternity Benefit Act, 1961 (as amended 2017)
- Contract Labour (Regulation and Abolition) Act, 1970
- Factories Act, 1948
- Shops & Establishments Acts (state-specific)
- State Professional Tax Acts
- State Labour Welfare Fund Acts

The four Labour Codes (Wage, IR, SS, OSH) consolidated 29 central labour laws and were notified in November 2025. Some provisions are in force, some require state-level rules to be operational. Where the spec touches code-vs-old-act differences, I flag explicitly.

### Schema notation

Schemas are written as TypeScript interfaces with MongoDB-friendly types:

```typescript
interface Example {
  _id: ObjectId;                    // MongoDB primary key
  tenantId: ObjectId;               // multi-tenant isolation
  entityId: ObjectId;               // multi-entity isolation
  // ... domain fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;              // user who created
  updatedBy: ObjectId;
  version: number;                  // optimistic concurrency
  isDeleted: boolean;               // soft delete
}
```

Common types:
- `ObjectId` — MongoDB ObjectId
- `Decimal128` — for monetary values; never use `number` for money
- `ISODate` — date as ISO 8601 string when serialized
- `Money` — `{ amount: Decimal128, currency: 'INR' }`

### Money handling rule

**All monetary values are stored as paise (integer) or Decimal128 with explicit currency.** Never as JavaScript `number`. Floating-point math on currency leads to ₹0.01 errors that break PF reconciliation and statutory filings. Display layer converts to rupees with two decimals. This is a hard rule throughout the spec.

---

## Table of contents

### Phase 1 — Foundations & Employee (this delivery)

#### `/00-foundations/`

1. [00-overview.md](./00-foundations/00-overview.md) — Architectural philosophy, design principles, what this spec covers
2. [01-multi-tenancy.md](./00-foundations/01-multi-tenancy.md) — Tenant isolation, data residency, query enforcement
3. [02-multi-entity.md](./00-foundations/02-multi-entity.md) — Legal entity model, statutory registration handling
4. [03-identity-and-rbac.md](./00-foundations/03-identity-and-rbac.md) — Users, roles, permissions, field-level security
5. [04-audit-and-compliance-hooks.md](./00-foundations/04-audit-and-compliance-hooks.md) — Audit log, change tracking, evidence pipeline
6. [05-data-model-conventions.md](./00-foundations/05-data-model-conventions.md) — Schema patterns, time-versioning, soft deletes
7. [06-statutory-rules-engine.md](./00-foundations/06-statutory-rules-engine.md) — Versioned compliance rules architecture
8. [07-glossary.md](./00-foundations/07-glossary.md) — Every acronym used in this spec, defined

#### `/01-employee/`

1. [00-overview.md](./01-employee/00-overview.md) — Employee module purpose, scope, integration points
2. [01-employee-master-schema.md](./01-employee/01-employee-master-schema.md) — The Employee record, all fields, indexes
3. [02-employment-record.md](./01-employee/02-employment-record.md) — Employment history, designations, transfers
4. [03-compensation-record.md](./01-employee/03-compensation-record.md) — CTC structure, revisions, retros
5. [04-statutory-ids.md](./01-employee/04-statutory-ids.md) — PAN, Aadhaar, UAN, ESI#, etc. — encryption and validation
6. [05-documents-and-kyc.md](./01-employee/05-documents-and-kyc.md) — Document collection, BGV, e-sign integration
7. [06-lifecycle-state-machine.md](./01-employee/06-lifecycle-state-machine.md) — Hire to retire, every transition, every workflow
8. [07-edge-cases.md](./01-employee/07-edge-cases.md) — 30+ edge cases with handling specs
9. [08-white-vs-blue-collar-differences.md](./01-employee/08-white-vs-blue-collar-differences.md) — Field-by-field differences

### Phase 2 — Attendance & Leave (this delivery)

#### `/02-attendance/`

1. [00-overview.md](./02-attendance/00-overview.md) — Module purpose, DailyAttendance canonical record, pipeline
2. [01-attendance-capture.md](./02-attendance/01-attendance-capture.md) — Capture sources, AttendanceEvent schema, deduplication, geo-fencing, biometric
3. [02-shifts-and-rosters.md](./02-attendance/02-shifts-and-rosters.md) — Shifts (cross-midnight, breaks, grace), Rosters, RosterPolicy, weekly off, holiday calendars
4. [03-leave-types-and-policies.md](./02-attendance/03-leave-types-and-policies.md) — Canonical leave catalog, LeavePolicy, LeaveApplication flow, sandwich rule
5. [04-leave-accrual-engine.md](./02-attendance/04-leave-accrual-engine.md) — 5 accrual methods, pro-ration, FY rollover, encashment under § 10(10AA)
6. [05-overtime-engine.md](./02-attendance/05-overtime-engine.md) — OT eligibility, Factories Act § 59 (2× rate), worked example, statutory caps
7. [06-regularization-workflow.md](./02-attendance/06-regularization-workflow.md) — Missed-punch correction, 12 regularization types, bulk regularization
8. [07-statutory-attendance-registers.md](./02-attendance/07-statutory-attendance-registers.md) — Form A/B (Wage Code), Form 25, Form 11, CLRA Forms, Inspection Pack
9. [08-edge-cases.md](./02-attendance/08-edge-cases.md) — 40 edge cases worked
10. [09-blue-collar-shift-patterns.md](./02-attendance/09-blue-collar-shift-patterns.md) — Panama, DuPont, Continental, 3-shift continuous, handover protocols
11. [10-mobile-and-offline.md](./02-attendance/10-mobile-and-offline.md) — Offline buffering, geo-fencing, biometric, WhatsApp/SMS/IVR/kiosk channels

### Phase 3 — Payroll & Compliance (this delivery)

#### `/03-payroll/`

1. [00-overview.md](./03-payroll/00-overview.md) — Module purpose, determinism, idempotency, run lifecycle, money correctness
2. [01-salary-structure-builder.md](./03-payroll/01-salary-structure-builder.md) — Structure schema, formula DSL, computation sequence, ₹15L worked example
3. [02-component-library.md](./03-payroll/02-component-library.md) — Full component catalog, statutory tagging matrix, Wage Code §2(y) 50% rule
4. [03-payroll-period-and-cycle.md](./03-payroll/03-payroll-period-and-cycle.md) — PayrollPeriod, PayrollRun (primary/retro/fnf/bonus), monthly/26th-25th/weekly/fortnightly cycles
5. [04-pre-payroll-inputs.md](./03-payroll/04-pre-payroll-inputs.md) — PrePayrollInput, OneTimeEntry, RecurringTemplate, TaxDeclaration, CSV upload
6. [05-payroll-engine.md](./03-payroll/05-payroll-engine.md) — 13-step engine sequence, full Pankaj April 2026 worked example (₹110,482 net)
7. [06-arrears-and-retros.md](./03-payroll/06-arrears-and-retros.md) — Carry-forward retros, RetroEvent schema, Section 89 relief, statutory contributions on arrears
8. [07-bonus-calculation.md](./03-payroll/07-bonus-calculation.md) — Statutory bonus (8.33%-20%, ₹7K calc cap), performance bonus, Forms A/B/C/D
9. [08-gratuity-calculation.md](./03-payroll/08-gratuity-calculation.md) — § 10(10) tax exemption, formula `(Basic+DA)/26 × 15 × yrs`, 5 worked examples, Form L issuance
10. [09-fnf-settlement.md](./03-payroll/09-fnf-settlement.md) — F&F flow, 2-day SLA, encashment, recoveries, exit clearance, documents
11. [10-payslip-format.md](./03-payroll/10-payslip-format.md) — Layout, channels, password protection, multi-language `[v2]`
12. [11-bank-file-formats.md](./03-payroll/11-bank-file-formats.md) — HDFC NEFT, SBI CMP, ICICI CIB, Generic NEFT/RTGS, NACH, retries
13. [12-journal-voucher-and-accounting.md](./03-payroll/12-journal-voucher-and-accounting.md) — Tally XML, Zoho CSV, SAP, CoA mapping, provisioning
14. [13-edge-cases.md](./03-payroll/13-edge-cases.md) — 40 payroll edge cases worked

#### `/04-compliance/`

1. [00-overview.md](./04-compliance/00-overview.md) — Module purpose, filing tracker, inspector mode, inspection pack
2. [01-pf-act-and-formulas.md](./04-compliance/01-pf-act-and-formulas.md) — EPF Act, ECR 2.0 format, contribution formulas, UAN/KYC, Section 14B/7Q penalties
3. [02-esi-act-and-formulas.md](./04-compliance/02-esi-act-and-formulas.md) — ESI Act, contribution periods (Apr-Sep / Oct-Mar), benefits, half-yearly returns
4. [03-tds-and-income-tax.md](./04-compliance/03-tds-and-income-tax.md) — Section 192, IT Act 2025, Form 24Q, Form 16, HRA exemption, regime switch
5. [04-professional-tax-state-wise.md](./04-compliance/04-professional-tax-state-wise.md) — State-by-state PT slabs (MH, KA, TN, etc.), filing cycles
6. [05-lwf-state-wise.md](./04-compliance/05-lwf-state-wise.md) — State-by-state LWF amounts and cycles
7. [06-bonus-act.md](./04-compliance/06-bonus-act.md) — Bonus Act compliance, Forms A/B/C/D, applicability tracking
8. [07-gratuity-act.md](./04-compliance/07-gratuity-act.md) — Forms F/G/H/I/J/K/L/M/N/O/U, nominations, controlling authority, group insurance
9. [08-maternity-benefit-act.md](./04-compliance/08-maternity-benefit-act.md) — MB Act 1961 amended 2017, 26 weeks, ESI overlap, anti-discrimination
10. [09-clra-contract-labour.md](./04-compliance/09-clra-contract-labour.md) — CLRA Forms (XII/XIII/XVII/XX/XXV), PE liability, OSH transition
11. [10-factories-act.md](./04-compliance/10-factories-act.md) — Form D, Form 25, Form 18 (accidents), workmen's comp, hazardous processes
12. [11-shops-and-establishments.md](./04-compliance/11-shops-and-establishments.md) — State S&E Acts overview (MH, KA, TN, DL), registration, returns
13. [12-statutory-registers.md](./04-compliance/12-statutory-registers.md) — Master index of every statutory register the HRMS produces
14. [13-statutory-files-and-formats.md](./04-compliance/13-statutory-files-and-formats.md) — ECR 2.0, FVU, ESIC, state PT/LWF formats, adapter abstraction
15. [14-2026-labour-codes.md](./04-compliance/14-2026-labour-codes.md) — Code on Wages / IR / SS / OSH transition, threshold changes, rule versioning
16. [15-statutory-deadlines-calendar.md](./04-compliance/15-statutory-deadlines-calendar.md) — Master calendar of every deadline, reminders, escalations

### Phase 4 — Recruitment, Performance, ESS & Mobile (this delivery)

#### `/05-recruitment/`

1. [00-overview.md](./05-recruitment/00-overview.md) — Module purpose, lightweight ATS philosophy, Indian-first handoff
2. [01-job-requisition.md](./05-recruitment/01-job-requisition.md) — Requisition schema, approval, posting channels, budget integration
3. [02-candidate-and-application.md](./05-recruitment/02-candidate-and-application.md) — Candidate dedup (email/phone hash), Application schema, sourcing channels, talent pool, blacklist, DPDPA consent
4. [03-pipeline-and-stages.md](./05-recruitment/03-pipeline-and-stages.md) — 18-stage default pipeline, kanban, SLAs, role-family templates
5. [04-interviews-and-feedback.md](./05-recruitment/04-interviews-and-feedback.md) — Interview scheduling, calendar integration (v1 .ics, v2 Google/Outlook API), panels, feedback templates
6. [05-offer-management.md](./05-recruitment/05-offer-management.md) — Offer schema with full comp breakdown, multi-level approval (>₹50L tenant admin), e-sign integration, negotiation, withdrawal
7. [06-pre-joining.md](./05-recruitment/06-pre-joining.md) — PreJoiningProfile schema, BGV vendors (AuthBridge/NetSepio/IDfy), engagement plan, no-show handling, cost-to-hire
8. [07-recruitment-analytics.md](./05-recruitment/07-recruitment-analytics.md) — Funnel, source effectiveness, time-to-hire benchmarks, cost per hire, quality of hire
9. [08-edge-cases.md](./05-recruitment/08-edge-cases.md) — 30 recruitment edge cases

#### `/06-performance/`

1. [00-overview.md](./06-performance/00-overview.md) — Module overview, Indian context, hybrid annual+continuous default
2. [01-goals-and-okrs.md](./06-performance/01-goals-and-okrs.md) — Goal schema, OKR cascading org→dept→individual, achievement scoring, role templates
3. [02-feedback-and-1on1s.md](./06-performance/02-feedback-and-1on1s.md) — FeedbackEntry, OneOnOneMeeting schemas, 360 flow with peer nomination, anonymous upward, DPDPA visibility
4. [03-review-cycles.md](./06-performance/03-review-cycles.md) — ReviewCycle, PerformanceReview schema, 70-day annual cycle timeline, calibration, probation auto-trigger T-30 days
5. [04-rating-and-calibration.md](./06-performance/04-rating-and-calibration.md) — 5-point default scale, alternatives, forced distribution policy, calibration grid, bias detection, rating-to-outcome mapping
6. [05-pip-and-improvement.md](./06-performance/05-pip-and-improvement.md) — PIP schema, weekly check-ins, outcomes (pass/fail/extend/resignation), legal documentation
7. [06-promotion-progression.md](./06-performance/06-promotion-progression.md) — Promotion schema, career path L1-L8, criteria evaluation, comp adjustment formula, 90-day post-review
8. [07-edge-cases.md](./06-performance/07-edge-cases.md) — 25 performance edge cases

#### `/07-ess-mobile/`

1. [00-overview.md](./07-ess-mobile/00-overview.md) — ESS philosophy, mobile-first, Indian context, default dashboard layout
2. [01-mobile-app-architecture.md](./07-ess-mobile/01-mobile-app-architecture.md) — PWA v1 → React Native v2 → Native v3 path, offline action queue, push, biometric, geolocation
3. [02-payslips-and-tax-statements.md](./07-ess-mobile/02-payslips-and-tax-statements.md) — Payslip access, Form 16, tax projection, regime comparison, YTD earnings
4. [03-leave-and-attendance-mobile.md](./07-ess-mobile/03-leave-and-attendance-mobile.md) — Apply leave flow, calendar view, check-in/out, regularization, manager view
5. [04-tax-declarations-and-investment-proofs.md](./07-ess-mobile/04-tax-declarations-and-investment-proofs.md) — Form 12BB declaration, old vs new regime helper, Q4 proof submission, verification flow, Pankaj worked example
6. [05-helpdesk-and-tickets.md](./07-ess-mobile/05-helpdesk-and-tickets.md) — Ticket schema, auto-routing, SLA, sensitive ticket protocol (harassment/grievance), CSAT
7. [06-pwa-vs-native.md](./07-ess-mobile/06-pwa-vs-native.md) — Comparison matrix, recommended path, code samples, migration plan, cost analysis
8. [07-edge-cases.md](./07-ess-mobile/07-edge-cases.md) — 25 mobile/ESS edge cases

### Phase 5 — Workflow, Analytics, Appendix (this delivery — final)

#### `/08-workflow/`

1. [00-overview.md](./08-workflow/00-overview.md) — Generic workflow engine philosophy, integration with all modules
2. [01-workflow-engine.md](./08-workflow/01-workflow-engine.md) — WorkflowDefinition + WorkflowInstance schemas, state machine, execution model, callbacks pattern, idempotency, email-based approval with signed JWT tokens
3. [02-approval-chains.md](./08-workflow/02-approval-chains.md) — Sequential / parallel-all / parallel-any-n / hybrid chain types, ApprovalChainConfig schema, conditional resolution, runtime resolution function, examples for leave / offer / expense / review / F&F chains
4. [03-delegation-and-escalation.md](./08-workflow/03-delegation-and-escalation.md) — DelegationRule schema (vacation, amount-limited, prevent re-delegation), EscalationPolicy with SLA breach triggers, reminder cadence, auto-escalation safety
5. [04-workflow-templates.md](./08-workflow/04-workflow-templates.md) — 30+ pre-built templates catalog (LEAVE-STANDARD, OFFER-STANDARD, OFFER-LEADERSHIP at >₹75L, COMP-REVISION-EXCEPTIONAL, FNF-CLEARANCE 72h, EXPENSE-CLAIM-STANDARD with tiers, etc.)
6. [05-edge-cases.md](./08-workflow/05-edge-cases.md) — 25 workflow edge cases (approver leaves company, requester resigns, workflow loops, version pinning, impersonation detection, mass approvals, cyclic delegation chain, self-approval handling)

#### `/09-analytics/`

1. [00-overview.md](./09-analytics/00-overview.md) — Analytics architecture, read model strategy, permissions enforcement, performance considerations
2. [01-reports-architecture.md](./09-analytics/01-reports-architecture.md) — ReportDefinition schema, query layers (cache, read model, operational), MongoDB aggregation example, async generation flow with BullMQ
3. [02-standard-reports-catalog.md](./09-analytics/02-standard-reports-catalog.md) — 110+ pre-built reports across 9 categories (Headcount, Attendance/Leave, Payroll/Comp, Recruitment, Performance, Compliance, Finance, Employee Experience, D&I)
4. [03-custom-report-builder.md](./09-analytics/03-custom-report-builder.md) — Tenant DIY report builder with 6-step wizard, DataSource schema, CustomReport schema, available data sources list
5. [04-dashboards.md](./09-analytics/04-dashboards.md) — Dashboard schema, role-based defaults (Employee, Manager, HR Head, Tenant Admin) with full layouts shown, widget types, real-time updates
6. [05-exports-and-api.md](./09-analytics/05-exports-and-api.md) — CSV/Excel/PDF/JSON formats, sync vs async (>50K rows = async), REST API endpoints with versioning, webhook subscriptions, rate limiting
7. [06-scheduled-distribution.md](./09-analytics/06-scheduled-distribution.md) — ScheduledDistribution schema, daily/weekly/monthly/quarterly/annual templates, conditional sending, distribution lists

#### `/99-appendix/`

1. [00-overview.md](./99-appendix/00-overview.md) — Appendix navigation
2. [01-open-questions.md](./99-appendix/01-open-questions.md) — All [OPEN] flags consolidated by severity (CRITICAL/HIGH/MEDIUM/LOW), 6 critical items + 12 high + ~30 medium + ~18 low
3. [02-decision-log.md](./99-appendix/02-decision-log.md) — All [DECISION] items locked-in with rationale, 28 architectural and operational decisions with reversibility notes
4. [03-statutory-verify-checklist.md](./99-appendix/03-statutory-verify-checklist.md) — 54 statutory items needing source verification (IT Act 2025, EPF, ESI, PT, LWF, Bonus, Gratuity, MB Act, Factories, CLRA, Wage Code, SS Code, DPDPA)
5. [04-ca-review-checklist.md](./99-appendix/04-ca-review-checklist.md) — 46 questions specifically for CA opinion before launch + annual / quarterly engagement model
6. [05-implementation-phasing.md](./99-appendix/05-implementation-phasing.md) — 21-sprint plan over 9 months, team scaling, critical path, beta criteria
7. [06-risk-register.md](./99-appendix/06-risk-register.md) — 21 risks across statutory/operational/security/business/customer-side with severity, likelihood, mitigations
8. [07-spec-index-by-topic.md](./99-appendix/07-spec-index-by-topic.md) — A-Z topic-based navigation across the entire spec

### Phase 3 — Payroll & Compliance (next session)

#### `/03-payroll/` (planned)

- 00-overview, 01-salary-structure-builder, 02-component-library,
  03-payroll-period-and-cycle, 04-pre-payroll-inputs, 05-payroll-engine,
  06-arrears-and-retros, 07-bonus-calculation, 08-gratuity-calculation,
  09-fnf-settlement, 10-payslip-format, 11-bank-file-formats,
  12-journal-voucher-and-accounting, 13-edge-cases

#### `/04-compliance/` (planned)

- 00-overview, 01-pf-act-and-formulas, 02-esi-act-and-formulas,
  03-tds-and-income-tax, 04-professional-tax-state-wise, 05-lwf-state-wise,
  06-bonus-act, 07-gratuity-act, 08-maternity-benefit-act,
  09-clra-contract-labour, 10-factories-act, 11-shops-and-establishments,
  12-statutory-registers, 13-statutory-files-and-formats,
  14-2026-labour-codes, 15-statutory-deadlines-calendar

### Phase 4 — Talent & Performance & ESS (later session)

#### `/05-recruitment/`, `/06-performance/`, `/07-ess-mobile/` (planned)

### Phase 5 — Workflow, Analytics, Appendix (later session)

#### `/08-workflow/`, `/09-analytics/`, `/99-appendix/` (planned)

---

## How to read this spec

For sprint planning, read in this order:
1. `/00-foundations/` cover-to-cover (architectural decisions)
2. `/01-employee/` cover-to-cover (the foundational entity)
3. Then go module by module based on sprint priority

For implementation, each module file has:
- **Purpose** section — what it does and why
- **Data model** section — schemas with indexes
- **Behavior** section — formulas, state machines, workflows
- **Edge cases** section — what can go wrong
- **Outputs** section — files, reports, integrations
- **Open questions** section — things you must decide

For Claude Code, point it at the relevant module folder and the foundations folder. Each module is self-contained enough that an agent can implement it without re-reading the entire spec.

---

## Versioning of this spec

This is a living document. Convention:
- Major version bumps when statutory law changes (e.g., 2026 Labour Codes notifications)
- Minor version bumps when product scope changes
- Patch bumps for typos, clarifications, edge case additions

Current version: **1.0.0** (Final spec — Phases 1+2+3+4+5 complete, April 2026)
