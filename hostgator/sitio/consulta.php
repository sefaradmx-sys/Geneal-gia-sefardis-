<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function campo(string $clave): string
{
    $valor = trim((string) ($_GET[$clave] ?? ''));
    $valor = preg_replace('/[^\p{L}\p{N} .,\-]/u', '', $valor) ?? '';
    return mb_substr($valor, 0, 80);
}

function sparql(string $texto): string
{
    return str_replace(['\\', '"'], ['\\\\', '\\"'], $texto);
}

function jsonDe(string $cuerpo): array
{
    $data = json_decode($cuerpo, true);
    return is_array($data) ? $data : [];
}

function tituloEn(array $nodo, int $profundidad = 0): string
{
    if ($profundidad > 5) {
        return '';
    }
    if (isset($nodo['title']) && is_string($nodo['title']) && $nodo['title'] !== '') {
        return $nodo['title'];
    }
    foreach ($nodo as $valor) {
        if (is_array($valor)) {
            $hallado = tituloEn($valor, $profundidad + 1);
            if ($hallado !== '') {
                return $hallado;
            }
        }
    }
    return '';
}

function una(array $tarea): array
{
    $curl = curl_init($tarea['url']);
    $opciones = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 2,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_ENCODING => '',
        CURLOPT_USERAGENT => 'GenealogiaSefardi/1.0',
        CURLOPT_HTTPHEADER => $tarea['encabezados'] ?? ['Accept: application/json'],
    ];
    if (($tarea['metodo'] ?? 'GET') === 'POST') {
        $opciones[CURLOPT_POST] = true;
        $opciones[CURLOPT_POSTFIELDS] = $tarea['cuerpo'] ?? '';
    }
    curl_setopt_array($curl, $opciones);
    $cuerpo = curl_exec($curl);
    $codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    return [
        'ok' => is_string($cuerpo) && $codigo >= 200 && $codigo < 300,
        'cuerpo' => is_string($cuerpo) ? substr($cuerpo, 0, 250000) : '',
    ];
}

function pedir(array $tareas): array
{
    if ($tareas === []) {
        return [];
    }
    if (!function_exists('curl_multi_init')) {
        $salidas = [];
        foreach ($tareas as $id => $tarea) {
            $salidas[$id] = una($tarea);
        }
        return $salidas;
    }
    $multi = curl_multi_init();
    $manijas = [];
    foreach ($tareas as $id => $tarea) {
        $curl = curl_init($tarea['url']);
        $opciones = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 2,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_ENCODING => '',
            CURLOPT_USERAGENT => 'GenealogiaSefardi/1.0',
            CURLOPT_HTTPHEADER => $tarea['encabezados'] ?? ['Accept: application/json'],
        ];
        if (($tarea['metodo'] ?? 'GET') === 'POST') {
            $opciones[CURLOPT_POST] = true;
            $opciones[CURLOPT_POSTFIELDS] = $tarea['cuerpo'] ?? '';
        }
        curl_setopt_array($curl, $opciones);
        curl_multi_add_handle($multi, $curl);
        $manijas[$id] = $curl;
    }
    $activo = null;
    do {
        $estado = curl_multi_exec($multi, $activo);
        if ($activo) {
            curl_multi_select($multi, 1.0);
        }
    } while ($activo && $estado === CURLM_OK);
    $salidas = [];
    foreach ($manijas as $id => $curl) {
        $cuerpo = curl_multi_getcontent($curl);
        $codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $salidas[$id] = [
            'ok' => is_string($cuerpo) && $codigo >= 200 && $codigo < 300,
            'cuerpo' => is_string($cuerpo) ? substr($cuerpo, 0, 250000) : '',
        ];
        curl_multi_remove_handle($multi, $curl);
        curl_close($curl);
    }
    curl_multi_close($multi);
    return $salidas;
}

