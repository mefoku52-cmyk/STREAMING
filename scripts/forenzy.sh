#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/FORENZNA_ANALYZA.md"

{
  echo "# Forenzná analýza - inventár súborov"
  echo
  echo "Vygenerované: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "Koreň: $ROOT"
  echo
  echo "## Zoznam súborov"
  echo
  find "$ROOT" -type f \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -print0 | sort -z | while IFS= read -r -d '' f; do
      rel="${f#$ROOT/}"
      size="$(stat -c '%s' "$f" 2>/dev/null || echo '?')"
      lines="$(wc -l < "$f" 2>/dev/null | tr -d ' ')"
      echo "### $rel"
      echo "- veľkosť: ${size} B"
      echo "- riadky: ${lines}"
      echo "- prvých 5 riadkov:"
      echo '```'
      sed -n '1,5p' "$f" 2>/dev/null || true
      echo '```'
      echo
    done
} > "$OUT"

echo "Výstup: $OUT"
wc -l "$OUT"
