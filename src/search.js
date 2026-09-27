import { clip } from "./fold.js";
import {
  insertSearch,
  insertSearchRun,
  searchPersons,
  searchPlaces,
  searchRecords,
  upsertPlace,
  upsertRecord,
} from "./db.js";
import { portalHits, queryLabel, runLive } from "./sources.js";

export function normalizeInput(params) {
  const yearRaw = clip(params.ano || params["año"] || params.year || "", 8).replace(/[^\d]/g, "");
  return {
    givenName: clip(params.nombre, 80),
    surname: clip(params.apellido, 80),
    place: clip(params.lugar, 80),
    year: /^\d{3,4}$/.test(yearRaw) ? yearRaw : "",
    text: clip(params.q, 80),
  };
}

export function hasQuery(query) {
  return Boolean(query.givenName || query.surname || query.place || query.text);
}

export async function performSearch(db, query, deps = {}) {
  if (!hasQuery(query)) {
    return { error: "Escribe un nombre, un apellido, un lugar o una palabra." };
  }
  const searchId = insertSearch(db, query);
  for (const hit of portalHits(query)) upsertRecord(db, hit);
  const live = await runLive(query, deps);
  insertSearchRun(db, searchId, { id: "portales", ok: true, count: portalHits(query).length, message: "" });
  for (const report of live.reports) insertSearchRun(db, searchId, report);
  for (const hit of live.items) {
    const latitude = Number(hit.latitude);
    const longitude = Number(hit.longitude);
    if (hit.kind === "place" && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      upsertPlace(db, hit);
    } else {
      upsertRecord(db, hit);
    }
  }
  return {
    error: "",
    query,
    label: queryLabel(query),
    searchId,
    persons: searchPersons(db, query),
    records: searchRecords(db, query, "record"),
    portals: searchRecords(db, query, "portal"),
    places: searchPlaces(db, query),
    reports: live.reports,
  };
}
