<div class="toolbar">
  <h1 style="margin:0">Fuentes</h1>
  <div style="display:flex;gap:.5rem;flex-wrap:wrap">
    <form class="search-form" method="get" action="/sources">
      <input type="search" name="q" value="<?= e($q) ?>" placeholder="Buscar fuentes…">
      <button class="btn" type="submit">Buscar</button>
    </form>
    <?php if (Auth::canEdit()): ?>
      <a class="btn" href="/sources/create">Nueva fuente</a>
    <?php endif; ?>
  </div>
</div>
<div class="card" style="padding:0;overflow:auto">
  <table>
    <thead><tr><th>Título</th><th>Visibilidad</th><th>Citación</th><th>Autor</th><th>Fecha</th></tr></thead>
    <tbody>
    <?php if (!$sources): ?>
      <tr><td colspan="5" class="empty">Sin fuentes.</td></tr>
    <?php else: foreach ($sources as $s): ?>
      <tr>
        <td><a href="/sources/<?= (int)$s['id'] ?>"><strong><?= e($s['title']) ?></strong></a></td>
        <td><span class="badge"><?= e(visibility_label($s['visibility'] ?? 'private')) ?></span></td>
        <td><?= e(mb_substr($s['citation'] ?? '', 0, 100)) ?></td>
        <td><?= e($s['author'] ?? '—') ?></td>
        <td><?= e($s['created_at']) ?></td>
      </tr>
    <?php endforeach; endif; ?>
    </tbody>
  </table>
</div>
