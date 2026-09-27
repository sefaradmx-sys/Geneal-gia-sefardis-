<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

function campo(string $clave): string
{
    $valor = trim((string) ($_GET[$clave] ?? ''));
    $valor = preg_replace('/[^\p{L}\p{N} .,\-]/u', '', $valor) ?? '';
    return mb_substr($valor, 0, 80);
}

function plano(string $texto): string
{
    $texto = mb_strtolower($texto, 'UTF-8');
    return strtr($texto, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
    ]);
}

$nombre = campo('nombre');
$apellido = campo('apellido');
$lugar = campo('lugar');
$ano = campo('ano');
$consulta = trim($nombre . ' ' . $apellido . ' ' . $lugar . ' ' . $ano);
$tokens = preg_split('/\s+/', plano($consulta)) ?: [];
$fuertes = [];
foreach ($tokens as $token) {
    if (mb_strlen($token) >= 3) {
        $fuertes[] = $token;
    }
}
if ($fuertes === []) {
    echo json_encode(['total' => 0, 'registros' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$ruta = __DIR__ . '/storage/saltillo.json';
$bruto = is_file($ruta) ? file_get_contents($ruta) : false;
$expedientes = is_string($bruto) ? json_decode($bruto, true) : null;
if (!is_array($expedientes)) {
    http_response_code(500);
    echo json_encode(['total' => 0, 'registros' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$hallados = [];
foreach ($expedientes as $expediente) {
    if (!is_array($expediente)) {
        continue;
    }
    $texto = plano(implode(' ', [
        $expediente['tipo'] ?? '',
        $expediente['descripcion'] ?? '',
        $expediente['lugar_fecha'] ?? '',
        $expediente['referencia'] ?? '',
    ]));
    $sirve = true;
    foreach ($fuertes as $token) {
        if (!str_contains($texto, $token)) {
            $sirve = false;
            break;
        }
    }
    if (!$sirve) {
        continue;
    }
    $hallados[] = [
        'tipo' => (string) ($expediente['tipo'] ?? ''),
        'descripcion' => (string) ($expediente['descripcion'] ?? ''),
        'lugar_fecha' => (string) ($expediente['lugar_fecha'] ?? ''),
        'referencia' => (string) ($expediente['referencia'] ?? ''),
        'fojas' => (int) ($expediente['fojas'] ?? 0),
    ];
    if (count($hallados) >= 40) {
        break;
    }
}

echo json_encode([
    'total' => count($hallados),
    'registros' => $hallados,
], JSON_UNESCAPED_UNICODE);
