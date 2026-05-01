# Troubleshooting

## `pnpm setup` fails

### Error: `docker info` exits non-zero

Docker daemon is not running. Start Docker Desktop or `colima start`.

### Error: `services not healthy after 120s`

ClamAV is slow on first run (downloads virus DB ~250MB). It is excluded from
the wait loop in `scripts/setup.sh`, but if other services are slow:

```bash
docker compose -f infra/docker/docker-compose.yml ps
docker compose -f infra/docker/docker-compose.yml logs <service>
```

Common cause: port already in use. Stop the conflicting process or change
ports in `infra/docker/docker-compose.yml`.

### Error: `Node 20+ required`

Use a Node version manager. With `mise` (recommended): `mise install`.
With `nvm`: `nvm install && nvm use`.

## `pnpm install` fails with peer dependency warnings

Set `auto-install-peers=true` is already in `.npmrc`. If a specific package
warns: search for it on https://github.com/pnpm/pnpm/issues — usually a known
transient issue.

## Pre-commit hook fails

### `gitleaks` not found

Install: `brew install gitleaks` (macOS) or download from
https://github.com/gitleaks/gitleaks/releases.

The hook gracefully skips if gitleaks isn't installed, so this is a _warning_
not a failure. CI runs gitleaks regardless.

### `commitlint` rejects message

Use a conventional commit message: `feat(api): your message`. See
[onboarding](./onboarding.md#4-commit-conventions).

## `pnpm dev` complains about port already in use

```bash
# Find what's holding the port:
lsof -i :3000
# Kill it:
kill <pid>
```

## API health endpoint returns 502 / connection refused

The API didn't start. Check logs:

```bash
pnpm --filter @hrms/api dev
```

Look for TS compilation errors or missing env vars.

## Postgres won't start

Existing volume corrupted. Reset:

```bash
pnpm dev:reset
```

(Destructive — wipes all local DB data.)

## VS Code: "Cannot find module '@hrms/config/...' "

Run `pnpm install` once more. Then in VS Code: Cmd+Shift+P → "TypeScript: Restart TS server".

## CI passes locally but fails on GitHub

Most common: lockfile drift. Run `pnpm install` and commit `pnpm-lock.yaml`.

## Tests pass locally but fail in CI

Most common: timezone mismatch. Either the test depends on local timezone
(fix the test to use UTC) or the CI environment has stricter type checking
(`pnpm type` should catch this locally).
