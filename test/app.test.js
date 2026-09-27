import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fold } from "../src/fold.js";
import {
  addParent,
  createPerson,
  getPerson,
  HttpError,
  openDatabase,
  searchPersons,
} from "../src/db.js";
import { createServer } from "../src/server.js";
import { hasQuery, normalizeInput, performSearch } from "../src/search.js";
import {
  inegiIndicatorUrl,
  parseDatosGobMx,
  parseFamilySearch,
  parseHistorypin,
  parseInegi,
  parseLoc,
  parseNara,
  parseOhm,
  parseViaf,
  parseWikidataPlaces,
  parseWktPoint,
  wantsInegi,
} from "../src/sources.js";
import { SEFARAD_DIR, SEFARAD_TREE_URL, sourceLinks } from "../src/links.js";
import { defaultFocusId, earliestAncestor } from "../src/tree.js";

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-"));
  return openDatabase(path.join(dir, "archivo.sqlite"));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(url) {
  const target = String(url);
  if (target.includes("viaf.org")) {
    return Promise.resolve(jsonResponse({
      result: [{ term: "Toledano", displayForm: "Toledano, Abraham", viafid: "12345", nametype: "personal" }],
    }));
  }
  return Promise.resolve(new Response("no", { status: 404 }));
}

async function withServer(fn, { host = "127.0.0.1" } = {}) {
  const db = tempDb();
  const server = createServer({
    db,
    fetchImpl: mockFetch,
    env: {
      FAMILYSEARCH_CLIENT_ID: "",
      INEGI_TOKEN: "",
      GEONAMES_USERNAME: "",
      EUROPEANA_WSKEY: "",
      TREE_HOST: "tree.genealogiasefardi.site",
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await fn({ port, db, host });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function get(port, pathname, headers = {}) {
  return fetch(`http://127.0.0.1:${port}${pathname}`, { headers, redirect: "manual" });
}

test("fold quita acentos", () => {
  assert.equal(fold("Tetuán"), "tetuan");
});

test("la familia de demostración arma el árbol de Jacob hasta Abraham", () => {
  const db = tempDb();
  const jacob = searchPersons(db, { givenName: "Jacob", surname: "Toledano", place: "", year: "", text: "" })[0];
  assert.ok(jacob);
  const focus = defaultFocusId(db);
  assert.equal(focus, jacob.id);
  const abraham = getPerson(db, earliestAncestor(db, jacob.id));
  assert.equal(abraham.given_name, "Abraham");
  assert.equal(abraham.surname, "Toledano");
});

test("un apellido con comillas no borra la tabla", () => {
  const db = tempDb();
  const before = db.prepare("SELECT COUNT(*) AS n FROM persons").get().n;
  const found = searchPersons(db, {
    givenName: "",
    surname: "Robert'); DROP TABLE persons;--",
    place: "",
    year: "",
    text: "",
  });
  assert.equal(found.length, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM persons").get().n, before);
});

test("no se puede cerrar un ciclo de padres", () => {
  const db = tempDb();
  const parent = createPerson(db, { nombre: "Ana", apellido: "Levy" });
  const child = createPerson(db, { nombre: "Lea", apellido: "Levy" });
  addParent(db, parent.id, child.id);
  assert.throws(() => addParent(db, child.id, parent.id), HttpError);
});

test("normaliza el año y rechaza una búsqueda vacía", () => {
  assert.equal(normalizeInput({ ano: "1870" }).year, "1870");
  assert.equal(normalizeInput({ ano: "18" }).year, "");
  assert.equal(hasQuery(normalizeInput({})), false);
});

test("la búsqueda guarda a VIAF y la segunda lectura sale de la base", async () => {
  const db = tempDb();
  const query = { givenName: "Abraham", surname: "Toledano", place: "", year: "", text: "" };
  const first = await performSearch(db, query, { fetchImpl: mockFetch, env: {}, ip: "127.0.0.1" });
  assert.equal(first.error, "");
  assert.ok(first.persons.some((person) => person.given_name === "Abraham"));
  assert.ok(first.records.some((record) => record.source_id === "viaf"));
  assert.ok(first.portals.some((portal) => portal.title.includes("Archivo Histórico Nacional")));
  assert.ok(first.portals.some((portal) => portal.title.includes("Archivo General de Indias")));

  const failing = () => Promise.reject(new Error("red caída"));
  const second = await performSearch(db, query, { fetchImpl: failing, env: {}, ip: "127.0.0.1" });
  assert.ok(second.records.some((record) => record.external_id === "12345"));
  const runs = db.prepare("SELECT COUNT(*) AS n FROM search_runs").get().n;
  assert.ok(runs >= 2);
});

test("el inicio, el árbol del subdominio y una ficha responden", async () => {
  await withServer(async ({ port }) => {
    const home = await get(port, "/");
    const homeHtml = await home.text();
    assert.equal(home.status, 200);
    assert.match(homeHtml, /Busca una persona/);
    assert.match(homeHtml, /Toledano/);
    assert.match(homeHtml, /FamilySearch/);
    assert.match(homeHtml, /INEGI/);
    assert.match(homeHtml, /Archivo Histórico Nacional/);
    assert.match(homeHtml, /Historypin/);
    assert.match(homeHtml, /HostGator/);
    assert.match(homeHtml, /tree\.genealogiasefardi\.site/);
    assert.match(homeHtml, /sefarad-mx%2Ftree%2Fsefarad/);
    assert.match(homeHtml, /WikiTree/);

    const treeHtml = await new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: "127.0.0.1", port, path: "/", headers: { Host: "tree.genealogiasefardi.site" } },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        },
      );
      req.on("error", reject);
      req.end();
    });
    assert.match(treeHtml, /Árbol genealógico/);
    assert.match(treeHtml, /Jacob/);
    assert.match(treeHtml, /Abraham/);

    const health = await get(port, "/api/salud");
    const body = await health.json();
    assert.equal(body.status, "ok");
    assert.ok(body.persons >= 10);
    assert.ok(body.places >= 5);
  });
});

