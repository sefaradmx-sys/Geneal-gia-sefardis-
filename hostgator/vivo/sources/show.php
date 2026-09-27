<div class="toolbar">
  <h1 style="margin:0"><?= e($source['title']) ?></h1>
  <?php if (!empty($canEdit)): ?>
    <div style="display:flex;gap:.4rem">
      <a class="btn btn-sm" href="/sources/<?= (int)$source['id'] ?>/edit">Editar</a>
      <form method="post" action="/sources/<?= (int)$source['id'] ?>/delete" onsubmit="return confirm('¿Eliminar fuente?')">
        <?= csrf_field() ?>
        <button class="btn btn-sm btn-danger" type="submit">Eliminar</button>
      </form>
    </div>
  <?php endif; ?>
</div>

<div class="two-col">
  <div class="card">
    <h2>Citación</h2>
    <p><?= nl2br(e($source['citation'] ?? '—')) ?></p>
    <?php if ($source['notes']): ?>
      <h3>Notas</h3>
      <p><?= nl2br(e($source['notes'])) ?></p>
    <?php endif; ?>
    <p class="hint"><span class="badge"><?= e(visibility_label($source['visibility'] ?? 'private')) ?></span> · Creada por <?= e($source['author'] ?? '—') ?> · <?= e($source['created_at']) ?></p>
  </div>
  <div class="card">
    <h2>Documento / imagen</h2>
    <?php if ($source['media_path']): ?>
      <?php
        $cover = !empty($source['cover_path']) ? '/media/cover/' . (int)$source['id'] : null;
        render_media_viewer('/media/source/' . (int)$source['id'], $source['media_path'], $source['title'], $cover);
      ?>
    <?php else: ?>
      <p class="empty">Sin archivo adjunto.</p>
    <?php endif; ?>
  </div>
</div>

<div class="card">
  <h2>Adjuntos a entidades</h2>
  <?php if (!$attachments): ?><p class="empty">No está adjunta a ninguna persona/hecho.</p>
  <?php else: ?>
    <table>
      <thead><tr><th>Tipo</th><th>Entidad</th><th>Razón</th></tr></thead>
      <tbody>
      <?php foreach ($attachments as $a): ?>
        <tr>
          <td><?= e($a['attachable_type']) ?></td>
          <td><a href="<?= e($a['url']) ?>"><?= e($a['label']) ?></a></td>
          <td><?= e($a['reason_statement'] ?? '') ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>
