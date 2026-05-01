import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';
import { createClient, type DbClient } from '../src/client';
import { withTenantContext } from '../src/tenant-context';

const TENANT = '11111111-1111-1111-1111-111111111111';
const EMPLOYEE = '99999999-9999-9999-9999-999999999999';

describe('demo.compensation — bitemporal exclusion', () => {
  let pgInst: RunningPg;
  let db: DbClient;

  beforeAll(async () => {
    pgInst = await startPostgres();
    db = createClient({ DATABASE_URL: pgInst.url });
    await migrate(db.drizzle, {
      migrationsFolder: path.resolve(__dirname, '..', 'src', 'migrations'),
    });

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

  it('inserts a base compensation row', async () => {
    await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      await tx.query(
        `INSERT INTO demo.compensation (tenant_id, employee_id, ctc_annual, valid_from)
         VALUES ($1, $2, 1200000, '2026-01-01')`,
        [TENANT, EMPLOYEE],
      );
    });
  });

  it('rejects an overlapping valid range at the same decision time', async () => {
    await expect(
      withTenantContext(db, { tenantId: TENANT }, async (tx) => {
        await tx.query('SET LOCAL ROLE app_role');
        await tx.query(
          `INSERT INTO demo.compensation (tenant_id, employee_id, ctc_annual, valid_from)
           VALUES ($1, $2, 1500000, '2026-06-01')`,
          [TENANT, EMPLOYEE],
        );
      }),
    ).rejects.toThrow(
      /conflicting key value violates exclusion constraint|compensation_no_overlap/i,
    );
  });

  it('accepts a non-overlapping later valid period after closing the prior', async () => {
    await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      await tx.query(
        `UPDATE demo.compensation
            SET valid_to = '2026-06-01', superseded_at = now()
          WHERE employee_id = $1 AND valid_to = 'infinity'`,
        [EMPLOYEE],
      );
      await tx.query(
        `INSERT INTO demo.compensation (tenant_id, employee_id, ctc_annual, valid_from)
         VALUES ($1, $2, 1500000, '2026-06-01')`,
        [TENANT, EMPLOYEE],
      );
    });

    const r = await withTenantContext(db, { tenantId: TENANT }, async (tx) => {
      await tx.query('SET LOCAL ROLE app_role');
      return tx.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM demo.compensation WHERE employee_id = $1',
        [EMPLOYEE],
      );
    });
    expect(r.rows[0]?.count).toBe('2');
  });
});
