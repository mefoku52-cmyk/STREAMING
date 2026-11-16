#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cmep-streaming}"
DEPLOY_USER="${DEPLOY_USER:-cmep}"
STATE_DIR="${STATE_DIR:-/var/lib/cmep-streaming}"
RUNTIME_DIR="${RUNTIME_DIR:-${STATE_DIR}/runtime}"
RECORDINGS_DIR="${RECORDINGS_DIR:-${STATE_DIR}/recordings}"
RELEASES_DIR="${RELEASES_DIR:-${STATE_DIR}/releases}"
SOURCE_DIR="${SOURCE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
ENV_FILE="${ENV_FILE:-/etc/cmep-streaming.env}"
SOURCE_ENV="${SOURCE_ENV:-${SOURCE_DIR}/deploy/env/.env.production}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%d%H%M%S)}"
CURRENT_LINK="${APP_DIR}"
ENABLE_COTURN="${ENABLE_COTURN:-1}"
INSTALL_COTURN_CONF="${INSTALL_COTURN_CONF:-1}"
ENABLE_CADDY="${ENABLE_CADDY:-1}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root or via sudo." >&2
  exit 1
fi

echo "[1/9] Preflight: validating prerequisites and configuration"
for cmd in node npm systemctl curl rsync python3 install id; do command -v "$cmd" >/dev/null || { echo "ERROR: missing required command: $cmd" >&2; exit 1; }; done
if [[ "$ENABLE_CADDY" == "1" ]]; then command -v caddy >/dev/null || { echo "ERROR: caddy required (ENABLE_CADDY=1)" >&2; exit 1; }; fi
if [[ "$ENABLE_COTURN" == "1" || "$INSTALL_COTURN_CONF" == "1" ]]; then command -v turnserver >/dev/null || { echo "ERROR: turnserver/coturn required (ENABLE_COTURN/INSTALL_COTURN_CONF=1)" >&2; exit 1; }; fi

# Required config must exist before mutating system state
if [[ ! -f "$ENV_FILE" && ! -f "$SOURCE_ENV" ]]; then
  echo "ERROR: missing required env config. Provide $ENV_FILE or $SOURCE_ENV" >&2
  exit 1
fi
ENV_CHECK="$SOURCE_ENV"; [[ -f "$ENV_FILE" && ! -f "$SOURCE_ENV" ]] && ENV_CHECK="$ENV_FILE"
python3 - "$ENV_CHECK" <<'PY'
import re,sys
path=sys.argv[1]
data=open(path,'r',encoding='utf-8',errors='ignore').read()
def val(k):
    m=re.search(r'(?m)^'+re.escape(k)+r'=(.*)$', data)
    return (m.group(1).strip() if m else '')
def bad(v):
    return (not v) or v.startswith('VÁŠ') or v.startswith('REPLACE')
missing=[]
for k in ('SESSION_SIGNING_SECRET','NODE_ENV','SIGNALING_PORT'):
    if bad(val(k)): missing.append(k)
# TURN required if TURN_URLS or TURN_SECRET intent present? enforce when TURN_SECRET set or TURN_URLS set
if val('TURN_URLS') or val('TURN_SECRET'):
    for k in ('TURN_SECRET','TURN_URLS','TURN_REALM'):
        if bad(val(k)): missing.append(k)
# CMEP http adapter requires platform config
if val('CMEP_ADAPTER')=='http':
    for k in ('CMEP_PLATFORM_URL','CMEP_INTERNAL_API_KEY'):
        if bad(val(k)): missing.append(k)
if missing:
    print('ERROR: invalid/missing required env keys: '+', '.join(sorted(set(missing))), file=sys.stderr)
    sys.exit(2)
print('env preflight ok: '+path)
PY

echo "[2/9] Creating application user and directories"
id -u "${DEPLOY_USER}" >/dev/null 2>&1 || useradd --system --home "${STATE_DIR}" --shell /usr/sbin/nologin "${DEPLOY_USER}"
install -d -m 0755 /opt "${RELEASES_DIR}" "${RUNTIME_DIR}" "${RECORDINGS_DIR}" /etc/caddy /etc/turnserver
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${RUNTIME_DIR}" "${RECORDINGS_DIR}" "${RELEASES_DIR}"

RELEASE_PATH="${RELEASES_DIR}/${RELEASE_ID}"
echo "[3/9] Syncing application files to release ${RELEASE_PATH}"
install -d -m 0755 "${RELEASE_PATH}"
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'runtime' \
  --exclude 'recordings' \
  --exclude 'deploy/env/.env.production' \
  "${SOURCE_DIR}/" "${RELEASE_PATH}/"

