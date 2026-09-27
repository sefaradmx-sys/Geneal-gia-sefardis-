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
  return valor("#lugar");
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

function dato(etiqueta, valor) {
  if (!valor) return null;
  const fila = document.createElement("div");
  const nombre = document.createElement("dt");
  nombre.textContent = etiqueta;
  const contenido = document.createElement("dd");
  contenido.textContent = valor;
  fila.append(nombre, contenido);
  return fila;
}

function oracion(registro) {
  const cuando = (registro.lugar_fecha || "la fecha que consta en el expediente").replace(/\.$/, "");
  const expediente = registro.expediente
    ? "el expediente " + registro.expediente
    : "la referencia " + (registro.referencia || "que consta en esta certificación");
  const tipo = registro.tipo || "documento";
  return "Genealogía Sefardí y Sefarad MX certifican que en " + cuando + ", en " + expediente + " del Archivo principal de Sefarad, se encuentra el documento " + tipo + ", con la información siguiente.";
}

async function generarPdf(registro, boton) {
  boton.disabled = true;
  boton.textContent = "Generando…";
  const url = new URL("/certificado.php", location.origin);
  url.searchParams.set("id", String(registro.id));
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    boton.disabled = false;
    boton.textContent = "Generar PDF";
    return;
  }
  const archivo = await respuesta.blob();
  const enlace = document.createElement("a");
  const caja = registro.caja ? "caja-" + registro.caja : "expediente";
  const pieza = registro.expediente ? "-expediente-" + registro.expediente : "";
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = ("Sefarad-MX-" + caja + pieza + ".pdf").replace(/\s+/g, "-");
  enlace.click();
  URL.revokeObjectURL(enlace.href);
  boton.disabled = false;
  boton.textContent = "Generar PDF";
}

function certificado(registro) {
  const article = document.createElement("article");
  article.className = "certificado";

  const marca = document.createElement("p");
  marca.className = "cert-marca";
  marca.textContent = "Genealogía Sefardí";
  const sub = document.createElement("p");
  sub.className = "cert-sub";
  sub.textContent = "Sefarad MX";
  const titulo = document.createElement("h3");
  titulo.textContent = "Certificación";
  const texto = document.createElement("p");
  texto.className = "cert-texto";
  texto.textContent = oracion(registro);

  article.append(marca, sub, titulo, texto);

  if (registro.descripcion) {
    const info = document.createElement("p");
    info.className = "cert-info";
    info.textContent = registro.descripcion;
    article.appendChild(info);
  }

  const ficha = document.createElement("dl");
  ficha.className = "cert-datos";
  for (const fila of [
    dato("Lugar y fecha", registro.lugar_fecha),
    dato("Caja", registro.caja),
    dato("Expediente", registro.expediente),
    dato("Documento", registro.documento),
    dato("Fojas", registro.fojas ? String(registro.fojas) : ""),
    dato("Referencia", registro.referencia),
  ]) {
    if (fila) ficha.appendChild(fila);
  }
  article.appendChild(ficha);

  const leyenda = document.createElement("p");
  leyenda.className = "cert-leyenda";
  leyenda.textContent = "Información Consultada de la Plataforma Sefarad MX. Ante Mí Consta y Doy Fe.";
  const firma = document.createElement("div");
  firma.className = "cert-firma";
  const lineaFirma = document.createElement("span");
  lineaFirma.className = "cert-linea";
  const nombre = document.createElement("strong");
  nombre.textContent = "Lic. Francisco Javier García Gaona";
  const cargo = document.createElement("span");
  cargo.textContent = "Fundador de Sefarad MX";
  firma.append(lineaFirma, nombre, cargo);

  const tramite = document.createElement("div");
  tramite.className = "cert-tramite";
  const tituloTramite = document.createElement("p");
  tituloTramite.className = "cert-tramite-titulo";
  tituloTramite.textContent = "Tramitar documentos certificados ante el archivo";
  const aviso = document.createElement("p");
  aviso.textContent = "No puedes venir hasta el archivo de Saltillo, no te preocupes, nosotros lo tramitamos por ti y te lo enviamos.";
  const contacto = document.createElement("p");
  const enlace = document.createElement("a");
  enlace.href = "tel:+528442195952";
  enlace.textContent = "+52 844 219 5952";
  contacto.append("Contáctanos ", enlace);
  tramite.append(tituloTramite, aviso, contacto);

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "no-imprimir";
  boton.textContent = "Generar PDF";
  boton.addEventListener("click", () => generarPdf(registro, boton));

  article.append(leyenda, firma, tramite, boton);
  return article;
}

function pintarSaltillo(registros) {
  if (!registros || !registros.length) return null;
  const seccion = document.createElement("section");
  seccion.className = "certificados";
  const encabezado = document.createElement("h2");
  encabezado.className = "no-imprimir";
  encabezado.textContent = "Archivo principal de Sefarad";
  seccion.appendChild(encabezado);
  for (const registro of registros) seccion.appendChild(certificado(registro));
  return seccion;
}

function pintarArchivo(registros) {
  const caja = document.querySelector("#resultados-archivo");
  if (!caja) return;
  caja.replaceChildren();
  const archivo = pintarSaltillo(registros);
  if (archivo) {
    caja.appendChild(archivo);
    return;
  }
  const vacio = document.createElement("p");
  vacio.textContent = "No hay expedientes con esos datos en el Archivo Histórico de Saltillo.";
  caja.appendChild(vacio);
}

function pintarGeneral(data) {
  const caja = document.querySelector("#resultados-general");
  if (!caja) return;
  caja.replaceChildren();
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

async function buscarArchivo() {
  const caja = document.querySelector("#resultados-archivo");
  const nombre = valor("#nombre-archivo");
  const apellido = valor("#apellido-archivo");
  if (!nombre && !apellido) return;
  if (caja) caja.textContent = "Buscando…";
  const archivo = new URL("/saltillo.php", location.origin);
  if (nombre) archivo.searchParams.set("nombre", nombre);
  if (apellido) archivo.searchParams.set("apellido", apellido);
  const respuesta = await fetch(archivo);
  const saltillo = respuesta.ok ? await respuesta.json() : { registros: [] };
  pintarArchivo(saltillo.registros || []);
}

async function buscarGeneral() {
  const caja = document.querySelector("#resultados-general");
  const nombre = valor("#nombre");
  const apellido = valor("#apellido");
  const lugar = lugarConsulta();
  const ano = valor("#ano");
  if (!nombre && !apellido && !lugar && !ano) return;
  if (caja) caja.textContent = "Buscando…";
  const url = new URL("/consulta.php", location.origin);
  if (nombre) url.searchParams.set("nombre", nombre);
  if (apellido) url.searchParams.set("apellido", apellido);
  if (lugar) url.searchParams.set("lugar", lugar);
  if (ano) url.searchParams.set("ano", ano);
  const respuesta = await fetch(url);
  const data = respuesta.ok ? await respuesta.json() : { fuentes: [] };
  pintarGeneral(data);
}

function iniciar() {
  const raiz = document.querySelector("#investigar");
  if (!raiz) return;
  document.querySelector("#municipio")?.addEventListener("input", () => {
    clearTimeout(reloj);
    reloj = setTimeout(buscarMunicipios, 280);
  });
  document.querySelector("#busqueda-archivo")?.addEventListener("submit", (event) => {
    event.preventDefault();
    buscarArchivo();
  });
  document.querySelector("#busqueda-general")?.addEventListener("submit", (event) => {
    event.preventDefault();
    buscarGeneral();
  });
}

iniciar();
