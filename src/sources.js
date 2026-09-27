import { clip, fold } from "./fold.js";

const USER_AGENT = "GenealogiaSefardi/0.2 (+https://genealogiasefardi.site)";

export function queryLabel(query) {
  return [query.givenName, query.surname, query.place, query.year, query.text].filter(Boolean).join(" ").trim();
}

function enc(value) {
  return encodeURIComponent(value ?? "");
}

export function wantsInegi(query) {
  const blob = fold([query.place, query.text, query.givenName, query.surname].join(" "));
  return /censo|inegi|mexic|mexico|cdmx|jalisco|puebla|yucatan|veracruz|oaxaca|chiapas|guadalajara|monterrey|ciudad de mexico/.test(
    blob,
  );
}

export function inegiIndicatorUrl(token, { indicador = "1002000001", area = "0700" } = {}) {
  return `https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/INDICATOR/${indicador}/es/${area}/false/BISE/2.0/${enc(token)}?type=json`;
}

export const PORTALS = [
  {
    id: "portal-familysearch",
    name: "FamilySearch",
    detail: "Registros históricos y árbol. La búsqueda de personas usa la API cuando hay sesión; si no, abre el portal oficial.",
    url: (query) => {
      const u = new URL("https://www.familysearch.org/search/record/results");
      if (query.givenName) u.searchParams.set("q.givenName", query.givenName);
      if (query.surname) u.searchParams.set("q.surname", query.surname);
      if (query.place) u.searchParams.set("q.anyPlace", query.place);
      if (query.year) u.searchParams.set("q.birthLikeDate.from", query.year);
      if (!u.search) u.searchParams.set("q.any", queryLabel(query));
      return u.toString();
    },
  },
  {
    id: "portal-ahn",
    name: "Archivo Histórico Nacional (PARES)",
    detail: "Portal de Archivos Españoles. La consulta queda guardada y se abre en el catálogo del AHN.",
    url: (query) =>
      `https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=${enc(`${queryLabel(query)} Archivo Histórico Nacional`)}`,
  },
  {
    id: "portal-agi",
    name: "Archivo General de Indias (PARES)",
    detail: "Fondos de Indias en PARES: pasajeros, consulados, inquisición y administración colonial.",
    url: (query) =>
      `https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=${enc(`${queryLabel(query)} Archivo General de Indias`)}`,
  },
  {
    id: "portal-simancas",
    name: "Archivo General de Simancas (PARES)",
    detail: "Consejos y secretarías de la Monarquía hispánica.",
    url: (query) =>
      `https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=${enc(`${queryLabel(query)} Archivo General de Simancas`)}`,
  },
  {
    id: "portal-hispana",
    name: "Hispana",
    detail: "Recolector del Ministerio de Cultura: archivos, bibliotecas y museos de España.",
    url: (query) => `https://hispana.mcu.es/es/buscador/search.do?q=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-agn-mx",
    name: "Archivo General de la Nación (México)",
    detail: "Portal del AGN. No publica una API abierta de expedientes; la ficha queda guardada con el enlace oficial.",
    url: () => "https://www.gob.mx/agn",
  },
  {
    id: "portal-bne",
    name: "Biblioteca Nacional de España",
    detail: "Catálogo y datos abiertos de la BNE.",
    url: (query) => `https://catalogo.bne.es/permalink/34BNE_INST/search?q=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-gallica",
    name: "Gallica — Biblioteca Nacional de Francia",
    detail: "Impresos y manuscritos digitalizados.",
    url: (query) =>
      `https://gallica.bnf.fr/services/engine/search/sru?operation=searchRetrieve&version=1.2&maximumRecords=5&query=${enc(`dc.title all "${queryLabel(query)}"`)}`,
  },
  {
    id: "portal-europeana",
    name: "Europeana",
    detail: "Agregador de patrimonio europeo. La API en vivo se usa si hay EUROPEANA_WSKEY.",
    url: (query) => `https://www.europeana.eu/es/search?query=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-loc",
    name: "Library of Congress",
    detail: "Catálogo de la Biblioteca del Congreso de Estados Unidos.",
    url: (query) => `https://www.loc.gov/search/?q=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-nara",
    name: "National Archives (EE. UU.)",
    detail: "Catálogo NARA.",
    url: (query) => `https://catalog.archives.gov/search?q=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-tna",
    name: "The National Archives (Reino Unido)",
    detail: "Discovery, el catálogo de los Archivos Nacionales británicos.",
    url: (query) => `https://discovery.nationalarchives.gov.uk/results/r?_q=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-arolsen",
    name: "Arolsen Archives",
    detail: "Archivos de persecución nazi y desplazados. Útil en ramas sefardíes del siglo XX.",
    url: (query) => `https://collections.arolsen-archives.org/en/search?s=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-jewishgen",
    name: "JewishGen",
    detail: "Bases judías y sefardíes. La consulta de personas exige cuenta en JewishGen.",
    url: () => "https://www.jewishgen.org/databases/",
  },
  {
    id: "portal-geneanet",
    name: "Geneanet",
    detail: "Árboles publicados por otros investigadores.",
    url: (query) => `https://es.geneanet.org/fonds/individus/?nom=${enc(query.surname || queryLabel(query))}&prenom=${enc(query.givenName)}`,
  },
  {
    id: "portal-wikitree",
    name: "WikiTree",
    detail: "Árbol colaborativo. También se consulta su API pública.",
    url: (query) =>
      `https://www.wikitree.com/wiki/Special:SearchPerson?FirstName=${enc(query.givenName)}&LastName=${enc(query.surname)}`,
  },
  {
    id: "portal-historypin",
    name: "Historypin",
    detail: "Fotos y relatos históricos colocados como pines sobre el mapa.",
    url: (query) => `https://www.historypin.org/en/search?q=${enc(query.place || queryLabel(query))}`,
  },
  {
    id: "portal-ohm",
    name: "OpenHistoricalMap",
    detail: "Mapa histórico abierto. Los pines que devuelve se guardan con latitud y longitud.",
    url: (query) => `https://www.openhistoricalmap.org/search?query=${enc(query.place || queryLabel(query))}`,
  },
  {
    id: "portal-pleiades",
    name: "Pleiades",
    detail: "Gazetero del mundo antiguo.",
    url: (query) => `https://pleiades.stoa.org/search?q=${enc(query.place || queryLabel(query))}`,
  },
  {
    id: "portal-whg",
    name: "World Historical Gazetteer",
    detail: "Lugares históricos conciliados de varios proyectos.",
    url: (query) => `https://whgazetteer.org/search/?q=${enc(query.place || queryLabel(query))}`,
  },
  {
    id: "portal-inegi",
    name: "INEGI — censos",
    detail: "Censos y conteos de población. La serie nacional usa la API de indicadores si hay INEGI_TOKEN.",
    url: (query) => `https://datos.gob.mx/busca/dataset?q=${enc(`censo población ${query.place || "México"}`)}`,
  },
  {
    id: "portal-viaf",
    name: "VIAF",
    detail: "Fichero de autoridades virtual internacional.",
    url: (query) => `https://viaf.org/viaf/search?query=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-wikidata",
    name: "Wikidata",
    detail: "Personas y coordenadas de lugares.",
    url: (query) => `https://www.wikidata.org/w/index.php?search=${enc(queryLabel(query))}`,
  },
  {
    id: "portal-geonames",
    name: "GeoNames",
    detail: "Topónimos. La API en vivo pide GEONAMES_USERNAME.",
    url: (query) => `https://www.geonames.org/search.html?q=${enc(query.place || queryLabel(query))}`,
  },
  {
    id: "portal-ape",
    name: "Archives Portal Europe",
    detail: "Portal europeo de archivos.",
    url: (query) => `https://www.archivesportaleurope.net/search?q=${enc(queryLabel(query))}`,
  },
];

