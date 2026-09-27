<h1>Panel</h1>
<p class="meta">Bienvenido, <strong><?= e($currentUser['name']) ?></strong>.</p>

<?php if (Auth::canEdit() && (int)($stats['persons'] ?? 0) === 0): ?>
<div class="cta-banner">
  <p><strong>Empiece su árbol familiar.</strong> Cree su ficha como raíz y luego añada padres e hijos.</p>
  <a class="btn" href="/pedigree">Empezar mi árbol</a>
</div>
<?php elseif (Auth::canEdit() && !$root): ?>
<div class="cta-banner">
  <p><strong>Defina la raíz de su árbol</strong> para ver el pedigree.</p>
  <a class="btn" href="/pedigree">Ir a Mi árbol</a>
</div>
<?php endif; ?>

<div class="grid-stats">
  <div class="stat"><div class="n"><?= (int)$stats['persons'] ?></div><div class="l">Personas</div></div>
  <div class="stat"><div class="n"><?= (int)$stats['sources'] ?></div><div class="l">Fuentes</div></div>
  <div class="stat"><div class="n"><?= (int)$stats['memories'] ?></div><div class="l">Memorias</div></div>
  <div class="stat"><div class="n"><?= (int)$stats['proofs'] ?></div><div class="l">Cadenas</div></div>
</div>

<div class="two-col">
  <div class="card">
    <h2>Mi árbol</h2>
    <?php if ($root): ?>
      <p>Persona raíz: <a href="/persons/<?= (int)$root['id'] ?>"><strong><?= e($root['primary_name']) ?></strong></a></p>
      <a class="btn" href="/pedigree">Ver pedigree</a>
      <a class="btn btn-outline" href="/persons/<?= (int)$root['id'] ?>">Añadir familiares</a>
    <?php else: ?>
      <p class="empty">Aún no hay persona raíz.</p>
      <a class="btn" href="/pedigree">Empezar / elegir raíz</a>
    <?php endif; ?>
  </div>
  <div class="card">
    <h2>Accesos rápidos</h2>
    <p>
      <?php if (Auth::canEdit()): ?>
        <a class="btn btn-sm" href="/pedigree">Mi árbol</a>
        <a class="btn btn-sm" href="/persons/create">Nueva persona</a>
        <a class="btn btn-sm btn-outline" href="/sources/create">Nueva fuente</a>
        <a class="btn btn-sm btn-outline" href="/memories/create">Nueva memoria</a>
        <a class="btn btn-sm btn-outline" href="/proof-chains/create">Nueva prueba</a>
        <a class="btn btn-sm btn-outline" href="/panel/import">Importar CSV/XML/GED</a>
      <?php else: ?>
        <span class="hint">Modo solo lectura (viewer).</span>
      <?php endif; ?>
    </p>
  </div>
</div>

<div class="card">
  <h2>Actividad reciente</h2>
  <?php if (!$recent): ?>
    <p class="empty">Sin actividad aún.</p>
  <?php else: ?>
    <table>
      <thead><tr><th>Cuándo</th><th>Quién</th><th>Acción</th><th>Resumen</th></tr></thead>
      <tbody>
      <?php foreach ($recent as $r): ?>
        <tr>
          <td><?= e($r['created_at']) ?></td>
          <td><?= e($r['user_name'] ?? '—') ?></td>
          <td><span class="badge"><?= e($r['action']) ?></span></td>
          <td><?= e($r['summary']) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>
