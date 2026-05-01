import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type DbClient } from '../src/client';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';

describe('createClient', () => {
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

  it('returns a working drizzle client backed by pg.Pool', async () => {
    const result = await db.execute<{ now: Date }>('SELECT NOW() AS now');
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.now).toBeInstanceOf(Date);
  });

  it('exposes db.pool for raw queries', async () => {
    const r = await db.pool.query('SELECT 42 AS answer');
    expect(r.rows[0]?.answer).toBe(42);
  });
});
