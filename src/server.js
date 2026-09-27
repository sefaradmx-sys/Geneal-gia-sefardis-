import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  HttpError,
  counts,
  createPerson,
  createPersonFromRecord,
  getPerson,
  linkFamily,
  listPersons,
  listPlaces,
  listRecords,
  openDatabase,
} from "./db.js";
import { pageHome, pageMessage, pageNewPerson, pagePerson, pagePlaces, pageRecords, pageSearch, pageSources, pageTree } from "./pages.js";
import { hasQuery, normalizeInput, performSearch } from "./search.js";
import { exchangeFamilySearchCode, familySearchAuthorizeUrl } from "./sources.js";
import { ancestorNode, defaultFocusId } from "./tree.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES = path.join(__dirname, "..", "public", "styles.css");

function readCookie(header, name) {
  for (const part of String(header || "").split(/;\s*/)) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index) === name) {
      return decodeURIComponent(part.slice(index + 1));
    }
  }
  return "";
}

function ensureSession(req, sessions) {
  const existing = readCookie(req.headers.cookie, "gsid");
  if (existing && sessions.has(existing)) {
    return { session: sessions.get(existing), cookieHeader: "" };
  }
  const id = randomBytes(24).toString("hex");
  const session = { csrf: randomBytes(16).toString("hex"), fsToken: "" };
  sessions.set(id, session);
  return {
    session,
    cookieHeader: `gsid=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`,
  };
}

function send(res, status, body, { type = "text/html; charset=utf-8", cookie = "", location = "" } = {}) {
  const headers = {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; base-uri 'none'; form-action 'self'",
  };
  if (cookie) headers["Set-Cookie"] = cookie;
  if (location) headers.Location = location;
  res.writeHead(status, headers);
  res.end(body);
}

