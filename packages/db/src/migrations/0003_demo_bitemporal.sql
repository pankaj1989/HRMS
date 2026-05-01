-- 0003_demo_bitemporal
-- expand-contract phase: EXPAND
-- locks acquired: AccessShare on demo schema
-- safe to run during business hours: yes
-- estimated duration: <1s

CREATE TABLE demo.compensation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  employee_id     uuid NOT NULL,

  ctc_annual      numeric(14,2) NOT NULL,

  -- Three-axis temporality (spec §5.12)
  valid_from      date NOT NULL,
  valid_to        date NOT NULL DEFAULT 'infinity',
  decided_at      timestamptz NOT NULL DEFAULT now(),
  superseded_at   timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  is_deleted      boolean NOT NULL DEFAULT false,

  -- The exclusion constraint: no two non-deleted rows for the same employee
  -- may overlap in BOTH valid time AND decision time.
  CONSTRAINT compensation_no_overlap EXCLUDE USING gist (
    employee_id WITH =,
    daterange(valid_from, valid_to, '[)') WITH &&,
    tstzrange(decided_at, COALESCE(superseded_at, 'infinity'::timestamptz), '[)') WITH &&
  ) WHERE (is_deleted = false)
);

CREATE INDEX compensation_employee_validfrom_idx
  ON demo.compensation (tenant_id, employee_id, valid_from DESC)
  WHERE is_deleted = false;

ALTER TABLE demo.compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo.compensation FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select ON demo.compensation
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_modify ON demo.compensation
  FOR ALL
  USING       (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK  (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

COMMENT ON TABLE demo.compensation IS
  'Bitemporal demo: exclusion constraint prevents overlapping (valid, decided) ranges per employee. Spec §5.12 + §6.4.';
