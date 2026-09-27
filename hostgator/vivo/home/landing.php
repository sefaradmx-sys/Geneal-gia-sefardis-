<div class="investigar" id="investigar">
  <header class="portada"><meta charset="utf-8">
    <img class="logo" src="/public/assets/logo.svg" alt="" width="92" height="92">
    <div>
      <p class="kicker">Genealogía Sefardí</p>
      <h1>Sefarad MX</h1>
    </div>
  </header>

  <section class="bloque-busqueda" id="archivo">
    <h2>Búsqueda de archivos en el Archivo Histórico de Saltillo</h2>
    <form class="consulta corta" id="busqueda-archivo">
      <label>Nombre <input id="nombre-archivo" name="nombre" autocomplete="given-name"></label>
      <label>Apellido <input id="apellido-archivo" name="apellido" autocomplete="family-name"></label>
      <button type="submit">Buscar en el archivo</button>
    </form>
    <div class="resultados" id="resultados-archivo"></div>
  </section>

  <section class="bloque-busqueda" id="censos">
    <h2>Búsqueda de censos del INEGI</h2>
    <div class="panel-censo">
      <div class="censo-busqueda">
        <label>Municipio <input id="municipio" placeholder="Monterrey"></label>
        <div class="lista-municipios" id="lista-municipios"></div>
      </div>
      <div class="visor">
        <p class="ficha-meta" id="ficha-meta">Escribe el municipio para ver su censo.</p>
        <iframe id="ficha-censo" title="Censo del municipio" src="about:blank"></iframe>
      </div>
    </div>
  </section>

  <section class="bloque-busqueda" id="general">
    <h2>Búsqueda general de actas y demás</h2>
    <form class="consulta" id="busqueda-general">
      <label>Nombre <input id="nombre" name="nombre" autocomplete="given-name"></label>
      <label>Apellido <input id="apellido" name="apellido" autocomplete="family-name"></label>
      <label>Lugar <input id="lugar" name="lugar" placeholder="Municipio, estado"></label>
      <label>Año <input id="ano" name="ano" inputmode="numeric" maxlength="4" placeholder="1930"></label>
      <button type="submit">Buscar</button>
    </form>
    <div class="resultados" id="resultados-general"></div>
  </section>

  <section class="tramitar" id="tramitar">
    <h2>Si no puedes venir a Saltillo</h2>
    <p>Solamente en ese caso lo gestionamos nosotros, directamente en el Archivo Municipal de Saltillo. El documento lo expide ese archivo y se envía a cualquier parte del mundo.</p>
    <p class="telefono">Contáctanos <a href="tel:+528442195952">+52 844 219 5952</a></p>
  </section>
</div>

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
