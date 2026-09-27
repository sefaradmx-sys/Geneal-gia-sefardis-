<div class="investigar" id="investigar">
  <p class="kicker">Genealogía Sefardí</p>
  <h1>Investiga un nombre y el censo de su municipio</h1>
  <p class="lede">Al buscar, este servidor le pide la respuesta a VIAF, Wikidata, WikiTree, la Library of Congress, los Archivos Nacionales de Estados Unidos, datos.gob.mx y el catálogo del INEGI. Las fichas aparecen aquí. La ficha censal del municipio se carga desde el INEGI.</p>
  <form class="consulta" id="busqueda-viva">
    <label>Nombre <input id="nombre" name="nombre" autocomplete="given-name"></label>
    <label>Apellido <input id="apellido" name="apellido" autocomplete="family-name"></label>
    <label>Lugar <input id="lugar" name="lugar" placeholder="Municipio, estado"></label>
    <label>Año <input id="ano" name="ano" inputmode="numeric" maxlength="4" placeholder="1930"></label>
    <button type="submit">Consultar los servidores</button>
  </form>
  <div class="resultados" id="resultados"></div>
  <div class="fuentes-vivas" id="fuentes">
    <a id="fuente-familysearch" href="https://www.familysearch.org/search/record/results?q.any=sefardi">FamilySearch</a>
    <a id="fuente-inegi" href="#censos">Censo INEGI</a>
    <a id="fuente-ahn" href="https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=sefardi%20Archivo%20Hist%C3%B3rico%20Nacional">Archivo Histórico Nacional</a>
    <a id="fuente-agi" href="https://pares.mcu.es/ParesBusquedas20/catalogo/search?q=sefardi%20Archivo%20General%20de%20Indias">Archivo General de Indias</a>
    <a id="fuente-historypin" href="https://www.historypin.org/en/search?q=sefardi">Historypin</a>
    <a id="fuente-wikitree" href="https://www.wikitree.com/wiki/Special:SearchPerson">WikiTree</a>
    <a id="fuente-viaf" href="https://viaf.org/viaf/search?query=local.personalNames%20all%20%22sefardi%22">VIAF</a>
    <a id="fuente-arbol" href="https://arbol.genealogiasefardi.site/index.php?route=%2Fsefarad-mx%2Ftree%2Fsefarad">Árbol Sefarad</a>
    <a id="fuente-archivo" href="/search">Buscar en este archivo</a>
  </div>

  <section id="censos">
    <h2>Censo histórico por municipio</h2>
    <p>Escribe el municipio. Al elegirlo aparece la ficha del INEGI con los censos de esa cabecera, y el enlace a las imágenes del padrón de 1930 en FamilySearch.</p>
    <div class="panel-censo">
      <div class="censo-busqueda">
        <label>Municipio <input id="municipio" placeholder="Ejemplo: Monterrey"></label>
        <div class="lista-municipios" id="lista-municipios"></div>
      </div>
      <div class="visor">
        <p class="ficha-meta" id="ficha-meta">Elige un municipio para ver la ficha censal.</p>
        <p class="anios" id="anios-censo"></p>
        <p><a class="accion secundaria" id="imagen-familysearch" hidden href="https://www.familysearch.org/search/collection/1307314">Ver las imágenes del censo de 1930 en FamilySearch</a></p>
        <iframe id="ficha-censo" title="Ficha censal del INEGI" src="about:blank"></iframe>
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
