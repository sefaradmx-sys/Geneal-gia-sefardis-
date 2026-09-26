# Despliegue en el VPS GarGa

LA MV Census se publica en `http://<IP>/census` por Caddy. No usa el apex de garga.com.mx ni sustituye `/crm`, `/encuestas`, `/pulso` o `/radio`.

## Base de datos

Se crea una base `lmc` en el Postgres 16 que ya corre (`garga-postgres-1`). Las bases `garga_crm`, `garga_cms`, `garga_encuestas` y `garga_matomo` no se tocan.

## Puertos

| Destino | Uso |
|---|---|
| `/census` en :80 / :8080 / :443 | Tablero público en el IP |
| :3092 | Next directo (si Database Mart lo mapea) |

El API no se publica hacia Internet; el tablero lo llama por la red Docker.
