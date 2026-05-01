import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';
import { createClient, type DbClient } from '../src/client';
import { withTenantContext } from '../src/tenant-context';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';

/**
 * RLS only applies to NON-superuser connections (FORCE RLS bypasses table-owner
 * exemption but not superuser exemption). The testcontainer creates `hrms` as
 * superuser by default, so each test enters its tenant transaction and
 * immediately drops to `app_role` via SET LOCAL ROLE.
 */
async function setRoleAppRole(tx: import('pg').PoolClient): Promise<void> {
  await tx.query('SET LOCAL ROLE app_role');
}

describe('RLS — demo.tenant_data', () => {
  let pgInst: RunningPg;
  let db: DbClient;

  beforeAll(async () => {
    pgInst = await startPostgres();
    db = createClient({ DATABASE_URL: pgInst.url });
    await migrate(db.drizzle, {
      migrationsFolder: path.resolve(__dirname, '..', 'src', 'migrations'),
    });

    // Create non-superuser role with the privileges an app role needs.
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

  it('tenant A can insert + read its own row', async () => {
    const got = await withTenantContext(db, { tenantId: TENANT_A }, async (tx) => {
      await setRoleAppRole(tx);
      await tx.query("INSERT INTO demo.tenant_data (tenant_id, payload) VALUES ($1, 'hello-A')", [
        TENANT_A,
      ]);
      const r = await tx.query<{ payload: string }>(
        'SELECT payload FROM demo.tenant_data ORDER BY created_at DESC LIMIT 1',
      );
      return r.rows[0]?.payload;
    });
    expect(got).toBe('hello-A');
  });

  it('tenant B cannot SELECT tenant A data (RLS hides it)', async () => {
    const got = await withTenantContext(db, { tenantId: TENANT_B }, async (tx) => {
      await setRoleAppRole(tx);
      const r = await tx.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM demo.tenant_data',
      );
      return r.rows[0]?.count;
    });
    expect(got).toBe('0');
  });

  it('tenant B cannot INSERT a row claiming tenant A (WITH CHECK blocks it)', async () => {
    await expect(
      withTenantContext(db, { tenantId: TENANT_B }, async (tx) => {
        await setRoleAppRole(tx);
        await tx.query("INSERT INTO demo.tenant_data (tenant_id, payload) VALUES ($1, 'forged')", [
          TENANT_A,
        ]);
      }),
    ).rejects.toThrow(/row-level security|new row violates row-level security/i);
  });

  it('non-superuser without tenant context sees nothing (RLS filters all rows)', async () => {
    // Use a fresh client running as app_role (non-superuser); no app.tenant_id set.
    const conn = await db.pool.connect();
    try {
      await conn.query('SET ROLE app_role');
      const r = await conn.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM demo.tenant_data',
      );
      expect(r.rows[0]?.count).toBe('0');
    } finally {
      await conn.query('RESET ROLE').catch(() => undefined);
      conn.release();
    }
  });
});
