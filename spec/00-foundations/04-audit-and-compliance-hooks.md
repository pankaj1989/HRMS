# 04 — Audit Log & Compliance Hooks

## Purpose

In every other SaaS product, the audit log is for security teams. In HRMS, the audit log is **legal evidence**. This file defines the audit subsystem as a tamper-evident, append-only stream that satisfies:

1. EPFO / ESIC / Income Tax / labor inspector audits (statutory requirement)
2. Employee disputes and tribunals (evidentiary use)
3. Internal controls (separation of duties, four-eyes principle)
4. SOC 2 / ISO 27001 / DPDPA 2023 compliance certifications

## What gets audited

The default rule: **every write goes to the audit log**. Reads of sensitive fields also go to the audit log. Reads of non-sensitive fields do not.

### Always-audited writes

- Any change to an Employee record (master, employment, compensation)
- Any salary structure change
- Any payroll input change
- Payroll run, lock, unlock, re-run
- Any statutory filing (PF ECR, ESI Challan, Form 24Q, Form 16)
- Any approval / rejection action
- Any leave application, approval, cancellation
- Any document upload, deletion
- Any user/role/permission change
- Any tenant config change
- Any login (successful and failed)
- Any impersonation start/end
- Any data export

### Always-audited reads

- Read of `employee.kyc.aadhaar`
- Read of `employee.kyc.pan` (when un-redacted)
- Read of `employee.compensation.*` (when un-redacted)
- Read of `bankAccount.accountNumber`
- Generation of Form 16
- Generation of payslip
- Statutory file download (ECR, 24Q, etc.)

### Not audited (too noisy)

- Reads of basic employee directory data (name, email, designation)
- Attendance reads
- Leave balance reads
- Dashboard analytics

## Audit log schema

```typescript
interface AuditLogEntry {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId?: ObjectId;                       // null for tenant-level events

  // who
  actor: {
    type: 'user' | 'system' | 'integration' | 'scheduled-job' | 'api';
    userId?: ObjectId;                       // if type=user
    serviceAccountId?: ObjectId;             // if type=integration
    impersonatedBy?: ObjectId;               // if support is impersonating
    ipAddress?: string;
    userAgent?: string;
    sessionId?: ObjectId;
  };

  // what
  action: string;                            // 'employee.compensation.update', 'payroll.run.lock'
  resource: {
    type: string;                            // 'Employee', 'PayrollRun', etc.
    id: ObjectId;
    name?: string;                           // for human readability — denormalized
  };

  // change details
  changes?: {
    field: string;                           // dotpath
    oldValue: any;                           // redacted if sensitive
    newValue: any;                           // redacted if sensitive
    oldValueHash?: string;                   // for sensitive fields, hash instead of value
    newValueHash?: string;
  }[];

  // context
  reason?: string;                           // optional — user-provided reason
  approvalId?: ObjectId;                     // if action came through approval workflow
  workflowInstanceId?: ObjectId;
  parentEventId?: ObjectId;                  // for chained events (e.g., payroll run produced payslips)

  // when
  occurredAt: Date;                          // event time
  recordedAt: Date;                          // when the log entry was written (may differ if async)

  // tamper-evidence
  sequenceNumber: number;                    // monotonically increasing per tenant
  previousEventHash: string;                 // SHA-256 of previous event's hash
  eventHash: string;                         // SHA-256 of (sequenceNumber + occurredAt + actor + action + resource + changes + previousEventHash)

  // status
  outcome: 'success' | 'failure' | 'partial';
  errorMessage?: string;

  // legal hold
  legalHold?: boolean;                       // mark for retention beyond standard period
  legalHoldReason?: string;
}
```

## Indexes

```typescript
// Primary lookup: by tenant + time range
{ tenantId: 1, occurredAt: -1 }

// Lookup by actor (who did what)
{ tenantId: 1, 'actor.userId': 1, occurredAt: -1 }

// Lookup by resource (what happened to this employee)
{ tenantId: 1, 'resource.type': 1, 'resource.id': 1, occurredAt: -1 }

// Action category lookup (all payroll runs, all login failures)
{ tenantId: 1, action: 1, occurredAt: -1 }

// Sequence integrity check
{ tenantId: 1, sequenceNumber: 1 }, unique
```

