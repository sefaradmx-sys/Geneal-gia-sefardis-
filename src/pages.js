import { listPersons, recordsForPerson, spousesOf } from "./db.js";
import { sourceCatalog } from "./sources.js";
import { ancestorNode, descendantTree, earliestAncestor, generationColumns } from "./tree.js";

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default: {
        const unknown = char;
        return unknown;
      }
    }
  });
}

function sexLabel(sex) {
  switch (sex) {
    case "M":
      return "Hombre";
    case "F":
      return "Mujer";
    case "U":
      return "No indicado";
    default: {
      const unknown = sex;
      return unknown || "No indicado";
    }
  }
}

function layout({ title, body, treeHost, active }) {
  const treeHref = treeHost ? "/" : "/arbol";
  const homeHref = treeHost ? "https://genealogiasefardi.site/" : "/";
  const item = (href, id, label) =>
    `<a class="${active === id ? "active" : ""}" href="${href}">${label}</a>`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — Genealogía Sefardí</title>
  <meta name="description" content="Archivo genealógico sefardí: personas, árbol, registros históricos y lugares." />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%231b3a4b' width='32' height='32' rx='4'/%3E%3Ctext x='16' y='22' text-anchor='middle' fill='%23f3e6c8' font-size='14' font-family='Georgia'%3EGS%3C/text%3E%3C/svg%3E" />
  <link rel="stylesheet" href="/estilos.css" />
</head>
<body>
  <a class="skip" href="#contenido">Saltar al contenido</a>
  <header class="site-header">
    <a class="brand" href="${treeHost ? "/" : homeHref}">
      <span class="brand-mark" aria-hidden="true">GS</span>
      <span>
        <strong>Genealogía Sefardí</strong>
        <small>${treeHost ? "Árbol familiar" : "Archivo de familias"}</small>
      </span>
    </a>
    <form class="header-search" method="get" action="/buscar">
      <label class="sr" for="q">Buscar</label>
      <input id="q" name="q" type="search" placeholder="Nombre, apellido o lugar" />
      <button type="submit">Buscar</button>
    </form>
    <nav>
      ${item(homeHref, "inicio", "Inicio")}
      ${item("/buscar", "buscar", "Registros")}
      ${item(treeHref, "arbol", "Árbol")}
      ${item("/lugares", "lugares", "Lugares")}
      ${item("/fuentes", "fuentes", "Fuentes")}
    </nav>
  </header>
  <main id="contenido">${body}</main>
  <footer>
    <p>Cada búsqueda se guarda en la base del archivo. Los enlaces a FamilySearch, PARES, INEGI y el resto de portales abren la fuente oficial; no son partidas transcritas aquí.</p>
  </footer>
</body>
</html>`;
}

function personLine(person) {
  const years = [person.birth_date, person.death_date].filter(Boolean).join(" – ");
  const place = person.birth_place || person.death_place || "";
  return `<a class="person-row" href="/persona/${person.id}">
    <span>
      <strong>${esc(person.given_name)} ${esc(person.surname)}</strong>
      ${person.is_demonstration ? '<em class="demo">demostración</em>' : ""}
    </span>
    <small>${esc([years, place].filter(Boolean).join(" · "))}</small>
  </a>`;
}

export function pageHome({ treeHost, stats, people }) {
  const body = `
    <section class="hero-search">
      <p class="kicker">Archivo</p>
      <h1>Busca una persona, un registro o un lugar</h1>
      <p class="lede">Los árboles están en <a href="${treeHost ? "/" : "/arbol"}">la página del árbol</a> (<span class="host">tree.genealogiasefardi.site</span>). Cada búsqueda queda guardada en la base de datos.</p>
      <form class="search-grid" method="get" action="/buscar">
        <label>Nombre <input name="nombre" autocomplete="given-name" /></label>
        <label>Apellido <input name="apellido" autocomplete="family-name" /></label>
        <label>Lugar <input name="lugar" /></label>
        <label>Año <input name="ano" inputmode="numeric" maxlength="4" /></label>
        <button type="submit">Buscar en el archivo</button>
      </form>
      <dl class="stats">
        <div><dt>Personas</dt><dd>${stats.persons}</dd></div>
        <div><dt>Registros</dt><dd>${stats.records}</dd></div>
        <div><dt>Lugares</dt><dd>${stats.places}</dd></div>
        <div><dt>Búsquedas</dt><dd>${stats.searches}</dd></div>
      </dl>
    </section>
    <section class="split">
      <article>
        <h2>Cómo investigar</h2>
        <ol class="steps">
          <li>Busca el apellido en el archivo local y en las fuentes conectadas.</li>
          <li>Incorpora al árbol solo el registro que reconozcas.</li>
          <li>Abre el árbol para ver padres, cónyuges e hijos.</li>
        </ol>
      </article>
      <article>
        <h2>Añadir una persona</h2>
        <p>Si la persona todavía no está en ninguna fuente, créala en el archivo. Después enlaza padres, cónyuge e hijos.</p>
        <p><a class="button" href="/persona/nueva">Nueva persona</a></p>
      </article>
    </section>
    <section class="panel">
      <h2>Personas en el archivo</h2>
      <div class="stack">${people.slice(0, 20).map(personLine).join("")}</div>
    </section>`;
  return layout({ title: "Inicio", body, treeHost, active: "inicio" });
}

export function pageSearch(result, { treeHost, csrf }) {
  if (result.error) {
    return layout({
      title: "Buscar",
      treeHost,
      active: "buscar",
      body: `<section class="panel"><h1>Buscar</h1><p class="warn">${esc(result.error)}</p></section>`,
    });
  }
  const q = result.query;
  const people = result.persons.map(personLine).join("") || "<p>Nadie en el archivo local con esos datos.</p>";
  const records = result.records
    .map(
      (record) => `<article class="hit">
        <h3>${esc(record.title)}</h3>
        <p>${esc([record.event_date, record.place, record.summary].filter(Boolean).join(" · "))}</p>
        <p class="hit-actions">
          <span class="pill">${esc(record.source_id)}</span>
          ${record.url ? `<a href="${esc(record.url)}" rel="noopener noreferrer">Abrir fuente</a>` : ""}
          <form method="post" action="/registros/${record.id}/al-arbol">
            <input type="hidden" name="csrf" value="${esc(csrf)}" />
            <button type="submit">Incorporar al árbol</button>
          </form>
        </p>
      </article>`,
    )
    .join("");
  const places = result.places
    .filter((place) => place.latitude != null)
    .map(
      (place) => `<li><a href="${esc(place.url || "/lugares")}">${esc(place.name)}</a>
        <small>${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)} · ${esc(place.source_id)}</small></li>`,
    )
    .join("");
  const portals = result.portals
    .map(
      (portal) =>
        `<li><a href="${esc(portal.url)}" rel="noopener noreferrer">${esc(portal.title)}</a></li>`,
    )
    .join("");
  const reports = result.reports
    .filter((report) => report.message && report.message !== "no aplica a esta consulta")
    .map(
      (report) =>
        `<li class="${report.ok ? "ok" : "bad"}">${esc(report.name)}: ${report.ok ? `${report.count} resultados` : esc(report.message)}</li>`,
    )
    .join("");
  const body = `
    <section class="panel">
      <p class="kicker">Búsqueda ${result.searchId} guardada</p>
      <h1>${esc(result.label)}</h1>
      <form class="search-grid compact" method="get" action="/buscar">
        <label>Nombre <input name="nombre" value="${esc(q.givenName)}" /></label>
        <label>Apellido <input name="apellido" value="${esc(q.surname)}" /></label>
        <label>Lugar <input name="lugar" value="${esc(q.place)}" /></label>
        <label>Año <input name="ano" value="${esc(q.year)}" /></label>
        <button type="submit">Buscar de nuevo</button>
      </form>
    </section>
    <section class="panel">
      <h2>Personas en el archivo</h2>
      <div class="stack">${people}</div>
    </section>
    <section class="panel">
      <h2>Registros recuperados</h2>
      ${records || "<p>Todavía no hay registros de archivo para esta consulta. Los portales de abajo sí quedaron guardados.</p>"}
    </section>
    <section class="panel">
      <h2>Lugares con pin</h2>
      ${places ? `<ul class="plain">${places}</ul>` : "<p>Sin coordenadas para esta consulta.</p>"}
      <p><a href="/lugares">Ver el mapa</a></p>
    </section>
    <section class="panel">
      <details>
        <summary>Portales de archivo guardados (${result.portals.length})</summary>
        <ul class="plain">${portals}</ul>
      </details>
      ${reports ? `<h2>Estado de las API</h2><ul class="plain reports">${reports}</ul>` : ""}
    </section>`;
  return layout({ title: result.label, body, treeHost, active: "buscar" });
}

function fact(label, value) {
  if (!value) return "";
  return `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
}

