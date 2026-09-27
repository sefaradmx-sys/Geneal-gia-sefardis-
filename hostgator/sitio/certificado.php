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
$certifica = 'Genealogía Sefardí y Sefarad MX certifican que en ' . $cuando . ', en ' . $donde . ' del Archivo Principal de Sefarad, se encuentra el documento ' . $tipo . ', con la información siguiente.';
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
    ['Genealogía Sefardí', 'F1', 22, '0.078 0.184 0.239', true, 0],
    ['Sefarad MX', 'F1', 13, '0.553 0.204 0.173', true, 8],
    ['Certificación', 'F1', 12, '0.553 0.204 0.173', true, 22],
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
foreach (cortar('Tramitar Documentos Certificados ante el Archivo. No puedes venir hasta el Archivo de Saltillo. No te preocupes: nosotros lo tramitamos por ti y te lo enviamos. Contáctanos +52 844 219 5952.', 78) as $linea) {
    $bloques[] = [$linea, 'F2', 11, '0.078 0.184 0.239', false, 16];
}
$cierre = [
    ['Información Consultada de la Plataforma Sefarad MX.', 'F3', 12, '0.078 0.184 0.239', true, 28],
    ['Ante Mí Consta y Doy Fe.', 'F3', 12, '0.078 0.184 0.239', true, 18],
    ['__firma__', 'F1', 12, '0.078 0.184 0.239', true, 36],
    ['Lic. Francisco Javier García Gaona', 'F1', 12, '0.078 0.184 0.239', true, 16],
    ['Fundador de Sefarad MX', 'F2', 11, '0.345 0.329 0.298', true, 16],
];

$paginas = [];
$y = 706.0;
$ops = '';
$abrir = static function () use (&$ops, &$y): void {
    $ops = "0.078 0.184 0.239 RG\n1.4 w\n40 36 532 720 re S\n0.769 0.631 0.353 RG\n0.7 w\n48 44 516 704 re S\n";
    $y = 706.0;
};
$abrir();
$pintar = static function (array $bloque) use (&$ops, &$y, &$paginas, $abrir): void {
    [$texto, $fuente, $tamano, $color, $centrado, $salto] = $bloque;
    $avance = max((float) $salto, ($texto === '' || $texto === '__firma__') ? 14 : (float) $tamano + 6);
    if ($y - $avance < 78) {
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
if ($y < 230) {
    $paginas[] = $ops;
    $abrir();
} elseif ($y > 270) {
    $y = 270;
}
foreach ($cierre as $bloque) {
    $pintar($bloque);
}
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
