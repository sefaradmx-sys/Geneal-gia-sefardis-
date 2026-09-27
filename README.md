# Genealogía Sefardí

Archivo genealógico con árbol, registros y lugares. La base SQLite guarda las personas, los parentescos y cada consulta.

- Sitio: `https://genealogiasefardi.site/`
- Árbol: `https://tree.genealogiasefardi.site/` (el mismo proceso; si el `Host` empieza por `tree.` la portada es el árbol)

## Arranque

Hace falta Node.js 22.5 o posterior. No hay dependencias que instalar.

```bash
cp .env.example .env
npm start
```

- Archivo: http://127.0.0.1:3000
- Árbol local: http://127.0.0.1:3000/arbol
- Salud: http://127.0.0.1:3000/api/salud

La primera vez se crea `data/genealogia.sqlite` con una familia Toledano de demostración, marcada como tal.

```bash
npm test
```

## Qué queda guardado

Cada búsqueda escribe en la base:

- la consulta
- el resultado de cada fuente (o el error)
- los registros y los pines con coordenadas
- las personas y parentescos que incorpores al árbol

Los portales (PARES, FamilySearch, INEGI, Historypin y el resto) se guardan como la consulta que abre el sitio oficial. No son partidas transcritas.

## Fuentes

Sin llave responden VIAF, Wikidata, WikiTree, Library of Congress, NARA, OpenHistoricalMap, Pleiades, World Historical Gazetteer, Historypin y datos.gob.mx (censos, cuando la búsqueda es de México o menciona un censo).

Con variable de entorno:

| Variable | Fuente |
| --- | --- |
| `FAMILYSEARCH_CLIENT_ID` | Lugares de FamilySearch. El botón «Conectar» abre OAuth para el árbol. |
| `INEGI_TOKEN` | Serie de población total (indicador `1002000001`, área `0700`). |
| `GEONAMES_USERNAME` | Topónimos GeoNames. |
| `EUROPEANA_WSKEY` | Objetos de Europeana. |
| `HISTORYPIN_PROJECT` | Galería de un proyecto Historypin. Sin ella se consulta el listado de proyectos. |

Historypin es la aplicación de pines históricos. El Archivo Histórico Nacional y el Archivo General de Indias se consultan en PARES.

## Sitio principal en HostGator

`genealogiasefardi.site` resuelve en HostGator (`ns18.hostgator.mx`, `ns19.hostgator.mx`, `108.179.194.59`). El árbol ya publicado está en:

`https://genealogiasefardi.site/sefarad-mx/index.php?route=/sefarad-mx/tree/sefarad`

`hostgator/public_html/index.html` es la portada para subir a la raíz de la cuenta, sin reemplazar la carpeta `sefarad-mx`. La búsqueda abre FamilySearch, INEGI, PARES, Historypin, WikiTree y VIAF, y el botón del árbol entra a esa ruta.

`tree.genealogiasefardi.site` todavía no tiene registro DNS. En cPanel el subdominio `tree` debe usar la carpeta `public_html/sefarad-mx`:

```bash
CPANEL_USER=usuario CPANEL_TOKEN=token node scripts/create-tree-subdomain.mjs
```

Hace falta el token de API de cPanel. Desde este repositorio no se puede crear el registro: el puerto 2083 de la cuenta no acepta la conexión.

## HostGator y el archivo Node

La aplicación Node guarda personas, parentescos y cada consulta. En cPanel, «Setup Node.js App»:

1. Raíz de la aplicación: este repositorio.
2. Archivo de arranque: `src/server.js`.
3. Versión de Node 22.
4. Variables de `.env.example` en el panel.

El directorio `data/` tiene que poder escribir la base. No subas `genealogia.sqlite` a un repositorio público si ya contiene investigación real. `docs/index.html` es la misma portada para GitHub Pages.
