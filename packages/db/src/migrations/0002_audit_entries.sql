-- 0002_audit_entries
-- expand-contract phase: EXPAND
-- locks acquired: AccessShare on audit schema (negligible)
-- safe to run during business hours: yes
-- estimated duration: <1s

CREATE TABLE audit.entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  prev_hash       bytea       NOT NULL,
  this_hash       bytea       NOT NULL,
  actor_type      text        NOT NULL CHECK (actor_type IN ('user','system','integration','job')),
  actor_id        uuid,
  action          text        NOT NULL,
  resource_type   text        NOT NULL,
  resource_id     uuid,
  changes         jsonb,
  reason          text,
  correlation_id  uuid,
  causation_id    uuid,
  request_id      uuid
);

CREATE INDEX audit_entries_tenant_occurred_idx
  ON audit.entries (tenant_id, occurred_at DESC);

CREATE INDEX audit_entries_correlation_idx
  ON audit.entries (correlation_id) WHERE correlation_id IS NOT NULL;

ALTER TABLE audit.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.entries FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select ON audit.entries
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_insert ON audit.entries
  FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- Append-only at the SQL layer: only INSERT and SELECT policies exist.
-- No UPDATE or DELETE policies = those operations are denied for non-owners
-- and (with FORCE) also for owners. The role-level REVOKE will be applied
-- per-environment in P1.2 when per-schema roles are created.

COMMENT ON TABLE audit.entries IS
  'Append-only hash-chained audit log. Spec §4.6 + §6.8.';