export function pagePerson(person, { db, treeHost, csrf }) {
  const parents = generationColumns(ancestorNode(db, person.id, 2))[1] || [];
  const spouses = spousesOf(db, person.id);
  const children = descendantTree(db, person.id, 2)?.children || [];
  const linked = recordsForPerson(db, person.id);
  const body = `
    <section class="panel person-head">
      <p class="kicker">${person.is_demonstration ? "Familia de demostración" : "Persona del archivo"}</p>
      <h1>${esc(person.given_name)} ${esc(person.surname)}</h1>
      <dl class="facts">
        ${fact("Sexo", sexLabel(person.sex))}
        ${fact("Nacimiento", [person.birth_date, person.birth_place].filter(Boolean).join(", "))}
        ${fact("Defunción", [person.death_date, person.death_place].filter(Boolean).join(", "))}
      </dl>
      ${person.notes ? `<p>${esc(person.notes)}</p>` : ""}
      <p><a class="button" href="${treeHost ? `/?persona=${person.id}` : `/arbol?persona=${person.id}`}">Ver en el árbol</a></p>
    </section>
    <section class="split">
      <article>
        <h2>Padres</h2>
        <div class="stack">${parents.map((node) => (node.person ? personLine(node.person) : "")).join("") || "<p>Sin padres enlazados.</p>"}</div>
        <h2>Cónyuges</h2>
        <div class="stack">${spouses.map(personLine).join("") || "<p>Sin cónyuge enlazado.</p>"}</div>
        <h2>Hijos</h2>
        <div class="stack">${children.map((node) => personLine(node.person)).join("") || "<p>Sin hijos enlazados.</p>"}</div>
      </article>
      <article id="familia">
        <h2>Enlazar pariente</h2>
        <form class="stack-form" method="post" action="/persona/${person.id}/familia">
          <input type="hidden" name="csrf" value="${esc(csrf)}" />
          <label>Parentesco
            <select name="kind">
              <option value="padre">Padre</option>
              <option value="madre">Madre</option>
              <option value="conyuge">Cónyuge</option>
              <option value="hijo">Hijo</option>
              <option value="hija">Hija</option>
            </select>
          </label>
          <label>Nombre <input name="nombre" required /></label>
          <label>Apellido <input name="apellido" /></label>
          <label>Año <input name="nacimiento" /></label>
          <label>Lugar <input name="lugar" /></label>
          <button type="submit">Guardar en el árbol</button>
        </form>
      </article>
    </section>
    <section class="panel">
      <h2>Registros vinculados</h2>
      ${
        linked.length
          ? `<ul class="plain">${linked
              .map(
                (record) =>
                  `<li><a href="${esc(record.url || "/registros")}">${esc(record.title)}</a> <small>${esc(record.source_id)}</small></li>`,
              )
              .join("")}</ul>`
          : "<p>Todavía no hay un registro de archivo vinculado a esta ficha.</p>"
      }
    </section>`;
  return layout({
    title: `${person.given_name} ${person.surname}`,
    body,
    treeHost,
    active: "arbol",
  });
}

