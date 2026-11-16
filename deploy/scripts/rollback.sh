#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cmep-streaming}"
RELEASES_DIR="${RELEASES_DIR:-/var/lib/cmep-streaming/releases}"
TARGET_RELEASE="${1:-}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root or via sudo." >&2
  exit 1
fi

echo "Rolling back cmep-streaming service"

if [[ -z "$TARGET_RELEASE" && -f "${RELEASES_DIR}/previous" ]]; then
  TARGET_RELEASE="$(cat "${RELEASES_DIR}/previous" || true)"
fi

if [[ -z "$TARGET_RELEASE" || ! -d "$TARGET_RELEASE" ]]; then
  echo "No valid rollback target. Provide release path or ensure ${RELEASES_DIR}/previous exists." >&2
  echo "Current: $(readlink -f "${APP_DIR}" 2>/dev/null || echo unknown)" >&2
  exit 1
fi

PREV_CURRENT="$(readlink -f "${APP_DIR}" 2>/dev/null || true)"
ln -sfn "${TARGET_RELEASE}" "${APP_DIR}"
printf '%s\n' "${TARGET_RELEASE}" > "${RELEASES_DIR}/current"
printf '%s\n' "${PREV_CURRENT}" > "${RELEASES_DIR}/previous"

systemctl daemon-reload
systemctl restart cmep-streaming.service
systemctl restart caddy || true
systemctl restart coturn || true
sleep 2
"${APP_DIR}/deploy/scripts/health-check.sh" "http://127.0.0.1:8504" "ready"

echo "Rollback completed to ${TARGET_RELEASE}."
