const form = document.querySelector("#busqueda-principal");
if (form) {
  const fields = () => ({
    nombre: form.nombre.value.trim(),
    apellido: form.apellido.value.trim(),
    lugar: form.lugar.value.trim(),
    ano: form.ano.value.trim(),
  });

  const textOf = (values) => [values.nombre, values.apellido, values.lugar, values.ano].filter(Boolean).join(" ");

  const urls = {
    sefarad() {
      return "https://arbol.genealogiasefardi.site/index.php?route=%2Fsefarad-mx%2Ftree%2Fsefarad";
    },
    familysearch(values) {
      const url = new URL("https://www.familysearch.org/search/record/results");
      if (values.nombre) url.searchParams.set("q.givenName", values.nombre);
      if (values.apellido) url.searchParams.set("q.surname", values.apellido);
      if (values.lugar) url.searchParams.set("q.anyPlace", values.lugar);
      if (values.ano) url.searchParams.set("q.birthLikeDate.from", values.ano);
      return url.toString();
    },
    inegi(values) {
      const place = values.lugar || "México";
      return `https://datos.gob.mx/busca/dataset?q=${encodeURIComponent(`censo población ${place}`)}`;
    },
    ahn(values) {
      return `https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=${encodeURIComponent(`${textOf(values)} Archivo Histórico Nacional`.trim())}`;
    },
    agi(values) {
      return `https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=${encodeURIComponent(`${textOf(values)} Archivo General de Indias`.trim())}`;
    },
    historypin(values) {
      return `https://www.historypin.org/en/search?q=${encodeURIComponent(values.lugar || textOf(values) || "sefardi")}`;
    },
    wikitree(values) {
      const url = new URL("https://www.wikitree.com/wiki/Special:SearchPerson");
      if (values.nombre) url.searchParams.set("g", values.nombre);
      if (values.apellido) url.searchParams.set("s", values.apellido);
      if (values.lugar) url.searchParams.set("b", values.lugar);
      return url.toString();
    },
    viaf(values) {
      const url = new URL("https://viaf.org/viaf/search");
      url.searchParams.set("query", `local.personalNames all "${textOf(values) || "sefardi"}"`);
      return url.toString();
    },
  };

  const refresh = () => {
    const values = fields();
    for (const link of document.querySelectorAll("[data-fuente]")) {
      const build = urls[link.dataset.fuente];
      if (build) link.href = build(values);
    }
  };

  form.addEventListener("input", refresh);
  refresh();
}
