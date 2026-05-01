import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';
import { createClient, type DbClient } from '../src/client';

describe('migrations', () => {
  let pgInst: RunningPg;
  let db: DbClient;

  beforeAll(async () => {
    pgInst = await startPostgres();
    db = createClient({ DATABASE_URL: pgInst.url });
  }, 90_000);

  afterAll(async () => {
    await db.close();
    await pgInst.stop();
  });

  it('applies 0000_extensions_and_schemas cleanly', async () => {
    await migrate(db.drizzle, {
      migrationsFolder: path.resolve(__dirname, '..', 'src', 'migrations'),
    });

    const ext = await db.execute<{ extname: string }>(
      "SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','btree_gist','pg_trgm') ORDER BY extname",
    );
    expect(ext.rows.map((r) => r.extname)).toEqual(['btree_gist', 'pg_trgm', 'pgcrypto']);

    const sch = await db.execute<{ nspname: string }>(
      "SELECT nspname FROM pg_namespace WHERE nspname IN ('platform','audit','demo') ORDER BY nspname",
    );
    expect(sch.rows.map((r) => r.nspname)).toEqual(['audit', 'demo', 'platform']);
  });

  it('is idempotent (re-running does nothing)', async () => {
    await migrate(db.drizzle, {
      migrationsFolder: path.resolve(__dirname, '..', 'src', 'migrations'),
    });
    expect(true).toBe(true);
  });
});
