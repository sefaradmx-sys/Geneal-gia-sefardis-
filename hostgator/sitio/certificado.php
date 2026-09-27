<?php
declare(strict_types=1);

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$ruta = __DIR__ . '/storage/saltillo.json';
$expedientes = is_int($id) && is_file($ruta) ? json_decode((string) file_get_contents($ruta), true) : null;
$expediente = is_array($expedientes) ? ($expedientes[$id] ?? null) : null;
if (!is_array($expediente)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'No está ese expediente.';
    exit;
}

function latin(string $texto): string
{
    $convertido = function_exists('iconv') ? iconv('UTF-8', 'Windows-1252//TRANSLIT', $texto) : false;
    if ($convertido === false) {
        $convertido = function_exists('mb_convert_encoding') ? mb_convert_encoding($texto, 'Windows-1252', 'UTF-8') : $texto;
    }
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $convertido);
}

function cortar(string $texto, int $maximo): array
{
    $texto = trim(preg_replace('/\s+/u', ' ', $texto) ?? '');
    if ($texto === '') {
        return [];
    }
    $lineas = [];
    $actual = '';
    foreach (preg_split('/\s+/u', $texto) ?: [] as $palabra) {
        $candidato = $actual === '' ? $palabra : $actual . ' ' . $palabra;
        if (mb_strlen($candidato) > $maximo && $actual !== '') {
            $lineas[] = $actual;
            $actual = $palabra;
        } else {
            $actual = $candidato;
        }
    }
    if ($actual !== '') {
        $lineas[] = $actual;
    }
    return $lineas;
}

