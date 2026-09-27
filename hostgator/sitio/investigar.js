const estados = {
  "01": "Aguascalientes",
  "02": "Baja California",
  "03": "Baja California Sur",
  "04": "Campeche",
  "05": "Coahuila de Zaragoza",
  "06": "Colima",
  "07": "Chiapas",
  "08": "Chihuahua",
  "09": "Ciudad de México",
  "10": "Durango",
  "11": "Guanajuato",
  "12": "Guerrero",
  "13": "Hidalgo",
  "14": "Jalisco",
  "15": "México",
  "16": "Michoacán de Ocampo",
  "17": "Morelos",
  "18": "Nayarit",
  "19": "Nuevo León",
  "20": "Oaxaca",
  "21": "Puebla",
  "22": "Querétaro",
  "23": "Quintana Roo",
  "24": "San Luis Potosí",
  "25": "Sinaloa",
  "26": "Sonora",
  "27": "Tabasco",
  "28": "Tamaulipas",
  "29": "Tlaxcala",
  "30": "Veracruz de Ignacio de la Llave",
  "31": "Yucatán",
  "32": "Zacatecas"
};

const aniosCenso = ["1895", "1900", "1910", "1921", "1930", "1940", "1950", "1960", "1970", "1980", "1990", "1995", "2000", "2005", "2010", "2020"];
const arbol = "https://arbol.genealogiasefardi.site/index.php?route=%2Fsefarad-mx%2Ftree%2Fsefarad";

function valor(id) {
  return document.querySelector(id)?.value.trim() || "";
}

function lugarConsulta() {
  return valor("#lugar") || valor("#municipio");
}

function textoConsulta() {
  return [valor("#nombre"), valor("#apellido"), lugarConsulta(), valor("#ano")].filter(Boolean).join(" ");
}

function poner(id, href, externo) {
  const enlace = document.querySelector(id);
  if (!enlace) return;
  enlace.href = href;
  if (externo) {
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
  }
}

function familySearch(anio) {
  const url = new URL("https://www.familysearch.org/search/record/results");
  const nombre = valor("#nombre");
  const apellido = valor("#apellido");
  const lugar = lugarConsulta();
  const fecha = anio || valor("#ano");
  if (nombre) url.searchParams.set("q.givenName", nombre);
  if (apellido) url.searchParams.set("q.surname", apellido);
  if (lugar) url.searchParams.set("q.anyPlace", lugar);
  if (fecha) url.searchParams.set("q.birthLikeDate.from", fecha);
  if (fecha === "1930") url.searchParams.set("f.collectionId", "1307314");
  if (!nombre && !apellido && !lugar) url.searchParams.set("q.any", "sefardi");
  return url.toString();
}

function pintarFuentes() {
  const lugar = lugarConsulta();
  const texto = textoConsulta() || "sefardi";
  const archivo = new URL("/search", location.origin);
  if (textoConsulta()) archivo.searchParams.set("q", textoConsulta());
  poner("#fuente-archivo", archivo.pathname + archivo.search, false);
  poner("#fuente-familysearch", familySearch(), true);
  poner("#fuente-ahn", "https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=" + encodeURIComponent(texto + " Archivo Histórico Nacional"), true);
  poner("#fuente-agi", "https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=" + encodeURIComponent(texto + " Archivo General de Indias"), true);
  poner("#fuente-historypin", "https://www.historypin.org/en/search?q=" + encodeURIComponent(lugar || texto), true);
  const wiki = new URL("https://www.wikitree.com/wiki/Special:SearchPerson");
  if (valor("#nombre")) wiki.searchParams.set("g", valor("#nombre"));
  if (valor("#apellido")) wiki.searchParams.set("s", valor("#apellido"));
  if (lugar) wiki.searchParams.set("b", lugar);
  poner("#fuente-wikitree", wiki.toString(), true);
  const viaf = new URL("https://viaf.org/viaf/search");
  viaf.searchParams.set("query", 'local.personalNames all "' + texto + '"');
  poner("#fuente-viaf", viaf.toString(), true);
  poner("#fuente-arbol", arbol, true);
  const inegi = document.querySelector("#fuente-inegi");
  if (inegi) inegi.href = "#censos";
}