export function pageNewPerson({ treeHost, csrf, error = "" }) {
  const body = `
    <section class="panel narrow">
      <h1>Nueva persona</h1>
      ${error ? `<p class="warn">${esc(error)}</p>` : ""}
      <form class="stack-form" method="post" action="/persona">
        <input type="hidden" name="csrf" value="${esc(csrf)}" />
        <label>Nombre <input name="nombre" /></label>
        <label>Apellido <input name="apellido" /></label>
        <label>Sexo
          <select name="sexo">
            <option value="U">No indicado</option>
            <option value="M">Hombre</option>
            <option value="F">Mujer</option>
          </select>
        </label>
        <label>Nacimiento <input name="nacimiento" placeholder="1780" /></label>
        <label>Lugar de nacimiento <input name="lugar" /></label>
        <label>Defunción <input name="defuncion" /></label>
        <label>Lugar de defunción <input name="lugar_defuncion" /></label>
        <label>Notas <textarea name="notas" rows="4"></textarea></label>
        <button type="submit">Guardar</button>
      </form>
    </section>`;
  return layout({ title: "Nueva persona", body, treeHost, active: "inicio" });
}

function pedigreeCard(node) {
  if (!node?.person) {
    if (!node?.childId) return "";
    return `<a class="pcard empty" href="/persona/${node.childId}#familia">Añadir padre o madre</a>`;
  }
  const person = node.person;
  return `<a class="pcard" href="/persona/${person.id}">
    <strong>${esc(person.given_name)} ${esc(person.surname)}</strong>
    <small>${esc(person.birth_date || "sin año")} · ${esc(person.birth_place || "lugar no indicado")}</small>
    ${person.is_demonstration ? "<small>demostración</small>" : ""}
  </a>`;
}

