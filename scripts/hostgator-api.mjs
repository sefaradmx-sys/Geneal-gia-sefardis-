import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const token = (process.env.CPANEL_TOKEN || "").trim();
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const statePath = path.join(root, "hostgator", "estado.txt");
const site = "genealogiasefardi.site";
const docroot = "public_html/sefarad-mx";
const treeRoute = "/sefarad-mx/tree/sefarad";
const hosts = ["mx18.hostgator.mx", "108.179.194.59", site];
const fallbackUsers = ["nuevaexp", "genealog", "sefarad", "geneal", "sefaradm", "sefaradmx"];
const lines = [`fecha=${new Date().toISOString()}`];

function redact(text) {
  let out = String(text ?? "");
  if (token) out = out.split(token).join("[redacted]");
  return out.replace(/(cpanel|whm|basic)\s+[a-z0-9_]+:\S+/gi, "$1 [redacted]");
}

function note(line) {
  const clean = redact(line).replace(/\s+/g, " ").slice(0, 420);
  lines.push(clean);
  console.log(clean);
}

function snippet(text) {
  return redact(text).replace(/\s+/g, " ").slice(0, 180);
}

function authHeaders(kind, user) {
  if (kind === "basic") {
    return { Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString("base64")}` };
  }
  return { Authorization: `${kind} ${user}:${token}` };
}

function accepted(status, text) {
  if (status !== 200) return false;
  try {
    const body = JSON.parse(text);
    if (body.status === 0 || body.metadata?.result === 0) return false;
    if (body.status === 1 || body.metadata?.result === 1) return true;
    return typeof body.version === "string";
  } catch {
    return false;
  }
}

function ownsSite(text) {
  return domainNames(text).some((name) => name === site || name.endsWith(`.${site}`));
}

function isDown(error) {
  const message = `${error.name || ""} ${error.message || ""} ${error.cause?.code || ""}`;
  return /timeout|abort|ECONN|ENOTFOUND|EHOST|fetch failed|UND_ERR|socket|closed/i.test(message);
}

async function call(url, headers) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(20000),
  });
  return { status: response.status, text: await response.text() };
}

async function peek(url) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      headers: { "User-Agent": "genealogia" },
    });
    const text = await response.text();
    const title = text.match(/<title>([^<]{0,80})/i)?.[1]?.trim() || "";
    note(`web ${response.status} ${url} ${title} ${snippet(text)}`);
    return text;
  } catch (error) {
    note(`web ERR ${error.name} ${url}`);
    return "";
  }
}

async function discoverUsers() {
  const found = [];
  const urls = [
    `https://arbol.${site}/sefarad-mx/index.php?route=${encodeURIComponent(treeRoute)}`,
    `https://arbol.${site}/`,
    `https://tree.${site}/`,
    `https://${site}/`,
  ];
  for (const url of urls) {
    const text = await peek(url);
    for (const match of text.matchAll(/\/home\/([a-z][a-z0-9]{2,16})\//g)) found.push(match[1]);
    for (const match of text.matchAll(/~([a-z][a-z0-9]{2,16})\//g)) found.push(match[1]);
  }
  return [...new Set(found)];
}

async function tryUsers(host, port, kind, apiPath, users) {
  let sawHttp = false;
  for (const user of users) {
    const url = `https://${host}:${port}${apiPath}`;
    try {
      const response = await call(url, authHeaders(kind, user));
      sawHttp = true;
      note(`${host}:${port} ${kind} ${user} HTTP ${response.status} ${snippet(response.text)}`);
      if (!accepted(response.status, response.text)) continue;
      if (port === 2087 || ownsSite(response.text)) {
        return { down: false, session: { host, port, kind, user, text: response.text, accountUser: user } };
      }
      const single = await call(
        `https://${host}:${port}/execute/DomainInfo/single_domain_data?domain=${site}`,
        authHeaders(kind, user),
      );
      note(`single ${user} HTTP ${single.status} ${snippet(single.text)}`);
      if (single.status === 200 && single.text.includes(site) && !/does not exist|no existe|denied/i.test(single.text)) {
        return { down: false, session: { host, port, kind, user, text: single.text, accountUser: user } };
      }
      note(`${user} entro en otra cuenta`);
      describe(response.text);
    } catch (error) {
      note(`${host}:${port} ${kind} ${user} red ${error.name}`);
      if (!sawHttp && isDown(error)) return { down: true, session: null };
    }
  }
  return { down: !sawHttp, session: null };
}

function endpoint(session, apiPath) {
  if (session.kind !== "whm") return `https://${session.host}:${session.port}${apiPath}`;
  const bare = apiPath.replace(/^\/execute\//, "");
  const [pathname, query = ""] = bare.split("?");
  const [module, func] = pathname.split("/");
  const params = new URLSearchParams(query);
  params.set("cpanel_jsonapi_user", session.accountUser);
  params.set("cpanel_jsonapi_apiversion", "3");
  params.set("cpanel_jsonapi_module", module);
  params.set("cpanel_jsonapi_func", func);
  return `https://${session.host}:2087/json-api/cpanel?${params}`;
}

async function uapi(session, apiPath) {
  const response = await call(endpoint(session, apiPath), authHeaders(session.kind, session.user));
  note(`${apiPath.split("?")[0]} HTTP ${response.status} ${snippet(response.text)}`);
  try {
    return { ...response, json: JSON.parse(response.text) };
  } catch {
    return { ...response, json: null };
  }
}

function succeeded(response) {
  const body = response.json;
  if (!body) return response.status === 200;
  if (body.status === 1) return true;
  if (body.metadata?.result === 1) return true;
  if (body.cpanelresult?.event?.result === 1) return true;
  const result = body.result?.data || body.data?.result;
  return result?.status === 1;
}

function domainNames(text) {
  try {
    const data = JSON.parse(text).data;
    if (Array.isArray(data)) return data.map((row) => row.domain).filter(Boolean);
    if (!data || typeof data !== "object") return [];
    return [data.main_domain, ...(data.sub_domains || []), ...(data.addon_domains || []), ...(data.parked_domains || [])].filter(Boolean);
  } catch {
    return [];
  }
}

function describe(text) {
  try {
    const data = JSON.parse(text).data;
    if (Array.isArray(data)) {
      for (const row of data.slice(0, 30)) {
        note(`dominio ${row.domain || row.servername || "?"} raiz ${row.documentroot || row.docroot || ""}`);
      }
      return;
    }
    if (!data || typeof data !== "object") return;
    note(`main=${data.main_domain || ""}`);
    for (const key of ["sub_domains", "addon_domains", "parked_domains"]) {
      const list = Array.isArray(data[key]) ? data[key] : [];
      note(`${key}=${list.join(" ") || "-"}`);
    }
  } catch {
    note("respuesta sin lista de dominios");
  }
}

async function findSession(users) {
  for (const host of hosts) {
    for (const kind of ["cpanel", "basic"]) {
      const found = await tryUsers(host, 2083, kind, "/execute/DomainInfo/list_domains", users);
      if (found.session) return found.session;
      if (found.down) break;
    }
  }
  for (const host of hosts) {
    const found = await tryUsers(host, 2087, "whm", "/json-api/version?api.version=1", users);
    if (!found.session) continue;
    const session = found.session;
    const listed = await call(
      `https://${host}:2087/json-api/listaccts?api.version=1&searchtype=domain&search=${site}`,
      authHeaders("whm", session.user),
    );
    note(`listaccts HTTP ${listed.status} ${snippet(listed.text)}`);
    session.accountUser = listed.text.match(/"user"\s*:\s*"([a-z0-9_]+)"/)?.[1] || session.user;
    if (!listed.text.includes(site) && session.accountUser === session.user) {
      note("WHM_SIN_ESTE_DOMINIO");
      continue;
    }
    return session;
  }
  return null;
}

async function pointSubdomain(session, name) {
  const domain = `${name}.${site}`;
  const changed = await uapi(
    session,
    `/execute/SubDomain/changedocroot?domain=${encodeURIComponent(domain)}&docroot=${encodeURIComponent(docroot)}`,
  );
  if (succeeded(changed)) return;
  const created = await uapi(
    session,
    `/execute/SubDomain/addsubdomain?domain=${name}&rootdomain=${site}&dir=${encodeURIComponent(docroot)}`,
  );
  if (succeeded(created) || /already exists|ya existe/i.test(created.text)) {
    await uapi(
      session,
      `/execute/SubDomain/changedocroot?domain=${encodeURIComponent(domain)}&docroot=${encodeURIComponent(docroot)}`,
    );
  }
}

async function main() {
  const discovered = await discoverUsers();
  if (discovered.length) note(`usuarios_en_pagina=${discovered.join(",")}`);
  const preferred = (process.env.CPANEL_USER || "").split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  const users = [...new Set([...discovered, ...preferred, ...fallbackUsers])];

  if (!token) {
    note("SIN_TOKEN");
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${lines.join("\n")}\n`);
    return;
  }

  const session = await findSession(users);
  if (!session) {
    note("API_NO_ENTRO");
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${lines.join("\n")}\n`);
    process.exitCode = 1;
    return;
  }

  note(`SESION ${session.kind} ${session.user} cuenta ${session.accountUser} ${session.host}:${session.port}`);
  const domains = await uapi(session, "/execute/DomainInfo/list_domains");
  describe(domains.text);
  const roots = await uapi(session, "/execute/DomainInfo/domains_data");
  describe(roots.text);
  await uapi(session, `/execute/Fileman/list_files?dir=${encodeURIComponent(docroot)}&limit=8`);
  await pointSubdomain(session, "tree");
  await pointSubdomain(session, "arbol");

  const route = encodeURIComponent(treeRoute);
  await peek(`https://tree.${site}/`);
  await peek(`https://tree.${site}/index.php?route=${route}`);
  await peek(`https://arbol.${site}/`);
  await peek(`https://arbol.${site}/index.php?route=${route}`);
  await peek(`https://${site}/sefarad-mx/index.php?route=${route}`);

  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${lines.join("\n")}\n`);
}

await main();
