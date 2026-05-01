# 0002 — Postgres with Row-Level Security over MongoDB

|         |                                                                                                                                                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | Accepted                                                                                                                                                                                                               |
| Date    | 2026-05-01                                                                                                                                                                                                             |
| Decider | Founder                                                                                                                                                                                                                |
| Related | [Spec §1 Decisions](../superpowers/specs/2026-05-01-hrms-architecture-design.md#1--decisions-locked), [Spec §6 Database](../superpowers/specs/2026-05-01-hrms-architecture-design.md#6--database-design-postgresql-16) |

## Context

The original spec (`spec/00-foundations/01-multi-tenancy.md`) chose MongoDB
because of Node/Mongoose ergonomics. Switching to NestJS + TypeScript-first
stack gave us the option to reconsider.

Multi-tenant compliance-heavy product needs:

- Strongest possible tenant isolation
- Time-versioning for statutory data (retros, audits)
- Append-only audit log
- Mature managed offerings

## Decision

PostgreSQL 16+ with **Row-Level Security (RLS) FORCED** as the primary
multi-tenancy mechanism. One schema per bounded context. Per-schema Postgres
roles for least-privilege defense in depth. Bitemporal modeling via range
types + exclusion constraints.

## Consequences

**Good**

- RLS at the DB layer means even a SQL-injected query cannot cross tenants.
- Bitemporal exclusion constraints make overlapping records mathematically
  impossible.
- Strict schema = compliance audit answer is "look at migration history."
- pg_partman, BRIN, logical replication scale fine to ceiling (~1M employees).

**Bad**

- Migration discipline higher than Mongo (offset by expand-contract pattern).
- Connection pooling matters earlier (PgBouncer in transaction mode in P4+).

## Alternatives considered

- **MongoDB** — original spec choice; weaker isolation primitives in Mongo;
  bitemporal modeling is hand-rolled rather than DB-enforced.
- **MariaDB / MySQL** — RLS support weaker; bitemporal modeling weaker.
- **CockroachDB** — overkill at our scale; ops complexity not warranted.
