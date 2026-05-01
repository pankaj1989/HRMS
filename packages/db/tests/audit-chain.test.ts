import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';
import { createClient, type DbClient } from '../src/client';
import { withTenantContext } from '../src/tenant-context';
import { appendAuditEntry, verifyAuditChain } from '../src/audit-chain';

const TENANT = '11111111-1111-1111-1111-111111111111';
const ACTOR = '22222222-2222-2222-2222-222222222222';

describe('audit hash chain', () => {
  let pgInst: RunningPg;
  let db: DbClient;

  beforeAll(async () => {
    pgInst = await startPostgres();
    db = createClient({ DATABASE_URL: pgInst.url });
    await migrate(db.drizzle, {
      migrationsFolder: path.resolve(__dirname, '..', 'src', 'migrations'),
    });

    // Non-superuser role for RLS tests (testcontainer's hrms is superuser).
    await db.execute('CREATE ROLE app_role NOLOGIN');
    await db.execute('GRANT USAGE ON SCHEMA demo, audit, platform TO app_role');
    await db.execute(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA demo, audit, platform TO app_role',
    );
    await db.execute(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA demo, audit, platform GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role',
    );
  }, 90_000);

  afterAll(async () => {
    await db.close();
    await pgInst.stop();
  });

  it('first entry has prev_hash = 32 zero bytes', async () => {
    const id = await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      return appendAuditEntry(tx, {
        tenantId: TENANT,
        actorType: 'user',
        actorId: ACTOR,
        action: 'employee.created',
        resourceType: 'Employee',
        resourceId: '33333333-3333-3333-3333-333333333333',
      });
    });

    const r = await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      return tx.query<{ prev_hash: Buffer; this_hash: Buffer }>(
        'SELECT prev_hash, this_hash FROM audit.entries WHERE id = $1',
        [id],
      );
    });
    expect(r.rows[0]?.prev_hash.equals(Buffer.alloc(32))).toBe(true);
    expect(r.rows[0]?.this_hash.length).toBe(32);
  });

  it('second entry chains to first', async () => {
    let firstHash: Buffer | undefined;

    await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      const r = await tx.query<{ this_hash: Buffer }>(
        'SELECT this_hash FROM audit.entries WHERE tenant_id = $1 ORDER BY occurred_at DESC LIMIT 1',
        [TENANT],
      );
      firstHash = r.rows[0]?.this_hash;
    });

    const secondId = await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      return appendAuditEntry(tx, {
        tenantId: TENANT,
        actorType: 'user',
        actorId: ACTOR,
        action: 'employee.updated',
        resourceType: 'Employee',
        resourceId: '33333333-3333-3333-3333-333333333333',
      });
    });

    const got = await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      return tx.query<{ prev_hash: Buffer }>('SELECT prev_hash FROM audit.entries WHERE id = $1', [
        secondId,
      ]);
    });
    expect(got.rows[0]?.prev_hash.equals(firstHash!)).toBe(true);
  });

  it('verifyAuditChain returns valid=true for an intact chain', async () => {
    // verifyAuditChain runs as superuser hrms (no app.tenant_id needed; reads everything).
    const result = await verifyAuditChain(db, { tenantId: TENANT });
    expect(result.valid).toBe(true);
    expect(result.entriesChecked).toBeGreaterThanOrEqual(2);
  });

  it('verifyAuditChain detects tampering', async () => {
    // Manually corrupt one entry's payload as superuser (bypassing append-only intent).
    await db.execute(
      "UPDATE audit.entries SET action = 'tampered' WHERE tenant_id = $1 AND action = 'employee.updated'",
      [TENANT],
    );
    const result = await verifyAuditChain(db, { tenantId: TENANT });
    expect(result.valid).toBe(false);
    expect(result.firstBrokenAt).toBeDefined();
  });
});
