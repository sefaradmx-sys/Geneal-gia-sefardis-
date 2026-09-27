<div class="investigar" id="investigar">
  <p class="kicker">Genealogía Sefardí</p>
  <h1>Busca una persona y el censo de su municipio</h1>
  <form class="consulta" id="busqueda-viva">
    <label>Nombre <input id="nombre" name="nombre" autocomplete="given-name"></label>
    <label>Apellido <input id="apellido" name="apellido" autocomplete="family-name"></label>
    <label>Lugar <input id="lugar" name="lugar" placeholder="Municipio, estado"></label>
    <label>Año <input id="ano" name="ano" inputmode="numeric" maxlength="4" placeholder="1930"></label>
    <button type="submit">Buscar</button>
  </form>
  <div class="resultados" id="resultados"></div>

  <section id="censos">
    <h2>Censo del municipio</h2>
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
