#!/data/data/com.termux/files/usr/bin/bash
# stop.sh — stops the cmep-streaming server identified via its runtime lock
# (never uses pkill/patterns; exact PID ownership is verified first).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCK="$ROOT/runtime/server.lock"
if [ ! -f "$LOCK" ]; then echo "not running (no lock file)"; exit 0; fi
PID=$(head -n 1 "$LOCK" | tr -d '[:space:]')
case "$PID" in ''|*[!0-9]*) echo "ERROR: corrupt lock file"; exit 2;; esac
CMDLINE=$(tr '\0' ' ' < "/proc/$PID/cmdline" 2>/dev/null || true)
CWD=$(readlink "/proc/$PID/cwd" 2>/dev/null || true)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "$CMDLINE" in
  *index.js*) ;;
  *) echo "ERROR: pid $PID is not the cmep-streaming server (cmdline: ${CMDLINE:-<dead>}); removing stale lock";
     [ -n "$CMDLINE" ] || rm -f "$LOCK"; exit 2;;
esac
if [ "$CWD" != "$ROOT" ]; then
  echo "ERROR: pid $PID cmdline matches but cwd is '$CWD', not '$ROOT' — refusing to kill (possible PID reuse); remove lock manually if you are sure" >&2
  exit 2
fi
kill -TERM "$PID" && echo "SIGTERM sent to $PID"
for i in $(seq 1 20); do
  kill -0 "$PID" 2>/dev/null || { echo "server $PID stopped"; [ -f "$LOCK" ] && rm -f "$LOCK"; exit 0; }
  sleep 0.5
done
echo "server did not exit after 10s — check logs/server.log" >&2
exit 1
