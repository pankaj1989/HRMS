# 05 — Implementation Phasing

## Purpose

Recommended sprint plan for building the HRMS v1. Two-week sprints. Assumes a small team (1 senior backend + 1 frontend + 1 mobile + 1 product/HR consultant + part-time CA / legal).

Total v1 timeline: ~36 weeks (9 months); v1 launch with core functionality, follow-on with v2 features.

## Pre-sprint: Foundations (Weeks 1-2)

### Sprint 0 — Setup

**Goals**: Infrastructure, tooling, CI/CD ready before feature work.

- AWS / GCP / Azure setup (multi-region for India)
- MongoDB Atlas (with encryption at rest)
- Redis (cache + queue)
- BullMQ workers infra
- S3 / object storage
- Auth0 / Clerk / custom auth
- Sentry / monitoring
- GitHub repo + CI/CD pipelines
- Dev / staging / prod environments
- Domain + SSL
- Email service (SES / SendGrid)
- SMS gateway (MSG91 / Kaleyra)
- Push notification (FCM)

**Deliverable**: Empty Next.js app + Express backend deployed to staging.

## Phase A: Foundation (Weeks 3-12, 5 sprints)

### Sprint 1-2 — Multi-tenancy + RBAC

- Tenant model + creation flow
- Entity model + multi-entity support
- User model + login
- RBAC (roles, permissions)
- Tenant admin onboarding
- Master data (departments, locations, designations)
- Audit log infrastructure (hash-chained)
- Encryption at rest (KYC + bank fields)

**Aligns with**: `/00-foundations/`

### Sprint 3-4 — Employee Master + Lifecycle

- Employee schema (full PII + nested employment, comp, KYC)
- Employee creation / onboarding flow
- Document upload + storage
- KYC verification (PAN + Aadhaar APIs)
- Employee lifecycle states
- Org chart visualization
- Bulk import (Excel)

**Aligns with**: `/01-employee/`

### Sprint 5-6 — Workflow Engine

- Generic workflow engine
- Approval chains
- Delegation
- Escalation
- Email-based approval
- Audit integration
- Workflow templates (initial 5-10)

**Aligns with**: `/08-workflow/`

## Phase B: Attendance + Payroll Core (Weeks 13-22, 5 sprints)

### Sprint 7-8 — Attendance + Leave

- Attendance daily schema
- Check-in / check-out (mobile + web)
- Geolocation
- Leave types and policies
- Leave application flow
- Leave balance tracking
- Holiday calendar
- Regularization workflow

**Aligns with**: `/02-attendance/`

### Sprint 9-10 — Payroll Engine

- Salary structure builder
- Compensation records
- Pre-payroll input collection
- Payroll engine (13-step pipeline)
- TDS computation (slab-based)
- PF / ESI / PT computation
- Payslip generation
- Bank file generation

**Aligns with**: `/03-payroll/`

### Sprint 11 — F&F + Arrears

- F&F settlement workflow
- Notice period buyout
- Encashment computation
- Gratuity calculation
- Arrears handling
- Recovery / advance handling

**Aligns with**: `/03-payroll/09-fnf-settlement.md`

## Phase C: Compliance (Weeks 23-28, 3 sprints)

### Sprint 12-13 — PF + ESI + TDS

- ECR file generation
- ESI return file
- Form 24Q quarterly
- Form 16 generation
- Statutory deadlines calendar
- Filing tracker
- Penalty / interest auto-calc

**Aligns with**: `/04-compliance/01-pf-and-uan.md` through `/04-compliance/03-tds-and-income-tax.md`

### Sprint 14 — State PT + LWF + Other

- State-wise PT engine
- State-wise LWF
- Bonus computation
- Statutory registers (Form A, B, C, etc.)
- Inspection pack generator

**Aligns with**: `/04-compliance/04-...11-...md`

## Phase D: Recruitment (Weeks 29-32, 2 sprints)

### Sprint 15-16 — Recruitment

- Requisition + approval
- Candidate database (with dedup)
- Application + pipeline
- Interview scheduling
- Feedback collection
- Offer generation
- Pre-joining
- BGV integration (1 vendor)

**Aligns with**: `/05-recruitment/`

## Phase E: Performance + ESS (Weeks 33-36, 2 sprints)

### Sprint 17-18 — Performance + ESS

- Goal setting
- Annual review cycle
- Rating + calibration
- ESS web (employee dashboard, payslips, leave, attendance)
- Helpdesk tickets
- Tax declaration / proofs