export function portalHits(query) {
  const label = queryLabel(query);
  const stamp = fold([query.givenName, query.surname, query.place, query.year, query.text].join("|"));
  return PORTALS.map((portal) => ({
    sourceId: portal.id,
    externalId: stamp || "vacio",
    kind: "portal",
    title: `${portal.name}: ${label}`,
    givenName: query.givenName,
    surname: query.surname,
    eventDate: query.year,
    place: query.place,
    url: portal.url(query),
    summary: "Consulta guardada. Abre el portal oficial; no es una partida transcrita por este archivo.",
    raw: { portal: portal.id, query: label },
  }));
}

export function sourceCatalog(env = process.env) {
  const live = LIVE.map((source) => ({
    id: source.id,
    name: source.name,
    detail: source.detail,
    needsKey: source.needsKey,
    configured: source.configured(env),
    docs: source.docs,
  }));
  const portals = PORTALS.map((portal) => ({
    id: portal.id,
    name: portal.name,
    detail: portal.detail,
    needsKey: false,
    configured: true,
    docs: portal.url({ givenName: "", surname: "", place: "", year: "", text: "" }),
  }));
  return [
    {
      id: "archivo-local",
      name: "Archivo local",
      detail: "Personas, parentescos, registros y pines guardados en la base SQLite del sitio.",
      needsKey: false,
      configured: true,
      docs: "/",
    },
    ...live,
    ...portals,
  ];
}

