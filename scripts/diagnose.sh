#!/data/data/com.termux/files/usr/bin/bash
# diagnose.sh — read-only diagnostics of the cmep-streaming runtime.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$ROOT/.env" ] && { set -a; . "$ROOT/.env"; set +a; }
echo "=== processes (node index.js) ==="
ps -eo pid,ppid,etime,args | awk '/[n]ode .*cmep-streaming\/backend\/src\/index.js|[n]ode backend\/src\/index.js/{print}'
LOCK="$ROOT/runtime/server.lock"
if [ -f "$LOCK" ]; then
  PID=$(head -n 1 "$LOCK" | tr -d '[:space:]')
  echo "=== lock ==="
  echo "lock: $LOCK pid=$PID alive=$(kill -0 "$PID" 2>/dev/null && echo yes || echo no)"
fi
echo "=== health endpoint ==="
curl -fsS -m 3 "http://127.0.0.1:${SIGNALING_PORT:-8504}/healthz" 2>/dev/null || echo "healthz: UNREACHABLE"
echo
echo "=== mediasoup workers ==="
ps -eo pid,ppid,etime,args | grep '[m]ediasoup-worker' || echo "none"
echo "=== ffmpeg children (recorder) ==="
ps -eo pid,ppid,args | grep '[f]fmpeg' || echo "none"
echo "=== last log lines ==="
tail -n 15 "$ROOT/logs/server.log" 2>/dev/null || echo "no log"
