# 00 — Foundations Overview

## Purpose of this folder

The eight files in `/00-foundations/` define the architectural decisions that every other module in the spec depends on. If these are wrong, every downstream module is wrong. Read this folder first.

## Architectural philosophy

The HRMS is built on five non-negotiable principles. Every decision in the rest of this spec ties back to one of these.

### Principle 1 — Time is a first-class dimension

In HR, every fact has a date. An employee's salary on January 15, 2024 must be answerable in 2027 with byte-perfect accuracy, even if the employee has had three salary revisions, one promotion, and a transfer in between. Every domain entity is **time-versioned**: it has `effectiveFrom`, `effectiveTo`, and history is never overwritten — only superseded by a new version.

This is the single hardest architectural principle to retrofit. It must be there from F0.

### Principle 2 — Statutory rules are versioned data, not code

The PF wage ceiling is ₹15,000 today. It might be ₹25,000 next year. The Maharashtra Professional Tax slab changes most years. The TDS slabs changed under the Income Tax Act 2025.

If statutory thresholds and formulas are hard-coded, every change is a code release. That is fatal in a compliance product.

Instead, statutory rules live in a **versioned rules engine** ([06-statutory-rules-engine.md](./06-statutory-rules-engine.md)). Each rule is a JSON document with `effectiveFrom` and `effectiveTo` dates. Re-running March 2024 payroll uses March 2024 rules. Re-running April 2026 payroll uses April 2026 rules. The same code path handles both because the code reads rules, not constants.

### Principle 3 — Multi-entity from day one

A single tenant (= customer company) typically has multiple legal entities. Examples:

- A 400-employee Bangalore IT services company has one Pvt Ltd (head office) and one LLP (consulting arm)
- A 1,200-employee Mumbai manufacturing firm has the manufacturing entity, a trading entity, and a sister concern doing exports
- A 60-employee Delhi startup has one Pvt Ltd today but plans to spin off a US Inc subsidiary

Each entity has its own:
- PAN, TAN, GSTIN
- PF establishment registration number (different EPFO codes)
- ESI registration number (different ESIC codes)
- Professional Tax registration per state
- Shop & Establishment registration per state
- Bank accounts for salary disbursement

Employees may transfer between entities mid-employment. Payroll runs per entity. Statutory filings happen per entity. Reports may roll up across entities or stay per-entity.

This is documented fully in [02-multi-entity.md](./02-multi-entity.md).

### Principle 4 — Audit log is evidence, not metadata

In every other SaaS product, the audit log is a "nice to have" feature for security teams. In HRMS, the audit log is **legal evidence** in three scenarios:

1. **Statutory inspection.** EPFO/ESIC/Income Tax inspector arrives. They want to know: who changed this employee's salary on this date? Who approved this leave? When was this PF transfer initiated?
2. **Employee dispute.** Terminated employee claims they were owed bonus. Audit log proves what was promised vs. what was paid.
3. **Compliance certification.** SOC 2, ISO 27001, DPDPA 2023 audits all require demonstrable change tracking on personal data.

The audit log is therefore designed as an **append-only, cryptographically-anchored evidence stream**, not a debug tool. Specified in [04-audit-and-compliance-hooks.md](./04-audit-and-compliance-hooks.md).

### Principle 5 — Money never lies, and never floats

All monetary values are **integer paise** in the database, or `Decimal128`. Never JavaScript `number`. Never floating-point math.

```typescript
// ❌ NEVER
const tax = grossSalary * 0.1;          // floating-point error

// ✅ ALWAYS
const tax = Decimal128.fromString(
  bigDecimal(grossPaise).multiply(0.10).toFixed(0)
);
```

The reason: PF reconciliation matches challan amounts to the paisa. A ₹0.01 floating-point error across 500 employees compounds to ₹5 mismatch in the EPFO ECR, which fails ECR upload, which delays PF deposit, which triggers interest and penalty under section 7Q.

Spec rule: every monetary calculation in this spec uses `bigdecimal.js` or equivalent fixed-precision arithmetic. UI converts to display rupees with `.toFixed(2)`.

## What this spec covers (scope)

**In scope:**
- Indian-only statutory regime (28 states + 8 UTs, central + state)
- Multi-tenant SaaS deployment
- Multi-entity per tenant
- White-collar employees as primary, blue-collar fully supported [`[BLUE-COLLAR]` tags throughout]
- v1 (Months 0–9), v2 (Months 10–18), v3 (Months 19–30) scoping
- Mobile-first ESS with offline support
- AI-augmented modules (Compliance Drift Detector, Notice Responder, Payroll Audit) as v2 wedges

**Out of scope (explicitly):**
- Multi-country payroll (the rules engine is country-aware but only Indian rules are written)
- Workforce planning / succession planning (enterprise-tier, year 3+)
- Full LMS authoring (Year 2 integration with external LMS, not build)
- Engagement platform competing with Lattice/CultureAmp (out of scope)
- Travel & expense at the depth of SAP Concur (Year 3 if at all)
- Vendor / contractor procurement (different product)

## Tech stack assumed throughout

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Server components, edge-friendly, strong DX |
| Mobile | React Native (Expo) | Shared TS types via monorepo |
| Backend | Node.js + Express + TypeScript | Existing Bilpaid expertise, type-safe |
| API | GraphQL (primary) + REST (legacy/integration) | Flexibility for ESS, REST for compliance partners |
| Database | MongoDB Atlas | Schema flexibility for time-versioned data, multi-tenant indexing |
| Cache & queue | Redis + BullMQ | Payroll runs, ECR generation, F&F workflows, AI inference queues |
| Storage | S3-compatible (R2 or AWS) | Documents, payslips, statutory files |
| Search | MongoDB Atlas Search or Meilisearch | Employee search, document search |
| AI | Claude API for reasoning; local Qwen2.5 for routine inference | Cost / capability tradeoff |
| Auth | Custom JWT (access + refresh httpOnly) | Same pattern as Bilpaid |
| Payments | Razorpay / Stripe (for SaaS subscription billing) | Standard Indian SaaS stack |

This stack is assumed in all schemas and design notes that follow.

## Reading order

1. This file (you're here)
2. [01-multi-tenancy.md](./01-multi-tenancy.md) — Foundation of every query
3. [02-multi-entity.md](./02-multi-entity.md) — Foundation of every statutory filing
4. [03-identity-and-rbac.md](./03-identity-and-rbac.md) — Foundation of every access check
5. [05-data-model-conventions.md](./05-data-model-conventions.md) — Foundation of every schema
6. [04-audit-and-compliance-hooks.md](./04-audit-and-compliance-hooks.md) — Foundation of every write
7. [06-statutory-rules-engine.md](./06-statutory-rules-engine.md) — Foundation of every payroll calculation
8. [07-glossary.md](./07-glossary.md) — Reference

Then proceed to `/01-employee/`.