function num(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asList(data, keys) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

export function parseViaf(data) {
  return asList(data?.result, []).slice(0, 8).map((row) => ({
    sourceId: "viaf",
    externalId: String(row.viafid || row.term || ""),
    kind: "record",
    title: row.displayForm || row.term || "Autoridad VIAF",
    givenName: "",
    surname: row.term || "",
    eventDate: "",
    place: "",
    url: row.viafid ? `https://viaf.org/viaf/${row.viafid}` : "https://viaf.org/",
    summary: `Autoridad ${row.nametype || "de nombre"} en VIAF.`,
    raw: row,
  })).filter((hit) => hit.externalId);
}

export function parseLoc(data) {
  const rows = asList(data, ["results", "content"]);
  const nested = rows.length > 0 ? rows : asList(data?.content, ["results"]);
  return nested.slice(0, 8).map((row) => ({
    sourceId: "loc",
    externalId: String(row.id || row.url || row.title || ""),
    kind: "record",
    title: typeof row.title === "string" ? row.title : row.title?.[0] || "Registro de la Library of Congress",
    givenName: "",
    surname: "",
    eventDate: typeof row.date === "string" ? row.date : "",
    place: "",
    url: typeof row.url === "string" ? row.url : "https://www.loc.gov/",
    summary: clip(Array.isArray(row.description) ? row.description[0] : row.description || "Catálogo de la Library of Congress.", 400),
    raw: row,
  })).filter((hit) => hit.externalId);
}

export function parseNara(data) {
  const result = data?.opaResponse?.results?.result ?? data?.results ?? [];
  const rows = Array.isArray(result) ? result : result ? [result] : [];
  return rows.slice(0, 8).map((row) => {
    const title = findTitle(row) || "Expediente NARA";
    const id = String(row.naId || row.id || title);
    return {
      sourceId: "nara",
      externalId: id,
      kind: "record",
      title,
      givenName: "",
      surname: "",
      eventDate: "",
      place: "",
      url: row.naId ? `https://catalog.archives.gov/id/${row.naId}` : "https://catalog.archives.gov/",
      summary: "Descripción del catálogo de los National Archives de Estados Unidos.",
      raw: row,
    };
  });
}

function findTitle(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 5) return "";
  if (typeof node.title === "string") return node.title;
  for (const value of Object.values(node)) {
    const found = findTitle(value, depth + 1);
    if (found) return found;
  }
  return "";
}

export function parseInegi(data, indicador = "1002000001") {
  const series = asList(data, ["Series"])[0];
  const observations = asList(series, ["OBSERVATIONS"]).slice(-12);
  if (!series || observations.length === 0) return [];
  const lines = observations
    .map((row) => `${row.TIME_PERIOD}: ${row.OBS_VALUE}`)
    .filter((line) => !line.endsWith(": undefined"));
  const latest = observations[observations.length - 1];
  return [
    {
      sourceId: "inegi",
      externalId: `indicador:${indicador}:area:0700`,
      kind: "record",
      title: "INEGI — población total, Estados Unidos Mexicanos",
      givenName: "",
      surname: "",
      eventDate: String(latest?.TIME_PERIOD ?? ""),
      place: "México",
      url: "https://www.inegi.org.mx/programas/ccpv/",
      summary: `Serie del indicador ${indicador} (personas). ${lines.join("; ")}`,
      raw: { indicador, observations },
    },
  ];
}

export function parseDatosGobMx(data) {
  const rows = data?.result?.results ?? [];
  return rows.slice(0, 5).map((row) => ({
    sourceId: "datos-gob-mx",
    externalId: String(row.id || row.name || row.title || ""),
    kind: "record",
    title: row.title || "Conjunto de datos",
    givenName: "",
    surname: "",
    eventDate: "",
    place: "México",
    url: row.name ? `https://datos.gob.mx/busca/dataset/${row.name}` : "https://datos.gob.mx/",
    summary: clip(row.notes || "Conjunto publicado en datos.gob.mx.", 400),
    raw: { id: row.id, name: row.name, title: row.title },
  })).filter((hit) => hit.externalId);
}

export function parseOhm(data) {
  return asList(data, []).slice(0, 6).map((row) => ({
    sourceId: "ohm",
    externalId: `${row.osm_type || "n"}:${row.osm_id || row.place_id || row.display_name}`,
    kind: "place",
    title: row.display_name || "Lugar histórico",
    place: row.display_name || "",
    latitude: num(row.lat),
    longitude: num(row.lon),
    url: row.osm_type && row.osm_id
      ? `https://www.openhistoricalmap.org/${row.osm_type}/${row.osm_id}`
      : "https://www.openhistoricalmap.org/",
    summary: "Pin de OpenHistoricalMap.",
    raw: row,
  })).filter((hit) => hit.latitude != null && hit.longitude != null);
}

