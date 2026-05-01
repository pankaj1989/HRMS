import crypto from 'node:crypto';
import type { PoolClient } from 'pg';
import type { DbClient } from './client';

export interface AuditEntryInput {
  tenantId: string;
  actorType: 'user' | 'system' | 'integration' | 'job';
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: unknown;
  reason?: string;
  correlationId?: string;
  causationId?: string;
  requestId?: string;
}

const ZERO_HASH = Buffer.alloc(32);

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(',')}}`;
}

function hashEntry(prevHash: Buffer, payload: Record<string, unknown>): Buffer {
  const h = crypto.createHash('sha256');
  h.update(prevHash);
  h.update(canonicalJson(payload));
  return h.digest();
}

/**
 * Inserts a new audit entry, computing its hash by chaining off the most recent
 * entry for the tenant. MUST be called inside `withTenantContext` so RLS lets
 * us read the prior hash and write the new row.
 */
export async function appendAuditEntry(tx: PoolClient, input: AuditEntryInput): Promise<string> {
  // Per-tenant advisory transaction lock — serializes concurrent appends within
  // a tenant without requiring an UPDATE policy on the append-only audit table
  // (FOR UPDATE on a table with no UPDATE/DELETE policy is silently rejected
  // by RLS as un-lockable).
  await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
    `audit:${input.tenantId}`,
  ]);

  const prior = await tx.query<{ this_hash: Buffer }>(
    `SELECT this_hash
       FROM audit.entries
      WHERE tenant_id = $1
      ORDER BY occurred_at DESC, id DESC
      LIMIT 1`,
    [input.tenantId],
  );
  const prevHash = prior.rows[0]?.this_hash ?? ZERO_HASH;

  const occurredAt = new Date();
  const id = crypto.randomUUID();

  const hashPayload: Record<string, unknown> = {
    id,
    tenantId: input.tenantId,
    occurredAt: occurredAt.toISOString(),
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    changes: input.changes ?? null,
    reason: input.reason ?? null,
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
    requestId: input.requestId ?? null,
  };

  const thisHash = hashEntry(prevHash, hashPayload);

  await tx.query(
    `INSERT INTO audit.entries (
       id, tenant_id, occurred_at, prev_hash, this_hash,
       actor_type, actor_id, action, resource_type, resource_id,
       changes, reason, correlation_id, causation_id, request_id
     ) VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15
     )`,
    [
      id,
      input.tenantId,
      occurredAt,
      prevHash,
      thisHash,
      input.actorType,
      input.actorId ?? null,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.changes !== undefined ? JSON.stringify(input.changes) : null,
      input.reason ?? null,
      input.correlationId ?? null,
      input.causationId ?? null,
      input.requestId ?? null,
    ],
  );

  return id;
}

export interface VerifyResult {
  valid: boolean;
  entriesChecked: number;
  firstBrokenAt?: { id: string; occurredAt: Date };
}

interface AuditRow {
  id: string;
  occurred_at: Date;
  prev_hash: Buffer;
  this_hash: Buffer;
  tenant_id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: unknown;
  reason: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  request_id: string | null;
  [key: string]: unknown;
}

/**
 * Walks the audit chain for a tenant from oldest to newest, recomputing each
 * row's hash and confirming `prev_hash` matches the previous row's `this_hash`.
 * Reads via `db.execute` — caller is responsible for connecting under a role
 * that can SELECT from `audit.entries` (i.e., tenant context already set, or
 * a privileged verification role).
 */
export async function verifyAuditChain(
  db: DbClient,
  opts: { tenantId: string; from?: Date; to?: Date } = { tenantId: '' },
): Promise<VerifyResult> {
  const params: unknown[] = [opts.tenantId];
  let where = 'tenant_id = $1';
  if (opts.from !== undefined) {
    params.push(opts.from);
    where += ` AND occurred_at >= $${String(params.length)}`;
  }
  if (opts.to !== undefined) {
    params.push(opts.to);
    where += ` AND occurred_at <= $${String(params.length)}`;
  }

  const r = await db.execute<AuditRow>(
    `SELECT id, tenant_id, occurred_at, prev_hash, this_hash,
            actor_type, actor_id, action, resource_type, resource_id,
            changes, reason, correlation_id, causation_id, request_id
       FROM audit.entries
      WHERE ${where}
      ORDER BY occurred_at ASC, id ASC`,
    params,
  );

  let expectedPrev = ZERO_HASH;
  for (let i = 0; i < r.rows.length; i++) {
    const row = r.rows[i];
    if (row === undefined) continue;
    if (!row.prev_hash.equals(expectedPrev)) {
      return {
        valid: false,
        entriesChecked: i,
        firstBrokenAt: { id: row.id, occurredAt: row.occurred_at },
      };
    }
    const recomputed = hashEntry(row.prev_hash, {
      id: row.id,
      tenantId: row.tenant_id,
      occurredAt: row.occurred_at.toISOString(),
      actorType: row.actor_type,
      actorId: row.actor_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      changes: row.changes ?? null,
      reason: row.reason,
      correlationId: row.correlation_id,
      causationId: row.causation_id,
      requestId: row.request_id,
    });
    if (!recomputed.equals(row.this_hash)) {
      return {
        valid: false,
        entriesChecked: i,
        firstBrokenAt: { id: row.id, occurredAt: row.occurred_at },
      };
    }
    expectedPrev = row.this_hash;
  }

  return { valid: true, entriesChecked: r.rows.length };
}
