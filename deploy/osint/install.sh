#!/usr/bin/env bash
# Publica el sitio estático OSINT Framework en el VPS GarGa, bajo /osint.
# No sustituye /census, /crm, /encuestas, /pulso ni /radio.
set -euo pipefail

APP_DIR="${OSINT_APP_DIR:-/opt/garga/apps/osint-framework}"
CADDYFILE="${CADDYFILE:-/opt/garga/caddy/Caddyfile}"

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
elif sudo docker info >/dev/null 2>&1; then
  DOCKER=(sudo docker)
else
  echo "docker no disponible" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/public/index.html" || ! -f "${APP_DIR}/public/arf.json" ]]; then
  echo "faltan ${APP_DIR}/public/index.html o arf.json" >&2
  exit 1
fi
if [[ ! -f "$CADDYFILE" ]]; then
  echo "no está $CADDYFILE" >&2
  exit 1
fi

CADDY_NAME="$("${DOCKER[@]}" ps --format '{{.Names}}' | grep -i caddy | head -1 || true)"
if [[ -z "$CADDY_NAME" ]]; then
  echo "no hay contenedor caddy en ejecución" >&2
  exit 1
fi

NET="$("${DOCKER[@]}" inspect "$CADDY_NAME" --format '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}' | head -1)"
if [[ -z "$NET" ]]; then
  echo "caddy sin red docker" >&2
  exit 1
fi

echo ">> nginx $(date -u +%H:%M:%S) red=${NET} caddy=${CADDY_NAME}"
"${DOCKER[@]}" pull nginx:1.27-alpine
"${DOCKER[@]}" rm -f osint-framework >/dev/null 2>&1 || true
"${DOCKER[@]}" run -d \
  --name osint-framework \
  --restart unless-stopped \
  --network "$NET" \
  -v "${APP_DIR}/public:/usr/share/nginx/html:ro" \
  nginx:1.27-alpine

python3 "${APP_DIR}/patch_caddy.py" "$CADDYFILE"

restore_caddy() {
  if [[ -f "${CADDYFILE}.bak-osint" ]]; then
    cp "${CADDYFILE}.bak-osint" "$CADDYFILE"
    echo "caddy_restored"
  fi
}

echo ">> caddy validate $(date -u +%H:%M:%S)"
if ! "${DOCKER[@]}" exec "$CADDY_NAME" caddy validate --config /etc/caddy/Caddyfile; then
  restore_caddy
  echo "caddy validate falló; configuración anterior restaurada" >&2
  exit 1
fi

echo ">> caddy reload $(date -u +%H:%M:%S)"
if ! "${DOCKER[@]}" exec "$CADDY_NAME" caddy reload --config /etc/caddy/Caddyfile; then
  restore_caddy
  "${DOCKER[@]}" exec "$CADDY_NAME" caddy reload --config /etc/caddy/Caddyfile || true
  echo "caddy reload falló" >&2
  exit 1
fi

echo ">> smoke $(date -u +%H:%M:%S)"
for i in 1 2 3 4 5 6; do
  code=$(curl -sS -m 15 -o /tmp/osint-index.html -w '%{http_code}' http://127.0.0.1/osint/ || true)
  echo "intento ${i} → ${code}"
  if [[ "$code" == "200" ]] && grep -q 'OSINT Framework' /tmp/osint-index.html; then
    break
  fi
  sleep 2
done
test "$code" = "200"
grep -q 'OSINT Framework' /tmp/osint-index.html
curl -fsS -m 20 -o /tmp/osint-arf.json http://127.0.0.1/osint/arf.json
python3 -c 'import json; d=json.load(open("/tmp/osint-arf.json")); assert d.get("name")=="OSINT Framework"; print("arf_ok", d["name"])'
curl -fsS -m 15 -o /dev/null -w 'css:%{http_code}\n' http://127.0.0.1/osint/css/arf.css
curl -fsS -m 15 -o /dev/null -w 'js:%{http_code}\n' http://127.0.0.1/osint/js/d3.min.js
curl -fsS -m 15 -o /dev/null -w 'census:%{http_code}\n' http://127.0.0.1/census/login
echo "OSINT_OK http://127.0.0.1/osint/"
