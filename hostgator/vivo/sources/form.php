<h1><?= e($title) ?></h1>
<div class="card">
<form method="post" action="<?= e($action) ?>" enctype="multipart/form-data">
  <?= csrf_field() ?>
  <label for="title">Título *</label>
  <input type="text" id="title" name="title" required value="<?= e($source['title'] ?? '') ?>">
  <label for="citation">Citación</label>
  <textarea id="citation" name="citation"><?= e($source['citation'] ?? '') ?></textarea>
  <label for="notes">Notas</label>
  <textarea id="notes" name="notes"><?= e($source['notes'] ?? '') ?></textarea>
  <label for="visibility">Visibilidad</label>
  <select id="visibility" name="visibility">
    <?php
    $vis = $source['visibility'] ?? 'private';
    $opts = ['private' => 'Privada (solo usted)', 'shared' => 'Compartida (usuarios registrados)', 'archive' => 'Archivo público'];
    foreach ($opts as $k => $lab):
      if ($k === 'archive' && !Auth::isAdmin() && $vis !== 'archive') continue;
    ?>
      <option value="<?= $k ?>" <?= $vis === $k ? 'selected' : '' ?>><?= e($lab) ?></option>
    <?php endforeach; ?>
  </select>
  <p class="hint">Las fuentes <em>shared</em> y <em>archive</em> son visibles para todos los usuarios registrados; <em>archive</em> también aparece en el Archivo público si tiene media.</p>
  <label for="media">Archivo / imagen (jpg, png, pdf)</label>
  <input type="file" id="media" name="media" accept="image/*,.pdf">
  <?php if (!empty($source['media_path'])): ?>
    <p class="hint">Actual: <?= e($source['media_path']) ?></p>
  <?php endif; ?>
  <div class="form-actions">
    <button class="btn" type="submit">Guardar</button>
    <a class="btn btn-outline" href="<?= $source ? '/sources/'.(int)$source['id'] : '/sources' ?>">Cancelar</a>
  </div>
</form>
</div>