function pintarAnios(ficha) {
  const caja = document.querySelector("#anios-censo");
  if (!caja) return;
  const lugar = lugarConsulta();
  caja.replaceChildren();
  for (const anio of aniosCenso) {
    const enlace = document.createElement("a");
    enlace.href = anio === "1930" && lugar ? familySearch("1930") : "https://www.inegi.org.mx/programas/ccpv/" + anio + "/";
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = anio === "1930" ? "1930 · imágenes" : anio;
    caja.appendChild(enlace);
  }
  if (ficha) pintarFicha(ficha);
}

function pintarFicha(ficha) {
  const marco = document.querySelector("#ficha-censo");
  const meta = document.querySelector("#ficha-meta");
  const estado = estados[ficha.entidad] || "";
  const lugar = [ficha.cabecera || ficha.nombre, ficha.nombre, estado, "México"].filter(Boolean).join(", ");
  const municipio = document.querySelector("#municipio");
  const campoLugar = document.querySelector("#lugar");
  if (municipio) municipio.value = ficha.nombre || municipio.value;
  if (campoLugar) campoLugar.value = lugar;
  if (meta) {
    const poblacion = ficha.poblacion ? Number(ficha.poblacion).toLocaleString("es-MX") : "sin cifra publicada";
    meta.textContent = ficha.nombre + (estado ? ", " + estado : "") + ". Cabecera: " + (ficha.cabecera || "la misma") + ". Población del último censo publicado por el INEGI: " + poblacion + ".";
  }
  if (marco && ficha.ficha) {
    marco.src = "/censo.php?accion=ficha&cve=" + encodeURIComponent(ficha.ficha);
  }
  const imagen = document.querySelector("#imagen-familysearch");
  if (imagen) {
    imagen.href = familySearch("1930");
    imagen.hidden = false;
  }
  pintarFuentes();
  pintarAnios(null);
}

async function elegirMunicipio(cve) {
  const respuesta = await fetch("/censo.php?accion=municipio&cve=" + encodeURIComponent(cve));
  if (!respuesta.ok) return;
  const ficha = await respuesta.json();
  if (!ficha.ficha) return;
  pintarFicha(ficha);
}

let reloj = 0;
async function buscarMunicipios() {
  const q = valor("#municipio");
  const lista = document.querySelector("#lista-municipios");
  if (!lista) return;
  if (q.length < 2) {
    lista.replaceChildren();
    return;
  }
  const respuesta = await fetch("/censo.php?accion=municipios&q=" + encodeURIComponent(q));
  const data = await respuesta.json();
  lista.replaceChildren();
  for (const municipio of data.municipios || []) {
    const boton = document.createElement("button");
    boton.type = "button";
    const estado = estados[municipio.entidad] || "";
    boton.textContent = municipio.nombre + (estado ? " · " + estado : "");
    boton.addEventListener("click", () => elegirMunicipio(municipio.cvegeo));
    lista.appendChild(boton);
  }
  if (!(data.municipios || []).length) {
    const vacio = document.createElement("p");
    vacio.textContent = "No hay un municipio del INEGI con ese nombre.";
    lista.appendChild(vacio);
  }
}

function iniciar() {
  const raiz = document.querySelector("#investigar");
  if (!raiz) return;
  pintarFuentes();
  pintarAnios(null);
  for (const id of ["#nombre", "#apellido", "#lugar", "#ano"]) {
    document.querySelector(id)?.addEventListener("input", pintarFuentes);
  }
  document.querySelector("#municipio")?.addEventListener("input", () => {
    pintarFuentes();
    clearTimeout(reloj);
    reloj = setTimeout(buscarMunicipios, 280);
  });
  document.querySelector("#investigar")?.addEventListener("submit", (event) => {
    if (event.target.id !== "busqueda-viva") return;
    event.preventDefault();
    pintarFuentes();
    consultar();
  });
}

