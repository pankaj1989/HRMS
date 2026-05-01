import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';
import { createClient, type DbClient } from '../src/client';
import { withTenantContext } from '../src/tenant-context';

describe('withTenantContext', () => {
  let pgInst: RunningPg;
  let db: DbClient;

  beforeAll(async () => {
    pgInst = await startPostgres();
    db = createClient({ DATABASE_URL: pgInst.url });
    await migrate(db.drizzle, {
      migrationsFolder: path.resolve(__dirname, '..', 'src', 'migrations'),
    });
  }, 90_000);

  afterAll(async () => {
    await db.close();
    await pgInst.stop();
  });

  it('sets app.tenant_id, app.actor_user_id, app.correlation_id for the duration of the callback', async () => {
    const seen = await withTenantContext(
      db,
      {
        tenantId: '11111111-1111-1111-1111-111111111111',
        actorUserId: '22222222-2222-2222-2222-222222222222',
        correlationId: '33333333-3333-3333-3333-333333333333',
      },
      async (tx) => {
        const r = await tx.query<{ t: string; u: string; c: string }>(
          "SELECT current_setting('app.tenant_id', true) AS t, " +
            "       current_setting('app.actor_user_id', true) AS u, " +
            "       current_setting('app.correlation_id', true) AS c",
        );
        return r.rows[0];
      },
    );

    expect(seen?.t).toBe('11111111-1111-1111-1111-111111111111');
    expect(seen?.u).toBe('22222222-2222-2222-2222-222222222222');
    expect(seen?.c).toBe('33333333-3333-3333-3333-333333333333');
  });

  it('settings are cleared (empty string) outside the callback', async () => {
    await withTenantContext(
      db,
      { tenantId: '11111111-1111-1111-1111-111111111111' },
      async () => undefined,
    );
    const r = await db.execute<{ t: string }>("SELECT current_setting('app.tenant_id', true) AS t");
    expect(r.rows[0]?.t).toBe('');
  });

  it('rolls back on thrown error and propagates', async () => {
    await expect(
      withTenantContext(db, { tenantId: '11111111-1111-1111-1111-111111111111' }, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
