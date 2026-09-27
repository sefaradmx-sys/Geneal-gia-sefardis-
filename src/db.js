import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { clip, fold, likePattern, nowIso } from "./fold.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS persons (
  id INTEGER PRIMARY KEY,
  given_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  sex TEXT NOT NULL DEFAULT 'U' CHECK (sex IN ('M', 'F', 'U')),
  birth_date TEXT NOT NULL DEFAULT '',
  birth_place TEXT NOT NULL DEFAULT '',
  death_date TEXT NOT NULL DEFAULT '',
  death_place TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  name_key TEXT NOT NULL,
  is_demonstration INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS parent_child (
  parent_id INTEGER NOT NULL REFERENCES persons(id),
  child_id INTEGER NOT NULL REFERENCES persons(id),
  PRIMARY KEY (parent_id, child_id),
  CHECK (parent_id <> child_id)
);
CREATE TABLE IF NOT EXISTS unions (
  person_a INTEGER NOT NULL REFERENCES persons(id),
  person_b INTEGER NOT NULL REFERENCES persons(id),
  PRIMARY KEY (person_a, person_b),
  CHECK (person_a < person_b)
);
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  given_name TEXT NOT NULL DEFAULT '',
  surname TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL DEFAULT '',
  place TEXT NOT NULL DEFAULT '',
  name_key TEXT NOT NULL,
  url TEXT,
  summary TEXT NOT NULL DEFAULT '',
  raw_json TEXT,
  fetched_at TEXT NOT NULL,
  UNIQUE (source_id, external_id)
);
CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  source_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  url TEXT,
  summary TEXT NOT NULL DEFAULT '',
  raw_json TEXT,
  fetched_at TEXT NOT NULL,
  UNIQUE (source_id, external_id)
);
CREATE TABLE IF NOT EXISTS person_records (
  person_id INTEGER NOT NULL REFERENCES persons(id),
  record_id INTEGER NOT NULL REFERENCES records(id),
  PRIMARY KEY (person_id, record_id)
);
CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY,
  given_name TEXT NOT NULL DEFAULT '',
  surname TEXT NOT NULL DEFAULT '',
  place TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS search_runs (
  id INTEGER PRIMARY KEY,
  search_id INTEGER NOT NULL REFERENCES searches(id),
  source_id TEXT NOT NULL,
  ok INTEGER NOT NULL,
  hit_count INTEGER NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(name_key);
CREATE INDEX IF NOT EXISTS idx_records_name ON records(name_key);
CREATE INDEX IF NOT EXISTS idx_places_name ON places(name_key);
`;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function defaultDatabasePath() {
  return process.env.DATABASE_PATH || path.join(process.cwd(), "data", "genealogia.sqlite");
}

export function openDatabase(filePath = defaultDatabasePath(), { seed = true } = {}) {
  if (filePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  }
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  if (seed && countPersons(db) === 0) {
    seedDemonstration(db);
  }
  return db;
}

function personKey(person) {
  return fold(
    [
      person.given_name,
      person.surname,
      person.birth_date,
      person.birth_place,
      person.death_date,
      person.death_place,
      person.notes,
    ].join(" "),
  );
}

export function countPersons(db) {
  return db.prepare("SELECT COUNT(*) AS n FROM persons").get().n;
}

export function counts(db) {
  return {
    persons: countPersons(db),
    records: db.prepare("SELECT COUNT(*) AS n FROM records WHERE kind = 'record'").get().n,
    portals: db.prepare("SELECT COUNT(*) AS n FROM records WHERE kind = 'portal'").get().n,
    places: db.prepare("SELECT COUNT(*) AS n FROM places").get().n,
    searches: db.prepare("SELECT COUNT(*) AS n FROM searches").get().n,
  };
}

export function listPersons(db) {
  return db.prepare("SELECT * FROM persons ORDER BY surname, given_name, id").all();
}

export function getPerson(db, id) {
  return db.prepare("SELECT * FROM persons WHERE id = ?").get(id) ?? null;
}

export function parentsOf(db, id) {
  return db
    .prepare(
      `SELECT p.* FROM persons p
       JOIN parent_child pc ON pc.parent_id = p.id
       WHERE pc.child_id = ?
       ORDER BY p.birth_date, p.id`,
    )
    .all(id);
}

export function childrenOf(db, id) {
  return db
    .prepare(
      `SELECT p.* FROM persons p
       JOIN parent_child pc ON pc.child_id = p.id
       WHERE pc.parent_id = ?
       ORDER BY p.birth_date, p.id`,
    )
    .all(id);
}

export function spousesOf(db, id) {
  return db
    .prepare(
      `SELECT p.* FROM persons p
       JOIN unions u ON (u.person_a = p.id OR u.person_b = p.id)
       WHERE (u.person_a = ? OR u.person_b = ?) AND p.id <> ?
       ORDER BY p.birth_date, p.id`,
    )
    .all(id, id, id);
}

export function recordsForPerson(db, id) {
  return db
    .prepare(
      `SELECT r.* FROM records r
       JOIN person_records pr ON pr.record_id = r.id
       WHERE pr.person_id = ?
       ORDER BY r.fetched_at DESC`,
    )
    .all(id);
}

export function cleanPersonInput(input) {
  const given = clip(input.given_name ?? input.nombre, 80);
  const surname = clip(input.surname ?? input.apellido, 80);
  if (!given && !surname) {
    throw new HttpError(400, "Escribe al menos un nombre o un apellido.");
  }
  const sexRaw = clip(input.sex ?? input.sexo, 1).toUpperCase();
  const sex = sexRaw === "M" || sexRaw === "F" ? sexRaw : "U";
  return {
    given_name: given,
    surname,
    sex,
    birth_date: clip(input.birth_date ?? input.nacimiento, 40),
    birth_place: clip(input.birth_place ?? input.lugar, 120),
    death_date: clip(input.death_date ?? input.defuncion, 40),
    death_place: clip(input.death_place ?? input.lugar_defuncion, 120),
    notes: clip(input.notes ?? input.notas, 2000),
  };
}

export function createPerson(db, input, { demonstration = false } = {}) {
  const person = cleanPersonInput(input);
  const stamp = nowIso();
  const result = db
    .prepare(
      `INSERT INTO persons (
        given_name, surname, sex, birth_date, birth_place, death_date, death_place,
        notes, name_key, is_demonstration, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      person.given_name,
      person.surname,
      person.sex,
      person.birth_date,
      person.birth_place,
      person.death_date,
      person.death_place,
      person.notes,
      personKey(person),
      demonstration ? 1 : 0,
      stamp,
      stamp,
    );
  return getPerson(db, Number(result.lastInsertRowid));
}