function linea(texto) {
  return texto ? " · " + texto : "";
}

function pintarResultados(data) {
  const caja = document.querySelector("#resultados");
  if (!caja) return;
  caja.replaceChildren();
  const resumen = document.createElement("p");
  resumen.textContent = "Los servidores contestaron con " + (data.conectadas || 0) + " fuentes para «" + (data.consulta || "esta consulta") + "».";
  caja.appendChild(resumen);
  if (data.inegi) {
    const ficha = data.inegi;
    const estado = estados[ficha.entidad] || "";
    const bloque = document.createElement("article");
    const titulo = document.createElement("h3");
    titulo.textContent = "INEGI · " + ficha.nombre + (estado ? ", " + estado : "");
    bloque.appendChild(titulo);
    const cifras = document.createElement("p");
    const poblacion = ficha.poblacion ? Number(ficha.poblacion).toLocaleString("es-MX") : "sin cifra";
    const hombres = ficha.hombres ? Number(ficha.hombres).toLocaleString("es-MX") : "—";
    const mujeres = ficha.mujeres ? Number(ficha.mujeres).toLocaleString("es-MX") : "—";
    const viviendas = ficha.viviendas ? Number(ficha.viviendas).toLocaleString("es-MX") : "—";
    cifras.textContent = "Población " + poblacion + ". Hombres " + hombres + ". Mujeres " + mujeres + ". Viviendas habitadas " + viviendas + ". Estas cifras las devolvió el catálogo del INEGI.";
    bloque.appendChild(cifras);
    caja.appendChild(bloque);
    const municipio = document.querySelector("#municipio");
    if (municipio) municipio.value = ficha.nombre;
    pintarFicha({
      entidad: ficha.entidad,
      nombre: ficha.nombre,
      cabecera: ficha.nombre,
      poblacion: ficha.poblacion,
      ficha: ficha.ficha
    });
  }
  for (const fuente of data.fuentes || []) {
    const bloque = document.createElement("article");
    const titulo = document.createElement("h3");
    titulo.textContent = fuente.nombre;
    bloque.appendChild(titulo);
    if (!fuente.registros || !fuente.registros.length) {
      const vacio = document.createElement("p");
      vacio.textContent = fuente.ok ? "Ese servidor contestó y no trajo fichas para esta consulta." : "Ese servidor no contestó en esta consulta.";
      bloque.appendChild(vacio);
    } else {
      const lista = document.createElement("ul");
      for (const registro of fuente.registros) {
        const item = document.createElement("li");
        const fuerte = document.createElement("strong");
        fuerte.textContent = registro.titulo;
        item.appendChild(fuerte);
        const extra = document.createElement("span");
        extra.textContent = linea(registro.fecha) + linea(registro.lugar);
        item.appendChild(extra);
        if (registro.detalle) {
          const detalle = document.createElement("p");
          detalle.textContent = registro.detalle;
          item.appendChild(detalle);
        }
        lista.appendChild(item);
      }
      bloque.appendChild(lista);
    }
    caja.appendChild(bloque);
  }
}

async function consultar() {
  const caja = document.querySelector("#resultados");
  if (caja) caja.textContent = "Consultando los servidores…";
  const url = new URL("/consulta.php", location.origin);
  const nombre = valor("#nombre");
  const apellido = valor("#apellido");
  const lugar = lugarConsulta();
  if (nombre) url.searchParams.set("nombre", nombre);
  if (apellido) url.searchParams.set("apellido", apellido);
  if (lugar) url.searchParams.set("lugar", lugar);
  const respuesta = await fetch(url);
  const data = await respuesta.json();
  pintarResultados(data);
}

iniciar();
