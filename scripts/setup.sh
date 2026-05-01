#!/usr/bin/env bash
set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[1;32m✓ %s\033[0m\n' "$*"; }
fail() { printf '  \033[1;31m✗ %s\033[0m\n' "$*"; exit 1; }

step "Verifying tool versions"
node -e "const v = process.versions.node.split('.').map(Number); if (v[0] < 20) { console.error('Node 20+ required, got ' + process.version); process.exit(1); }"
ok "Node $(node -v)"

command -v pnpm >/dev/null 2>&1 || fail "pnpm not installed (npm i -g pnpm@9)"
ok "pnpm $(pnpm -v)"

command -v docker >/dev/null 2>&1 || fail "docker not installed"
docker info >/dev/null 2>&1 || fail "docker daemon not running"
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

step "Installing dependencies"
pnpm install
ok "deps installed"

step "Starting Docker services"
docker compose -f infra/docker/docker-compose.yml up -d
ok "containers up"

step "Waiting for services to be healthy"
WAIT_SECONDS=120
START=$(date +%s)
while true; do
  ALL_HEALTHY=true
  for svc in postgres redis meilisearch minio; do
    STATUS=$(docker inspect -f '{{.State.Health.Status}}' "hrms-$svc" 2>/dev/null || echo "missing")
    if [ "$STATUS" != "healthy" ]; then
      ALL_HEALTHY=false
    fi
  done
  if [ "$ALL_HEALTHY" = "true" ]; then
    ok "all core services healthy"
    break
  fi
  ELAPSED=$(($(date +%s) - START))
  if [ "$ELAPSED" -gt "$WAIT_SECONDS" ]; then
    fail "services not healthy after ${WAIT_SECONDS}s (clamav can be slow on first run; ignore if only it is starting)"
  fi
  sleep 2
done

step "Building all packages"
pnpm build
ok "build green"

step "Running database migrations"
DATABASE_URL='postgres://hrms:hrms_dev_password@localhost:5433/hrms' \
  pnpm --filter @hrms/db db:migrate
ok "migrations applied"

step "Running db:doctor"
DATABASE_URL='postgres://hrms:hrms_dev_password@localhost:5433/hrms' \
  pnpm --filter @hrms/db db:doctor
ok "db:doctor green"

step "Setup complete"
cat <<'EOF'

Ready:
  Web:        http://localhost:3000   (pnpm --filter @hrms/web dev)
  Admin:      http://localhost:3002   (pnpm --filter @hrms/admin dev)
  API:        http://localhost:3001   (pnpm --filter @hrms/api dev)
  Mailpit:    http://localhost:8025
  Meilisearch:http://localhost:7700
  MinIO:      http://localhost:9001   (root: hrms_dev / hrms_dev_minio_password)
  Jaeger:     http://localhost:16686
  Postgres:   postgres://hrms:hrms_dev_password@localhost:5433/hrms
  Redis:      redis://localhost:6380

Run `pnpm dev` to start everything in parallel.

EOF
