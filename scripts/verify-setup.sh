#!/usr/bin/env bash
set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

PASS=0
FAIL=0

check() {
  if eval "$2" >/dev/null 2>&1; then
    printf '  \033[1;32m✓\033[0m %s\n' "$1"
    PASS=$((PASS+1))
  else
    printf '  \033[1;31m✗\033[0m %s\n' "$1"
    FAIL=$((FAIL+1))
  fi
}

echo "▶ Verifying setup"
check "Node 20+"                        "node -e 'process.exit(process.versions.node.split(\".\").map(Number)[0] >= 20 ? 0 : 1)'"
check "pnpm 9+"                         "[ \"$(pnpm -v | cut -d. -f1)\" -ge 9 ]"
check "Docker daemon up"                "docker info"
check "Postgres responding"             "docker exec hrms-postgres pg_isready -U hrms"
check "Redis responding"                "docker exec hrms-redis redis-cli ping | grep -q PONG"
check "Meilisearch healthy"             "curl -fsS http://localhost:7700/health"
check "MinIO healthy"                   "curl -fsS http://localhost:9000/minio/health/live"
check "Jaeger UI reachable"             "curl -fsS http://localhost:16686/"
check "OTel collector healthy"          "curl -fsS http://localhost:13133/"
check "Mailpit reachable"               "curl -fsS http://localhost:8025/api/v1/info"
check "API package builds"              "pnpm --filter @hrms/api build"
check "Workers package builds"          "pnpm --filter @hrms/workers build"
check "Web package builds"              "pnpm --filter @hrms/web build"
check "Admin package builds"            "pnpm --filter @hrms/admin build"

echo ""
echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ] || exit 1