export function isAncestor(db, ancestorId, startId) {
  const stack = [startId];
  const seen = new Set();
  while (stack.length > 0) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const parent of parentsOf(db, id)) {
      if (parent.id === ancestorId) return true;
      stack.push(parent.id);
    }
  }
  return false;
}

export function addParent(db, parentId, childId) {
  if (!getPerson(db, parentId) || !getPerson(db, childId)) {
    throw new HttpError(404, "No está esa persona en el archivo.");
  }
  if (parentId === childId || isAncestor(db, childId, parentId)) {
    throw new HttpError(400, "Ese parentesco cerraría un ciclo en el árbol.");
  }
  db.prepare("INSERT OR IGNORE INTO parent_child (parent_id, child_id) VALUES (?, ?)").run(parentId, childId);
}

export function addUnion(db, leftId, rightId) {
  if (!getPerson(db, leftId) || !getPerson(db, rightId)) {
    throw new HttpError(404, "No está esa persona en el archivo.");
  }
  if (leftId === rightId) {
    throw new HttpError(400, "Una persona no puede ser cónyuge de sí misma.");
  }
  const [personA, personB] = leftId < rightId ? [leftId, rightId] : [rightId, leftId];
  db.prepare("INSERT OR IGNORE INTO unions (person_a, person_b) VALUES (?, ?)").run(personA, personB);
}

export function linkFamily(db, personId, kind, relativeId) {
  switch (kind) {
    case "padre":
    case "madre":
      addParent(db, relativeId, personId);
      return;
    case "hijo":
    case "hija":
      addParent(db, personId, relativeId);
      return;
    case "conyuge":
      addUnion(db, personId, relativeId);
      return;
    default: {
      const unknown = kind;
      throw new HttpError(400, `Parentesco no reconocido: ${unknown}`);
    }
  }
}

function tokensFrom(query) {
  const blob = [query.givenName, query.surname, query.place, query.text].filter(Boolean).join(" ");
  return [...new Set(fold(blob).split(/[^a-z0-9]+/).filter((token) => token.length >= 2))].slice(0, 8);
}

function whereTokens(column, tokens) {
  const clause = tokens.map(() => `${column} LIKE ? ESCAPE '\\'`).join(" AND ");
  const params = tokens.map((token) => likePattern(token));
  return { clause, params };
}

