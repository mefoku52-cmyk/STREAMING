#!/data/data/com.termux/files/usr/bin/bash
set -u
for p in 8402 8404; do
  if command -v curl >/dev/null 2>&1 && [ "$p" = 8404 ]; then curl -fsS "http://127.0.0.1:$p/healthz" || true; echo; fi
  if command -v ss >/dev/null 2>&1; then ss -ltn 2>/dev/null | grep -E ":$p\b" || true; fi
done
