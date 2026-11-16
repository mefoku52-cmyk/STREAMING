#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8504}"
MODE="${2:-ready}" # live | ready

check_live() {
  echo "Checking liveness ${BASE_URL}/healthz"
  curl --fail --silent --show-error --max-time 10 "${BASE_URL}/healthz"
  echo
}

check_ready() {
  echo "Checking readiness ${BASE_URL}/health"
  local out
  out="$(curl --fail --silent --show-error --max-time 10 "${BASE_URL}/health")"
  echo "$out"
  python3 - "$out" <<'PY'
import json,sys
d=json.loads(sys.argv[1])
ok=bool(d.get('ok')) and bool(d.get('ready'))
media=d.get('media') or {}
ok=ok and bool(media.get('workerAlive'))
sys.exit(0 if ok else 2)
PY
}

check_live
if [[ "$MODE" == "ready" ]]; then
  check_ready
fi

echo "All health checks passed."