## Tamper evidence

The audit log is a **hash chain**:

```
event[N].previousEventHash = event[N-1].eventHash
event[N].eventHash = SHA256(event[N].sequenceNumber || event[N].occurredAt || event[N].actor || ... || event[N-1].eventHash)
```

A daily job verifies the chain integrity end-to-end. Any break (a row missing, modified, or inserted out of order) is detected and alerted.

`[DECISION]` We do NOT use blockchain, distributed ledger, or per-event digital signatures in v1. They add complexity disproportionate to the threat model. The hash chain plus access controls (no user has DB write access except the service account) plus daily integrity verification is sufficient for SOC 2 type II.

`[v3]` For enterprise tenants requiring blockchain anchoring for legal cases, integrate with a notarization service (e.g., Stampery, OpenTimestamps) that periodically anchors the head of the chain to Bitcoin or similar. Optional add-on.

## Sensitive value handling

When a field is sensitive (PAN, Aadhaar, salary), the audit log stores **hashes**, not raw values:

```typescript
// Bad
{ field: 'kyc.aadhaar', oldValue: '123456781234', newValue: '987654321234' }

// Good
{
  field: 'kyc.aadhaar',
  oldValueHash: 'sha256:a1b2c3...',
  newValueHash: 'sha256:d4e5f6...',
  // No raw value stored in audit log
}
```

Why: the audit log is queried by support, audited by external auditors, exported in legal proceedings. We don't want raw Aadhaar in those exports.

For evidence purposes ("what was Pankaj's salary on March 14, 2024"), the actual value is reconstructed from the time-versioned employee record (covered in [05-data-model-conventions.md](./05-data-model-conventions.md)), not from the audit log. The audit log only proves a change occurred, not what the value was.

## Sensitive read logging

When a sensitive field is read, we log the read but NOT the value read:

```typescript
{
  action: 'employee.compensation.read',
  resource: { type: 'Employee', id: ObjectId('...') },
  // no changes field for read events
  outcome: 'success'
}
```

This proves "user X looked at employee Y's salary at time Z" without storing the salary in the log.

## Retention

| Event type | Retention |
|---|---|
| Login / logout / failed login | 90 days |
| Read events (sensitive) | 1 year |
| Write events on Employee | 7 years (Income Tax Act § 230) |
| Payroll runs | 7 years (statutory requirement) |
| Statutory filings | 8 years `[VERIFY]` |
| User/role/permission changes | 7 years |
| Tenant config changes | 7 years |
| Legal hold flagged events | indefinite until released |

After retention, events are exported to cold storage (S3 Glacier) and removed from MongoDB.

## Performance considerations

The audit log will grow large. A 500-employee tenant generates roughly:
- ~10,000 attendance events/day (auto-write — but most are not audited; only changes/regularizations are)
- ~50–100 leave events/day
- ~5–10 admin actions/day
- 1 payroll run/month producing ~5,000 derived events (but logged as one parent event with child references)

`[DECISION]` Use a separate MongoDB database for audit log: `auditlog-{shard}` with sharding by tenantId. Keeps the operational DB lean. v2 may move to a dedicated time-series store like ClickHouse or TimescaleDB for analytics queries against audit data.

## Async vs sync logging

Audit events are written **synchronously** in the same transaction as the business operation. Reasoning:

- If a payroll run succeeds but the audit log write fails, we have inconsistent state
- If an auditor asks "did this run happen?" we need certainty

For high-volume read-only events (attendance reads on dashboard), async batched logging is acceptable. Mark these with `recordedAt > occurredAt`.

## Compliance hooks

Beyond raw audit, certain events trigger **compliance hooks** that produce structured outputs:

### Hook 1 — Statutory event timeline

Every event with statutory significance (employment start, salary change, statutory ID update, payroll run, statutory filing) is mirrored to a per-employee `StatutoryTimeline` collection for fast retrieval during audits:

