import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { loadEnv, type DbEnv } from './env';

export interface DbClient {
  drizzle: NodePgDatabase;
  pool: pg.Pool;
  execute: <Row extends pg.QueryResultRow = pg.QueryResultRow>(
    query: string,
    params?: unknown[],
  ) => Promise<{ rows: Row[] }>;
  close: () => Promise<void>;
}

export function createClient(envSource?: Partial<DbEnv>): DbClient {
  const env = loadEnv({ ...process.env, ...envSource });

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000,
  });

  const db = drizzle(pool);

  return {
    drizzle: db,
    pool,
    async execute<Row extends pg.QueryResultRow = pg.QueryResultRow>(
      query: string,
      params?: unknown[],
    ) {
      const r = await pool.query<Row>(query, params as unknown[]);
      return { rows: r.rows };
    },
    async close() {
      await pool.end();
    },
  };
}

export { sql };
