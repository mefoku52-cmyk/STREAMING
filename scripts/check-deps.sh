#!/data/data/com.termux/files/usr/bin/bash
set -eu
for cmd in node npm python ffmpeg; do if command -v "$cmd" >/dev/null 2>&1; then printf '%-8s %s
' "$cmd" "$(command -v "$cmd")"; else printf '%-8s MISSING
' "$cmd"; fi; done
node --version 2>/dev/null || true
python --version 2>/dev/null || true
ffmpeg -version 2>/dev/null | head -n 1 || true
