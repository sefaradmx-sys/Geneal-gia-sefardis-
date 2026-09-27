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

function valor(id) {
  return document.querySelector(id)?.value.trim() || "";
}

function lugarConsulta() {
  return valor("#lugar") || valor("#municipio");
}

function pintarFicha(ficha) {
  const marco = document.querySelector("#ficha-censo");
  const meta = document.querySelector("#ficha-meta");
  const estado = estados[ficha.entidad] || "";
  const lugar = [ficha.nombre, estado].filter(Boolean).join(", ");
  const municipio = document.querySelector("#municipio");
  const campoLugar = document.querySelector("#lugar");
  if (municipio && ficha.nombre) municipio.value = ficha.nombre;
  if (campoLugar && lugar) campoLugar.value = lugar;
  if (meta) {
    const poblacion = ficha.poblacion ? Number(ficha.poblacion).toLocaleString("es-MX") + " habitantes" : "";
    const hombres = ficha.hombres ? Number(ficha.hombres).toLocaleString("es-MX") + " hombres" : "";
    const mujeres = ficha.mujeres ? Number(ficha.mujeres).toLocaleString("es-MX") + " mujeres" : "";
    const viviendas = ficha.viviendas ? Number(ficha.viviendas).toLocaleString("es-MX") + " viviendas" : "";
    meta.textContent = [lugar, poblacion, hombres, mujeres, viviendas].filter(Boolean).join(". ") + ".";
  }
  if (marco && ficha.ficha) {
    marco.src = "/censo.php?accion=ficha&cve=" + encodeURIComponent(ficha.ficha);
    marco.classList.add("visible");
  }
}

async function elegirMunicipio(cve) {
  const respuesta = await fetch("/censo.php?accion=municipio&cve=" + encodeURIComponent(cve));
  if (!respuesta.ok) return;
  const ficha = await respuesta.json();
  if (!ficha.ficha) return;
  pintarFicha(ficha);
  consultar();
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
    boton.textContent = municipio.nombre + (estado ? ", " + estado : "");
    boton.addEventListener("click", () => elegirMunicipio(municipio.cvegeo));
    lista.appendChild(boton);
  }
}

function linea(texto) {
  return texto ? " · " + texto : "";
}

function listaDe(registros) {
  const lista = document.createElement("ul");
  for (const registro of registros) {
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
  return lista;
}

function bloque(titulo, registros) {
  if (!registros.length) return null;
  const article = document.createElement("article");
  const encabezado = document.createElement("h3");
  encabezado.textContent = titulo;
  article.appendChild(encabezado);
  article.appendChild(listaDe(registros));
  return article;
}

function pintarSaltillo(registros) {
  if (!registros || !registros.length) return null;
  const article = document.createElement("article");
  const encabezado = document.createElement("h3");
  encabezado.textContent = "Archivo Municipal de Saltillo";
  article.appendChild(encabezado);
  const lista = document.createElement("ul");
  for (const registro of registros) {
    const item = document.createElement("li");
    const fuerte = document.createElement("strong");
    fuerte.textContent = registro.tipo || "Expediente";
    item.appendChild(fuerte);
    if (registro.descripcion) {
      const texto = document.createElement("p");
      texto.textContent = registro.descripcion;
      item.appendChild(texto);
    }
    if (registro.lugar_fecha) {
      const cuando = document.createElement("p");
      cuando.textContent = registro.lugar_fecha;
      item.appendChild(cuando);
    }
    if (registro.referencia) {
      const ref = document.createElement("p");
      ref.textContent = registro.referencia;
      item.appendChild(ref);
    }
    lista.appendChild(item);
  }
  article.appendChild(lista);
  return article;
}

function pintarResultados(data, saltillo) {
  const caja = document.querySelector("#resultados");
  if (!caja) return;
  caja.replaceChildren();
  const archivo = pintarSaltillo(saltillo);
  if (archivo) caja.appendChild(archivo);
  if (data.inegi) {
    pintarFicha(data.inegi);
  }
  const personas = [];
  const documentos = [];
  const lugares = [];
  for (const fuente of data.fuentes || []) {
    const registros = fuente.registros || [];
    if (fuente.id === "mapa") lugares.push(...registros);
    else if (fuente.id === "loc" || fuente.id === "nara" || fuente.id === "datos") documentos.push(...registros);
    else personas.push(...registros);
  }
  for (const parte of [bloque("Personas", personas), bloque("Documentos", documentos), bloque("Lugares", lugares)]) {
    if (parte) caja.appendChild(parte);
  }
  if (!caja.childElementCount) {
    const vacio = document.createElement("p");
    vacio.textContent = "No hay fichas con esos datos.";
    caja.appendChild(vacio);
  }
}

async function consultar() {
  const caja = document.querySelector("#resultados");
  const nombre = valor("#nombre");
  const apellido = valor("#apellido");
  const lugar = lugarConsulta();
  if (!nombre && !apellido && !lugar) return;
  if (caja) caja.textContent = "Buscando…";
  const url = new URL("/consulta.php", location.origin);
  const archivo = new URL("/saltillo.php", location.origin);
  const ano = valor("#ano");
  if (nombre) {
    url.searchParams.set("nombre", nombre);
    archivo.searchParams.set("nombre", nombre);
  }
  if (apellido) {
    url.searchParams.set("apellido", apellido);
    archivo.searchParams.set("apellido", apellido);
  }
  if (lugar) {
    url.searchParams.set("lugar", lugar);
    archivo.searchParams.set("lugar", lugar);
  }
  if (ano) archivo.searchParams.set("ano", ano);
  const [respuesta, saltilloRespuesta] = await Promise.all([fetch(url), fetch(archivo)]);
  const data = await respuesta.json();
  const saltillo = await saltilloRespuesta.json();
  pintarResultados(data, saltillo.registros || []);
}

function iniciar() {
  const raiz = document.querySelector("#investigar");
  if (!raiz) return;
  document.querySelector("#municipio")?.addEventListener("input", () => {
    clearTimeout(reloj);
    reloj = setTimeout(buscarMunicipios, 280);
  });
  document.querySelector("#busqueda-viva")?.addEventListener("submit", (event) => {
    event.preventDefault();
    consultar();
  });
}

iniciar();
