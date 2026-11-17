#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${SIGNALING_PORT:-8504}"
BASE="http://127.0.0.1:${PORT}"

echo "==> healthz"
curl --fail --silent --show-error --max-time 10 "${BASE}/healthz" >/dev/null
echo "OK healthz"

echo "==> health ready"
python3 - "${BASE}" <<'PY'
import json,sys,urllib.request
base=sys.argv[1]
with urllib.request.urlopen(base+'/health', timeout=10) as r:
    d=json.load(r)
assert d.get('ok') is True
assert d.get('ready') is True
assert (d.get('media') or {}).get('workerAlive') is True
print('OK health ready')
PY

echo "==> WebSocket smoke"
set -a; . "$ROOT/.env"; set +a
node /data/data/com.termux/files/usr/tmp/opencode/ws-smoke.js

echo "SMOKE_LOCAL_PASS"