export function parsePleiades(data) {
  const rows = asList(data, ["results", "@graph", "items"]);
  return rows.slice(0, 6).map((row) => {
    const point = row.reprPoint || row.coordinates || row.geo || [];
    const longitude = num(point[0] ?? row.longitude ?? row.lon);
    const latitude = num(point[1] ?? row.latitude ?? row.lat);
    return {
      sourceId: "pleiades",
      externalId: String(row.id || row.uri || row.title || ""),
      kind: "place",
      title: row.title || row.name || "Lugar antiguo",
      place: row.description || "",
      latitude,
      longitude,
      url: typeof row.uri === "string" ? row.uri : "https://pleiades.stoa.org/",
      summary: "Lugar del gazetero Pleiades.",
      raw: row,
    };
  }).filter((hit) => hit.externalId);
}

export function parseWhg(data) {
  const rows = asList(data, ["results", "features", "places"]);
  return rows.slice(0, 6).map((row) => {
    const props = row.properties || row;
    const coords = row.geometry?.coordinates || props.geo?.coordinates || props.coordinates || [];
    return {
      sourceId: "whg",
      externalId: String(props.id || props.place_id || props.title || props.name || ""),
      kind: "place",
      title: props.title || props.name || props.toponym || "Lugar histórico",
      place: Array.isArray(props.ccodes) ? props.ccodes.join(", ") : "",
      longitude: num(coords[0] ?? props.lon ?? props.longitude),
      latitude: num(coords[1] ?? props.lat ?? props.latitude),
      url: props.uri || (props.id ? `https://whgazetteer.org/places/${props.id}/` : "https://whgazetteer.org/"),
      summary: "Lugar del World Historical Gazetteer.",
      raw: props,
    };
  }).filter((hit) => hit.externalId);
}

export function parseWikidataPeople(data) {
  const bindings = data?.results?.bindings ?? [];
  return bindings.slice(0, 6).map((row) => {
    const uri = row.item?.value || "";
    const id = uri.split("/").pop();
    return {
      sourceId: "wikidata",
      externalId: id,
      kind: "record",
      title: row.itemLabel?.value || id,
      givenName: "",
      surname: row.itemLabel?.value || "",
      eventDate: yearOf(row.birth?.value),
      place: row.birthPlaceLabel?.value || "",
      url: id ? `https://www.wikidata.org/wiki/${id}` : uri,
      summary: row.death?.value ? `Defunción ${yearOf(row.death.value)}.` : "Persona en Wikidata.",
      raw: row,
    };
  }).filter((hit) => hit.externalId);
}

export function parseWikidataPlaces(data) {
  const bindings = data?.results?.bindings ?? [];
  return bindings.slice(0, 6).map((row) => {
    const uri = row.item?.value || "";
    const id = uri.split("/").pop();
    const point = parseWktPoint(row.coord?.value);
    return {
      sourceId: "wikidata-lugar",
      externalId: id,
      kind: "place",
      title: row.itemLabel?.value || id,
      latitude: point?.latitude ?? null,
      longitude: point?.longitude ?? null,
      url: id ? `https://www.wikidata.org/wiki/${id}` : uri,
      summary: "Coordenada de Wikidata.",
      raw: row,
    };
  }).filter((hit) => hit.externalId && hit.latitude != null);
}

function yearOf(value) {
  const match = String(value ?? "").match(/\d{3,4}/);
  return match ? match[0] : "";
}

export function parseWktPoint(value) {
  const match = String(value ?? "").match(/Point\(([-\d.]+)\s+([-\d.]+)\)/i);
  if (!match) return null;
  return { longitude: Number(match[1]), latitude: Number(match[2]) };
}

export function parseWikiTree(data) {
  const rows = Array.isArray(data) ? data[0]?.matches || data : data?.matches || data?.items || [];
  const list = Array.isArray(rows) ? rows : [];
  return list.slice(0, 8).map((row) => ({
    sourceId: "wikitree",
    externalId: String(row.Id || row.Name || row.key || ""),
    kind: "record",
    title: [row.FirstName, row.LastName].filter(Boolean).join(" ") || row.Name || "Perfil WikiTree",
    givenName: row.FirstName || "",
    surname: row.LastName || "",
    eventDate: row.BirthDate || row.BirthYear || "",
    place: row.BirthLocation || "",
    url: row.Name ? `https://www.wikitree.com/wiki/${row.Name}` : "https://www.wikitree.com/",
    summary: "Perfil público de WikiTree.",
    raw: row,
  })).filter((hit) => hit.externalId);
}

