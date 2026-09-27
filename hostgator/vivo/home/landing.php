<section class="landing-hero">
  <div class="landing-hero-inner">
    <p class="eyebrow">Archivo documental · evidencia primero</p>
    <h1>Genealogía Sefardí</h1>
    <p class="lede">Reconstruya su linaje con fuentes compartidas, cadenas de prueba y un árbol propio — registro gratuito.</p>
    <form class="landing-search" method="get" action="/search" role="search">
      <label class="sr-only" for="landing-q">Buscar en Genealogía Sefardí</label>
      <input id="landing-q" type="search" name="q" placeholder="Buscar Garza Falcón, un apellido, un año…" autocomplete="off">
      <button type="submit" class="btn btn-lg">Buscar</button>
    </form>
    <div class="landing-ctas">
      <a class="btn btn-lg" href="/registro">Registro gratis</a>
      <a class="btn btn-lg btn-outline-light" href="/login">Iniciar sesión</a>
      <a class="btn btn-lg btn-outline-light" href="/archivo">Ver archivo de pruebas</a>
    </div>
  </div>
</section>

<section class="landing-section">
  <div class="features-grid">
    <article class="feature-card">
      <h2>Árbol</h2>
      <p>Cada usuario posee su propio árbol de personas. Defina la raíz y explore el pedigree con control de propiedad.</p>
    </article>
    <article class="feature-card">
      <h2>Fuentes compartidas</h2>
      <p>Publique evidencias como compartidas o de archivo para que toda la comunidad registrada las cite — estilo archivo colaborativo.</p>
    </article>
    <article class="feature-card">
      <h2>Cadenas de prueba</h2>
      <p>Enlace documentos a afirmaciones genealógicas. Separe lo <em>probado</em> de lo <em>pendiente</em>.</p>
    </article>
  </div>
</section>

<section class="landing-section">
  <div class="two-col">
    <div class="card">
      <h2>Archivo público de pruebas</h2>
      <p>Consulte imágenes y PDFs marcados como compartidos o de archivo, sin iniciar sesión.</p>
      <p><?php if (!empty($archiveCount)): ?><span class="badge"><?= (int)$archiveCount ?> documentos</span><?php endif; ?></p>
      <a class="btn" href="/archivo">Explorar archivo</a>
    </div>
    <div class="card">
      <h2>Biografías citables</h2>
      <p>Fichas públicas de figuras del linaje, con filiación documentada y bloque «Cómo citar».</p>
      <a class="btn btn-outline" href="/biografias">Ver biografías</a>
    </div>
  </div>
</section>

<?php if (!empty($featuredBios)): ?>
<section class="landing-section">
  <h2 class="section-title">Biografías destacadas</h2>
  <div class="bio-cards">
    <?php foreach ($featuredBios as $b): ?>
      <a class="bio-card" href="/biografias/<?= e($b['slug']) ?>">
        <strong><?= e($b['full_name']) ?></strong>
        <?php if ($b['lifespan_label']): ?><span class="meta"><?= e($b['lifespan_label']) ?></span><?php endif; ?>
        <span class="hint"><?= e(mb_substr($b['summary'] ?? '', 0, 140)) ?>…</span>
      </a>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<section class="landing-section about-block">
  <div class="card">
    <h2>Sobre el proyecto</h2>
    <p>Genealogía Sefardí es un archivo de trabajo propio: prioriza documentos, citas y honestidad sobre afirmaciones sin prueba. Marca claramente lo probado y lo pendiente. No está afiliado a FamilySearch ni reproduce sus marcas.</p>
  </div>
</section>
