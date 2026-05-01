# 05 — Data Model Conventions

## Purpose

This file defines schema patterns used consistently across every collection. Following these patterns avoids the "every developer makes their own decisions" problem that makes a 2-year-old codebase impossible to navigate.

## Universal document shape

Every domain document has these common fields, in this order:

```typescript
interface BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;                       // multi-tenant isolation
  entityId?: ObjectId;                      // multi-entity isolation (some collections are tenant-only)

  // ... domain-specific fields go here ...

  // metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;                      // ref Users
  updatedBy: ObjectId;
  version: number;                          // optimistic concurrency control

  // soft delete
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
  deletionReason?: string;
}
```

Rules:
- `_id` and `tenantId` are mandatory and immutable
- `entityId` is mandatory for entity-scoped collections, absent for tenant-scoped
- `version` starts at 1, increments on every update
- `isDeleted=true` documents are excluded from default queries via repository middleware

## Time-versioning pattern

The single most important pattern in the HRMS. Many domain entities require history retention with point-in-time queryability.

### Pattern A — Effective-dated record (preferred for most cases)

The current state plus a history collection.

```typescript
// Current state
interface Employee {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeCode: string;                     // immutable employee number
  // ... current fields ...
  effectiveFrom: Date;                      // start date of current values
}

// Historical versions
interface EmployeeVersion {
  _id: ObjectId;
  tenantId: ObjectId;
  employeeId: ObjectId;                     // ref Employee
  effectiveFrom: Date;
  effectiveTo: Date;                        // null for current version
  // ... full snapshot of fields at this version ...
  changedBy: ObjectId;
  changeReason?: string;
  changeApprovalId?: ObjectId;
}
```

Reading point-in-time:
```typescript
async function getEmployeeAt(employeeId: ObjectId, asOf: Date): Promise<Employee> {
  // 1. Try current
  const current = await Employee.findOne({ _id: employeeId });
  if (current.effectiveFrom <= asOf) return current;

  // 2. Find historical version
  return EmployeeVersion.findOne({
    employeeId,
    effectiveFrom: { $lte: asOf },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gt: asOf } }],
  });
}
```

This is the pattern for: Employee record, Compensation, Salary Structure, Reporting Manager, Designation, Department, Location, Bank Account.

### Pattern B — Event-sourced (for high-frequency mutations)

When changes happen many times per day and you mostly want a stream of events.

```typescript
interface AttendanceEvent {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  employeeId: ObjectId;
  eventType: 'punch-in' | 'punch-out' | 'break-start' | 'break-end' | 'regularization';
  occurredAt: Date;
  // ... event payload ...
}
```

Current state is computed from events (with caching for performance). This is the pattern for: Attendance, Notification History, Leave Balance Movements.

### Pattern C — Snapshot table (for derived state)

Computed periodically and stored as snapshots.

```typescript
interface PayrollRun {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  payrollPeriodId: ObjectId;
  status: 'draft' | 'computing' | 'review' | 'locked' | 'disbursed';
  // ... payroll-run-level fields ...
  snapshotAt: Date;                          // moment of computation
}

interface PayrollLine {
  _id: ObjectId;
  tenantId: ObjectId;
  payrollRunId: ObjectId;
  employeeId: ObjectId;
  // ... computed values ...
  // these are immutable once payrollRun is locked
}
```

This is the pattern for: Payroll Run, Form 16 generations, Statutory Filings, F&F Statements.

## Decision tree for picking a pattern

```
Does the entity have history/versioning needs?
  No → simple BaseDocument (Pattern: none)
  Yes →
    Is it a master record changed occasionally?
      Yes → Pattern A (effective-dated)
    Is it a high-frequency event stream?
      Yes → Pattern B (event-sourced)
    Is it a periodic computed snapshot?
      Yes → Pattern C (snapshot table)
```

## Identifiers

### `_id` (system ID)

MongoDB ObjectId. Internal use only. Never shown to end users.

### Domain code

Many entities have a human-readable code displayed in the UI:

- `Employee.employeeCode` — e.g., `ACM-EMP-0042`
- `Entity.entityCode` — e.g., `ACM-IND` (auto-generated from short name)
- `PayrollRun.runCode` — e.g., `ACM-IND-PAY-202604` (entity + month)
- `LeaveApplication.leaveCode` — e.g., `LV-2026-04-001234`
- `JobRequisition.requisitionCode` — e.g., `REQ-2026-0089`

Codes are unique within tenant (or within entity for entity-scoped resources). Generated via a counter pattern using a `Counters` collection with atomic `findOneAndUpdate`.

```typescript
async function nextCode(tenantId: ObjectId, codeType: string, format: string): Promise<string> {
  const counter = await Counters.findOneAndUpdate(
    { tenantId, codeType },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return interpolate(format, { ...counter });
}
```

