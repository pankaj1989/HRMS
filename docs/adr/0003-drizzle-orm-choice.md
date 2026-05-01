# 0003 — Drizzle ORM over Prisma / Kysely / TypeORM

|         |                                                                                                                                                                         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | Accepted                                                                                                                                                                |
| Date    | 2026-05-01                                                                                                                                                              |
| Decider | Founder                                                                                                                                                                 |
| Related | [Spec §6 Database](../superpowers/specs/2026-05-01-hrms-architecture-design.md#6--database-design-postgresql-16) · [ADR 0002 Postgres+RLS](./0002-postgres-with-rls.md) |

## Context

Phase 1.1 needs a Postgres TS layer that:

- Plays well with strict TypeScript (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)
- Lets us drop to raw SQL freely (RLS policies, exclusion constraints, hash-chain helpers, `SET LOCAL` are all things ORMs hide poorly)
- Has first-class migration tooling
- Doesn't prescribe a specific runtime/architecture

Three contenders evaluated.

## Decision

**Drizzle ORM** + drizzle-kit for migrations.

## Consequences

**Good**

- Schemas declared in TypeScript stay type-safe with our strict tsconfig
- `db.execute(...)` lets us write raw SQL for RLS policies, exclusion constraints, FORCE RLS — without ceremony
- drizzle-kit generates `.sql` files we can hand-edit before applying. We did this for migrations 0000-0003 — the generator can't emit `CREATE EXTENSION` or RLS policies
- No runtime engine; no shadow DB; thin layer over `pg`
- Excellent multi-dialect support (we may add CockroachDB or Neon later)

**Bad**

- Younger ecosystem than Prisma; some features (e.g., introspection ergonomics) less polished
- Less hand-holding for newcomers — but that aligns with the project's quality bar

## Alternatives considered

- **Prisma** — popular, opinionated. But: client generation step adds friction; raw SQL escapes are ergonomically second-class; shadow DB requirement for migrations is awkward in CI; Prisma's `@@@schema` directives don't compose well with our per-context Postgres schemas.
- **Kysely** — pure query-builder, no migrations. We'd glue drizzle-kit or another tool on top — net more moving parts.
- **TypeORM** — mature but the legacy decorator-based model fights our hexagonal isolation; entities couple to ORM lifecycle.
