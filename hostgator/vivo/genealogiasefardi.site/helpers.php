<?php
declare(strict_types=1);

function e(?string $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirect(string $path): never
{
    if (!str_starts_with($path, 'http')) {
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
        if ($base === '/' || $base === '\\') {
            $base = '';
        }
        // When using front controller at root, SCRIPT_NAME is /index.php
        if (str_ends_with($base, '/index.php') || basename($_SERVER['SCRIPT_NAME'] ?? '') === 'index.php') {
            $base = '';
        }
        $path = $base . $path;
    }
    header('Location: ' . $path);
    exit;
}

function flash(string $key, ?string $message = null): ?string
{
    Auth::startSession();
    if ($message !== null) {
        $_SESSION['_flash'][$key] = $message;
        return null;
    }
    $msg = $_SESSION['_flash'][$key] ?? null;
    unset($_SESSION['_flash'][$key]);
    return $msg;
}

function csrf_token(): string
{
    Auth::startSession();
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    Auth::startSession();
    $token = $_POST['_csrf'] ?? '';
    if (!hash_equals($_SESSION['_csrf'] ?? '', $token)) {
        http_response_code(419);
        exit('Token CSRF inválido.');
    }
}

function view(string $name, array $data = []): void
{
    extract($data, EXTR_SKIP);
    $config = $GLOBALS['config'];
    $currentUser = Auth::user();
    $viewFile = BASE_PATH . '/views/' . $name . '.php';
    if (!is_file($viewFile)) {
        http_response_code(500);
        echo 'Vista no encontrada: ' . e($name);
        return;
    }
    ob_start();
    require $viewFile;
    $content = ob_get_clean();
    require BASE_PATH . '/views/layout.php';
}

function partial(string $name, array $data = []): void
{
    extract($data, EXTR_SKIP);
    require BASE_PATH . '/views/' . $name . '.php';
}

function url(string $path = '/'): string
{
    return $path;
}

function asset(string $path): string
{
    return '/public/assets/' . ltrim($path, '/');
}

function audit_log(?int $userId, string $entityType, ?int $entityId, string $action, string $summary): void
{
    try {
        Db::insert('audit_log', [
            'user_id' => $userId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'summary' => mb_substr($summary, 0, 500),
        ]);
    } catch (Throwable $e) {
        // non-fatal
    }
}

function sex_label(string $sex): string
{
    return match ($sex) {
        'M' => 'Masculino',
        'F' => 'Femenino',
        default => 'Desconocido',
    };
}

function fact_type_label(string $type): string
{
    $map = [
        'birth' => 'Nacimiento',
        'baptism' => 'Bautismo',
        'marriage' => 'Matrimonio',
        'death' => 'Defunción',
        'burial' => 'Entierro',
        'residence' => 'Residencia',
        'occupation' => 'Ocupación',
        'custom' => 'Otro',
    ];
    return $map[$type] ?? ucfirst($type);
}

function proof_status_label(string $status): string
{
    return match ($status) {
        'probado' => 'Probado',
        'pendiente' => 'Pendiente',
        'en_disputa' => 'En disputa',
        default => $status,
    };
}

function upload_file(array $file, string $subdir = ''): ?string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Error al subir archivo.');
    }
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!in_array($mime, $allowed, true)) {
        throw new RuntimeException('Tipo de archivo no permitido.');
    }
    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
        default => 'bin',
    };
    $dir = BASE_PATH . '/storage/uploads' . ($subdir ? '/' . trim($subdir, '/') : '');
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $name = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dest = $dir . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new RuntimeException('No se pudo guardar el archivo.');
    }
    $rel = 'storage/uploads' . ($subdir ? '/' . trim($subdir, '/') : '') . '/' . $name;
    return $rel;
}

function media_url(?string $path): ?string
{
    if (!$path) {
        return null;
    }
    return '/' . ltrim($path, '/');
}

function is_image_path(?string $path): bool
{
    if (!$path) {
        return false;
    }
    return (bool)preg_match('/\.(jpe?g|png|gif|webp)$/i', $path);
}