`[OPEN]` Should employee codes be configurable per tenant? Yes — tenant chooses prefix, padding, separator. Default `{ENTITY_SHORTCODE}-EMP-{0000}`.

### Statutory IDs

PAN, Aadhaar, UAN, PF#, ESI#, etc. are stored encrypted, treated as identifiers but never as primary keys. See [/01-employee/04-statutory-ids.md](../01-employee/04-statutory-ids.md).

## Money fields

Reiterating the rule from [00-overview.md](./00-overview.md):

```typescript
// ✅ Correct
amount: Decimal128                          // MongoDB Decimal128

// ❌ Wrong
amount: number                              // double-precision float, will cause errors
amount: string                              // looks safe but creates parsing complexity
```

For storage in arithmetic-heavy hot paths (payroll engine), can also use:

```typescript
// Integer paise
amountPaise: number                         // integer, no decimal precision issue
// e.g., ₹15,000.50 = 1500050 paise
```

Convention: end-user-facing amounts in API responses are formatted strings (`"₹15,000.50"`). Internal API uses Decimal128 or paise integer. Database stores Decimal128 with explicit precision.

## Date and time fields

Three different concepts that get conflated:

| Concept | Type | Example | Use |
|---|---|---|---|
| Calendar date | string `YYYY-MM-DD` | `"2026-04-29"` | Employee DOB, holiday date, payroll period |
| Date-time UTC | Date (ISO) | `2026-04-29T08:30:00.000Z` | Login time, audit log timestamp |
| Local time | string `HH:mm` | `"09:30"` | Shift start, biometric punch |
| Date with TZ | object `{ date, tz }` | `{ "2026-04-29", "Asia/Kolkata" }` | Attendance event in employee's local time |

Rules:
- Server time is always UTC
- Display layer converts to user's timezone
- Calendar dates are strings, not Date objects (avoids timezone bugs around midnight)
- Indian operations standardize on `Asia/Kolkata` (IST, UTC+5:30) by default; per-employee timezone supported for distributed teams

## Address fields

Standardized address shape:

```typescript
interface Address {
  type?: 'permanent' | 'current' | 'office' | 'registered' | 'communication';
  line1: string;
  line2?: string;
  area?: string;                             // landmark / locality
  city: string;
  district?: string;
  state: StateCode;                          // 2-letter state code
  pincode: string;                           // 6-digit
  country: 'IN';                             // always IN in v1
  geo?: { lat: number; lng: number };        // optional, for GPS attendance / mapping
}
```

State codes are the 2-letter codes used in PAN/GSTIN. See [07-glossary.md](./07-glossary.md).

## Phone numbers

Stored in E.164 format: `+919876543210`. Display layer strips country code if not relevant. Validation: must be a valid mobile number for the country.

`[VERIFY]` Indian mobile numbers: 10 digits, starts with 6/7/8/9, prefixed with `+91`. Landlines (now rare) have variable length and STD codes.

## Email addresses

Stored lowercased. Indexed unique within tenant. Validation per RFC 5321/5322 + DNS MX check at signup.

## Boolean conventions

- `is*` for state: `isActive`, `isDeleted`, `isPrimary`
- `has*` for capability: `hasPfRegistration`, `hasManagerialApproval`
- Avoid `isNot*` — too easy to misread negations

## Soft delete vs hard delete

Default: **soft delete** for all domain entities. Set `isDeleted=true`, retain row.

Hard delete only for:
- Tenant cancellation after retention period (DPDPA)
- Specific PII purge requests under DPDPA

Soft-deleted documents are excluded from queries via repository default. To query including soft-deleted (audit, support), explicit flag.

`[DECISION]` Soft-deleted documents do NOT count toward billing employee count.

## Schema migrations

Mongo is schemaless but we will have schema evolution. Strategy:

- Schema version field on each collection: `_schemaVersion: number`
- Migration scripts in `/migrations/` versioned with timestamps
- Backward-compatible additive changes are deployed without migration
- Breaking changes (renaming, restructuring) require:
  1. Deploy code that reads both old and new shape, writes new shape
  2. Background job migrates old → new
  3. Deploy code that only reads new shape
- Migration job is idempotent and tenant-scoped (can pause / resume per tenant)

## Indexes

Mandatory indexes per collection (in addition to domain-specific):

```typescript
// Every collection
{ tenantId: 1, isDeleted: 1, updatedAt: -1 }

// Entity-scoped collections additionally
{ tenantId: 1, entityId: 1, isDeleted: 1, updatedAt: -1 }
```

Domain-specific indexes are documented in each module's spec.

