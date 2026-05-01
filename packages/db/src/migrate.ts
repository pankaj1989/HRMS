import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createClient } from './client';

async function run(): Promise<void> {
  const client = createClient();
  const migrationsFolder = path.resolve(import.meta.dirname, 'migrations');
  console.warn(`[migrate] applying from ${migrationsFolder}`);
  await migrate(client.drizzle, { migrationsFolder });
  await client.close();
  console.warn('[migrate] done');
}

run().catch((err: unknown) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