export function parseEuropeana(data) {
  return asList(data, ["items"]).slice(0, 6).map((row) => ({
    sourceId: "europeana",
    externalId: String(row.id || row.guid || ""),
    kind: "record",
    title: Array.isArray(row.title) ? row.title[0] : row.title || "Objeto Europeana",
    givenName: "",
    surname: "",
    eventDate: "",
    place: Array.isArray(row.dataProvider) ? row.dataProvider[0] : "",
    url: row.guid || row.link || "https://www.europeana.eu/",
    summary: "Objeto agregado por Europeana.",
    raw: { id: row.id, title: row.title },
  })).filter((hit) => hit.externalId);
}

export function parseGeonames(data) {
  return asList(data, ["geonames"]).slice(0, 6).map((row) => ({
    sourceId: "geonames",
    externalId: String(row.geonameId || ""),
    kind: "place",
    title: [row.name, row.countryName].filter(Boolean).join(", "),
    latitude: num(row.lat),
    longitude: num(row.lng),
    url: row.geonameId ? `https://www.geonames.org/${row.geonameId}` : "https://www.geonames.org/",
    summary: "Topónimo GeoNames.",
    raw: row,
  })).filter((hit) => hit.externalId && hit.latitude != null);
}

export function parseHistorypin(data) {
  const found = [];
  const seen = new Set();
  const walk = (node, depth) => {
    if (!node || depth > 6 || found.length >= 8) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node !== "object") return;
    const latitude = num(node.latitude ?? node.lat);
    const longitude = num(node.longitude ?? node.lng ?? node.lon);
    const title = node.caption || node.title || node.name;
    if (latitude != null && longitude != null && title) {
      const externalId = String(node.id || node.pin_id || `${latitude},${longitude},${title}`).slice(0, 180);
      if (!seen.has(externalId)) {
        seen.add(externalId);
        found.push({
          sourceId: "historypin",
          externalId,
          kind: "place",
          title: clip(title, 180),
          latitude,
          longitude,
          url: node.url || node.link || "https://www.historypin.org/",
          summary: "Pin de Historypin.",
          raw: { id: externalId, title },
        });
      }
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === "object") walk(value, depth + 1);
    }
  };
  walk(data, 0);
  return found;
}

export function parseFamilySearch(data) {
  const entries = asList(data, ["entries"]);
  return entries.slice(0, 8).map((entry) => {
    const person = entry?.content?.gedcomx?.persons?.[0];
    const full = person?.names?.[0]?.nameForms?.[0]?.fullText || entry.title || "Persona de FamilySearch";
    const [givenName, ...rest] = String(full).split(" ");
    const birth = (person?.facts || []).find((fact) => String(fact.type || "").includes("Birth"));
    const id = String(entry.id || person?.id || full);
    return {
      sourceId: "familysearch",
      externalId: id,
      kind: "record",
      title: full,
      givenName: givenName || "",
      surname: rest.join(" "),
      eventDate: birth?.date?.original || birth?.date?.formal || "",
      place: birth?.place?.original || "",
      url: id.startsWith("http") ? id : `https://www.familysearch.org/tree/person/details/${id}`,
      summary: "Resultado de la API de FamilySearch.",
      raw: { id, title: full },
    };
  }).filter((hit) => hit.externalId);
}

export function parseFamilySearchPlaces(data) {
  return parseFamilySearch(data).map((hit) => ({
    ...hit,
    sourceId: "familysearch-lugar",
    kind: "place",
    latitude: num(hit.raw?.latitude),
    longitude: num(hit.raw?.longitude),
    summary: "Lugar de la API de FamilySearch.",
  }));
}

async function fetchJson(url, { fetchImpl, method = "GET", headers = {}, body, timeoutMs = 7000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...headers,
      },
      body,
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) {
      return { ok: false, status: response.status, data, error: `HTTP ${response.status}` };
    }
    return { ok: true, status: response.status, data, error: "" };
  } catch (error) {
    const message = error?.name === "AbortError" ? "tiempo agotado" : error?.message || "falló la consulta";
    return { ok: false, status: 0, data: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}

function personText(query) {
  return [query.givenName, query.surname, query.text].filter(Boolean).join(" ").trim();
}

function placeText(query) {
  return query.place || personText(query);
}

function sparqlString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').slice(0, 80);
}

let familySearchCache = { token: "", expiresAt: 0 };

