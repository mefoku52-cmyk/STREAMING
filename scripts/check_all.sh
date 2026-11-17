#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "=== check_all ==="
./scripts/check-deps.sh || true
./scripts/smoke_local.sh
cd backend && node --test $(ls test/*.js | grep -v cmep-live-e2e) && cd "$ROOT"
echo "CHECK_ALL_PASS"
