<?php
/** @var string $content */
/** @var string $title */
/** @var array|null $currentUser */
/** @var array $config */
$appName = $config['app_name'] ?? 'Genealogía Sefardí';
$pageTitle = isset($title) ? ($title . ' — ' . $appName) : $appName;
$isPublicAuth = in_array(($title ?? ''), ['Iniciar sesión', 'Registro gratis'], true);
$isPublic = !empty($public) || $isPublicAuth;
?>
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8">
  
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($pageTitle) ?></title>
  <?php
    $appUrl = rtrim($config['app_url'] ?? 'https://genealogiasefardi.site', '/');
    $metaDescription = $metaDescription ?? 'Archivo genealógico sefardí con biografías documentadas, fuentes y pruebas. Genealogía Sefardí.';
    $canonical = $canonical ?? null;
    $ogImage = $ogImage ?? ($appUrl . '/public/assets/og-default.png');
    $robots = $robots ?? 'index,follow';
  ?>
  <meta name="description" content="<?= e($metaDescription) ?>">
  <meta name="robots" content="<?= e($robots) ?>">
  <?php if ($canonical): ?><link rel="canonical" href="<?= e($canonical) ?>"><?php endif; ?>
  <meta property="og:site_name" content="<?= e($appName) ?>">
  <meta property="og:locale" content="es_MX">
  <meta property="og:title" content="<?= e($pageTitle) ?>">
  <meta property="og:description" content="<?= e($metaDescription) ?>">
  <meta property="og:type" content="<?= e($ogType ?? 'website') ?>">
  <?php if ($canonical): ?><meta property="og:url" content="<?= e($canonical) ?>"><?php endif; ?>
  <meta property="og:image" content="<?= e($ogImage) ?>">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?= e($pageTitle) ?>">
  <meta name="twitter:description" content="<?= e($metaDescription) ?>">
  <?php if (!empty($jsonLd)): ?>
  <script type="application/ld+json"><?= $jsonLd /* pre-encoded JSON */ ?></script>
  <?php endif; ?>
  <link rel="stylesheet" href="<?= e(asset('app.css')) ?>">
  <link rel="stylesheet" href="/public/assets/investigar.css?v=tramite">
</head>
<body class="<?= $isPublic && !$currentUser ? 'public-body' : '' ?>">
<?php if ($isPublicAuth): ?>
  <?= $content ?>
<?php else: ?>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="<?= $currentUser ? '/panel' : '/' ?>"><?= e($appName) ?> <span>archivo</span></a>
    <form class="header-search" method="get" action="/search" role="search">
      <label class="sr-only" for="header-q">Buscar en todo el sitio</label>
      <input id="header-q" type="search" name="q" value="<?= e($_GET['q'] ?? '') ?>" placeholder="Buscar nombre, apellido, año…" autocomplete="off">
      <button type="submit" class="btn btn-sm" title="Buscar">Buscar</button>
    </form>
    <nav class="nav">
      <?php if ($currentUser): ?>
        <a href="/panel">Panel</a>
        <a href="/persons">Personas</a>
        <a href="/pedigree">Árbol</a>
        <a href="/sources">Fuentes</a>
        <a href="/memories">Memorias</a>
        <a href="/proof-chains">Pruebas</a>
        <a href="/#censos">Censos</a>
        <a href="/search">Buscar</a>
        <?php if (Auth::canEdit()): ?><a href="/panel/import">Importar</a><?php endif; ?>
        <a href="/archivo">Archivo</a>
        <a href="https://genealogiasefardi.site/sefarad-mx/">Sefarad-MX</a>
        <a href="/biografias">Biografías</a>
        <span class="user-chip"><?= e($currentUser['name']) ?> (<?= e($currentUser['role']) ?>)</span>
        <form class="inline-form" method="post" action="/logout"><?= csrf_field() ?>
          <button type="submit" class="btn btn-sm btn-outline" style="border-color:#c4b59a;color:#f5efe4!important">Salir</button>
        </form>
      <?php else: ?>
        <a href="/">Inicio</a>
        <a href="/#censos">Censos</a>
        <a href="https://arbol.genealogiasefardi.site/index.php?route=%2Fsefarad-mx%2Ftree%2Fsefarad">Árbol</a>
        <a href="/archivo">Archivo</a>
        <a href="/biografias">Biografías</a>
        <a href="/registro">Registro</a>
        <a href="/login">Entrar</a>
      <?php endif; ?>
    </nav>
  </div>
</header>
<main class="wrap<?= !empty($public) && ($title ?? '') === 'Inicio' ? ' wrap-landing' : '' ?>">
  <?php if ($m = flash('success')): ?><div class="flash success" style="max-width:1100px;margin:1rem auto 0;padding-left:1.25rem;padding-right:1.25rem"><?= e($m) ?></div><?php endif; ?>
  <?php if ($m = flash('error')): ?><div class="flash error" style="max-width:1100px;margin:1rem auto 0;padding-left:1.25rem;padding-right:1.25rem"><?= e($m) ?></div><?php endif; ?>
  <?= $content ?>
</main>
<footer class="site-footer">
  <?= e($appName) ?> — archivo documental · evidencia primero
  · <a href="/biografias">Biografías</a> · <a href="/archivo">Archivo</a>
</footer>
<?php endif; ?>

<script>
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.media-viewer').forEach(function (el) {
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
});
</script>
<script src="/public/assets/investigar.js?v=tramite" defer></script>
</body>
</html>
