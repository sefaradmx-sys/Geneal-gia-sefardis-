# Arquitectura — LA MV Census

LA MV Census es una aplicación privada de inteligencia de sentimiento cívico. El número que muestra es un **índice de sentimiento digital**, no una encuesta probabilística y no una aprobación electoral.

## Árbol del monorepo

```
.
├── apps/
│   ├── api/                 # FastAPI, modelos, scoring, seed, worker
│   ├── collector/           # Conectores de ingesta (paquete `collector`)
│   └── web/                 # Next.js 15, tablero LA MV Census
├── docs/
├── scripts/seed_demo.py
├── docker-compose.yml
├── .env.example
└── README.md
```

`apps/api` y `apps/collector` comparten imagen. El proceso `api` sirve HTTP, `worker` recalcula snapshots y `collector` ejecuta conectores. No hay un módulo único que mezcle red, NLP y tablero.

## Límites de recolección

Prioridad:

1. APIs oficiales y cargas que el analista tiene derecho a usar.
2. RSS, hemerotecas y comentarios públicos con API (YouTube Data API, Reddit API, X API oficial, Bluesky queda fuera de esta entrega).
3. Crawler de páginas públicas: `robots.txt`, retraso, tope diario, User-Agent identificable, solo dominios en la lista permitida del estudio.
4. CSV, XLSX y JSON.

No se implementa evasión de captchas, robo de sesiones, granjas de cuentas, bypass de login ni scraping autenticado de Facebook, Instagram, TikTok o X. Esas redes, si no hay API usable, quedan como conector deshabilitado con el contrato `Connector` y la carga manual.

Playwright no corre por defecto. El crawler público usa HTTP. Un render de navegador solo tendría sentido en URLs ya allowlisteadas y queda apagado (`PLAYWRIGHT_ENABLED` no se usa en esta versión).

El sistema no enriquece datos de civiles. Los objetivos de ejemplo son perfiles ficticios e instituciones.

## Servicios locales

| Servicio | Rol |
|---|---|
| PostgreSQL 16 | Fuente de verdad. La imagen Compose trae pgvector para embeddings futuros. |
| Redis | Señal de vida del worker y base para topes. |
| API :8000 | Auth, CRUD, scoring en vivo, carga manual. |
| Worker | Snapshots diarios del índice. |
| Collector | RSS y APIs cuando hay llave y el interruptor está activo. |
| Web :3000 | Login y tablero. |
| MinIO | Reservado para payloads crudos y exports. |

Si falta una API key, ese conector responde `ConnectorNotConfigured` y la app sigue arriba.

## Flujo de una mención

1. El conector devuelve `RawItem` (o el analista sube un archivo).
2. Se normaliza el texto y se guarda la mención con `license_note`, `collected_at` y `source_url`.
3. La clasificación (sentimiento, postura, ironía, confianza) vive aparte.
4. El índice se calcula al leer, con la fórmula de `docs/SCORING.md`. Nada se inventa para llenar un hueco.

Las menciones de demostración van marcadas `is_synthetic=true` y el tablero lo dice.

## Auth

JWT de corta vida en cookie `httpOnly` puesta por el servidor de Next. Contraseñas con Argon2id. Roles: `superadmin`, `analyst`, `client_reader`, `auditor`. Cada tabla de negocio lleva `organization_id`.

El usuario inicial sale de `BOOTSTRAP_ADMIN_USER` y `BOOTSTRAP_ADMIN_PASSWORD`. Esas variables no se escriben en logs ni en respuestas.
