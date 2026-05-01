# Architecture Decision Records

ADRs document **why** a non-trivial decision was made — not what the
code does (the code does that). The audience is future-you, future
collaborators, and auditors.

## Conventions

- One file per decision, numbered: `NNNN-short-slug.md`
- Status: `Proposed` → `Accepted` → `Superseded by NNNN`
- Never delete; supersede.
- Link from PR descriptions and code comments where the decision matters.

## Index

- [0001 — Modular monolith over microservices](./0001-modular-monolith.md)
- [0002 — Postgres with RLS over Mongo](./0002-postgres-with-rls.md)
- [0003 — Drizzle ORM over Prisma / Kysely / TypeORM](./0003-drizzle-orm-choice.md)

Add new ADRs by copying [`_template.md`](./_template.md).
