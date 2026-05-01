# 06 — Risk Register

## Purpose

Known risks, their likelihood, impact, and mitigation strategies. Used in:
- Sprint planning (avoid hitting these)
- Stakeholder communication
- Insurance / contractual conversations
- Continuous monitoring

## Categorization

- **Severity**: Low (L) / Medium (M) / High (H) / Critical (C)
- **Likelihood**: Low (L) / Medium (M) / High (H)
- **Status**: Open / Monitoring / Mitigated / Accepted

## Statutory / Regulatory

### R1 — Wrong tax computation due to outdated slabs

**Severity**: C  
**Likelihood**: M  
**Status**: Open

**Description**: IT Act 2025 slabs assumed; if actual differs, all TDS computations wrong. Employees pay wrong tax. Employer faces penalties under section 192.

**Impact**: 
- 1000s of incorrect Form 16s
- Penalties (₹10,000 per default, plus interest)
- Reputation damage
- Customer churn

**Mitigation**:
- CA validation pre-launch (CR-CA-1, CR-CA-3)
- Slabs in rule engine (config-driven, not hardcoded in code)
- Auto-flag at tenant onboarding for CA review
- Recovery: re-run TDS for affected period if discovered

**Owner**: Product + CA

### R2 — Late statutory filing penalties

**Severity**: H  
**Likelihood**: M  
**Status**: Open

**Description**: Tenant misses Form 24Q / ECR / ESI return deadline due to HRMS bug or downtime.

**Impact**:
- Tenant penalized (₹200/day for Form 24Q late, etc.)
- HRMS reputation damage
- Possible legal exposure if HRMS contractually responsible

**Mitigation**:
- Buffer days before deadlines (file 5 days early)
- Multiple reminder cadence (T-7, T-3, T-1)
- Escalation if not filed
- HRMS uptime SLA 99.95%
- Contractual disclaimer (HRMS prepares; tenant files)

**Owner**: Product + Legal

### R3 — DPDPA non-compliance

**Severity**: H  
**Likelihood**: M  
**Status**: Open

**Description**: Personal data handling violates DPDPA 2023 (consent, retention, breach notification).

**Impact**:
- Penalty up to ₹250 Cr (significant data fiduciary)
- Legal action
- Tenant churn

**Mitigation**:
- DPO engagement
- Consent management built-in
- Retention auto-deletion
- Breach response plan
- Annual privacy audit

**Owner**: Legal + Product

### R4 — Wage Code transition errors

**Severity**: H  
**Likelihood**: H  
**Status**: Open

**Description**: When state notifies Code on Wages Rules, tenants need to transition. Wrong transition = wage / PF / minimum wage non-compliance.

**Impact**:
- Labour law violations
- Worker disputes
- Possible criminal liability (Wage Code § 56)

**Mitigation**:
- State-by-state tracking
- Transition templates per state
- 6-month buffer post-notification
- CA assistance per tenant

**Owner**: Compliance team

### R5 — Statutory rule engine bug

**Severity**: H  
**Likelihood**: L  
**Status**: Open

**Description**: Bug in rule engine produces wrong calculation across many tenants.

**Impact**:
- Mass incorrect computations
- Trust erosion
- Recovery costs

**Mitigation**:
- Comprehensive automated tests (every rule with edge cases)
- Sanity checks (alert if computation deviates significantly from expected)
- Canary deployment for rule changes
- Manual CA review of test cases

**Owner**: Engineering + CA

## Operational

### R6 — Payroll missed for tenant due to HRMS downtime

**Severity**: C  
**Likelihood**: L  
**Status**: Monitoring

**Description**: HRMS down on payday (1st of month). Salary not credited.

**Impact**:
- Employees unpaid
- Trust damage
- Customer churn
- Possible Wage Code penalty (delayed wages)

**Mitigation**:
- 99.95% uptime SLA
- Multi-region deployment
- Pre-payday reliability checks (D-3 stress test)
- Bank file generated D-1 (not D)
- Manual fallback procedure documented

**Owner**: DevOps + Customer Success

### R7 — Data corruption / loss

**Severity**: C  
**Likelihood**: L  
**Status**: Monitoring

**Description**: Database corruption or data loss event.

**Impact**:
- Catastrophic for tenant
- Existential for HRMS

**Mitigation**:
- Continuous backups (multi-region)
- Point-in-time restore
- Disaster recovery plan tested
- Data validation checksums
- Audit log immutability

**Owner**: DevOps

### R8 — Tenant data leakage between tenants

**Severity**: C  
**Likelihood**: L  
**Status**: Open

**Description**: Bug in multi-tenancy isolation; one tenant sees another's data.

**Impact**:
- Massive trust failure
- Possible legal exposure
- Class action

**Mitigation**:
- TenantId in every query (enforced at framework level)
- Automated tests for cross-tenant access attempts
- Code review for every query
- Penetration testing
- Indexing tenant first

**Owner**: Engineering + Security

### R9 — Performance degradation under load

**Severity**: H  
**Likelihood**: M  
**Status**: Monitoring

**Description**: HRMS slow during peak (payroll runs, attendance check-in mornings).

**Impact**:
- Poor user experience
- Operational delays
- Tenant frustration

**Mitigation**:
- Read models for analytics
- Caching
- Async processing
- Auto-scaling
- Load testing

**Owner**: Engineering

### R10 — Failed integration (PF / ESI portals)

**Severity**: M  
**Likelihood**: H  
**Status**: Open

**Description**: EPFO / ESIC portal changes format / API; HRMS submission fails.

**Impact**:
- Filing failures
- Manual recovery work

