export const APEX_ORIGIN = "https://genealogiasefardi.site";
export const TREE_SUBDOMAIN = "tree.genealogiasefardi.site";
export const ARBOL_ORIGIN = "https://arbol.genealogiasefardi.site";
export const SEFARAD_ROUTE = "/sefarad-mx/tree/sefarad";
export const SEFARAD_TREE_URL = `${APEX_ORIGIN}/sefarad-mx/index.php?route=${encodeURIComponent(SEFARAD_ROUTE)}`;
export const ARBOL_TREE_URL = `${ARBOL_ORIGIN}/index.php?route=${encodeURIComponent(SEFARAD_ROUTE)}`;
export const SEFARAD_DIR = "public_html/sefarad-mx";

function textOf(query) {
  return [query.givenName, query.surname, query.place, query.year].filter(Boolean).join(" ");
}

export function sourceLinks(query = {}) {
  const givenName = query.givenName || "";
  const surname = query.surname || "";
  const place = query.place || "";
  const year = query.year || "";
  const text = textOf({ givenName, surname, place, year });
  const familySearch = new URL("https://www.familysearch.org/search/record/results");
  if (givenName) familySearch.searchParams.set("q.givenName", givenName);
  if (surname) familySearch.searchParams.set("q.surname", surname);
  if (place) familySearch.searchParams.set("q.anyPlace", place);
  if (year) familySearch.searchParams.set("q.birthLikeDate.from", year);

  const wikiTree = new URL("https://www.wikitree.com/wiki/Special:SearchPerson");
  if (givenName) wikiTree.searchParams.set("g", givenName);
  if (surname) wikiTree.searchParams.set("s", surname);
  if (place) wikiTree.searchParams.set("b", place);

  const viaf = new URL("https://viaf.org/viaf/search");
  viaf.searchParams.set("query", `local.personalNames all "${text || surname || "sefardi"}"`);

  return [
    { id: "sefarad", label: "Árbol Sefarad", href: ARBOL_TREE_URL },
    { id: "familysearch", label: "FamilySearch", href: familySearch.toString() },
    {
      id: "inegi",
      label: "INEGI censos",
      href: `https://datos.gob.mx/busca/dataset?q=${encodeURIComponent(`censo población ${place || "México"}`)}`,
    },
    {
      id: "ahn",
      label: "Archivo Histórico Nacional",
      href: `https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=${encodeURIComponent(`${text} Archivo Histórico Nacional`.trim())}`,
    },
    {
      id: "agi",
      label: "Archivo General de Indias",
      href: `https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=${encodeURIComponent(`${text} Archivo General de Indias`.trim())}`,
    },
    {
      id: "historypin",
      label: "Historypin",
      href: `https://www.historypin.org/en/search?q=${encodeURIComponent(place || text || "sefardi")}`,
    },
    { id: "wikitree", label: "WikiTree", href: wikiTree.toString() },
    { id: "viaf", label: "VIAF", href: viaf.toString() },
  ];
}
