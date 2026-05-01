# Developer onboarding

> Goal: be productive in 30 minutes.

## 1. Tools (one-time)

| Tool     | Version | Install                                                                              |
| -------- | ------- | ------------------------------------------------------------------------------------ |
| Node     | 20.18.0 | `mise install`, or `nvm install`, or `fnm install` (uses `.nvmrc` / `.node-version`) |
| pnpm     | 9+      | `npm install -g pnpm@9`                                                              |
| Docker   | latest  | Docker Desktop or Colima (`brew install colima docker`)                              |
| gitleaks | latest  | `brew install gitleaks` (macOS) — recommended but not required                       |

Set git config (one-time):

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

## 2. Bootstrap

```bash
git clone <repo-url> hrms
cd hrms
pnpm bootstrap    # installs deps, starts docker, builds
pnpm verify       # smoke test
```

If `pnpm bootstrap` fails, see [troubleshooting](./troubleshooting.md).

## 3. Daily workflow

```bash
pnpm dev          # start everything in parallel (Turborepo TUI)
pnpm test         # run tests
pnpm lint         # lint + format check
pnpm type         # typecheck
pnpm build        # full production build
```

Working on one app:

```bash
pnpm --filter @hrms/api dev
pnpm --filter @hrms/web dev
```

Reset state when something is wedged:

```bash
pnpm dev:reset    # destructive: nukes containers + node_modules
```

## 4. Commit conventions

Conventional commits enforced by commitlint:

```
feat(scope): short summary in lowercase
fix(scope): another summary
chore: maintenance work
docs: documentation only
refactor: code change without behavior change
test: adding/fixing tests
ci: CI changes
build: build system changes
perf: performance improvement
security: security fix or hardening
```

Pre-commit hooks auto-format changed files via Prettier.
gitleaks scans staged changes for secrets.

## 5. Where to find things

| Question                          | Answer                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| Architecture overview             | `docs/superpowers/specs/2026-05-01-hrms-architecture-design.md` |
| Why X was decided                 | `docs/adr/`                                                     |
| Bounded context map               | Spec §3                                                         |
| Database conventions              | Spec §6                                                         |
| Cross-cutting (auth, audit, etc.) | Spec §7                                                         |
| Testing strategy                  | Spec §8                                                         |
| API design conventions            | Spec Appendix E                                                 |
| Local dev commands                | Spec Appendix H + this doc                                      |

## 6. First contribution

1. Pick a checkbox from `docs/superpowers/plans/2026-05-01-p1.0-monorepo-bootstrap.md`
2. Create a branch: `git checkout -b feat/<short-slug>`
3. Make the change with tests
4. Run `pnpm test && pnpm lint && pnpm type && pnpm build`
5. Commit (conventional message); push; open PR