echo "[4/9] Installing backend dependencies"
cd "${RELEASE_PATH}/backend"
if [[ -f package-lock.json ]]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

echo "[5/9] Installing configuration files"
install -m 0644 "${RELEASE_PATH}/deploy/systemd/cmep-streaming.service" /etc/systemd/system/cmep-streaming.service
if [[ "$ENABLE_CADDY" == "1" ]]; then install -m 0644 "${RELEASE_PATH}/deploy/caddy/Caddyfile" /etc/caddy/Caddyfile; fi
if [[ "$INSTALL_COTURN_CONF" == "1" ]]; then
  # Render turnserver.conf from template + env (never log secrets)
  TURN_SECRET_VAL="$(python3 - "$ENV_CHECK" <<'PY'
import re,sys
d=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
m=re.search(r'(?m)^TURN_SECRET=(.*)$',d); print((m.group(1).strip() if m else ''))
PY
)"
  TURN_REALM_VAL="$(python3 - "$ENV_CHECK" <<'PY'
import re,sys
d=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
m=re.search(r'(?m)^TURN_REALM=(.*)$',d); print((m.group(1).strip() if m else 'cmep-streaming'))
PY
)"
  ANNOUNCED_IP_VAL="$(python3 - "$ENV_CHECK" <<'PY'
import re,sys
d=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
m=re.search(r'(?m)^ANNOUNCED_IP=(.*)$',d); print((m.group(1).strip() if m else ''))
PY
)"
  if [[ -z "$TURN_SECRET_VAL" || "$TURN_SECRET_VAL" == VÁŠ* || "$TURN_SECRET_VAL" == REPLACE* ]]; then
    echo "ERROR: TURN_SECRET missing/placeholder; cannot install turnserver.conf" >&2; exit 1
  fi
  python3 - "${RELEASE_PATH}/deploy/coturn/turnserver.conf" /etc/turnserver/turnserver.conf "$TURN_SECRET_VAL" "$TURN_REALM_VAL" "$ANNOUNCED_IP_VAL" <<'PY'
import sys
src,dst,secret,realm,ip = sys.argv[1:6]
text=open(src,encoding='utf-8').read()
text=text.replace('<TURN_SECRET>', secret)
text=text.replace('<TURN_REALM>', realm or 'cmep-streaming')
if ip and not ip.startswith('VÁŠ') and not ip.startswith('REPLACE'):
    text=text.replace('listening-ip=<VPS_PUBLIC_IP>', f'listening-ip={ip}\n#external-ip={ip}')
open(dst,'w',encoding='utf-8').write(text)
PY
  chmod 600 /etc/turnserver/turnserver.conf
  chown root:root /etc/turnserver/turnserver.conf || true
fi
# Install env only if source provided or missing destination (preserve existing on redeploy when no source change intent)
if [[ -f "$SOURCE_ENV" ]]; then
  install -m 0600 "$SOURCE_ENV" "$ENV_FILE"
  chown root:root "$ENV_FILE" || true
elif [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE missing and no source env provided" >&2; exit 1
else
  echo "Preserving existing $ENV_FILE"
fi

echo "[6/9] Activating release"
PREV=""
if [[ -L "${CURRENT_LINK}" || -e "${CURRENT_LINK}" ]]; then PREV="$(readlink -f "${CURRENT_LINK}" || true)"; fi
ln -sfn "${RELEASE_PATH}" "${CURRENT_LINK}"
printf '%s\n' "${PREV}" > "${RELEASES_DIR}/previous"
printf '%s\n' "${RELEASE_PATH}" > "${RELEASES_DIR}/current"

echo "[7/9] Reloading systemd and enabling services"
systemctl daemon-reload
systemctl enable cmep-streaming.service
if [[ "$ENABLE_CADDY" == "1" ]]; then systemctl enable caddy || true; fi
if [[ "$ENABLE_COTURN" == "1" ]]; then systemctl enable coturn || true; fi

echo "[8/9] Restarting services"
systemctl restart cmep-streaming.service
if [[ "$ENABLE_CADDY" == "1" ]]; then systemctl restart caddy || true; fi
if [[ "$ENABLE_COTURN" == "1" ]]; then systemctl restart coturn || true; fi

echo "[9/9] Running readiness health check"
for i in $(seq 1 30); do
  if "${CURRENT_LINK}/deploy/scripts/health-check.sh" "http://127.0.0.1:8504" "ready"; then
    echo "Deployment completed successfully (release ${RELEASE_ID})."
    exit 0
  fi
  sleep 1
done
echo "ERROR: readiness check failed for release ${RELEASE_ID}" >&2
exit 1
