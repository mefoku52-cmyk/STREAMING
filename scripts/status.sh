#!/data/data/com.termux/files/usr/bin/bash
set -u
port="${SIGNALING_PORT:-8504}"
if ! [[ "$port" =~ ^[0-9]+$ ]] || (( port < 1 || port > 65535 )); then
  echo "Invalid SIGNALING_PORT: expected TCP/UDP port 1..65535" >&2
  exit 2
fi
if command -v curl >/dev/null 2>&1; then
  if curl --silent --show-error --fail --max-time 3 "http://127.0.0.1:${port}/readyz"; then
    echo
    exit 0
  fi
  echo "Streaming is not ready on port ${port}" >&2
  exit 1
fi
if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -Eq ":${port}\\b"; then
  echo "HTTP listener is open on port ${port}; install curl to verify /readyz"
  exit 2
fi
echo "No listener detected on port ${port}" >&2
exit 1
