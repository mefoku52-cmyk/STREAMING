#!/data/data/com.termux/files/usr/bin/bash
# browser-test.sh — fully automated 1:1 browser test (publisher↔viewer) via CDP.
#
# Preconditions:
#   1. Server running:  ./scripts/start.sh   (ENABLE_RECORDER=1 recommended —
#      adds objective RTP proof via FFmpeg recording + ffprobe)
#   2. Fresh tokens:    ./scripts/mint-token.sh inspector-owner 3600
#                       ./scripts/mint-token.sh inspector-viewer 3600
#   3. chromium-browser present (Termux tur-repo package).
#
# The script launches ONE headless Chromium with two ISOLATED browser contexts,
# fake media device (sine audio), auto-granted permissions and autoplay enabled.
# It never prints tokens. Full step-by-step PASS/FAIL is printed; a JSON report
# lands in runtime/browser-test-last.json.
#
# Usage: ./scripts/browser-test.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ -f .env ] || { echo "ERROR: .env missing" >&2; exit 2; }
command -v chromium-browser >/dev/null || { echo "ERROR: chromium-browser not found" >&2; exit 2; }
curl -sf -m 3 "http://127.0.0.1:${SIGNALING_PORT:-8504}/healthz" >/dev/null || {
  echo "ERROR: server not running on ${SIGNALING_PORT:-8504} — start it first (scripts/start.sh)" >&2; exit 2; }
mkdir -p runtime
exec node scripts/browser-test.js