**Aligns with**: `/06-performance/` (lighter v1) and `/07-ess-mobile/` (web)

### Sprint 19 — Mobile (PWA)

- PWA setup
- Mobile-optimized ESS
- Offline action queue
- Push notifications
- Biometric auth (web)

**Aligns with**: `/07-ess-mobile/`

## Phase F: Analytics + Polish (Week 37-40 — included in v1)

### Sprint 20 — Analytics

- Standard reports (top 30)
- Dashboards (4 default roles)
- Custom report builder (basic)
- Excel / PDF export
- Scheduled distribution

**Aligns with**: `/09-analytics/`

### Sprint 21 — Polish + Beta

- Bug fixes
- Performance optimization
- Documentation
- Training material
- Beta with 3-5 customers
- Iterate based on feedback

## v1 Launch (Week 41-42)

- Production deployment
- Customer onboarding playbook
- 24/7 support setup
- Marketing launch

## Post-v1 Roadmap

### v1.1 (Month 11-12)

- Mobile native (React Native iOS + Android)
- Native push, biometric, geofence
- Advanced offline
- Polish remaining mobile flows

### v1.2 (Month 13-14)

- Hindi + 2 regional language support
- Advanced reports + custom builder enhancements
- Slack / Teams integrations
- Webhook framework

### v2 (Months 15-24)

- Performance: 360 feedback, calibration UI, PIP workflow
- Recruitment: full ATS, BGV vendors, AI features
- Compliance: FY 27-28 transition, post-Code on Wages full implementation
- Mobile: native apps
- Tableau / Power BI connector
- Workflow visual builder

### v3 (Year 2-3)

- AI insights (attrition prediction, hiring recommendations)
- Cross-tenant benchmarking
- Industry-specific bundles
- Wearable / voice integration

## Team scaling

| Phase | Backend | Frontend | Mobile | Product / HR | CA / Legal | DevOps |
|---|---|---|---|---|---|---|
| Phase A (Found.) | 1 | 1 | 0 | 1 (PT) | 1 (PT) | 0.5 |
| Phase B (Att+Pay) | 2 | 1 | 0 | 1 | 1 (PT) | 0.5 |
| Phase C (Comp.) | 2 | 1 | 0 | 1 | 1 | 0.5 |
| Phase D (Recr.) | 2 | 2 | 0 | 1 | 0.5 (PT) | 0.5 |
| Phase E (Perf+ESS) | 2 | 2 | 1 | 1 | 0.5 (PT) | 0.5 |
| Phase F (Anal.) | 2 | 2 | 1 | 1 | 0.5 (PT) | 0.5 |
| v1.1+ | 3 | 3 | 2 | 2 | 1 | 1 |

PT = Part-time.

## Critical path items

These cannot slip without delaying launch:

1. **Authentication + RBAC** (Sprint 1-2) — every feature builds on this
2. **Employee Master** (Sprint 3-4) — foundation for everything
3. **Payroll engine** (Sprint 9-10) — primary value proposition
4. **PF / ESI / TDS** (Sprint 12-13) — compliance is non-negotiable
5. **CA review** (overlap Sprints 11-15) — pre-launch validation

## Risk mitigations

### Statutory risk

- Engage CA early (sprint 1)
- Build statutory rules engine first; rules can be updated without code changes
- Mock filings before going live (test with EPFO TIN, ESIC validation)

### Performance risk

- Indexing strategy from day one
- Read models for analytics
- Load test before launch (1000+ concurrent users, 10K employees per tenant)

### Adoption risk

- Beta with friendly customers Week 35
- Customer onboarding template
- Excellent default tenant config (work out-of-box for typical SME)

### Quality risk

- Automated tests for all statutory calculations (Sprint 1 onward)
- Manual QA after each sprint
- Penetration test before launch

## Beta criteria

Before opening to public:

- [ ] 3 customers running production payroll for 2 consecutive months
- [ ] 0 statutory calculation errors (audit by CA)
- [ ] < 1 sec response time for 95% of requests
- [ ] 99.9% uptime over 30 days
- [ ] DPDPA compliance audit passed
- [ ] Penetration test passed
- [ ] Customer onboarding playbook tested

## Cross-references

- [01-open-questions.md](./01-open-questions.md) — items to resolve
- [04-ca-review-checklist.md](./04-ca-review-checklist.md) — pre-launch CA review
- [06-risk-register.md](./06-risk-register.md) — risks to monitor
- All spec folders — feature specs to implement
