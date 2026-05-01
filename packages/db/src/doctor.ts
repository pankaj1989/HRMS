import { createClient, type DbClient } from './client';
import { verifyAuditChain } from './audit-chain';

export interface DoctorCheck {
  name: string;
  status: 'pass' | 'fail';
  detail?: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
}

const REQUIRED_EXTENSIONS = ['pgcrypto', 'btree_gist', 'pg_trgm'] as const;
const REQUIRED_SCHEMAS = ['platform', 'audit', 'demo'] as const;
const MULTITENANT_TABLES: readonly { schema: string; table: string }[] = [
  { schema: 'demo', table: 'tenant_data' },
  { schema: 'demo', table: 'compensation' },
  { schema: 'audit', table: 'entries' },
];

export async function runDoctor(db: DbClient): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];

  // Check 1: extensions
  const ext = await db.execute<{ extname: string }>(
    `SELECT extname FROM pg_extension WHERE extname = ANY($1::text[])`,
    [REQUIRED_EXTENSIONS],
  );
  const installed = new Set(ext.rows.map((r) => r.extname));
  const missingExt = REQUIRED_EXTENSIONS.filter((e) => !installed.has(e));
  checks.push({
    name: 'extensions-installed',
    status: missingExt.length === 0 ? 'pass' : 'fail',
    ...(missingExt.length === 0 ? {} : { detail: `missing: ${missingExt.join(', ')}` }),
  });

  // Check 2: schemas
  const sch = await db.execute<{ nspname: string }>(
    `SELECT nspname FROM pg_namespace WHERE nspname = ANY($1::text[])`,
    [REQUIRED_SCHEMAS],
  );
  const present = new Set(sch.rows.map((r) => r.nspname));
  const missingSch = REQUIRED_SCHEMAS.filter((s) => !present.has(s));
  checks.push({
    name: 'schemas-present',
    status: missingSch.length === 0 ? 'pass' : 'fail',
    ...(missingSch.length === 0 ? {} : { detail: `missing: ${missingSch.join(', ')}` }),
  });

  // Check 3 + 4: RLS + FORCE RLS on multi-tenant tables
  const placeholders = MULTITENANT_TABLES.map(
    (_, i) => `($${String(i * 2 + 1)}::text, $${String(i * 2 + 2)}::text)`,
  ).join(', ');
  const rlsParams = MULTITENANT_TABLES.flatMap((t) => [t.schema, t.table]);
  const rls = await db.execute<{
    schemaname: string;
    tablename: string;
    rls: boolean;
    force: boolean;
  }>(
    `SELECT n.nspname AS schemaname, c.relname AS tablename,
            c.relrowsecurity AS rls, c.relforcerowsecurity AS force
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE (n.nspname, c.relname) IN (${placeholders})`,
    rlsParams,
  );
  const rlsMissing = rls.rows.filter((r) => !r.rls);
  const forceMissing = rls.rows.filter((r) => !r.force);
  checks.push({
    name: 'rls-enabled-on-multitenant-tables',
    status: rlsMissing.length === 0 ? 'pass' : 'fail',
    ...(rlsMissing.length === 0
      ? {}
      : {
          detail: `RLS not enabled: ${rlsMissing.map((r) => `${r.schemaname}.${r.tablename}`).join(', ')}`,
        }),
  });
  checks.push({
    name: 'rls-forced-on-multitenant-tables',
    status: forceMissing.length === 0 ? 'pass' : 'fail',
    ...(forceMissing.length === 0
      ? {}
      : {
          detail: `FORCE RLS missing: ${forceMissing.map((r) => `${r.schemaname}.${r.tablename}`).join(', ')}`,
        }),
  });

  // Check 5: audit chain integrity (sample one tenant if any audit entries)
  const sample = await db.execute<{ tenant_id: string }>(
    'SELECT DISTINCT tenant_id FROM audit.entries LIMIT 1',
  );
  if (sample.rows.length === 0) {
    checks.push({
      name: 'audit-chain-integrity-sample',
      status: 'pass',
      detail: 'no audit entries yet — vacuously OK',
    });
  } else {
    const tenantId = sample.rows[0]?.tenant_id;
    if (tenantId !== undefined) {
      const result = await verifyAuditChain(db, { tenantId });
      checks.push({
        name: 'audit-chain-integrity-sample',
        status: result.valid ? 'pass' : 'fail',
        detail: result.valid
          ? `tenant ${tenantId} chain OK over ${String(result.entriesChecked)} entries`
          : `tenant ${tenantId} chain BROKEN at ${result.firstBrokenAt?.id ?? '?'}`,
      });
    }
  }

  return {
    ok: checks.every((c) => c.status === 'pass'),
    checks,
  };
}

// CLI entry: `pnpm db:doctor`
async function main(): Promise<void> {
  const db = createClient();
  try {
    const report = await runDoctor(db);
    for (const c of report.checks) {
      const icon = c.status === 'pass' ? '✓' : '✗';
      const detail = c.detail !== undefined ? ` — ${c.detail}` : '';
      console.warn(`${icon} ${c.name}${detail}`);
    }
    console.warn('');
    console.warn(report.ok ? '✓ db:doctor PASS' : '✗ db:doctor FAIL');
    process.exit(report.ok ? 0 : 1);
  } finally {
    await db.close();
  }
}

if (
  process.argv[1]?.endsWith('doctor.ts') === true ||
  process.argv[1]?.endsWith('doctor.js') === true
) {
  void main();
}
