# 0001 — Modular monolith over microservices

|         |                                                                                                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | Accepted                                                                                                                                                                                                                                        |
| Date    | 2026-05-01                                                                                                                                                                                                                                      |
| Decider | Founder                                                                                                                                                                                                                                         |
| Related | [Spec §3 Bounded contexts](../superpowers/specs/2026-05-01-hrms-architecture-design.md#3--bounded-contexts-modules), [Spec §4 Module pattern](../superpowers/specs/2026-05-01-hrms-architecture-design.md#5--module-internal-pattern-hexagonal) |

## Context

8-phase HRMS over 18-24 months. Solo founder + AI assistance. Need to:

- Hold shape across long delivery
- Keep modules independently testable
- Make future Go-extraction of hot paths (payroll, rules engine) mechanical

Three options weighed: boring monolith, modular monolith, microservices.

## Decision

Modular monolith. Each bounded context lives in `apps/api/src/modules/<name>/`,
owns its own Postgres schema, exposes its public surface via
`packages/contracts/<name>/`, and talks to other modules only through those
contracts or via the transactional outbox.

Hard import rules enforced by `dependency-cruiser` and architecture fitness
function tests in CI.

## Consequences

**Good**

- One deploy, one log stream, one DB transaction across modules where needed.
- Modules independently testable (hexagonal pattern in §5 of spec).
- Solo dev never spends time on inter-service plumbing.
- Future Go extraction is a port-swap, not a rewrite.

**Bad**

- Requires upfront discipline (~15-20% extra setup time in Phase 1).
- Misses some scale ceiling vs microservices — irrelevant at 1M employees.

## Alternatives considered

- **Boring monolith** — by Phase 5 cross-module imports would be untangled
  manually; explicitly the "garbage code" outcome the founder rejected.
- **Microservices from day one** — solo dev + 8 phases + microservices = doom.
  Distributed transactions on payroll alone would exceed the entire schedule.