export async function familySearchToken(env, ip, fetchImpl) {
  if (!env.FAMILYSEARCH_CLIENT_ID) return { token: "", error: "Falta FAMILYSEARCH_CLIENT_ID" };
  if (familySearchCache.token && familySearchCache.expiresAt > Date.now()) {
    return { token: familySearchCache.token, error: "" };
  }
  const body = new URLSearchParams({
    grant_type: "unauthenticated_session",
    client_id: env.FAMILYSEARCH_CLIENT_ID,
    ip_address: ip || "127.0.0.1",
  });
  const result = await fetchJson("https://ident.familysearch.org/cis-web/oauth2/v3/token", {
    fetchImpl,
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!result.ok || !result.data?.access_token) {
    return { token: "", error: result.error || "FamilySearch no entregó un token" };
  }
  const expiresIn = Number(result.data.expires_in || 300);
  familySearchCache = {
    token: result.data.access_token,
    expiresAt: Date.now() + Math.max(30, expiresIn - 30) * 1000,
  };
  return { token: familySearchCache.token, error: "" };
}

export function familySearchAuthorizeUrl(env) {
  const redirect = env.FAMILYSEARCH_REDIRECT_URI || "https://genealogiasefardi.site/familysearch/callback";
  const url = new URL("https://ident.familysearch.org/cis-web/oauth2/v3/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.FAMILYSEARCH_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", redirect);
  return url.toString();
}

export async function exchangeFamilySearchCode(env, code, fetchImpl) {
  const redirect = env.FAMILYSEARCH_REDIRECT_URI || "https://genealogiasefardi.site/familysearch/callback";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.FAMILYSEARCH_CLIENT_ID || "",
    redirect_uri: redirect,
  });
  const result = await fetchJson("https://ident.familysearch.org/cis-web/oauth2/v3/token", {
    fetchImpl,
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!result.ok || !result.data?.access_token) {
    return { token: "", error: result.error || "No se pudo canjear el código de FamilySearch" };
  }
  return { token: result.data.access_token, error: "" };
}

async function searchFamilySearch(query, ctx, token, path, parser) {
  const parts = [];
  if (path.includes("places")) {
    const name = placeText(query);
    if (!name) return [];
    parts.push(`name:${name}`);
  } else {
    if (query.surname) parts.push(`surname:${query.surname}`);
    if (query.givenName) parts.push(`givenName:${query.givenName}`);
    if (!parts.length && query.text) parts.push(`name:${query.text}`);
  }
  if (parts.length === 0) return [];
  const url = new URL(`https://api.familysearch.org${path}`);
  url.searchParams.set("q", parts.join(" "));
  url.searchParams.set("count", "8");
  const result = await fetchJson(url, {
    fetchImpl: ctx.fetchImpl,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/x-gedcomx-atom+json, application/json",
    },
  });
  if (!result.ok) throw new Error(result.error);
  return parser(result.data);
}

