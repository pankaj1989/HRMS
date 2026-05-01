import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';
import { createClient, type DbClient } from '../src/client';
import { runDoctor } from '../src/doctor';

describe('runDoctor', () => {
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

  it('reports all checks pass on a fresh migrated DB', async () => {
    const report = await runDoctor(db);
    const failed = report.checks.filter((c) => c.status === 'fail');
    expect(failed).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('check list includes RLS, FORCE RLS, extensions, schemas, audit chain', async () => {
    const report = await runDoctor(db);
    const names = report.checks.map((c) => c.name);
    expect(names).toContain('extensions-installed');
    expect(names).toContain('schemas-present');
    expect(names).toContain('rls-enabled-on-multitenant-tables');
    expect(names).toContain('rls-forced-on-multitenant-tables');
    expect(names).toContain('audit-chain-integrity-sample');
  });
});
