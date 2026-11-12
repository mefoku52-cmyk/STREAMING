#!/data/data/com.termux/files/usr/bin/bash
# start.sh — starts the cmep-streaming signaling/HTTP server in the background.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ ! -f .env ]; then echo "ERROR: .env missing — run: cp .env.example .env  (then set SESSION_SIGNING_SECRET)" >&2; exit 2; fi
if [ -f runtime/server.lock ]; then
  LPID=$(head -n 1 runtime/server.lock | tr -d '[:space:]')
  if [ -n "$LPID" ] && [ -d "/proc/$LPID" ] && readlink "/proc/$LPID/cwd" 2>/dev/null | grep -qx "$ROOT"; then
    echo "ERROR: server already running (pid $LPID per runtime/server.lock). Use scripts/stop.sh first." >&2
    exit 3
  fi
  echo "note: stale lock found (pid ${LPID:-?} not alive in $ROOT) — server will clear it on boot"
fi
mkdir -p logs runtime
ENV_OVERRIDE="${ENABLE_RECORDER:-}"
set -a; . ./.env; set +a
if [ -n "$ENV_OVERRIDE" ]; then ENABLE_RECORDER="$ENV_OVERRIDE"; export ENABLE_RECORDER; fi
setsid nohup node backend/src/index.js >> logs/server.log 2>&1 &
PID=$!
echo "$PID" > runtime/last-start.pid
sleep 1
if kill -0 "$PID" 2>/dev/null; then
  echo "cmep-streaming started (pid $PID), log: logs/server.log"
else
  echo "ERROR: server exited immediately — see logs/server.log" >&2
  tail -n 20 logs/server.log >&2
  exit 1
fi
