import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createClient } from './client';

// Works under both CJS (tsx) and ESM. __dirname is defined in CJS;
// fall back to fileURLToPath(import.meta.url) for ESM.
declare const __dirname: string | undefined;
function thisDir(): string {
  if (typeof __dirname === 'string') return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}

async function run(): Promise<void> {
  const client = createClient();
  const migrationsFolder = path.resolve(thisDir(), 'migrations');
  console.warn(`[migrate] applying from ${migrationsFolder}`);
  await migrate(client.drizzle, { migrationsFolder });
  await client.close();
  console.warn('[migrate] done');
}

run().catch((err: unknown) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
