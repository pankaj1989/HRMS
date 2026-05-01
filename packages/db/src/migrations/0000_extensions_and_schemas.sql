-- 0000_extensions_and_schemas
-- expand-contract phase: EXPAND
-- locks acquired: AccessExclusive on system catalogs (negligible on empty DB)
-- safe to run during business hours: yes (only on initial bootstrap)
-- estimated duration: <1s

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS demo;

COMMENT ON SCHEMA platform IS 'Platform-level entities: tenants, plans, billing, idempotency, sagas';
COMMENT ON SCHEMA audit    IS 'Append-only hash-chained audit log';
COMMENT ON SCHEMA demo     IS 'Bitemporal + RLS proofs (removed in P1.2 once real domain modules land)';
