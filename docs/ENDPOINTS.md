# Endpoints

Base: `/api/v1`. Campos JSON en inglés. Textos de error de negocio en español. El brief nombra rutas en español; esta versión usa las rutas de abajo.

| Brief | Implementado |
|---|---|
| `GET /estudios/{id}/resumen` | `GET /api/v1/studies/{id}/summary` |
| `GET /estudios/{id}/objetivos/{id}/serie` | `GET /api/v1/studies/{id}/targets/{target_id}/series` |
| `GET /estudios/{id}/comparar` | `GET /api/v1/studies/{id}/compare?ids=` |
| `GET /menciones` | `GET /api/v1/mentions` |
| `POST /estudios/{id}/preguntar` | `POST /api/v1/studies/{id}/ask` |

## Auth

- `POST /auth/login` — usuario o correo y contraseña. No revela cuál falló.
- `GET /auth/me`

## Organización y usuarios

- `GET /organizations`
- `POST /organizations`
- `GET /organizations/{id}`
- `PATCH /organizations/{id}`
- `GET /users`
- `POST /users`
- `GET /users/{id}`
- `PATCH /users/{id}`

`client_reader` y `auditor` no crean ni editan. `superadmin` crea usuarios.

## Estudios, objetivos, alias

- `GET /studies`
- `POST /studies`
- `GET /studies/{id}`
- `PATCH /studies/{id}`
- `DELETE /studies/{id}`
- `POST /studies/{id}/targets`
- `PATCH /targets/{id}`
- `DELETE /targets/{id}`
- `POST /targets/{id}/aliases`
- `DELETE /aliases/{id}`

## Lectura analítica

- `GET /studies/{id}/summary`
- `GET /studies/{id}/targets/{target_id}/series?date_from&date_to&source`
- `GET /studies/{id}/compare?ids=` UUID separados por coma
- `GET /mentions?study_id&source&sentiment&stance&geo_state&date_from&date_to&limit&offset`
- `POST /studies/{id}/ask` — cuerpo `{ "question": "..." }`. Modo `lexical` mientras no hay un modelo configurado. Cita menciones guardadas; no redacta citas nuevas.
- `POST /studies/{id}/uploads` — CSV, XLSX o JSON. Si el archivo no trae sentimiento, la mención queda en revisión y fuera del índice.

## Operación

- `GET /health`

El resumen siempre incluye `disclaimer`: «Sentimiento digital observado. No es encuesta representativa.»
