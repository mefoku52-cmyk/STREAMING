#!/data/data/com.termux/files/usr/bin/bash
# mint-token.sh — mints a local dev session token and writes the ready-to-open
# URLs into runtime/tokens/ (dir 0700, files 0600). The token is NEVER printed
# to stdout/logs/reports — read the URL file locally and paste it into the
# browser. Development only; in production identity comes from CMEP.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUB="${1:?usage: mint-token.sh <sub> [ttlSeconds]}"
TTL="${2:-3600}"
case "$TTL" in ''|*[!0-9]*) echo "ERROR: ttlSeconds must be an integer (got: $TTL)" >&2; exit 2;; esac
set -a; . "$ROOT/.env" 2>/dev/null || { echo "ERROR: .env missing" >&2; exit 2; }; set +a
[ -n "${SESSION_SIGNING_SECRET:-}" ] && [ "${SESSION_SIGNING_SECRET}" != "REPLACE_WITH_RANDOM_SECRET" ] \
  || { echo "ERROR: set a real SESSION_SIGNING_SECRET in .env first" >&2; exit 2; }
OUT="$ROOT/runtime/tokens"
mkdir -p "$OUT"; chmod 700 "$OUT"
HOST="${SIGNALING_HOST:-127.0.0.1}"
[ "$HOST" = "0.0.0.0" ] && HOST=127.0.0.1
[ -n "${ANNOUNCED_IP:-}" ] && HOST="$ANNOUNCED_IP"
PORT="${SIGNALING_PORT:-8504}"
node -e '
  const { issueLocalSessionToken } = require(process.argv[1]);
  const fs = require("node:fs");
  const t = issueLocalSessionToken({ sub: process.argv[2], ttlSeconds: Number(process.argv[3]), secret: process.env.SESSION_SIGNING_SECRET });
  const base = "http://" + process.argv[4] + ":" + process.argv[5];
  const pub = process.argv[6] + ".publish.url";
  const view = process.argv[6] + ".viewer.url";
  fs.writeFileSync(pub, base + "/publish.html?token=" + t + "\n", { mode: 0o600 });
  fs.writeFileSync(view, base + "/viewer.html?token=" + t + "\n", { mode: 0o600 });
  console.log("OK — URLs written locally (token not printed):");
  console.log("  publisher: " + pub);
  console.log("  viewer:    " + view);
  console.log("open locally, e.g.:  xdg-open \"$(cat " + view + ")\"");
' "$ROOT/backend/src/auth.js" "$SUB" "$TTL" "$HOST" "$PORT" "$OUT/$SUB"