**Mitigation**:
- Schema versioning
- Tenant alerts on portal changes
- Manual override path
- Vendor partnership for reliability

**Owner**: Compliance + Engineering

## Security

### R11 — Authentication compromise

**Severity**: H  
**Likelihood**: L  
**Status**: Open

**Description**: Tenant admin credentials compromised; access to all employees' data.

**Impact**:
- Mass data breach
- DPDPA breach notification required
- Reputation damage

**Mitigation**:
- MFA mandatory for admin
- Password complexity rules
- Session timeout
- Anomaly detection (login from new geo, etc.)
- Audit log

**Owner**: Security

### R12 — API key leak

**Severity**: H  
**Likelihood**: L  
**Status**: Open

**Description**: Tenant's API key leaked (e.g., in source code commit).

**Impact**:
- Data extraction by attacker
- Unauthorized actions

**Mitigation**:
- Short-lived keys
- Key rotation
- Per-key permissions / IP whitelist
- Detection of unusual API usage
- Customer education

**Owner**: Security

### R13 — Insider threat

**Severity**: H  
**Likelihood**: L  
**Status**: Open

**Description**: HRMS employee abuses access to tenant data.

**Impact**:
- Data breach
- Trust failure

**Mitigation**:
- Need-to-know access
- Audit log for support actions
- Background checks for employees
- Annual access reviews
- Encryption at rest

**Owner**: Security + HR

### R14 — Vulnerability in dependency

**Severity**: H  
**Likelihood**: M  
**Status**: Monitoring

**Description**: Critical CVE in npm package (e.g., Next.js, MongoDB driver).

**Impact**:
- Possible RCE / data exfiltration

**Mitigation**:
- Dependabot / Snyk
- Security patches within 48 hours
- WAF
- Pen testing

**Owner**: Engineering + Security

## Business

### R15 — Customer churn due to bugs

**Severity**: H  
**Likelihood**: M  
**Status**: Open

**Description**: Multiple customers leave due to recurring bugs.

**Impact**:
- Revenue loss
- Reputational damage

**Mitigation**:
- QA-first culture
- Bug priority + SLA
- Customer success outreach
- Feedback loop

**Owner**: Product + Customer Success

### R16 — Failure to compete on features

**Severity**: M  
**Likelihood**: M  
**Status**: Monitoring

**Description**: Competitors launch features faster.

**Impact**:
- Market share loss

**Mitigation**:
- Focus on Indian-first wedge
- Excellent UX over feature breadth
- Iterative releases

**Owner**: Product

### R17 — Cash flow issues

**Severity**: H  
**Likelihood**: M  
**Status**: Open

**Description**: Tenant churn / slow growth means burn out of runway.

**Mitigation**:
- Conservative spending
- Customer pre-pay incentives
- Tight focus on retention

**Owner**: Founder / Finance

### R18 — Key personnel departure

**Severity**: H  
**Likelihood**: L  
**Status**: Monitoring

**Description**: Senior engineer / domain expert leaves.

**Mitigation**:
- Documentation (this spec is part of it)
- Bus factor > 1 on critical paths
- Equity / retention
- Cross-training

**Owner**: Founder

## Customer-side

### R19 — Tenant misconfigures statutory settings

**Severity**: H  
**Likelihood**: H  
**Status**: Open

**Description**: Tenant sets wrong PF basis / wrong PT state, etc. Compliance failure.

**Impact**:
- Tenant penalized
- HRMS reputation impact

**Mitigation**:
- Onboarding checklist
- CA validation step (mandatory at tenant setup)
- Sanity checks at runtime
- Periodic audit prompts

**Owner**: Customer Success

### R20 — Tenant uses HRMS for non-supported jurisdiction

**Severity**: M  
**Likelihood**: L  
**Status**: Open

**Description**: Tenant has employees outside India.

**Impact**:
- Wrong calculations
- Tenant disappointment

**Mitigation**:
- Clear product positioning (Indian-only)
- Block non-Indian entity creation
- Upfront communication

**Owner**: Product + Sales

### R21 — Tenant data quality issues

**Severity**: M  
**Likelihood**: H  
**Status**: Open

**Description**: Tenant data (employee records) has errors (duplicate, missing fields, bad formatting).

**Impact**:
- Poor user experience
- Calculation errors
- Trust impact

**Mitigation**:
- Bulk import validation
- Data cleansing wizard
- Profile completeness scoring
- Periodic data audits

**Owner**: Customer Success + Product

## Mitigations summary

| Risk | Mitigation status |
|---|---|
| Statutory calculations | CA review pre-launch + automated tests |
| Filing deadlines | Buffer days + escalation |
| DPDPA | Privacy-by-design + DPO |
| Multi-tenant isolation | Framework-enforced + pen testing |
| Data loss | Backups + DR plan |
| Performance | Load testing + read models |
| Authentication | MFA + anomaly detection |
| Dependencies | CVE monitoring + SLA |
| Churn | UX focus + customer success |

## Risk review cadence

- **Weekly**: Sprint planning includes risk review for sprint scope
- **Monthly**: Operational risks reviewed (uptime, performance, security)
- **Quarterly**: Strategic risk review (statutory, business, competitive)
- **Annually**: Full risk register refresh

## Cross-references

- [05-implementation-phasing.md](./05-implementation-phasing.md) — sprint plan accounts for these risks
- [04-ca-review-checklist.md](./04-ca-review-checklist.md) — CA mitigates statutory risks
- [/00-foundations/04-audit-and-compliance-hooks.md](../00-foundations/04-audit-and-compliance-hooks.md) — audit infrastructure