function registro(string $titulo, string $detalle, string $fecha = '', string $lugar = ''): array
{
    return [
        'titulo' => mb_substr($titulo, 0, 180),
        'detalle' => mb_substr($detalle, 0, 240),
        'fecha' => mb_substr($fecha, 0, 40),
        'lugar' => mb_substr($lugar, 0, 120),
    ];
}

function fuente(string $id, string $nombre, bool $ok, array $registros): array
{
    return ['id' => $id, 'nombre' => $nombre, 'ok' => $ok, 'registros' => array_slice($registros, 0, 6)];
}

$nombre = campo('nombre');
$apellido = campo('apellido');
$lugar = campo('lugar');
$persona = trim($nombre . ' ' . $apellido);
$consulta = trim($persona . ' ' . $lugar);
if (mb_strlen($consulta) < 2) {
    echo json_encode(['conectadas' => 0, 'consulta' => '', 'inegi' => null, 'fuentes' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$tareas = [];
if (mb_strlen($persona) >= 2) {
    $tareas['viaf'] = ['url' => 'https://viaf.org/viaf/AutoSuggest?query=' . rawurlencode($persona)];
    $termino = sparql($persona);
    $tareas['wikidata'] = [
        'url' => 'https://query.wikidata.org/sparql',
        'metodo' => 'POST',
        'cuerpo' => 'SELECT ?item ?itemLabel ?birth ?death ?birthPlaceLabel WHERE { SERVICE wikibase:mwapi { bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch"; mwapi:search "' . $termino . '"; mwapi:language "es". ?item wikibase:apiOutputItem mwapi:item. } ?item wdt:P31 wd:Q5. OPTIONAL { ?item wdt:P569 ?birth. } OPTIONAL { ?item wdt:P570 ?death. } OPTIONAL { ?item wdt:P19 ?birthPlace. ?birthPlace rdfs:label ?birthPlaceLabel. FILTER(LANG(?birthPlaceLabel)="es") } SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } } LIMIT 6',
        'encabezados' => ['Content-Type: application/sparql', 'Accept: application/sparql-results+json'],
    ];
}
if ($nombre !== '' || $apellido !== '') {
    $wiki = 'https://api.wikitree.com/api.php?action=searchPerson&format=json';
    if ($nombre !== '') {
        $wiki .= '&FirstName=' . rawurlencode($nombre);
    }
    if ($apellido !== '') {
        $wiki .= '&LastName=' . rawurlencode($apellido);
    }
    $tareas['wikitree'] = ['url' => $wiki];
}
$tareas['loc'] = ['url' => 'https://www.loc.gov/search/?fo=json&c=6&q=' . rawurlencode($consulta)];
$tareas['nara'] = ['url' => 'https://catalog.archives.gov/api/v1/?rows=6&q=' . rawurlencode($consulta)];
$tareas['datos'] = ['url' => 'https://datos.gob.mx/busca/api/3/action/package_search?rows=5&q=' . rawurlencode('censo población ' . ($lugar !== '' ? $lugar : 'México'))];
if (mb_strlen($lugar) >= 2) {
    $tareas['mapa'] = ['url' => 'https://nominatim.openhistoricalmap.org/search?format=jsonv2&limit=5&q=' . rawurlencode($lugar)];
    $tareas['inegi'] = ['url' => 'https://gaia.inegi.org.mx/wscatgeo/v2/mgem/buscar/' . rawurlencode($lugar)];
}

$respuestas = pedir($tareas);
$fuentes = [];

$viaf = jsonDe($respuestas['viaf']['cuerpo'] ?? '');
$registros = [];
foreach (array_slice($viaf['result'] ?? [], 0, 6) as $fila) {
    if (!is_array($fila)) {
        continue;
    }
    $titulo = (string) ($fila['displayForm'] ?? $fila['term'] ?? '');
    if ($titulo === '') {
        continue;
    }
    $registros[] = registro($titulo, 'Ficha de autoridad devuelta por VIAF.', '', (string) ($fila['nametype'] ?? ''));
}
if (isset($respuestas['viaf'])) {
    $fuentes[] = fuente('viaf', 'VIAF', $respuestas['viaf']['ok'], $registros);
}

$wikiData = jsonDe($respuestas['wikidata']['cuerpo'] ?? '');
$registros = [];
foreach (array_slice($wikiData['results']['bindings'] ?? [], 0, 6) as $fila) {
    if (!is_array($fila)) {
        continue;
    }
    $titulo = (string) ($fila['itemLabel']['value'] ?? '');
    if ($titulo === '') {
        continue;
    }
    $nacimiento = (string) ($fila['birth']['value'] ?? '');
    $registros[] = registro($titulo, 'Persona devuelta por Wikidata.', substr($nacimiento, 0, 4), (string) ($fila['birthPlaceLabel']['value'] ?? ''));
}
if (isset($respuestas['wikidata'])) {
    $fuentes[] = fuente('wikidata', 'Wikidata', $respuestas['wikidata']['ok'], $registros);
}

$arbol = jsonDe($respuestas['wikitree']['cuerpo'] ?? '');
$coincidencias = $arbol['matches'] ?? (isset($arbol[0]['matches']) ? $arbol[0]['matches'] : []);
$registros = [];
if (is_array($coincidencias)) {
    foreach (array_slice($coincidencias, 0, 6) as $fila) {
        if (!is_array($fila)) {
            continue;
        }
        $titulo = trim(((string) ($fila['FirstName'] ?? '')) . ' ' . ((string) ($fila['LastName'] ?? '')));
        if ($titulo === '') {
            $titulo = (string) ($fila['Name'] ?? '');
        }
        if ($titulo === '') {
            continue;
        }
        $registros[] = registro($titulo, 'Perfil devuelto por la API de WikiTree.', (string) ($fila['BirthDate'] ?? $fila['BirthYear'] ?? ''), (string) ($fila['BirthLocation'] ?? ''));
    }
}
if (isset($respuestas['wikitree'])) {
    $fuentes[] = fuente('wikitree', 'WikiTree', $respuestas['wikitree']['ok'], $registros);
}

$loc = jsonDe($respuestas['loc']['cuerpo'] ?? '');
$filasLoc = $loc['results'] ?? [];
$registros = [];
if (is_array($filasLoc)) {
    foreach (array_slice($filasLoc, 0, 6) as $fila) {
        if (!is_array($fila)) {
            continue;
        }
        $titulo = is_string($fila['title'] ?? null) ? $fila['title'] : (is_array($fila['title'] ?? null) ? (string) ($fila['title'][0] ?? '') : '');
        if ($titulo === '') {
            continue;
        }
        $detalle = is_array($fila['description'] ?? null) ? (string) ($fila['description'][0] ?? '') : (string) ($fila['description'] ?? 'Registro del catálogo de la Library of Congress.');
        $registros[] = registro($titulo, $detalle, is_string($fila['date'] ?? null) ? $fila['date'] : '');
    }
}
$fuentes[] = fuente('loc', 'Library of Congress', $respuestas['loc']['ok'] ?? false, $registros);

$nara = jsonDe($respuestas['nara']['cuerpo'] ?? '');
$filasNara = $nara['opaResponse']['results']['result'] ?? [];
if (isset($filasNara['naId'])) {
    $filasNara = [$filasNara];
}
$registros = [];
if (is_array($filasNara)) {
    foreach (array_slice($filasNara, 0, 6) as $fila) {
        if (!is_array($fila)) {
            continue;
        }
        $titulo = tituloEn($fila);
        if ($titulo === '') {
            continue;
        }
        $registros[] = registro($titulo, 'Expediente devuelto por la API de NARA.');
    }
}
$fuentes[] = fuente('nara', 'Archivos Nacionales de EE. UU.', $respuestas['nara']['ok'] ?? false, $registros);

$datos = jsonDe($respuestas['datos']['cuerpo'] ?? '');
$registros = [];
foreach (array_slice($datos['result']['results'] ?? [], 0, 5) as $fila) {
    if (!is_array($fila)) {
        continue;
    }
    $titulo = (string) ($fila['title'] ?? '');
    if ($titulo === '') {
        continue;
    }
    $notas = trim(strip_tags((string) ($fila['notes'] ?? '')));
    $registros[] = registro($titulo, $notas !== '' ? $notas : 'Conjunto de datos devuelto por datos.gob.mx.', '', 'México');
}
$fuentes[] = fuente('datos', 'datos.gob.mx', $respuestas['datos']['ok'] ?? false, $registros);

$mapa = jsonDe($respuestas['mapa']['cuerpo'] ?? '');
$registros = [];
if (isset($respuestas['mapa']) && array_keys($mapa) === range(0, count($mapa) - 1)) {
    foreach (array_slice($mapa, 0, 5) as $fila) {
        if (!is_array($fila) || empty($fila['display_name'])) {
            continue;
        }
        $registros[] = registro((string) $fila['display_name'], 'Lugar devuelto por OpenHistoricalMap.', '', (string) ($fila['display_name'] ?? ''));
    }
    $fuentes[] = fuente('mapa', 'OpenHistoricalMap', $respuestas['mapa']['ok'], $registros);
}

$inegi = null;
$listaInegi = jsonDe($respuestas['inegi']['cuerpo'] ?? '');
$filasInegi = $listaInegi['datos'] ?? (array_keys($listaInegi) === range(0, max(count($listaInegi) - 1, 0)) ? $listaInegi : []);
$primera = is_array($filasInegi) ? ($filasInegi[0] ?? null) : null;
if (is_array($primera) && preg_match('/^\d{5}$/', (string) ($primera['cvegeo'] ?? ''))) {
    $cve = (string) $primera['cvegeo'];
    $detalle = pedir(['detalle' => ['url' => 'https://gaia.inegi.org.mx/wscatgeo/v2/mgem/' . $cve]]);
    $filaDetalle = jsonDe($detalle['detalle']['cuerpo'] ?? '');
    $datosDetalle = $filaDetalle['datos'][0] ?? $filaDetalle[0] ?? $primera;
    if (!is_array($datosDetalle)) {
        $datosDetalle = $primera;
    }
    $cab = preg_replace('/\D+/', '', (string) ($datosDetalle['cve_cab'] ?? '')) ?? '';
    if (strlen($cab) !== 4) {
        $cab = '0001';
    }
    $inegi = [
        'cvegeo' => $cve,
        'nombre' => (string) ($datosDetalle['nomgeo'] ?? $primera['nomgeo'] ?? ''),
        'entidad' => substr($cve, 0, 2),
        'poblacion' => (string) ($datosDetalle['pob_total'] ?? ''),
        'hombres' => (string) ($datosDetalle['pob_masculina'] ?? ''),
        'mujeres' => (string) ($datosDetalle['pob_femenina'] ?? ''),
        'viviendas' => (string) ($datosDetalle['total_viviendas_habitadas'] ?? ''),
        'ficha' => $cve . $cab,
    ];
}

$conectadas = 0;
foreach ($fuentes as $fuenteLista) {
    if ($fuenteLista['registros'] !== []) {
        $conectadas++;
    }
}
if ($inegi) {
    $conectadas++;
}

$resumen = [];
foreach ($fuentes as $fuenteLista) {
    $resumen[] = $fuenteLista['id'] . ':' . count($fuenteLista['registros']) . ($fuenteLista['ok'] ? '' : '!');
}
if ($inegi) {
    $resumen[] = 'inegi:1';
}

echo json_encode([
    'resumen' => $resumen,
    'conectadas' => $conectadas,
    'consulta' => $consulta,
    'inegi' => $inegi,
    'fuentes' => $fuentes,
], JSON_UNESCAPED_UNICODE);
