#!/usr/bin/env bash
# Publica LA MV Census en el VPS de Database Mart (GarGa).
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
  echo "Falta $PASS_FILE" >&2
  exit 1
fi
command -v sshpass >/dev/null
command -v rsync >/dev/null

# Keepalives: el NAT de Database Mart corta SSH idle ~3–4 min durante docker build.
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
run_scp() { sshpass -f "$PASS_FILE" scp "${SSH_OPTS[@]}" -P "$PORT" "$@"; }

echo ">> ping ssh $(date -u +%H:%M:%S)"
run_ssh 'echo SSH_OK; hostname; whoami; (docker --version || sudo docker --version); df -h / | tail -1; free -m | head -2'

echo ">> rsync $(date -u +%H:%M:%S)"
export RSYNC_RSH="sshpass -f ${PASS_FILE} ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/tmp/vps-known -o PreferredAuthentications=password -o PubkeyAuthentication=no -o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=240 -o TCPKeepAlive=yes -p ${PORT}"
rsync -az --delete \
  --exclude .git --exclude .venv --exclude node_modules --exclude .next \
  --exclude .env --exclude 'apps/api/.env' --exclude deploy/vps/.env \
  --exclude .ruff_cache --exclude __pycache__ --exclude .pytest_cache \
  --exclude .github \
  "${REPO_ROOT}/" "${USER_NAME}@${HOST}:${REMOTE_APP}/"

echo ">> escribe scripts remotos $(date -u +%H:%M:%S)"
tmp=$(mktemp -d)
cat >"$tmp/update_env.py" <<'PY'
import os
from pathlib import Path
path = Path(os.environ["REMOTE_APP"]) / "deploy/vps/.env"
vals = {
    "BOOTSTRAP_ADMIN_USER": os.environ["ADMIN_USER"],
    "BOOTSTRAP_ADMIN_EMAIL": os.environ["ADMIN_EMAIL"],
    "BOOTSTRAP_ADMIN_PASSWORD": os.environ["ADMIN_PASS"],
}
lines, seen = [], set()
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
print("env_ok", path)
PY

cat >"$tmp/patch_caddy.py" <<'PY'
from pathlib import Path
import re
path = Path("/opt/garga/caddy/Caddyfile")
text = path.read_text()
original = text
census_block = "\thandle /census* {\n\t\treverse_proxy lmc-web:3000\n\t}\n"
root_block = "\thandle / {\n\t\tredir /census/login 302\n\t}\n"
if "handle /census" not in text:
    if "handle {" in text:
        text = text.replace("handle {", census_block + root_block + "handle {", 1)
    else:
        raise SystemExit("caddy_missing_handle")
elif "redir /census/login" not in text:
    text2, n = re.subn(
        r"(handle /census\* \{\s*reverse_proxy lmc-web:3000\s*\})",
        r"\1\n" + root_block.rstrip("\n"),
        text,
        count=1,
        flags=re.S,
    )
    if n:
        text = text2
    elif "handle /census*" in text and root_block.strip() not in text:
        text = text.replace("handle /census*", census_block.strip() + "\n" + root_block + "\thandle_old_census", 1)
if text != original:
    path.write_text(text)
    print("caddy_updated")
else:
    print("caddy_unchanged")
PY

cat >"$tmp/remote_compose.sh" <<'REMOTE'
#!/usr/bin/env bash
set -euo pipefail
cd "$REMOTE_APP/deploy/vps"
if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif sudo docker compose version >/dev/null 2>&1; then
  DC=(sudo docker compose)
else
  DC=(docker-compose)
fi
echo "USING:${DC[*]}"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
echo ">> build api $(date -u +%H:%M:%S)"
"${DC[@]}" build --progress=plain api
echo ">> build web $(date -u +%H:%M:%S)"
"${DC[@]}" build --progress=plain web
echo ">> up $(date -u +%H:%M:%S)"
"${DC[@]}" up -d --force-recreate --remove-orphans api web
echo ">> wait api $(date -u +%H:%M:%S)"
for i in $(seq 1 36); do
  if curl -sf -m 3 http://127.0.0.1:3092/census/login >/dev/null 2>&1 \
    || curl -sf -m 3 http://127.0.0.1/census/login >/dev/null 2>&1; then
    echo "web_ready_$i"
    break
  fi
  sleep 5
done
echo ">> caddy reload $(date -u +%H:%M:%S)"
if sudo docker exec garga-caddy-1 caddy reload --config /etc/caddy/Caddyfile 2>/tmp/caddy-reload.err; then
  echo caddy_reload_ok
elif docker exec garga-caddy-1 caddy reload --config /etc/caddy/Caddyfile 2>>/tmp/caddy-reload.err; then
  echo caddy_reload_ok
else
  echo "WARN caddy reload failed"
  cat /tmp/caddy-reload.err || true
fi
"${DC[@]}" ps
REMOTE

run_scp "$tmp/update_env.py" "$tmp/patch_caddy.py" "$tmp/remote_compose.sh" "${USER_NAME}@${HOST}:/tmp/"
run_ssh "REMOTE_APP='${REMOTE_APP}' ADMIN_USER='${ADMIN_USER}' ADMIN_EMAIL='${ADMIN_EMAIL}' ADMIN_PASS='${ADMIN_PASS}' python3 /tmp/update_env.py"
run_ssh "python3 /tmp/patch_caddy.py" || echo "WARN caddy patch failed"
run_ssh "chmod +x /tmp/remote_compose.sh; REMOTE_APP='${REMOTE_APP}' bash /tmp/remote_compose.sh"

echo ">> smoke local $(date -u +%H:%M:%S)"
run_ssh "curl -sS -m 25 -o /tmp/lmc-login.body -w 'login:%{http_code}\n' http://127.0.0.1/census/login || curl -sS -m 25 -o /tmp/lmc-login.body -w 'login_direct:%{http_code}\n' http://127.0.0.1:3092/census/login; python3 -c \"import pathlib; t=pathlib.Path('/tmp/lmc-login.body').read_text(errors='ignore'); print('ok_title', 'LA MV Census' in t); print('bytes', len(t))\""

rm -rf "$tmp"
echo "LISTO http://${HOST}:10049/census/login"
