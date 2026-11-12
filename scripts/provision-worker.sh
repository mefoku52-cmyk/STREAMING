#!/data/data/com.termux/files/usr/bin/bash
# provision-worker.sh — provisions the mediasoup worker binary for Termux/Android.
#
# WHY: mediasoup@3.32.2 publishes no android-arm64 prebuilt worker, and the
# local source build fails in Termux because the pip-provisioned meson cannot
# detect Termux ninja (reproduced 2026-11-10: npm-rebuild.log in live-prototype
# and in this project). The only working android-arm64 build available is the
# binary already compiled for live-prototype (same pinned version 3.32.2,
# verified running). This script copies it WITHOUT modifying the source
# project. On a normal Linux server the npm postinstall downloads the official
# prebuilt worker automatically and this script is NOT needed.
#
# Usage: bash scripts/provision-worker.sh [path-to-source-worker]
set -euo pipefail
SRC="${1:-$HOME/live-prototype/gate_c/node_modules/mediasoup/worker/out/Release/mediasoup-worker}"
DEST_DIR="$(cd "$(dirname "$0")/.." && pwd)/backend/node_modules/mediasoup/worker/out/Release"

[ -f "$SRC" ] || { echo "ERROR: source worker not found: $SRC" >&2; exit 1; }
[ -x "$SRC" ] || { echo "ERROR: source worker is not executable: $SRC" >&2; exit 1; }

mkdir -p "$DEST_DIR"
cp -n "$SRC" "$DEST_DIR/mediasoup-worker" 2>/dev/null || true
chmod 755 "$DEST_DIR/mediasoup-worker"

"$DEST_DIR/mediasoup-worker" --version && echo "worker provisioned and reports version above"