function redirect(res, location, cookie) {
  send(res, 303, "", { cookie, location });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 100_000) {
        reject(new HttpError(413, "El formulario es demasiado grande."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isTreeHost(host, env) {
  const configured = String(env.TREE_HOST || "tree.genealogiasefardi.site").toLowerCase();
  const name = String(host || "").split(":")[0].toLowerCase();
  return name === configured || name.startsWith("tree.");
}

function limited(limits, ip) {
  const now = Date.now();
  const recent = (limits.get(ip) || []).filter((stamp) => now - stamp < 10 * 60 * 1000);
  if (recent.length >= 30) {
    limits.set(ip, recent);
    return true;
  }
  recent.push(now);
  limits.set(ip, recent);
  return false;
}

function sexForKind(kind) {
  switch (kind) {
    case "padre":
    case "hijo":
      return "M";
    case "madre":
    case "hija":
      return "F";
    case "conyuge":
      return "U";
    default: {
      const unknown = kind;
      throw new HttpError(400, `Parentesco no reconocido: ${unknown}`);
    }
  }
}

async function dispatch(req, res, ctx) {
  const url = new URL(req.url || "/", "http://localhost");
  const pathName = decodeURIComponent(url.pathname);
  if (pathName.includes("\0") || pathName.includes("..")) {
    throw new HttpError(400, "Ruta no válida.");
  }
  const treeHost = isTreeHost(req.headers.host, ctx.env);
  const { session, cookieHeader } = ensureSession(req, ctx.sessions);
  const view = { treeHost };

  if (req.method === "GET" && (pathName === "/estilos.css" || pathName === "/inicio.js")) {
    const file = pathName === "/estilos.css" ? STYLES : path.join(__dirname, "..", "public", "inicio.js");
    const type = pathName === "/estilos.css" ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
    send(res, 200, fs.readFileSync(file), { type });
    return;
  }

  if (req.method === "GET" && pathName === "/api/salud") {
    send(res, 200, JSON.stringify({ status: "ok", service: "genealogia-sefardi", ...counts(ctx.db) }), {
      type: "application/json; charset=utf-8",
    });
    return;
  }

  if (req.method === "GET" && pathName === "/api/arbol") {
    const focus = Number(url.searchParams.get("persona")) || defaultFocusId(ctx.db);
    send(res, 200, JSON.stringify(ancestorNode(ctx.db, focus, 4)), {
      type: "application/json; charset=utf-8",
    });
    return;
  }

  if (req.method === "GET" && (pathName === "/buscar" || pathName === "/api/buscar")) {
    const ip = req.socket?.remoteAddress || "local";
    if (limited(ctx.limits, ip)) {
      throw new HttpError(429, "Demasiadas búsquedas seguidas. Espera unos minutos.");
    }
    const query = normalizeInput(Object.fromEntries(url.searchParams.entries()));
    if (!hasQuery(query) && pathName === "/api/buscar") {
      throw new HttpError(400, "Faltan términos de búsqueda.");
    }
    const result = await performSearch(ctx.db, query, {
      fetchImpl: ctx.fetchImpl,
      env: ctx.env,
      ip,
      userToken: session.fsToken,
    });
    if (pathName === "/api/buscar") {
      if (result.error) throw new HttpError(400, result.error);
      send(res, 200, JSON.stringify(result), { type: "application/json; charset=utf-8" });
      return;
    }
    send(res, 200, pageSearch(result, { ...view, csrf: session.csrf }), { cookie: cookieHeader });
    return;
  }

  if (req.method === "GET" && pathName === "/familysearch/conectar") {
    if (!ctx.env.FAMILYSEARCH_CLIENT_ID) {
      send(res, 200, pageMessage("FamilySearch", "Falta FAMILYSEARCH_CLIENT_ID en el servidor.", view), {
        cookie: cookieHeader,
      });
      return;
    }
    send(res, 302, "", { location: familySearchAuthorizeUrl(ctx.env), cookie: cookieHeader });
    return;
  }

  if (req.method === "GET" && pathName === "/familysearch/callback") {
    const exchanged = await exchangeFamilySearchCode(ctx.env, url.searchParams.get("code") || "", ctx.fetchImpl);
    if (!exchanged.token) {
      send(res, 502, pageMessage("FamilySearch", exchanged.error, view), { cookie: cookieHeader });
      return;
    }
    session.fsToken = exchanged.token;
    redirect(res, "/fuentes", cookieHeader);
    return;
  }

  if (req.method === "GET" && pathName === "/persona/nueva") {
    send(res, 200, pageNewPerson({ ...view, csrf: session.csrf }), { cookie: cookieHeader });
    return;
  }

  const personMatch = pathName.match(/^\/persona\/(\d+)$/);
  if (req.method === "GET" && personMatch) {
    const person = getPerson(ctx.db, Number(personMatch[1]));
    if (!person) throw new HttpError(404, "Esa persona no está en el archivo.");
    send(res, 200, pagePerson(person, { ...view, db: ctx.db, csrf: session.csrf }), { cookie: cookieHeader });
    return;
  }

  if (req.method === "POST" && pathName === "/persona") {
    const form = Object.fromEntries(new URLSearchParams(await readBody(req)));
    if (form.csrf !== session.csrf) throw new HttpError(403, "La sesión caducó. Vuelve a cargar la página.");
    const person = createPerson(ctx.db, form);
    redirect(res, `/persona/${person.id}`, cookieHeader);
    return;
  }

  const familyMatch = pathName.match(/^\/persona\/(\d+)\/familia$/);
  if (req.method === "POST" && familyMatch) {
    const form = Object.fromEntries(new URLSearchParams(await readBody(req)));
    if (form.csrf !== session.csrf) throw new HttpError(403, "La sesión caducó. Vuelve a cargar la página.");
    const personId = Number(familyMatch[1]);
    const relative = createPerson(ctx.db, { ...form, sexo: sexForKind(form.kind) });
    linkFamily(ctx.db, personId, form.kind, relative.id);
    redirect(res, `/persona/${personId}`, cookieHeader);
    return;
  }

  const attachMatch = pathName.match(/^\/registros\/(\d+)\/al-arbol$/);
  if (req.method === "POST" && attachMatch) {
    const form = Object.fromEntries(new URLSearchParams(await readBody(req)));
    if (form.csrf !== session.csrf) throw new HttpError(403, "La sesión caducó. Vuelve a cargar la página.");
    const person = createPersonFromRecord(ctx.db, Number(attachMatch[1]));
    redirect(res, `/persona/${person.id}`, cookieHeader);
    return;
  }

  if (req.method === "GET" && pathName === "/registros") {
    send(res, 200, pageRecords(listRecords(ctx.db), view), { cookie: cookieHeader });
    return;
  }

  if (req.method === "GET" && pathName === "/lugares") {
    send(res, 200, pagePlaces(listPlaces(ctx.db), view), { cookie: cookieHeader });
    return;
  }

  if (req.method === "GET" && pathName === "/fuentes") {
    send(res, 200, pageSources(ctx.env, view), { cookie: cookieHeader });
    return;
  }

  if (req.method === "GET" && (pathName === "/arbol" || (treeHost && pathName === "/"))) {
    const requested = Number(url.searchParams.get("persona"));
    const focus = requested || defaultFocusId(ctx.db);
    if (requested && !getPerson(ctx.db, requested)) throw new HttpError(404, "Esa persona no está en el archivo.");
    send(res, 200, pageTree(ctx.db, focus, view), { cookie: cookieHeader });
    return;
  }

  if (req.method === "GET" && pathName === "/") {
    send(res, 200, pageHome({
      ...view,
      stats: counts(ctx.db),
      people: listPersons(ctx.db),
      places: listPlaces(ctx.db),
    }), { cookie: cookieHeader });
    return;
  }

  throw new HttpError(404, "No está esa página.");
}

export function createServer(options = {}) {
  const db = options.db ?? openDatabase(options.databasePath);
  const sessions = options.sessions ?? new Map();
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const limits = options.limits ?? new Map();
  return http.createServer(async (req, res) => {
    try {
      await dispatch(req, res, { db, sessions, env, fetchImpl, limits });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = status === 500 ? "No se pudo completar la operación." : error.message;
      if (status === 500) console.error(error);
      const treeHost = isTreeHost(req.headers.host, env);
      send(res, status, pageMessage("Error", message, { treeHost }));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "0.0.0.0";
  createServer().listen(port, host, () => {
    console.log(`Genealogía Sefardí en http://${host}:${port}`);
  });
}