```typescript
interface StatutoryTimelineEvent {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeId: ObjectId;

  category: 'employment' | 'compensation' | 'pf' | 'esi' | 'tds' | 'pt' | 'lwf'
          | 'gratuity' | 'bonus' | 'leave' | 'attendance' | 'document';
  eventType: string;                         // 'pf.contribution.deposited', 'tax.tds.deducted'
  description: string;                       // human-readable
  occurredAt: Date;

  // financial (if applicable)
  amount?: Decimal128;
  currency?: 'INR';

  // statutory (if applicable)
  challanNumber?: string;
  filingReferenceNumber?: string;

  // links to source
  sourceAuditEventId: ObjectId;
  sourceDocumentId?: ObjectId;               // e.g., PF challan PDF in S3

  createdAt: Date;
}
```

Use case: "Show me everything that happened with employee EMP123's PF in FY 2024-25" — single fast query against the timeline.

### Hook 2 — Inspector mode

A special read-only role `inspector` exists for statutory inspectors. When an inspector logs in:

- Time-bound access (default 4 hours, configurable up to 24)
- Scoped to one or more entities specified at login
- Every action logged with `actor.type='inspector'`
- Inspector sees: employee data (subject to redaction rules), payroll registers, statutory filings, audit log itself, statutory timeline
- Inspector cannot see: forward-looking data, hiring pipeline, salary revisions in draft, performance reviews

The "Inspection Pack" (covered in [/04-compliance/12-statutory-registers.md](../04-compliance/12-statutory-registers.md), Phase 3) is a one-click bundle that pre-generates everything an inspector typically asks for, with audit-log linkage.

### Hook 3 — Notice trigger ingestion

When customer receives an EPFO/ESIC/IT department notice, they upload it. The system:

1. OCR + AI classification → notice type
2. Extract employee IDs / PF numbers / period referenced in the notice
3. Pull the relevant statutory timeline events
4. Pull the relevant audit log entries
5. Bundle as evidence pack

This is the basis of the AI Notice Responder wedge ([/04-compliance/](../04-compliance/), Phase 3).

## Audit log access UI

For tenant admins, the audit log is browseable with:

- Filter by actor (user)
- Filter by resource type
- Filter by resource ID (e.g., "show me everything that ever happened to employee EMP123")
- Filter by action
- Filter by time range
- Filter by outcome (failures only)
- Export to CSV/JSON for offline analysis

For super admins (internal staff), additional filters:
- Filter by tenant (cross-tenant search, only with explicit reason logged)
- Filter by impersonation events
- Anomaly detection alerts

## Anomaly detection (v2)

`[v2]` ML-based anomaly detection on audit stream:

- Login from unusual geography
- Bulk salary changes by a single user
- Off-hours payroll runs
- Mass employee data export
- Privilege escalation patterns

Triggers email alerts to tenant admin + internal security team.

## Open questions

`[OPEN]` Per-tenant retention policy override. Some enterprises want longer retention. Default is statutory minimum; tenant can extend up to 10 years; we charge for storage.

`[OPEN]` Customer-controlled audit log export. Should tenant admins be able to export their full audit log unilaterally? Yes — DPDPA right of access. Implementation: signed URL, async generation.

`[OPEN]` Replay attack prevention on hash chain. If someone gains DB write access, they could rewrite the chain. Mitigation: periodically push chain head hash to an external write-only store (e.g., a tamper-evident log service or S3 with object lock). v2 hardening.

`[OPEN]` Should reads of basic employee data (e.g., manager viewing reportee profile) be audited at all? Default no, but configurable per tenant for paranoid customers. Adds load.

## Cross-references

- See [01-multi-tenancy.md](./01-multi-tenancy.md) for tenant scoping
- See [03-identity-and-rbac.md](./03-identity-and-rbac.md) for actor model
- See [05-data-model-conventions.md](./05-data-model-conventions.md) for time-versioning that complements audit log
- See [/04-compliance/12-statutory-registers.md](../04-compliance/12-statutory-registers.md) (Phase 3) for Inspector Pack
