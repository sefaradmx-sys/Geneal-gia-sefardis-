#!/bin/bash
# Entra por SSH a HostGator, crea tree.genealogiasefardi.site
# y sube la portada sin tocar la carpeta sefarad-mx.
set -u

HOST="${HOSTGATOR_SSH_HOST:-mx18.hostgator.mx}"
USER_NAME="${HOSTGATOR_SSH_USER:-}"
PORT="${HOSTGATOR_SSH_PORT:-2222}"
PASS_FILE="${HOSTGATOR_SSH_PASS_FILE:-}"
ROOT="${HOSTGATOR_WEB_ROOT:-public_html}"
STATE="${HOSTGATOR_STATE_FILE:-hostgator/estado.txt}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$(dirname "$STATE")"
{
  echo "fecha=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "host=$HOST"
  echo "puerto_pedido=$PORT"
} > "$STATE"

banner() {
  local host="$1" port="$2"
  python3 - "$host" "$port" << 'PY'
import socket, sys
host, port = sys.argv[1], int(sys.argv[2])
try:
    sock = socket.create_connection((host, port), 8)
    sock.settimeout(5)
    data = sock.recv(180)
    sock.close()
    text = data.decode("utf-8", "replace").replace("\n", " ").strip()
    print(f"BANNER {host}:{port} {text[:160]}")
except Exception as error:
    print(f"CERRADO {host}:{port} {type(error).__name__}")
PY
}

for candidate in "$PORT" 2222 22; do
  banner "$HOST" "$candidate" | tee -a "$STATE"
  banner "genealogiasefardi.site" "$candidate" | tee -a "$STATE"
done

if [[ -z "$USER_NAME" || -z "$PASS_FILE" || ! -s "$PASS_FILE" ]]; then
  echo "SSH_SIN_CLAVE" | tee -a "$STATE"
  exit 0
fi

SSH_OPTS=(
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile=/tmp/hostgator-known
  -o PreferredAuthentications=password
  -o PubkeyAuthentication=no
  -o ConnectTimeout=20
)

run_ssh() {
  sshpass -f "$PASS_FILE" ssh "${SSH_OPTS[@]}" -p "$1" "${USER_NAME}@${HOST}" "$2"
}

OPEN_PORT=""
for candidate in "$PORT" 2222 22; do
  if run_ssh "$candidate" "echo SSH_OK; pwd; ls public_html | head"; then
    OPEN_PORT="$candidate"
    echo "SSH_OK puerto=$candidate" | tee -a "$STATE"
    break
  fi
  echo "SSH_FALLO puerto=$candidate" | tee -a "$STATE"
done

if [[ -z "$OPEN_PORT" ]]; then
  exit 1
fi

run_ssh "$OPEN_PORT" "mkdir -p ${ROOT}/sefarad-mx ${ROOT}/tree && uapi SubDomain addsubdomain domain=tree rootdomain=genealogiasefardi.site dir=${ROOT}/sefarad-mx; uapi SubDomain listsubdomains" | tee -a "$STATE"

LOCAL="${REPO_ROOT}/hostgator/public_html"
sshpass -f "$PASS_FILE" scp "${SSH_OPTS[@]}" -P "$OPEN_PORT" \
  "$LOCAL/index.html" "$LOCAL/estilos.css" "$LOCAL/.htaccess" \
  "${USER_NAME}@${HOST}:${ROOT}/"
sshpass -f "$PASS_FILE" scp "${SSH_OPTS[@]}" -P "$OPEN_PORT" \
  "$LOCAL/tree/index.php" \
  "${USER_NAME}@${HOST}:${ROOT}/tree/index.php"
echo "ARCHIVOS_SUBIDOS" | tee -a "$STATE"