function fechaSolicitud(): string
{
    $meses = [1 => 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    $hoy = new DateTime('now', new DateTimeZone('America/Mexico_City'));
    return $hoy->format('j') . ' de ' . $meses[(int) $hoy->format('n')] . ' de ' . $hoy->format('Y');
}

$tipo = trim((string) ($expediente['tipo'] ?? '')) ?: 'Documento';
$cuando = trim((string) ($expediente['lugar_fecha'] ?? ''));
$cuando = $cuando !== '' ? rtrim($cuando, '.') : 'la fecha que consta en el expediente';
$expedienteNumero = trim((string) ($expediente['expediente'] ?? ''));
$donde = $expedienteNumero !== '' ? 'el expediente ' . $expedienteNumero : 'la referencia ' . ((string) ($expediente['referencia'] ?? 'que consta en esta certificación'));
$certifica = 'Genealogía Sefardí y Sefarad MX certifican que en ' . $cuando . ', en ' . $donde . ' del Archivo Municipal de Saltillo, se encuentra el documento ' . $tipo . '. Nos consta y damos fe de que ahí está.';
$descripcion = trim((string) ($expediente['descripcion'] ?? ''));
$datos = array_filter([
    'Lugar y Fecha' => trim((string) ($expediente['lugar_fecha'] ?? '')),
    'Caja' => trim((string) ($expediente['caja'] ?? '')),
    'Expediente' => $expedienteNumero,
    'Documento' => trim((string) ($expediente['documento'] ?? '')),
    'Fojas' => ((int) ($expediente['fojas'] ?? 0)) > 0 ? (string) $expediente['fojas'] : '',
    'Referencia' => trim((string) ($expediente['referencia'] ?? '')),
    'Fecha de Solicitud' => fechaSolicitud(),
], static fn (string $valor): bool => $valor !== '');

$bloques = [
    ['Genealogía Sefardí', 'F1', 20, '0.078 0.184 0.239', true, 0],
    ['Sefarad MX', 'F1', 12, '0.553 0.204 0.173', true, 6],
    ['Consta en el Archivo Municipal de Saltillo', 'F1', 12, '0.553 0.204 0.173', true, 18],
];
foreach (cortar($certifica, 78) as $linea) {
    $bloques[] = [$linea, 'F2', 11, '0.110 0.098 0.082', false, 16];
}
$bloques[count($bloques) - 1][5] = 8;
if ($descripcion !== '') {
    $bloques[] = ['', 'F2', 11, '0.110 0.098 0.082', false, 10];
    foreach (cortar($descripcion, 70) as $linea) {
        $bloques[] = [$linea, 'F3', 12, '0.078 0.184 0.239', false, 4];
    }
}
$bloques[] = ['', 'F2', 11, '0.110 0.098 0.082', false, 16];
foreach ($datos as $etiqueta => $valor) {
    foreach (cortar($etiqueta . ': ' . $valor, 78) as $i => $linea) {
        $bloques[] = [$linea, 'F2', 11, '0.110 0.098 0.082', false, $i === 0 ? 18 : 14];
    }
}
foreach (cortar('Si no puedes venir a Saltillo, lo gestionamos directamente en el Archivo Municipal de Saltillo. El documento lo expide ese archivo y se envía a cualquier parte del mundo. Contáctanos +52 844 219 5952.', 78) as $linea) {
    $bloques[] = [$linea, 'F2', 10, '0.345 0.329 0.298', false, 14];
}
$cierre = [
    ['Información consultada en la plataforma Sefarad MX.', 'F3', 11, '0.078 0.184 0.239', true, 20],
    ['Nos consta y damos fe de que el documento está en el Archivo Municipal de Saltillo.', 'F3', 11, '0.078 0.184 0.239', true, 16],
    ['__firma__', 'F1', 12, '0.078 0.184 0.239', true, 28],
    ['Lic. Francisco Javier García Gaona', 'F1', 12, '0.078 0.184 0.239', true, 16],
    ['Fundador de Sefarad MX', 'F2', 11, '0.345 0.329 0.298', true, 14],
];

function sello(): string
{
    return "0.769 0.631 0.353 RG\n1.3 w\n306 718 30 0 360 arc S\n"
        . "0.078 0.184 0.239 RG\n0.8 w\n306 718 22 0 360 arc S\n"
        . "BT\n/F1 16 Tf\n0.078 0.184 0.239 rg\n1 0 0 1 300 712 Tm\n(S) Tj\nET\n";
}

function pie(): string
{
    $linea = static function (string $texto, float $y, string $fuente, float $tamano): string {
        $ancho = mb_strlen($texto) * $tamano * 0.46;
        $x = (612 - $ancho) / 2;
        return "BT\n/{$fuente} {$tamano} Tf\n0.078 0.184 0.239 rg\n1 0 0 1 {$x} {$y} Tm\n(" . latin($texto) . ") Tj\nET\n";
    };
    return "0.769 0.631 0.353 RG\n0.7 w\n64 78 m 548 78 l S\n"
        . $linea('Genealogía Sefardí · Sefarad MX · +52 844 219 5952', 62, 'F1', 9)
        . $linea('Los documentos los expide el Archivo Municipal de Saltillo y se envían a cualquier parte del mundo.', 48, 'F2', 8);
}

$paginas = [];
$y = 640.0;
$ops = '';
$primera = true;
$abrir = static function () use (&$ops, &$y, &$primera): void {
    $ops = "0.078 0.184 0.239 RG\n1.1 w\n36 32 540 728 re S\n0.769 0.631 0.353 RG\n0.6 w\n42 38 528 716 re S\n";
    if ($primera) {
        $ops .= sello();
        $y = 670.0;
        $primera = false;
    } else {
        $y = 700.0;
    }
};
$abrir();
$pintar = static function (array $bloque) use (&$ops, &$y, &$paginas, $abrir): void {
    [$texto, $fuente, $tamano, $color, $centrado, $salto] = $bloque;
    $avance = max((float) $salto, ($texto === '' || $texto === '__firma__') ? 14 : (float) $tamano + 6);
    if ($y - $avance < 108) {
        $ops .= pie();
        $paginas[] = $ops;
        $abrir();
    }
    $y -= $avance;
    if ($texto === '' || $texto === '__firma__') {
        if ($texto === '__firma__') {
            $ops .= "0.078 0.184 0.239 RG\n0.8 w\n206 {$y} m 406 {$y} l S\n";
        }
        return;
    }
    $ancho = mb_strlen($texto) * $tamano * 0.46;
    $x = $centrado ? (612 - $ancho) / 2 : 68;
    $ops .= "BT\n/{$fuente} {$tamano} Tf\n{$color} rg\n1 0 0 1 {$x} {$y} Tm\n(" . latin($texto) . ") Tj\nET\n";
};
foreach ($bloques as $bloque) {
    $pintar($bloque);
}
if ($y < 250) {
    $ops .= pie();
    $paginas[] = $ops;
    $abrir();
} elseif ($y > 280) {
    $y = 280;
}
foreach ($cierre as $bloque) {
    $pintar($bloque);
}
$ops .= pie();
$paginas[] = $ops;

$objetos = [];
$objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
$objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>';
$objetos[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>';
$objetos[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>';
$kids = [];
$numero = 6;
foreach ($paginas as $contenido) {
    $pagina = $numero;
    $flujo = $numero + 1;
    $kids[] = $pagina . ' 0 R';
    $objetos[$pagina] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {$flujo} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> >>";
    $objetos[$flujo] = "<< /Length " . strlen($contenido) . " >>\nstream\n" . $contenido . "endstream";
    $numero += 2;
}
$objetos[2] = '<< /Type /Pages /Count ' . count($paginas) . ' /Kids [' . implode(' ', $kids) . '] >>';
ksort($objetos);

$pdf = "%PDF-1.4\n";
$offsets = [0];
foreach ($objetos as $indice => $cuerpo) {
    $offsets[$indice] = strlen($pdf);
    $pdf .= $indice . " 0 obj\n" . $cuerpo . "\nendobj\n";
}
$inicio = strlen($pdf);
$total = count($objetos) + 1;
$pdf .= "xref\n0 {$total}\n";
$pdf .= "0000000000 65535 f \n";
for ($indice = 1; $indice < $total; $indice++) {
    $pdf .= sprintf("%010d 00000 n \n", $offsets[$indice]);
}
$pdf .= "trailer\n<< /Size {$total} /Root 1 0 R >>\nstartxref\n{$inicio}\n%%EOF";

$caja = preg_replace('/\s+/', '-', trim((string) ($expediente['caja'] ?? 's'))) ?: 's';
$pieza = preg_replace('/\s+/', '-', $expedienteNumero !== '' ? $expedienteNumero : 's') ?: 's';
$archivo = 'Sefarad-MX-caja-' . $caja . '-expediente-' . $pieza . '.pdf';
$archivo = preg_replace('/[^A-Za-z0-9._-]/', '', $archivo) ?: 'Sefarad-MX.pdf';

header('X-Content-Type-Options: nosniff');
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $archivo . '"');
header('Cache-Control: no-store');
echo $pdf;
