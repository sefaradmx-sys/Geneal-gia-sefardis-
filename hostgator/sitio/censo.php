<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');

function soloDigitos(string $valor, int $largo): string
{
    $digitos = preg_replace('/\D+/', '', $valor) ?? '';
    return strlen($digitos) === $largo ? $digitos : '';
}

function traer(string $url): array
{
    $partes = parse_url($url);
    $host = $partes['host'] ?? '';
    if (($partes['scheme'] ?? '') !== 'https' || !in_array($host, ['gaia.inegi.org.mx', 'www.inegi.org.mx'], true)) {
        return ['ok' => false, 'code' => 0, 'type' => '', 'body' => ''];
    }
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_USERAGENT => 'GenealogiaSefardi/1.0',
    ]);
    $body = curl_exec($curl);
    $code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $type = (string) curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
    curl_close($curl);
    return ['ok' => is_string($body) && $code >= 200 && $code < 300, 'code' => $code, 'type' => $type, 'body' => is_string($body) ? $body : ''];
}

function filas(string $json): array
{
    $data = json_decode($json, true);
    if (!is_array($data)) {
        return [];
    }
    if (isset($data['datos']) && is_array($data['datos'])) {
        return $data['datos'];
    }
    if ($data === []) {
        return [];
    }
    if (array_keys($data) === range(0, count($data) - 1)) {
        return $data;
    }
    return [];
}

function jsonSalida(array $payload, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$accion = $_GET['accion'] ?? '';

if ($accion === 'municipios') {
    $texto = trim((string) ($_GET['q'] ?? ''));
    $texto = preg_replace('/[^\p{L}\p{N} .,\-]/u', '', $texto) ?? '';
    if (mb_strlen($texto) < 2) {
        jsonSalida(['municipios' => []]);
    }
    $respuesta = traer('https://gaia.inegi.org.mx/wscatgeo/v2/mgem/buscar/' . rawurlencode($texto));
    if (!$respuesta['ok']) {
        jsonSalida(['municipios' => [], 'error' => 'inegi'], 502);
    }
    $municipios = [];
    foreach (array_slice(filas($respuesta['body']), 0, 12) as $fila) {
        if (!is_array($fila)) {
            continue;
        }
        $cve = soloDigitos((string) ($fila['cvegeo'] ?? ''), 5);
        if ($cve === '') {
            continue;
        }
        $municipios[] = [
            'cvegeo' => $cve,
            'nombre' => (string) ($fila['nomgeo'] ?? ''),
            'entidad' => substr($cve, 0, 2),
            'cabecera' => (string) ($fila['nom_cab'] ?? ''),
            'poblacion' => (string) ($fila['pob_total'] ?? ''),
        ];
    }
    jsonSalida(['municipios' => $municipios]);
}

if ($accion === 'municipio') {
    $cve = soloDigitos((string) ($_GET['cve'] ?? ''), 5);
    if ($cve === '') {
        jsonSalida(['error' => 'clave'], 400);
    }
    $respuesta = traer('https://gaia.inegi.org.mx/wscatgeo/v2/mgem/' . $cve);
    $fila = filas($respuesta['body'])[0] ?? null;
    if (!$respuesta['ok'] || !is_array($fila)) {
        jsonSalida(['error' => 'inegi'], 502);
    }
    $cab = soloDigitos((string) ($fila['cve_cab'] ?? ''), 4);
    if ($cab === '') {
        $cab = '0001';
    }
    jsonSalida([
        'cvegeo' => $cve,
        'nombre' => (string) ($fila['nomgeo'] ?? ''),
        'entidad' => substr($cve, 0, 2),
        'cabeceraClave' => $cab,
        'cabecera' => (string) ($fila['nom_cab'] ?? ''),
        'poblacion' => (string) ($fila['pob_total'] ?? ''),
        'mujeres' => (string) ($fila['pob_femenina'] ?? ''),
        'hombres' => (string) ($fila['pob_masculina'] ?? ''),
        'viviendas' => (string) ($fila['total_viviendas_habitadas'] ?? ''),
        'ficha' => $cve . $cab,
    ]);
}

if ($accion === 'ficha') {
    $cve = soloDigitos((string) ($_GET['cve'] ?? ''), 9);
    if ($cve === '') {
        http_response_code(400);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Falta la clave de la localidad.';
        exit;
    }
    $respuesta = traer('https://www.inegi.org.mx/app/geo2/ahl/hacerPDF.do?cveGeo=' . $cve);
    if (!$respuesta['ok'] || strncmp($respuesta['body'], '%PDF', 4) !== 0) {
        header('Location: https://www.inegi.org.mx/app/geo2/ahl/hacerPDF.do?cveGeo=' . $cve, true, 302);
        exit;
    }
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="censo-' . $cve . '.pdf"');
    header('Cache-Control: public, max-age=86400');
    echo $respuesta['body'];
    exit;
}

jsonSalida(['error' => 'accion'], 404);