function renderDescendants(node) {
  if (!node?.person) return "";
  const spouses = node.spouses.map((spouse) => esc(`${spouse.given_name} ${spouse.surname}`)).join(", ");
  const children = node.children.map((child) => `<li>${renderDescendants(child)}</li>`).join("");
  return `<div class="desc">
    <a href="/persona/${node.person.id}">${esc(node.person.given_name)} ${esc(node.person.surname)}</a>
    <small>${esc(node.person.birth_date)} ${spouses ? `· con ${spouses}` : ""}</small>
    ${children ? `<ul>${children}</ul>` : ""}
  </div>`;
}

export function pageTree(db, focusId, { treeHost }) {
  const people = listPersons(db);
  const focus = focusId || people[0]?.id;
  const root = focus ? ancestorNode(db, focus, 4) : null;
  const columns = generationColumns(root);
  const originId = focus ? earliestAncestor(db, focus) : null;
  const descendants = originId ? descendantTree(db, originId) : null;
  const options = people
    .map(
      (person) =>
        `<option value="${person.id}" ${person.id === focus ? "selected" : ""}>${esc(person.given_name)} ${esc(person.surname)}</option>`,
    )
    .join("");
  const action = treeHost ? "/" : "/arbol";
  const body = `
    <section class="panel">
      <p class="kicker">${treeHost ? "tree.genealogiasefardi.site" : "Árbol"}</p>
      <h1>Árbol genealógico</h1>
      <form class="inline-form" method="get" action="${action}">
        <label>Persona de referencia
          <select name="persona">${options}</select>
        </label>
        <button type="submit">Ver</button>
      </form>
      <div class="pedigree" role="list">
        ${columns
          .map(
            (column, index) =>
              `<div class="gen" role="listitem"><p class="gen-label">${["Persona", "Padres", "Abuelos", "Bisabuelos"][index] || ""}</p>${column.map(pedigreeCard).join("")}</div>`,
          )
          .join("")}
      </div>
    </section>
    <section class="panel">
      <h2>Descendencia desde el antepasado más antiguo de esta línea</h2>
      ${descendants ? renderDescendants(descendants) : "<p>El archivo todavía no tiene personas.</p>"}
    </section>`;
  return layout({ title: "Árbol", body, treeHost, active: "arbol" });
}

