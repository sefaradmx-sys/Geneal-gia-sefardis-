# Genealogía Sefardí

Sitio público: https://sefaradmx-sys.github.io/Geneal-gia-sefardis-/

A small web application to explore and preserve Sephardic family trees. It serves
a static frontend and a small JSON API backed by an in-memory dataset. The public
page lives in `docs/` and is published with GitHub Pages.

## Requirements

- Node.js >= 20 (developed against Node 22)

## Getting started

```bash
npm install
npm start
```

The server listens on `http://localhost:3000` by default. Set `PORT` to change it.

## Available scripts

- `npm start` — start the Express server (`src/server.js`).
- `npm run dev` — start the server with automatic reload on file changes.
- `npm test` — run the unit tests with the Node.js built-in test runner.

## API

| Method | Path                | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/api/health`       | Service health check.                |
| GET    | `/api/members`      | List all registered members.         |
| GET    | `/api/members/:id`  | Fetch a single member by id.         |
| GET    | `/api/tree`         | Members arranged as a nested tree.   |

## Project structure

```
public/          Static frontend (HTML, CSS, JS)
src/server.js    Express server and API routes
src/members.js   In-memory dataset and tree helpers
test/            Unit tests (node:test)
```
