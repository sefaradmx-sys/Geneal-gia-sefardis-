#!/usr/bin/env bash
# En esta rama el job deploy-vps publica solo el catálogo OSINT Framework.
# No reconstruye LA MV Census ni toca sus contenedores.
set -euo pipefail

HOST="${VPS_HOST:-108.181.203.225}"
PORT="${VPS_SSH_PORT:-10048}"
USER_NAME="${VPS_SSH_USER:-administrator}"
PASS_FILE="${VPS_SSH_PASS_FILE:-/tmp/vps-ssh-pass}"
APP_DIR="${OSINT_APP_DIR:-/opt/garga/apps/osint-framework}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ ! -s "$PASS_FILE" ]]; then
  echo "Falta $PASS_FILE" >&2
  exit 1
fi
command -v sshpass >/dev/null
command -v rsync >/dev/null

SSH_OPTS=(
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile=/tmp/vps-known
  -o PreferredAuthentications=password
  -o PubkeyAuthentication=no
  -o ConnectTimeout=30
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=240
  -o TCPKeepAlive=yes
)
run_ssh() { sshpass -f "$PASS_FILE" ssh "${SSH_OPTS[@]}" -p "$PORT" "${USER_NAME}@${HOST}" "$@"; }

echo ">> clonar catálogo $(date -u +%H:%M:%S)"
rm -rf /tmp/osint-fw
git clone --depth 1 https://github.com/sefaradmx-sys/OSINT-Framework.git /tmp/osint-fw
test -f /tmp/osint-fw/public/index.html
test -f /tmp/osint-fw/public/arf.json
test -f /tmp/osint-fw/public/js/d3.min.js

echo ">> ping ssh $(date -u +%H:%M:%S)"
run_ssh 'echo SSH_OK; hostname; whoami'

echo ">> rsync $(date -u +%H:%M:%S)"
run_ssh "mkdir -p ${APP_DIR}/public"
export RSYNC_RSH="sshpass -f ${PASS_FILE} ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/tmp/vps-known -o PreferredAuthentications=password -o PubkeyAuthentication=no -o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=240 -o TCPKeepAlive=yes -p ${PORT}"
rsync -az --delete /tmp/osint-fw/public/ "${USER_NAME}@${HOST}:${APP_DIR}/public/"
rsync -az \
  "${REPO_ROOT}/deploy/osint/patch_caddy.py" \
  "${REPO_ROOT}/deploy/osint/pick_port.py" \
  "${REPO_ROOT}/deploy/osint/install.sh" \
  "${REPO_ROOT}/deploy/osint/nginx.conf" \
  "${USER_NAME}@${HOST}:${APP_DIR}/"

echo ">> instalar $(date -u +%H:%M:%S)"
run_ssh "chmod +x ${APP_DIR}/install.sh && bash ${APP_DIR}/install.sh"

echo ">> url pública $(date -u +%H:%M:%S)"
public="http://${HOST}:10049/osint/"
code="$(curl -sS -m 20 -o /tmp/osint-public.html -w '%{http_code}' "$public")"
echo "public_index:${code}"
test "$code" = "200"
grep -q 'OSINT Framework' /tmp/osint-public.html
curl -fsS -m 20 -o /dev/null -w 'public_arf:%{http_code}\n' "http://${HOST}:10049/osint/arf.json"
curl -fsS -m 20 -o /dev/null -w 'public_css:%{http_code}\n' "http://${HOST}:10049/osint/css/arf.css"
curl -fsS -m 20 -o /dev/null -w 'public_js:%{http_code}\n' "http://${HOST}:10049/osint/js/d3.min.js"
curl -fsS -m 20 -o /dev/null -w 'public_api:%{http_code}\n' "http://${HOST}:10049/api/tool-stats?tool_id=probe"
census="$(curl -sS -m 20 -o /dev/null -w '%{http_code}' "http://${HOST}:10049/census/login")"
echo "public_census:${census}"
test "$census" = "200"
echo "LISTO ${public}"