export function pageRecords(records, { treeHost }) {
  const body = `
    <section class="panel">
      <h1>Registros guardados</h1>
      <p>Son respuestas de las API y fichas incorporadas. Los portales de consulta están en cada búsqueda, no en esta lista.</p>
      <div class="stack">
        ${
          records.length
            ? records
                .map(
                  (record) => `<article class="hit">
                    <h3>${esc(record.title)}</h3>
                    <p>${esc(record.summary)}</p>
                    <p class="hit-actions"><span class="pill">${esc(record.source_id)}</span>
                    ${record.url ? `<a href="${esc(record.url)}" rel="noopener noreferrer">Abrir</a>` : ""}</p>
                  </article>`,
                )
                .join("")
            : "<p>Cuando una fuente responda, el registro aparecerá aquí.</p>"
        }
      </div>
    </section>`;
  return layout({ title: "Registros", body, treeHost, active: "buscar" });
}

export function mapSvg(places) {
  const width = 800;
  const height = 360;
  const dots = places
    .filter((place) => place.latitude != null && place.longitude != null)
    .map((place) => {
      const x = ((place.longitude + 180) / 360) * width;
      const y = ((90 - place.latitude) / 180) * height;
      return `<a href="${esc(place.url || "/lugares")}">
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" />
        <text x="${(x + 8).toFixed(1)}" y="${(y - 6).toFixed(1)}">${esc(place.name.split(",")[0])}</text>
      </a>`;
    })
    .join("");
  return `<svg class="map" viewBox="0 0 ${width} ${height}" role="img" aria-label="Mapa de lugares guardados">
    <rect width="${width}" height="${height}" />
    ${dots || ""}
  </svg>`;
}

export function pagePlaces(places, { treeHost }) {
  const list = places
    .map(
      (place) =>
        `<li><a href="${esc(place.url || "#")}">${esc(place.name)}</a> <small>${place.latitude?.toFixed?.(3) ?? ""}, ${place.longitude?.toFixed?.(3) ?? ""} · ${esc(place.summary)}</small></li>`,
    )
    .join("");
  const body = `
    <section class="panel">
      <h1>Lugares</h1>
      <p>Pines guardados: familia de demostración, Historypin, OpenHistoricalMap, Pleiades, el World Historical Gazetteer, Wikidata y GeoNames.</p>
      ${mapSvg(places)}
      <ul class="plain">${list || "<li>Sin lugares todavía.</li>"}</ul>
    </section>`;
  return layout({ title: "Lugares", body, treeHost, active: "lugares" });
}

export function pageSources(env, { treeHost }) {
  const rows = sourceCatalog(env)
    .map((source) => {
      const state = source.configured ? "lista" : "falta la llave";
      return `<article class="source">
        <h3>${esc(source.name)}</h3>
        <p>${esc(source.detail)}</p>
        <p class="hit-actions"><span class="pill ${source.configured ? "ok" : ""}">${state}</span>
        <a href="${esc(source.docs)}" rel="noopener noreferrer">Documentación</a></p>
      </article>`;
    })
    .join("");
  const body = `
    <section class="panel">
      <h1>Fuentes instaladas</h1>
      <p>FamilySearch, Historypin, los censos del INEGI, el Archivo Histórico Nacional, el Archivo General de Indias y los portales de archivo que tienen consulta pública. La base guarda cada resultado. Las llaves se leen del entorno del servidor y no se muestran aquí.</p>
      <div class="source-grid">${rows}</div>
      <p><a class="button" href="/familysearch/conectar">Conectar la sesión de FamilySearch</a></p>
    </section>`;
  return layout({ title: "Fuentes", body, treeHost, active: "fuentes" });
}

export function pageMessage(title, message, { treeHost, statusClass = "warn" }) {
  const body = `<section class="panel narrow"><h1>${esc(title)}</h1><p class="${statusClass}">${esc(message)}</p></section>`;
  return layout({ title, body, treeHost, active: "" });
}
