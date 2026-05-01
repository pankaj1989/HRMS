import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { startPostgres, type RunningPg } from '../src/test-utils/postgres-container';

describe('postgres-container helper', () => {
  let pgInst: RunningPg;
  let client: pg.Client;

  beforeAll(async () => {
    pgInst = await startPostgres();
    client = new pg.Client({ connectionString: pgInst.url });
    await client.connect();
  }, 90_000);

  afterAll(async () => {
    await client.end();
    await pgInst.stop();
  });

  it('boots and accepts a SELECT 1', async () => {
    const result = await client.query<{ ok: number }>('SELECT 1 AS ok');
    expect(result.rows[0]?.ok).toBe(1);
  });
});
