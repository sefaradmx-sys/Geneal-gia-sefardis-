#!/usr/bin/env bash
# Publica LA MV Census en el VPS de Database Mart (GarGa).
# Uso local:
#   printf '%s' 'CONTRASEÑA' > /tmp/vps-ssh-pass
#   chmod 600 /tmp/vps-ssh-pass
#   ./deploy/vps/deploy.sh
set -euo pipefail

HOST="${VPS_HOST:-108.181.203.225}"
PORT="${VPS_SSH_PORT:-10048}"
USER_NAME="${VPS_SSH_USER:-administrator}"
PASS_FILE="${VPS_SSH_PASS_FILE:-/tmp/vps-ssh-pass}"
REMOTE_APP="${VPS_REMOTE_APP:-/opt/garga/apps/la-mv-census}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ADMIN_USER="${BOOTSTRAP_ADMIN_USER:-pmccoahuila@gmail.com}"
ADMIN_EMAIL="${BOOTSTRAP_ADMIN_EMAIL:-pmccoahuila@gmail.com}"
ADMIN_PASS="${BOOTSTRAP_ADMIN_PASSWORD:-tachy8507}"

if [[ ! -s "$PASS_FILE" ]]; then
  echo "Falta $PASS_FILE con la contraseña SSH." >&2
  exit 1
fi
if ! command -v sshpass >/dev/null 2>&1; then
  echo "Instala sshpass (apt install sshpass)." >&2
  exit 1
fi

ssh_base=(sshpass -f "$PASS_FILE" ssh
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile=/tmp/vps-known
  -o PreferredAuthentications=password
  -o PubkeyAuthentication=no
  -p "$PORT")
rsync_rsh="sshpass -f ${PASS_FILE} ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/tmp/vps-known -o PreferredAuthentications=password -o PubkeyAuthentication=no -p ${PORT}"

echo ">> código → ${USER_NAME}@${HOST}:${REMOTE_APP}"
rsync -az --delete \
  --exclude .git --exclude .venv --exclude node_modules --exclude .next \
  --exclude .env --exclude 'apps/api/.env' --exclude deploy/vps/.env \
  --exclude .ruff_cache --exclude __pycache__ --exclude .pytest_cache \
  --exclude .github \
  -e "$rsync_rsh" \
  "${REPO_ROOT}/" "${USER_NAME}@${HOST}:${REMOTE_APP}/"

echo ">> BOOTSTRAP_ADMIN_* en deploy/vps/.env"
"${ssh_base[@]}" "${USER_NAME}@${HOST}" \
  ADMIN_USER="$ADMIN_USER" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASS="$ADMIN_PASS" REMOTE_APP="$REMOTE_APP" \
  bash -s <<'REMOTE'
set -euo pipefail
python3 - <<'PY'
import os
from pathlib import Path
path = Path(os.environ["REMOTE_APP"]) / "deploy/vps/.env"
vals = {
    "BOOTSTRAP_ADMIN_USER": os.environ["ADMIN_USER"],
    "BOOTSTRAP_ADMIN_EMAIL": os.environ["ADMIN_EMAIL"],
    "BOOTSTRAP_ADMIN_PASSWORD": os.environ["ADMIN_PASS"],
}
lines = []
seen = set()
if path.exists():
    for raw in path.read_text().splitlines():
        if not raw.strip() or raw.lstrip().startswith("#") or "=" not in raw:
            lines.append(raw)
            continue
        key = raw.split("=", 1)[0].strip()
        if key in vals:
            lines.append(f'{key}="{vals[key]}"')
            seen.add(key)
        else:
            lines.append(raw)
for key, value in vals.items():
    if key not in seen:
        lines.append(f'{key}="{value}"')
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("\n".join(lines).rstrip() + "\n")
path.chmod(0o600)
print("env ok", path)
PY
REMOTE

echo ">> Caddy: /census y redirección de / al login"
"${ssh_base[@]}" "${USER_NAME}@${HOST}" bash -s <<'REMOTE'
set -euo pipefail
python3 - <<'PY'
from pathlib import Path
import re
path = Path("/opt/garga/caddy/Caddyfile")
text = path.read_text()
original = text
if "handle /census" not in text:
    block = "\thandle /census* {\n\t\treverse_proxy lmc-web:3000\n\t}\n\thandle / {\n\t\tredir /census/login 302\n\t}\n"
    if "handle {" in text:
        text = text.replace("handle {", block + "handle {", 1)
    else:
        raise SystemExit("Caddyfile sin bloque handle")
elif "redir /census/login" not in text:
    text, n = re.subn(
        r"(handle /census\* \{\s*reverse_proxy lmc-web:3000\s*\})",
        r"\1\n\thandle / {\n\t\tredir /census/login 302\n\t}",
        text,
        count=1,
        flags=re.S,
    )
    if not n:
        # bloque en una sola línea u otra forma: insertar antes del handle final
        text = text.replace(
            "handle /census*",
            "handle /census* {\n\t\treverse_proxy lmc-web:3000\n\t}\n\thandle / {\n\t\tredir /census/login 302\n\t}\n\t# census",
            1,
        )
if text != original:
    path.write_text(text)
    print("Caddyfile actualizado")
else:
    print("Caddyfile sin cambios")
PY
REMOTE

echo ">> docker compose build + recreate"
"${ssh_base[@]}" "${USER_NAME}@${HOST}" \
  "cd ${REMOTE_APP}/deploy/vps && docker compose build && docker compose up -d --force-recreate api web && docker exec garga-caddy-1 caddy reload --config /etc/caddy/Caddyfile"

echo ">> prueba local"
"${ssh_base[@]}" "${USER_NAME}@${HOST}" \
  "curl -sS -m 25 -o /tmp/lmc-login.body -w 'login:%{http_code}\n' http://127.0.0.1/census/login; python3 -c \"import pathlib; t=pathlib.Path('/tmp/lmc-login.body').read_text(errors='ignore'); print('LA MV Census' in t, 'form' in t.lower())\""

echo "LISTO → http://${HOST}:10049/census/login"