const LIVE = [
  {
    id: "viaf",
    name: "VIAF",
    detail: "Autoridades de nombre, sin llave.",
    docs: "https://viaf.org/",
    needsKey: false,
    configured: () => true,
    applies: (query) => personText(query).length >= 2,
    async search(query, ctx) {
      const url = `https://viaf.org/viaf/AutoSuggest?query=${enc(personText(query))}`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseViaf(result.data);
    },
  },
  {
    id: "wikidata",
    name: "Wikidata — personas",
    detail: "Personas con el servicio público de consultas.",
    docs: "https://query.wikidata.org/",
    needsKey: false,
    configured: () => true,
    applies: (query) => personText(query).length >= 2,
    async search(query, ctx) {
      const term = sparqlString(personText(query));
      const sparql = `SELECT ?item ?itemLabel ?birth ?death ?birthPlaceLabel WHERE {
        SERVICE wikibase:mwapi {
          bd:serviceParam wikibase:endpoint "www.wikidata.org";
                          wikibase:api "EntitySearch";
                          mwapi:search "${term}";
                          mwapi:language "es".
          ?item wikibase:apiOutputItem mwapi:item.
        }
        ?item wdt:P31 wd:Q5.
        OPTIONAL { ?item wdt:P569 ?birth. }
        OPTIONAL { ?item wdt:P570 ?death. }
        OPTIONAL { ?item wdt:P19 ?birthPlace. ?birthPlace rdfs:label ?birthPlaceLabel. FILTER(LANG(?birthPlaceLabel)="es") }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
      } LIMIT 6`;
      const result = await fetchJson("https://query.wikidata.org/sparql", {
        fetchImpl: ctx.fetchImpl,
        method: "POST",
        headers: { "Content-Type": "application/sparql", Accept: "application/sparql-results+json" },
        body: sparql,
      });
      if (!result.ok) throw new Error(result.error);
      return parseWikidataPeople(result.data);
    },
  },
  {
    id: "wikidata-lugar",
    name: "Wikidata — lugares",
    detail: "Lugares con coordenada.",
    docs: "https://query.wikidata.org/",
    needsKey: false,
    configured: () => true,
    applies: (query) => placeText(query).length >= 2,
    async search(query, ctx) {
      const term = sparqlString(placeText(query));
      const sparql = `SELECT ?item ?itemLabel ?coord WHERE {
        SERVICE wikibase:mwapi {
          bd:serviceParam wikibase:endpoint "www.wikidata.org";
                          wikibase:api "EntitySearch";
                          mwapi:search "${term}";
                          mwapi:language "es".
          ?item wikibase:apiOutputItem mwapi:item.
        }
        ?item wdt:P625 ?coord.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
      } LIMIT 6`;
      const result = await fetchJson("https://query.wikidata.org/sparql", {
        fetchImpl: ctx.fetchImpl,
        method: "POST",
        headers: { "Content-Type": "application/sparql", Accept: "application/sparql-results+json" },
        body: sparql,
      });
      if (!result.ok) throw new Error(result.error);
      return parseWikidataPlaces(result.data);
    },
  },
  {
    id: "wikitree",
    name: "WikiTree",
    detail: "Búsqueda pública de personas.",
    docs: "https://www.wikitree.com/wiki/Help:API_Documentation",
    needsKey: false,
    configured: () => true,
    applies: (query) => Boolean(query.surname || query.givenName),
    async search(query, ctx) {
      const url = new URL("https://api.wikitree.com/api.php");
      url.searchParams.set("action", "searchPerson");
      url.searchParams.set("format", "json");
      if (query.givenName) url.searchParams.set("FirstName", query.givenName);
      if (query.surname) url.searchParams.set("LastName", query.surname);
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseWikiTree(result.data);
    },
  },
  {
    id: "loc",
    name: "Library of Congress",
    detail: "API JSON del catálogo.",
    docs: "https://www.loc.gov/apis/",
    needsKey: false,
    configured: () => true,
    applies: (query) => queryLabel(query).length >= 2,
    async search(query, ctx) {
      const url = `https://www.loc.gov/search/?q=${enc(queryLabel(query))}&fo=json&c=8`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseLoc(result.data);
    },
  },
  {
    id: "nara",
    name: "National Archives (EE. UU.)",
    detail: "API del catálogo NARA.",
    docs: "https://www.archives.gov/developer",
    needsKey: false,
    configured: () => true,
    applies: (query) => queryLabel(query).length >= 2,
    async search(query, ctx) {
      const url = `https://catalog.archives.gov/api/v1/?q=${enc(queryLabel(query))}&rows=8`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseNara(result.data);
    },
  },
  {
    id: "ohm",
    name: "OpenHistoricalMap",
    detail: "Pines históricos vía Nominatim de OpenHistoricalMap.",
    docs: "https://www.openhistoricalmap.org/",
    needsKey: false,
    configured: () => true,
    applies: (query) => placeText(query).length >= 2,
    async search(query, ctx) {
      const url = `https://nominatim.openhistoricalmap.org/search?format=jsonv2&limit=6&q=${enc(placeText(query))}`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseOhm(result.data);
    },
  },
  {
    id: "pleiades",
    name: "Pleiades",
    detail: "Gazetero del mundo antiguo.",
    docs: "https://pleiades.stoa.org/",
    needsKey: false,
    configured: () => true,
    applies: (query) => placeText(query).length >= 2,
    async search(query, ctx) {
      const url = `https://pleiades.stoa.org/search.json?q=${enc(placeText(query))}&search_type=place`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parsePleiades(result.data);
    },
  },
  {
    id: "whg",
    name: "World Historical Gazetteer",
    detail: "Lugares históricos conciliados.",
    docs: "https://whgazetteer.org/",
    needsKey: false,
    configured: () => true,
    applies: (query) => placeText(query).length >= 2,
    async search(query, ctx) {
      const url = `https://whgazetteer.org/api/places/?name=${enc(placeText(query))}`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseWhg(result.data);
    },
  },
  {
    id: "historypin",
    name: "Historypin",
    detail: "Pines de fotos y relatos. Historypin es la aplicación de pines históricos.",
    docs: "https://www.historypin.org/",
    needsKey: false,
    configured: () => true,
    applies: (query) => placeText(query).length >= 2,
    async search(query, ctx) {
      const project = ctx.env.HISTORYPIN_PROJECT || "";
      const url = project
        ? `https://www.historypin.org/en/api/${enc(project)}/pin/get_gallery.json?q=${enc(placeText(query))}`
        : `https://www.historypin.org/en/api/projects/listing.json`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseHistorypin(result.data);
    },
  },
  {
    id: "inegi",
    name: "INEGI — indicador de población",
    detail: "Serie de población total del censo (indicador 1002000001) cuando la búsqueda es de México o de censos.",
    docs: "https://www.inegi.org.mx/servicios/api_indicadores.html",
    needsKey: true,
    configured: (env) => Boolean(env.INEGI_TOKEN),
    applies: (query, env) => Boolean(env.INEGI_TOKEN) && wantsInegi(query),
    async search(query, ctx) {
      const result = await fetchJson(inegiIndicatorUrl(ctx.env.INEGI_TOKEN), { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseInegi(result.data);
    },
  },
  {
    id: "datos-gob-mx",
    name: "datos.gob.mx — censos",
    detail: "Conjuntos abiertos de censos y conteos.",
    docs: "https://datos.gob.mx/",
    needsKey: false,
    configured: () => true,
    applies: (query) => wantsInegi(query),
    async search(query, ctx) {
      const url = `https://datos.gob.mx/busca/api/3/action/package_search?rows=5&q=${enc(`censo población ${query.place || "México"}`)}`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseDatosGobMx(result.data);
    },
  },
  {
    id: "geonames",
    name: "GeoNames",
    detail: "Topónimos contemporáneos para completar un pin.",
    docs: "https://www.geonames.org/export/web-services.html",
    needsKey: true,
    configured: (env) => Boolean(env.GEONAMES_USERNAME),
    applies: (query, env) => Boolean(env.GEONAMES_USERNAME) && placeText(query).length >= 2,
    async search(query, ctx) {
      const url = `https://secure.geonames.org/searchJSON?maxRows=6&q=${enc(placeText(query))}&username=${enc(ctx.env.GEONAMES_USERNAME)}`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseGeonames(result.data);
    },
  },
  {
    id: "europeana",
    name: "Europeana",
    detail: "Objetos de patrimonio. Requiere EUROPEANA_WSKEY.",
    docs: "https://pro.europeana.eu/page/search",
    needsKey: true,
    configured: (env) => Boolean(env.EUROPEANA_WSKEY),
    applies: (query, env) => Boolean(env.EUROPEANA_WSKEY) && queryLabel(query).length >= 2,
    async search(query, ctx) {
      const url = `https://api.europeana.eu/record/v2/search.json?rows=6&profile=minimal&wskey=${enc(ctx.env.EUROPEANA_WSKEY)}&query=${enc(queryLabel(query))}`;
      const result = await fetchJson(url, { fetchImpl: ctx.fetchImpl });
      if (!result.ok) throw new Error(result.error);
      return parseEuropeana(result.data);
    },
  },
  {
    id: "familysearch",
    name: "FamilySearch — árbol y lugares",
    detail: "Lugares con sesión no autenticada (FAMILYSEARCH_CLIENT_ID). Personas del árbol con la sesión OAuth del investigador.",
    docs: "https://www.familysearch.org/developers/",
    needsKey: true,
    configured: (env) => Boolean(env.FAMILYSEARCH_CLIENT_ID),
    applies: (query, env) => Boolean(env.FAMILYSEARCH_CLIENT_ID) && queryLabel(query).length >= 2,
    async search(query, ctx) {
      const hits = [];
      if (ctx.userToken) {
        hits.push(...await searchFamilySearch(query, ctx, ctx.userToken, "/platform/tree/search", parseFamilySearch));
      }
      const unauth = await familySearchToken(ctx.env, ctx.ip, ctx.fetchImpl);
      if (unauth.token && placeText(query)) {
        hits.push(...await searchFamilySearch(query, ctx, unauth.token, "/platform/places/search", parseFamilySearchPlaces));
      } else if (!ctx.userToken && unauth.error && hits.length === 0) {
        throw new Error(unauth.error);
      }
      return hits;
    },
  },
];

export async function runLive(query, { fetchImpl = fetch, env = process.env, ip = "127.0.0.1", userToken = "" } = {}) {
  const ctx = { fetchImpl, env, ip, userToken };
  const jobs = LIVE.map(async (source) => {
    if (!source.configured(env)) {
      return { id: source.id, name: source.name, ok: false, count: 0, message: source.needsKey ? "falta la llave" : "no configurada", items: [] };
    }
    if (!source.applies(query, env)) {
      return { id: source.id, name: source.name, ok: true, count: 0, message: "no aplica a esta consulta", items: [] };
    }
    try {
      const items = await source.search(query, ctx);
      return { id: source.id, name: source.name, ok: true, count: items.length, message: "", items };
    } catch (error) {
      return {
        id: source.id,
        name: source.name,
        ok: false,
        count: 0,
        message: clip(error?.message || "falló", 180),
        items: [],
      };
    }
  });
  const reports = await Promise.all(jobs);
  return {
    items: reports.flatMap((report) => report.items),
    reports: reports.map(({ items, ...report }) => report),
  };
}
