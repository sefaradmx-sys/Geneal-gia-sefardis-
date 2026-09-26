# Despliegue en el VPS GarGa

LA MV Census se publica en `/census` por Caddy. No usa el apex de garga.com.mx ni sustituye `/crm`, `/encuestas`, `/pulso` o `/radio`.

URL pública (Database Mart ya mapea **10049** y **10050** al Caddy de la VM):

`http://108.181.203.225:10049/census/login`

80 y 443 públicos de esa IP no son este Caddy. 8080, 3090, 3091 y 3092 están ocupados dentro de la VM o no salen a Internet.

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
