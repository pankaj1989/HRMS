#!/usr/bin/env bash
set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "▶ Stopping containers and deleting volumes (data will be lost)"
docker compose -f infra/docker/docker-compose.yml down -v

echo "▶ Removing build artifacts"
pnpm clean

echo "▶ Reinstalling dependencies"
pnpm install

echo "▶ Restarting via setup.sh"
exec bash scripts/setup.sh
