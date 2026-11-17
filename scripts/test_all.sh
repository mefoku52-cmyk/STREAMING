#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
node --test $(ls test/*.js | grep -v cmep-live-e2e)
cd "$ROOT"
./scripts/smoke_local.sh
echo "TEST_ALL_PASS"
