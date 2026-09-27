<div class="archive-hero">
  <h1>Buscar en todo el sitio</h1>
  <p>Biografías, archivo de pruebas<?= !empty($logged_in) ? ' y personas de tu árbol' : '' ?>. Nombre, apellido, año o tipo de documento.</p>
</div>

<form class="archive-search" method="get" action="/search" role="search">
  <label class="sr-only" for="q">Buscar</label>
  <input id="q" type="search" name="q" value="<?= e($q ?? '') ?>" placeholder="Ej. Garza Falcón, Joseph García, 1670…" autocomplete="off" autofocus>
  <button type="submit" class="btn primary">Buscar</button>
</form>

<?php if (($q ?? '') === ''): ?>
  <div class="card"><p class="meta">Escribe al menos una palabra. El mismo buscador está arriba, en todas las páginas.</p></div>
<?php else: ?>

  <h2 style="margin-top:1.5rem">Biografías (<?= count($bios ?? []) ?>)</h2>
  <?php if (empty($bios)): ?>
    <p class="meta">Sin biografías coincidentes.</p>
  <?php else: ?>
    <ul class="list-plain">
      <?php foreach ($bios as $b): ?>
        <li>
          <a href="/biografias/<?= e($b['slug']) ?>"><strong><?= e($b['full_name']) ?></strong></a>
          <?php if (!empty($b['lifespan_label'])): ?><span class="meta"> — <?= e($b['lifespan_label']) ?></span><?php endif; ?>
          <?php if (!empty($b['summary'])): ?><div class="hint"><?= e(mb_substr($b['summary'], 0, 160)) ?></div><?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>

  <?php if (!empty($logged_in)): ?>
    <h2 style="margin-top:1.5rem">Personas en tu árbol (<?= count($persons) ?>)</h2>
    <?php if (empty($persons)): ?>
      <p class="meta">Sin coincidencias en tu árbol.</p>
    <?php else: ?>
      <ul class="list-plain">
        <?php foreach ($persons as $p): ?>
          <li><a href="/persons/<?= (int)$p['id'] ?>"><?= e($p['primary_name']) ?></a></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  <?php endif; ?>

  <h2 style="margin-top:1.5rem">Documentos del archivo (<?= count($sources) ?>)</h2>
  <?php if (empty($sources)): ?>
    <p class="meta">Sin documentos. Prueba solo el apellido o un año.</p>
  <?php else: ?>
    <div class="archive-gallery">
      <?php foreach ($sources as $it):
        $id = (int)$it['id'];
        $who = trim((string)($it['subject_name'] ?? '')) ?: (string)($it['title'] ?? 'Documento');
        $what = trim((string)($it['doc_type'] ?? '')) ?: (string)($it['title'] ?? '');
        $year = $it['doc_year'] ?? '';
        $cover = !empty($it['cover_path']) ? '/media/cover/' . $id : null;
      ?>
        <a class="archive-card" href="/archivo/<?= $id ?>">
          <div class="cover">
            <?php if ($cover): ?>
              <img src="<?= e($cover) ?>" alt="<?= e($who) ?>" loading="lazy">
            <?php else: ?>
              <div class="placeholder-media" style="height:100%;min-height:160px;display:flex;align-items:center;justify-content:center;color:#f5efe4;background:#3d2a1a">📄</div>
            <?php endif; ?>
            <?php if ($year !== '' && $year !== null): ?><span class="ribbon"><?= e((string)$year) ?></span><?php endif; ?>
          </div>
          <div class="body">
            <p class="who"><?= e($who) ?></p>
            <p class="what"><?= e($what) ?></p>
          </div>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
<?php endif; ?>