export function searchPersons(db, query) {
  const tokens = tokensFrom(query);
  if (tokens.length === 0) return [];
  const { clause, params } = whereTokens("name_key", tokens);
  const yearClause = query.year ? " AND (birth_date LIKE ? OR death_date LIKE ?)" : "";
  const yearParams = query.year ? [`%${query.year}%`, `%${query.year}%`] : [];
  return db
    .prepare(`SELECT * FROM persons WHERE ${clause}${yearClause} ORDER BY surname, given_name LIMIT 40`)
    .all(...params, ...yearParams);
}

export function searchRecords(db, query, kind) {
  const tokens = tokensFrom(query);
  if (tokens.length === 0) return [];
  const { clause, params } = whereTokens("name_key", tokens);
  const kindClause = kind ? " AND kind = ?" : "";
  const kindParams = kind ? [kind] : [];
  return db
    .prepare(
      `SELECT * FROM records WHERE ${clause}${kindClause}
       ORDER BY CASE kind WHEN 'record' THEN 0 ELSE 1 END, fetched_at DESC
       LIMIT 80`,
    )
    .all(...params, ...kindParams);
}

export function searchPlaces(db, query) {
  const tokens = tokensFrom(query);
  if (tokens.length === 0) {
    return db.prepare("SELECT * FROM places ORDER BY name LIMIT 80").all();
  }
  const { clause, params } = whereTokens("name_key", tokens);
  return db.prepare(`SELECT * FROM places WHERE ${clause} ORDER BY name LIMIT 40`).all(...params);
}

export function listRecords(db, limit = 40) {
  return db
    .prepare("SELECT * FROM records WHERE kind = 'record' ORDER BY fetched_at DESC, id DESC LIMIT ?")
    .all(limit);
}

export function listPlaces(db, limit = 80) {
  return db
    .prepare("SELECT * FROM places WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY name LIMIT ?")
    .all(limit);
}

export function getRecord(db, id) {
  return db.prepare("SELECT * FROM records WHERE id = ?").get(id) ?? null;
}

