import type { PoolClient } from 'pg';
import type { DbClient } from './client';

export interface TenantContext {
  tenantId: string;
  entityId?: string;
  actorUserId?: string;
  correlationId?: string;
}

/**
 * Runs `callback` inside a Postgres transaction with `SET LOCAL` for
 * `app.tenant_id`, `app.entity_id`, `app.actor_user_id`, `app.correlation_id`.
 * RLS policies on multi-tenant tables read these settings — see spec §6.3.
 */
export async function withTenantContext<T>(
  db: DbClient,
  ctx: TenantContext,
  callback: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const conn = await db.pool.connect();
  try {
    await conn.query('BEGIN');
    await conn.query("SELECT set_config('app.tenant_id', $1, true)", [ctx.tenantId]);
    if (ctx.entityId !== undefined) {
      await conn.query("SELECT set_config('app.entity_id', $1, true)", [ctx.entityId]);
    }
    if (ctx.actorUserId !== undefined) {
      await conn.query("SELECT set_config('app.actor_user_id', $1, true)", [ctx.actorUserId]);
    }
    if (ctx.correlationId !== undefined) {
      await conn.query("SELECT set_config('app.correlation_id', $1, true)", [ctx.correlationId]);
    }
    const result = await callback(conn);
    await conn.query('COMMIT');
    return result;
  } catch (err) {
    await conn.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    conn.release();
  }
}
