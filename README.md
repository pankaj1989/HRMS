# HRMS

Indian compliance-first multi-tenant HR platform — modular monolith on
NestJS + Next.js + Flutter, backed by PostgreSQL with Row-Level Security.

> Phase 1.0 (monorepo bootstrap) and Phase 1.1 (database foundations) **complete**. See
> [`docs/superpowers/plans/`](./docs/superpowers/plans/).

## Get started in 5 minutes

```bash
git clone <repo-url> hrms
cd hrms

# Prereqs (one-time): Node 20+, pnpm 9+, Docker, gitleaks (optional)
node -v && pnpm -v && docker info

# Bootstrap everything
pnpm bootstrap

# Verify
pnpm verify

# Start everything in parallel
pnpm dev
```

URLs after `pnpm dev`:

| Service                       | URL                    |
| ----------------------------- | ---------------------- |
| Web (customer + tenant-admin) | http://localhost:3000  |
| API                           | http://localhost:3001  |
| Admin (internal)              | http://localhost:3002  |
| Mailpit                       | http://localhost:8025  |
| Meilisearch                   | http://localhost:7700  |
| MinIO console                 | http://localhost:9001  |
| Jaeger UI                     | http://localhost:16686 |

## Documentation

- **[Architecture design](./docs/superpowers/specs/2026-05-01-hrms-architecture-design.md)** — the full system design (~17k words; sections 1-13 + appendices A-H)
- **[ADRs](./docs/adr/)** — every "why" lives here
- **[Onboarding](./docs/dev/onboarding.md)** — first-day checklist
- **[Database workflow](./docs/dev/database.md)** — db:\* commands, RLS pattern, audit chain
- **[Troubleshooting](./docs/dev/troubleshooting.md)** — common issues + fixes
- **[Specs](./spec/)** — original 10-module functional spec
- **[Plans](./docs/superpowers/plans/)** — implementation plans, one per sub-phase

## Repository structure

```
apps/        # api (NestJS) · workers · web (Next.js) · admin · mobile (Phase 8)
packages/    # domain · contracts · rules-engine · crypto · db · ui · api-client-{ts,dart} · i18n · config
infra/       # docker · coolify
scripts/     # setup · dev-reset · verify-setup
docs/        # adr · dev · superpowers/specs · superpowers/plans
spec/        # original 10-module functional spec
```

## License

UNLICENSED. Proprietary. All rights reserved.
