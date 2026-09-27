import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const token = process.env.CPANEL_TOKEN || "";
const user = process.env.CPANEL_USER || "nuevaexp";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const statePath = path.join(root, "hostgator", "estado.txt");
const hosts = ["genealogiasefardi.site", "mx18.hostgator.mx"];
const lines = [`fecha=${new Date().toISOString()}`, `usuario=${user}`];

function redact(text) {
  return token ? String(text).split(token).join("[redacted]") : String(text);
}

function note(line) {
  const clean = redact(line).slice(0, 500);
  lines.push(clean);
  console.log(clean);
}

async function cpanel(host, apiPath, { method = "GET", body = "" } = {}) {
  const response = await fetch(`https://${host}:2083${apiPath}`, {
    method,
    headers: {
      Authorization: `cpanel ${user}:${token}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body || undefined,
    signal: AbortSignal.timeout(25000),
  });
  const text = await response.text();
  return { status: response.status, text };
}

function domainRows(payload) {
  const data = payload?.data ?? payload?.result?.data ?? [];
  return Array.isArray(data) ? data : [];
}

async function main() {
  if (!token) {
    note("SIN_TOKEN");
    fs.writeFileSync(statePath, `${lines.join("\n")}\n`);
    return;
  }

  let session = null;
  for (const host of hosts) {
    try {
      const response = await cpanel(host, "/execute/DomainInfo/domains_data");
      note(`${host} dominios HTTP ${response.status}`);
      if (response.status === 200 && response.text.includes("genealogiasefardi")) {
        session = { host, payload: JSON.parse(response.text) };
        break;
      }
      if (response.status === 200) {
        session = { host, payload: JSON.parse(response.text) };
        note(`${host} entro pero no lista genealogiasefardi.site en el primer vistazo`);
        break;
      }
      note(`${host} respuesta ${redact(response.text).slice(0, 180)}`);
    } catch (error) {
      note(`${host} sin conexion ${error.name}`);
    }
  }

  if (!session) {
    note("API_NO_ENTRO");
    fs.writeFileSync(statePath, `${lines.join("\n")}\n`);
    process.exitCode = 1;
    return;
  }

  const rows = domainRows(session.payload);
  const site = rows.find((row) => row.domain === "genealogiasefardi.site");
  for (const row of rows) {
    note(`dominio ${row.domain || row.servername || "?"} raiz ${row.documentroot || row.docroot || ""}`);
  }
  const docroot = site?.documentroot || site?.docroot || "";
  if (!site) {
    note("LA_CUENTA_NO_TIENE_genealogiasefardi.site");
  }

  const created = await cpanel(
    session.host,
    "/execute/SubDomain/addsubdomain?domain=tree&rootdomain=genealogiasefardi.site&dir=public_html/sefarad-mx",
  );
  note(`subdominio HTTP ${created.status} ${redact(created.text).slice(0, 240)}`);

  if (docroot) {
    const index = fs.readFileSync(path.join(root, "hostgator/public_html/index.html"));
    const css = fs.readFileSync(path.join(root, "hostgator/public_html/estilos.css"));
    for (const [file, bytes] of [["index.html", index], ["estilos.css", css]]) {
      const body = new URLSearchParams({
        dir: docroot,
        file,
        content: bytes.toString("utf8"),
      });
      const saved = await cpanel(session.host, "/execute/Fileman/save_file_content", {
        method: "POST",
        body,
      });
      note(`archivo ${file} HTTP ${saved.status} ${redact(saved.text).slice(0, 160)}`);
    }
  }

  fs.writeFileSync(statePath, `${lines.join("\n")}\n`);
}

await main();