function safe_next_path(?string $next, string $default = '/panel'): string
{
    if ($next === null || $next === '') {
        return $default;
    }
    if (!str_starts_with($next, '/') || str_starts_with($next, '//')) {
        return $default;
    }
    return $next;
}

function get_user_root_person_id(?int $userId = null): ?int
{
    $userId = $userId ?? Auth::id();
    if (!$userId) {
        return null;
    }
    $row = Db::fetch('SELECT root_person_id FROM user_settings WHERE user_id = ?', [$userId]);
    return ($row && $row['root_person_id']) ? (int)$row['root_person_id'] : null;
}

function set_user_root_person_id(int $personId, ?int $userId = null): void
{
    $userId = $userId ?? Auth::id();
    if (!$userId) {
        return;
    }
    Db::query(
        'INSERT INTO user_settings (user_id, root_person_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE root_person_id = VALUES(root_person_id)',
        [$userId, $personId]
    );
}

function ensure_user_settings(int $userId): void
{
    Db::query(
        'INSERT IGNORE INTO user_settings (user_id, root_person_id) VALUES (?, NULL)',
        [$userId]
    );
}

function person_owner_clause(string $alias = 'p'): array
{
    if (Auth::isAdmin()) {
        return ['1=1', []];
    }
    $col = $alias === '' ? 'owner_id' : $alias . '.owner_id';
    return [$col . ' = ?', [Auth::id()]];
}

function sources_visible_clause(string $alias = 's'): array
{
    if (Auth::isAdmin()) {
        return ['1=1', []];
    }
    $v = $alias === '' ? 'visibility' : $alias . '.visibility';
    $c = $alias === '' ? 'created_by' : $alias . '.created_by';
    return ["($v IN ('shared','archive') OR $c = ?)", [Auth::id()]];
}

function visibility_label(string $v): string
{
    return match ($v) {
        'private' => 'Privada',
        'shared' => 'Compartida',
        'archive' => 'Archivo público',
        default => $v,
    };
}

function is_public_visibility(?string $v): bool
{
    return in_array($v, ['shared', 'archive'], true);
}

function mime_for_path(string $path): string
{
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    return match ($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'pdf' => 'application/pdf',
        default => 'application/octet-stream',
    };
}

function e_nl2br(?string $s): string
{
    return nl2br(e($s));
}

function is_pdf_path(?string $path): bool
{
    if (!$path) {
        return false;
    }
    return (bool)preg_match('/\.pdf$/i', $path);
}

/**
 * Render a consultation-only media viewer (no download link).
 * $serveUrl must be a /media/... route, not a raw storage path.
 */
function render_media_viewer(string $serveUrl, ?string $mediaPath, string $alt = 'Documento', ?string $coverUrl = null): void
{
    $isImage = is_image_path($mediaPath);
    $isPdf = is_pdf_path($mediaPath);
    ?>
    <div class="media-viewer" oncontextmenu="return false;">
      <p class="media-consult-note">Solo consulta — descarga deshabilitada</p>
      <?php if ($isImage): ?>
        <img src="<?= e($serveUrl) ?>" alt="<?= e($alt) ?>" draggable="false">
      <?php elseif ($isPdf): ?>
        <?php if ($coverUrl): ?>
          <div class="pdf-cover-preview">
            <img src="<?= e($coverUrl) ?>" alt="Portada — <?= e($alt) ?>" draggable="false">
          </div>
        <?php endif; ?>
        <object class="pdf-object" data="<?= e($serveUrl) ?>#toolbar=0&amp;navpanes=0&amp;scrollbar=1" type="application/pdf" width="100%" height="560">
          <iframe class="pdf-frame" src="<?= e($serveUrl) ?>#toolbar=0&amp;navpanes=0" sandbox="allow-same-origin allow-scripts" title="<?= e($alt) ?>" width="100%" height="560"></iframe>
        </object>
      <?php else: ?>
        <p class="empty">Vista previa no disponible para este tipo de archivo. Consulte el archivo desde el panel de administración.</p>
      <?php endif; ?>
    </div>
    <?php
}
