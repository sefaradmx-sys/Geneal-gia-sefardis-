# Despliegue en el VPS GarGa

LA MV Census se publica en `/census` por Caddy. No usa el apex de garga.com.mx ni sustituye `/crm`, `/encuestas`, `/pulso` o `/radio`.

URL pública (Database Mart ya mapea **10049** y **10050** al Caddy de la VM):

`http://108.181.203.225:10049/census/login`

La raíz `http://108.181.203.225:10049/` solo muestra el placeholder del VPS. El tablero es **`/census`**.

El acceso de ese entorno sale de `deploy/vps/.env` (`BOOTSTRAP_ADMIN_USER`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`). El ejemplo del repo usa `pmccoahuila@gmail.com`. Al recrear el API, la semilla actualiza esa cuenta aunque el usuario anterior sea `admin`.

## Redeploy

Con la contraseña SSH de `administrator` en el puerto **10048**:

```bash
printf '%s' 'TU_CLAVE_SSH' > /tmp/vps-ssh-pass
chmod 600 /tmp/vps-ssh-pass
./deploy/vps/deploy.sh
```

O configura el secreto Actions `VPS_SSH_PASS` y deja que `.github/workflows/deploy-vps.yml` publique la rama.

## Base de datos

Base `lmc` en el Postgres 16 existente (`garga-postgres-1`). No se tocan `garga_crm`, `garga_cms`, `garga_encuestas` ni `garga_matomo`.

## Puertos

| Destino | Uso |
|---|---|
| Público `10049` y `10050` → Caddy :80 | Tablero en `/census` |
| Público `10047` | n8n (no tocar) |
| Público `10048` | SSH (no tocar) |
| Público `10051` | Icecast / radio (no tocar) |
| VM :3092 | Next directo, solo interno |

El API no se publica hacia Internet; el tablero lo llama por la red Docker.

El archivo `deploy/vps/.env` vive solo en el VPS. No se versiona. Un `rsync --delete` desde el repo lo borra: excluir `.env` o copiarlo de nuevo antes de `docker compose up`.
