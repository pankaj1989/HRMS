# Database workflow

## Daily commands

```bash
pnpm db:migrate            # apply pending migrations
pnpm db:doctor             # run the self-check (extensions, RLS, audit chain)
pnpm db:generate           # generate a new migration from schema diffs (drizzle-kit)
```

`pnpm bootstrap` runs `db:migrate` + `db:doctor` automatically after building.

## Adding a new table

1. Declare it in `packages/db/src/schemas/<schema>.ts` (Drizzle TS) — when we add Drizzle-managed schemas in P1.2+.
2. `pnpm db:generate` produces `packages/db/src/migrations/NNNN_<name>.sql`.
3. **Hand-edit** the generated SQL to add: `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, RLS policies, indexes, exclusion constraints — drizzle-kit does not emit these.
4. Append a new entry to `packages/db/src/migrations/meta/_journal.json`.
5. Add a vitest spec under `packages/db/tests/` proving the contract (RLS isolation, exclusion, etc.).
6. Re-run `pnpm db:migrate && pnpm db:doctor` locally.

## Multi-tenant query pattern

Always wrap multi-tenant operations in `withTenantContext`:

```ts
import { createClient, withTenantContext } from '@hrms/db';

const db = createClient();
await withTenantContext(db, { tenantId, actorUserId, correlationId }, async (tx) => {
  // RLS automatically scopes every query to this tenant.
  await tx.query('SELECT * FROM employee.employees');
});
```

Querying outside `withTenantContext` returns no rows (RLS sees `app.tenant_id` empty → policy NULLIF returns NULL → no match) — that's the safety net.

## Hash-chained audit log

```ts
import { appendAuditEntry } from '@hrms/db';

await withTenantContext(db, { tenantId }, async (tx) => {
  await appendAuditEntry(tx, {
    tenantId,
    actorType: 'user',
    actorId,
    action: 'employee.compensation.updated',
    resourceType: 'Employee',
    resourceId: employeeId,
    changes: { ctcAnnual: { from: 1200000, to: 1500000 } },
    correlationId,
  });
});
```

Verify any tenant's chain:

```ts
import { verifyAuditChain } from '@hrms/db';
const r = await verifyAuditChain(db, { tenantId });
console.log(r.valid, r.entriesChecked);
```

## Why every test creates an `app_role`

PostgreSQL's RLS exempts superusers, even with `FORCE ROW LEVEL SECURITY`. The `postgres:16-alpine` testcontainer creates the user (`hrms`) as a superuser by default, so the integration tests would silently bypass every RLS policy. Each test thus creates a non-superuser `app_role` and uses `SET LOCAL ROLE app_role` inside its transactions to make RLS actually apply.

Production rules in P1.2+: per-schema least-privilege roles per spec §6.2.

## Why `pg_advisory_xact_lock` instead of `SELECT ... FOR UPDATE`

`audit.entries` deliberately has no UPDATE/DELETE policy (append-only at the SQL layer). Postgres treats rows as un-lockable when no UPDATE policy permits the lock, so `FOR UPDATE` returns zero rows under RLS. We serialize concurrent appends within a tenant via `pg_advisory_xact_lock(hashtextextended('audit:<tenant>', 0))` — held for the duration of the transaction, no row-locking required.