test("se puede crear una persona y verla en la búsqueda", async () => {
  await withServer(async ({ port }) => {
    const formPage = await get(port, "/persona/nueva");
    const html = await formPage.text();
    const cookie = formPage.headers.get("set-cookie").split(";")[0];
    const csrf = html.match(/name="csrf" value="([^"]+)"/)[1];
    const created = await fetch(`http://127.0.0.1:${port}/persona`, {
      method: "POST",
      redirect: "manual",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: new URLSearchParams({ csrf, nombre: "Ruth", apellido: "Pinto", lugar: "Esmirna", nacimiento: "1901" }),
    });
    assert.equal(created.status, 303);
    const location = created.headers.get("location");
    const page = await get(port, location, { Cookie: cookie });
    assert.match(await page.text(), /Ruth Pinto/);

    const search = await get(port, "/buscar?apellido=Pinto");
    const searchHtml = await search.text();
    assert.match(searchHtml, /Ruth/);
    assert.match(searchHtml, /Archivo Histórico Nacional/);
  });
});

test("las fuentes y el árbol sefarad comparten la consulta", () => {
  assert.equal(SEFARAD_DIR, "public_html/sefarad-mx");
  assert.match(SEFARAD_TREE_URL, /https:\/\/genealogiasefardi\.site\/sefarad-mx\/index\.php\?route=%2Fsefarad-mx%2Ftree%2Fsefarad/);
  const links = sourceLinks({ givenName: "Abraham", surname: "Toledano", place: "Tetuán", year: "1780" });
  const byId = Object.fromEntries(links.map((link) => [link.id, link.href]));
  assert.match(byId.familysearch, /q\.surname=Toledano/);
  assert.match(byId.familysearch, /q\.givenName=Abraham/);
  assert.match(byId.ahn, /Archivo%20Hist%C3%B3rico%20Nacional|Archivo\+Hist%C3%B3rico\+Nacional/);
  assert.match(byId.sefarad, /sefarad-mx%2Ftree%2Fsefarad/);
  assert.match(byId.historypin, /Tetu/);
});

test("INEGI solo entra en búsquedas de México o de censos", () => {
  assert.equal(wantsInegi({ place: "Tetuán", text: "", givenName: "Abraham", surname: "Toledano" }), false);
  assert.equal(wantsInegi({ place: "Ciudad de México", text: "", givenName: "", surname: "Toledano" }), true);
  assert.equal(wantsInegi({ place: "", text: "censo 1930", givenName: "", surname: "" }), true);
  assert.match(inegiIndicatorUrl("tok-1"), /INDICATOR\/1002000001\/es\/0700\/false\/BISE\/2\.0\/tok-1\?type=json/);
});

test("los lectores de fuentes reconocen las respuestas públicas", () => {
  assert.equal(parseViaf({ result: [{ term: "Toledano", viafid: "9", nametype: "personal" }] })[0].url, "https://viaf.org/viaf/9");
  assert.equal(parseLoc({ results: [{ id: "loc/1", title: "Ketubbot", url: "https://www.loc.gov/item/1/" }] })[0].title, "Ketubbot");
  assert.equal(parseNara({ opaResponse: { results: { result: [{ naId: "77", description: { title: "Pasaporte" } }] } } })[0].url, "https://catalog.archives.gov/id/77");
  const inegi = parseInegi({ Series: [{ OBSERVATIONS: [{ TIME_PERIOD: "1930", OBS_VALUE: "16552722" }, { TIME_PERIOD: "2020", OBS_VALUE: "126014024" }] }] });
  assert.match(inegi[0].summary, /1930: 16552722/);
  assert.equal(inegi[0].place, "México");
  assert.equal(parseDatosGobMx({ result: { results: [{ name: "censo-1930", title: "Censo 1930", notes: "Población" }] } })[0].url, "https://datos.gob.mx/busca/dataset/censo-1930");
  assert.equal(parseOhm([{ lat: "35.5", lon: "-5.3", display_name: "Tetuán", osm_type: "node", osm_id: 4 }])[0].latitude, 35.5);
  assert.deepEqual(parseWktPoint("Point(-5.36 35.58)"), { longitude: -5.36, latitude: 35.58 });
  const places = parseWikidataPlaces({
    results: { bindings: [{ item: { value: "http://www.wikidata.org/entity/Q1" }, itemLabel: { value: "Tetuán" }, coord: { value: "Point(-5.36 35.58)" } }] },
  });
  assert.equal(places[0].latitude, 35.58);
  const pins = parseHistorypin({ pins: [{ id: "p1", caption: "Puerta", latitude: 35.5, longitude: -5.3 }] });
  assert.equal(pins[0].title, "Puerta");
  const family = parseFamilySearch({
    entries: [{ id: "XXXX-YYY", title: "Abraham Toledano", content: { gedcomx: { persons: [{ names: [{ nameForms: [{ fullText: "Abraham Toledano" }] }], facts: [{ type: "http://gedcomx.org/Birth", date: { original: "1780" }, place: { original: "Tetuán" } }] }] } } }],
  });
  assert.equal(family[0].surname, "Toledano");
  assert.equal(family[0].place, "Tetuán");
});
