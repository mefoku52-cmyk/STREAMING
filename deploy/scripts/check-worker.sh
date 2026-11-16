#!/bin/bash
# Kontrola dostupnosti a správnosti mediasoup workeru pre cieľovú architektúru.
# Spustiť na VPS po `npm ci`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORKER="$ROOT/backend/node_modules/mediasoup/worker/out/Release/mediasoup-worker"

echo "==> Kontrola working directory: $ROOT"
if [ ! -f "$ROOT/backend/package.json" ]; then
  echo "CHYBA: backend/package.json nie je nájdený" >&2
  exit 1
fi

echo "==> Kontrola worker binary: $WORKER"
if [ ! -f "$WORKER" ]; then
  echo "CHYBA: mediasoup worker binary nie je nájdený" >&2
  echo "      Spustite: cd $ROOT/backend && npm ci (postinstall stiahne worker pre tieto architektúru)"
  exit 1
fi

if [ ! -x "$WORKER" ]; then
  echo "CHYBA: worker binary nie je spustiteľný" >&2
  exit 1
fi

echo "==> Worker verzia:"
"$WORKER" --version

echo "==> OK: mediasoup worker je dostupný a spustiteľný"
