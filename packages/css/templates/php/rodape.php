<?php
/** Parcial "rodape". Use semec_render('rodape', [...]). */
$secoes = $p['secoes'] ?? [];
?>
<footer class="semec-footer">
<?php if (!empty($secoes)): ?>
  <div class="semec-footer__content">
<?php foreach ($secoes as $secao): ?>
    <div class="semec-footer__section">
      <h2 class="semec-footer__title"><?= semec_e($secao['titulo'] ?? '') ?></h2>
      <ul class="semec-footer__links">
<?php foreach (($secao['links'] ?? []) as $link): ?>
        <li><a href="<?= semec_e($link['href'] ?? '') ?>" class="semec-footer__link"><?= semec_e($link['texto'] ?? '') ?></a></li>
<?php endforeach ?>
      </ul>
    </div>
<?php endforeach ?>
  </div>
<?php endif ?>
  <div class="semec-footer__bottom"><?= semec_e(semec_param($p, 'texto_final', 'Prefeitura de Porto Velho · SEMEC')) ?></div>
</footer>
