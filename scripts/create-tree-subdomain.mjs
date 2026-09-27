const host = process.env.CPANEL_HOST || "genealogiasefardi.site";
const user = process.env.CPANEL_USER || "";
const token = process.env.CPANEL_TOKEN || "";
const port = process.env.CPANEL_PORT || "2083";
const subdomain = "tree";
const rootdomain = "genealogiasefardi.site";
const dir = process.env.CPANEL_SUBDOMAIN_DIR || "public_html/sefarad-mx";

if (!user || !token) {
  console.error("Faltan CPANEL_USER y CPANEL_TOKEN. genealogiasefardi.site está en HostGator (ns18.hostgator.mx y ns19.hostgator.mx). El árbol ya vive en public_html/sefarad-mx. Sin el token de cPanel no se puede crear tree.genealogiasefardi.site ni asignarle esa carpeta.");
  process.exit(2);
}

const url = new URL(`https://${host}:${port}/execute/SubDomain/addsubdomain`);
url.searchParams.set("domain", subdomain);
url.searchParams.set("rootdomain", rootdomain);
url.searchParams.set("dir", dir);

const response = await fetch(url, {
  headers: { Authorization: `cpanel ${user}:${token}` },
});
const body = await response.text();
console.log(response.status);
console.log(body.slice(0, 2000));
if (!response.ok) process.exit(1);