`[DECISION]` We use compound indexes aggressively. MongoDB supports multi-key indexes on arrays. Sparse indexes for optional fields. Partial indexes (`partialFilterExpression`) for `isDeleted: false` to keep indexes lean.

## Query conventions

All queries go through repository layer. Direct `Model.find()` calls in business logic are forbidden.

```typescript
// Repository defines the queries
class EmployeeRepository extends BaseRepository<Employee> {
  async findByCode(code: string): Promise<Employee | null> {
    return this.findOne({ employeeCode: code });
    // tenantId, entityId, isDeleted=false injected by base
  }

  async findActiveAt(asOf: Date): Promise<Employee[]> {
    return this.find({
      'employment.startedAt': { $lte: asOf },
      $or: [
        { 'employment.endedAt': null },
        { 'employment.endedAt': { $gt: asOf } },
      ],
    });
  }
}
```

## Pagination

Cursor-based pagination using `_id` (or domain code):

```typescript
interface PaginatedQuery {
  limit: number;                             // max 100
  cursor?: string;                            // base64-encoded last _id from previous page
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;                        // optional, expensive
}
```

Offset pagination (`skip`/`limit`) is only used when total count and page jumping are essential (e.g., admin search). For most lists, cursor pagination scales better.

## File and document references

Documents are stored in S3-compatible storage. References in MongoDB:

```typescript
interface DocumentReference {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId?: ObjectId;
  employeeId?: ObjectId;
  documentType: string;                       // 'offer-letter', 'pan-card', 'form-16', etc.
  documentCategory: 'kyc' | 'employment' | 'payroll' | 'compliance' | 'performance';

  // storage
  storageKey: string;                         // s3 path: tenants/{tid}/employees/{eid}/{filename}
  storageProvider: 's3' | 'r2';
  fileName: string;                           // original filename
  mimeType: string;
  sizeBytes: number;
  hash: string;                               // SHA-256 of contents (integrity)

  // confidentiality
  isConfidential: boolean;                    // requires special permission to view
  encryptionKeyId?: string;                   // for additionally encrypted documents

  // signing
  isDigitallySigned: boolean;
  signatureProvider?: 'aadhaar-esign' | 'docusign' | 'leegality';
  signedAt?: Date;
  signatureCertificate?: string;

  // lifecycle
  uploadedAt: Date;
  uploadedBy: ObjectId;
  expiresAt?: Date;                           // for time-bound documents (passport, license)

  isDeleted: boolean;
}
```

Files in S3 are encrypted at rest with SSE-KMS. Tenant-prefixed paths prevent cross-tenant URL leak.

## Internationalization fields

For tenant-customizable text (custom field labels, policy names, email templates):

```typescript
interface I18nString {
  en: string;                                 // mandatory
  hi?: string;
  ta?: string;
  te?: string;
  mr?: string;
  bn?: string;
  kn?: string;
  gu?: string;
  ml?: string;
  pa?: string;
}
```

Default locale is `en`. Falls back to `en` if requested locale missing.

## Computed / cached fields

Some fields are computed and cached for performance. Convention:

- Stored in same document with prefix `cached_*` or in a separate `*Cache` collection
- Always have `cachedAt` and `cacheVersion`
- Recomputed on demand or via scheduled jobs
- Marked with comment "DERIVED" in schema

Examples:
- `Employee.cached_currentManagerId` — derived from latest employment record
- `Employee.cached_currentSalaryCtc` — derived from latest compensation record

Never rely on cached fields for compliance calculations. Always recompute from source for payroll, statutory filings, and reports.

## Validation layer

Validation happens at three layers:

1. **API layer** (zod / joi): syntactic validation on incoming requests
2. **Service layer**: business logic validation (e.g., "cannot terminate employee while pending payroll")
3. **Schema layer**: MongoDB schema validation as last line of defense

Errors propagate up with structured error objects, not strings.

## Open questions

`[OPEN]` Whether to use MongoDB schema validation actively. Pro: catches bad writes. Con: locks schema, migrations harder. Recommended: enable schema validation in `warn` mode in production, `strict` in staging.

`[OPEN]` Time-versioning at field-level vs document-level. Document-level is simpler (snapshot full doc); field-level is cheaper at scale. v1: document-level. v3: revisit if storage cost becomes painful.

`[OPEN]` Cross-collection foreign key integrity. Mongo doesn't enforce. Application layer responsibility. Should we add a periodic integrity-check job? Yes, for critical references (employee → entity, payroll line → employee).

## Cross-references

- See [04-audit-and-compliance-hooks.md](./04-audit-and-compliance-hooks.md) for audit log conventions
- See [06-statutory-rules-engine.md](./06-statutory-rules-engine.md) for versioned rules pattern
- Every module's spec follows these conventions
