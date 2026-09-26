# LA MV Census

Panel privado de inteligencia de sentimiento cívico. El número del tablero es un **índice de sentimiento digital**. No es una encuesta representativa ni una aprobación electoral.

Marca visible: **LA MV Census**. Subtítulo: «Inteligencia de sentimiento cívico».

## Qué mide

Para cada objetivo y ventana, el índice pondera menciones públicas o cargas del analista por engagement, fuente, autor, recencia, relevancia e ironía. La fórmula está en `docs/SCORING.md`. Cada porcentaje se puede abrir hasta el texto que lo sostiene.

## Límites

- Solo contenido público o archivos que el cliente tiene derecho a usar.
- Cada mención guarda `collected_at`, URL y `license_note`.
- No hay enriquecimiento de civiles. Los perfiles de la semilla son ficticios.
- Sin API key, esa fuente queda en «no configurada» y el resto sigue funcionando.
- No hay evasión de captchas, robo de sesión, granjas de cuentas ni scraping autenticado de redes cerradas.
- El crawler público respeta `robots.txt`, espera entre páginas y tiene tope diario. Solo entra a dominios de la lista del estudio.
- X, YouTube y Reddit se consultan por su API oficial. Facebook queda deshabilitado.
- El sistema no inventa menciones. La semilla está marcada como sintética y el tablero lo dice.

## Arranque

Hace falta Docker y un archivo `.env` copiado de `.env.example`.

```bash
cp .env.example .env
docker compose up --build
```

- Tablero: http://localhost:3000
- API: http://localhost:8000/api/v1/health

El usuario inicial sale de `BOOTSTRAP_ADMIN_USER` y `BOOTSTRAP_ADMIN_PASSWORD`. En local, el ejemplo trae un superadmin para el primer login. En producción hay que cambiar esas variables. La contraseña no se imprime en logs ni en la API.

`DEMO_SEED=true` carga el estudio «Sentimiento Gobierno de Coahuila — 30 días» con 2,000 menciones sintéticas.

## Desarrollo sin Compose

```bash
python3 -m venv .venv
.venv/bin/pip install -r apps/api/requirements.txt
cd apps/api && ../.venv/bin/alembic upgrade head && ../.venv/bin/python -m app.seed
cd apps/web && npm install && npm run dev
```

Postgres y Redis tienen que estar arriba. La URL local de la base usa `localhost` en lugar de `postgres`.

## Pruebas

```bash
cd apps/api && PYTHONPATH=".:../collector/src" ../../.venv/bin/pytest
```

Si el virtualenv está en la raíz del repo, el intérprete es `.venv/bin/pytest` desde `apps/api` con `PYTHONPATH` como arriba.
