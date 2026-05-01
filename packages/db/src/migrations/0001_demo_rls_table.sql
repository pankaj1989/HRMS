-- 0001_demo_rls_table
-- expand-contract phase: EXPAND
-- locks acquired: AccessShareLock on demo schema (negligible)
-- safe to run during business hours: yes
-- estimated duration: <1s

CREATE TABLE demo.tenant_data (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  payload      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tenant_data_tenant_id_idx ON demo.tenant_data (tenant_id);

ALTER TABLE demo.tenant_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.tenant_data FORCE  ROW LEVEL SECURITY;

-- NULLIF ensures unset app.tenant_id (empty string) becomes NULL,
-- which evaluates the equality to NULL and denies the row — instead
-- of erroring on `''::uuid`.
CREATE POLICY tenant_isolation_select ON demo.tenant_data
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_modify ON demo.tenant_data
  FOR ALL
  USING       (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK  (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

COMMENT ON TABLE demo.tenant_data IS
  'Demo table: proves RLS-FORCE blocks cross-tenant SELECT and INSERT (spec §6.3).';