export function insertSearch(db, query) {
  const result = db
    .prepare(
      `INSERT INTO searches (given_name, surname, place, year, text, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(query.givenName, query.surname, query.place, query.year, query.text, nowIso());
  return Number(result.lastInsertRowid);
}

export function insertSearchRun(db, searchId, report) {
  db.prepare(
    `INSERT INTO search_runs (search_id, source_id, ok, hit_count, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(searchId, report.id, report.ok ? 1 : 0, report.count, clip(report.message, 300), nowIso());
}

export function upsertRecord(db, hit) {
  const title = clip(hit.title, 300) || "Sin título";
  const externalId = clip(hit.externalId, 200);
  if (!hit.sourceId || !externalId) return null;
  const row = {
    given_name: clip(hit.givenName, 80),
    surname: clip(hit.surname, 80),
    event_date: clip(hit.eventDate, 40),
    place: clip(hit.place, 160),
    summary: clip(hit.summary, 500),
    title,
  };
  const nameKey = fold([row.given_name, row.surname, row.title, row.event_date, row.place, row.summary].join(" "));
  let raw = "";
  try {
    raw = JSON.stringify(hit.raw ?? null).slice(0, 15000);
  } catch {
    raw = "";
  }
  db.prepare(
    `INSERT INTO records (
      source_id, external_id, kind, title, given_name, surname, event_date, place,
      name_key, url, summary, raw_json, fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_id, external_id) DO UPDATE SET
      kind = excluded.kind,
      title = excluded.title,
      given_name = excluded.given_name,
      surname = excluded.surname,
      event_date = excluded.event_date,
      place = excluded.place,
      name_key = excluded.name_key,
      url = excluded.url,
      summary = excluded.summary,
      raw_json = excluded.raw_json,
      fetched_at = excluded.fetched_at`,
  ).run(
    hit.sourceId,
    externalId,
    hit.kind === "portal" ? "portal" : "record",
    row.title,
    row.given_name,
    row.surname,
    row.event_date,
    row.place,
    nameKey,
    clip(hit.url, 500),
    row.summary,
    raw,
    nowIso(),
  );
  return db.prepare("SELECT * FROM records WHERE source_id = ? AND external_id = ?").get(hit.sourceId, externalId);
}

export function upsertPlace(db, hit) {
  const externalId = clip(hit.externalId, 200);
  const name = clip(hit.title || hit.place, 200);
  if (!hit.sourceId || !externalId || !name) return null;
  const latitude = numberOrNull(hit.latitude);
  const longitude = numberOrNull(hit.longitude);
  let raw = "";
  try {
    raw = JSON.stringify(hit.raw ?? null).slice(0, 8000);
  } catch {
    raw = "";
  }
  db.prepare(
    `INSERT INTO places (
      name, name_key, latitude, longitude, source_id, external_id, url, summary, raw_json, fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_id, external_id) DO UPDATE SET
      name = excluded.name,
      name_key = excluded.name_key,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      url = excluded.url,
      summary = excluded.summary,
      raw_json = excluded.raw_json,
      fetched_at = excluded.fetched_at`,
  ).run(
    name,
    fold([name, hit.place, hit.summary].join(" ")),
    latitude,
    longitude,
    hit.sourceId,
    externalId,
    clip(hit.url, 500),
    clip(hit.summary, 400),
    raw,
    nowIso(),
  );
  return db.prepare("SELECT * FROM places WHERE source_id = ? AND external_id = ?").get(hit.sourceId, externalId);
}

export function linkRecord(db, personId, recordId) {
  if (!getPerson(db, personId) || !getRecord(db, recordId)) {
    throw new HttpError(404, "No está la persona o el registro.");
  }
  db.prepare("INSERT OR IGNORE INTO person_records (person_id, record_id) VALUES (?, ?)").run(personId, recordId);
}

export function createPersonFromRecord(db, recordId) {
  const record = getRecord(db, recordId);
  if (!record) throw new HttpError(404, "Ese registro no está en la base.");
  const person = createPerson(db, {
    given_name: record.given_name,
    surname: record.surname || record.title,
    birth_date: record.event_date,
    birth_place: record.place,
    notes: `Incorporado desde ${record.source_id}. ${record.summary}`,
  });
  linkRecord(db, person.id, record.id);
  return person;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function seedDemonstration(db) {
  db.exec("BEGIN");
  try {
    const add = (input) => createPerson(db, input, { demonstration: true });
    const abraham = add({
      given_name: "Abraham",
      surname: "Toledano",
      sex: "M",
      birth_date: "1780",
      birth_place: "Tetuán, Marruecos",
    });
    const miriam = add({
      given_name: "Miriam",
      surname: "Levy",
      sex: "F",
      birth_date: "1784",
      birth_place: "Tetuán, Marruecos",
    });
    const raquel = add({
      given_name: "Raquel",
      surname: "Toledano",
      sex: "F",
      birth_date: "1810",
      birth_place: "Tetuán, Marruecos",
    });
    const isaac = add({
      given_name: "Isaac",
      surname: "Toledano",
      sex: "M",
      birth_date: "1812",
      birth_place: "Tetuán, Marruecos",
    });
    const reina = add({
      given_name: "Reina",
      surname: "Cohen",
      sex: "F",
      birth_date: "1816",
      birth_place: "Tetuán, Marruecos",
    });
    const ester = add({
      given_name: "Ester",
      surname: "Benarroch",
      sex: "F",
      birth_date: "1838",
      birth_place: "Tánger, Marruecos",
    });
    const david = add({
      given_name: "David",
      surname: "Toledano",
      sex: "M",
      birth_date: "1841",
      birth_place: "Gibraltar",
    });
    const sol = add({
      given_name: "Sol",
      surname: "Azoulay",
      sex: "F",
      birth_date: "1844",
      birth_place: "Gibraltar",
    });
    const sara = add({
      given_name: "Sara",
      surname: "Toledano",
      sex: "F",
      birth_date: "1866",
      birth_place: "Buenos Aires, Argentina",
    });
    const jacob = add({
      given_name: "Jacob",
      surname: "Toledano",
      sex: "M",
      birth_date: "1870",
      birth_place: "Ciudad de México, México",
    });
    addUnion(db, abraham.id, miriam.id);
    addUnion(db, isaac.id, reina.id);
    addUnion(db, david.id, sol.id);
    for (const child of [raquel, isaac]) {
      addParent(db, abraham.id, child.id);
      addParent(db, miriam.id, child.id);
    }
    addParent(db, raquel.id, ester.id);
    addParent(db, isaac.id, david.id);
    addParent(db, reina.id, david.id);
    for (const child of [sara, jacob]) {
      addParent(db, david.id, child.id);
      addParent(db, sol.id, child.id);
    }
    const pins = [
      ["Tetuán, Marruecos", 35.5889, -5.3626],
      ["Tánger, Marruecos", 35.7595, -5.834],
      ["Gibraltar", 36.1408, -5.3536],
      ["Buenos Aires, Argentina", -34.6037, -58.3816],
      ["Ciudad de México, México", 19.4326, -99.1332],
    ];
    for (const [name, latitude, longitude] of pins) {
      upsertPlace(db, {
        sourceId: "archivo-local",
        externalId: fold(name),
        title: name,
        latitude,
        longitude,
        url: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=10/${latitude}/${longitude}`,
        summary: "Coordenada de referencia del lugar citado en la familia de demostración.",
      });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
