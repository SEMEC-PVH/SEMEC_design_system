<?php
/** Parcial "resumo-de-erros". Use semec_render('resumo-de-erros', [...]). Sem erros, não imprime nada. */
$erros = $p['erros'] ?? [];
$id = (string) semec_param($p, 'id', 'resumo-de-erros');
$focar = !empty($p['focar'] ?? true);
?>
<?php if (!empty($erros)): ?>
<div id="<?= semec_e($id) ?>" class="semec-error-summary" role="alert" tabindex="-1" aria-labelledby="<?= semec_e($id) ?>-titulo"<?= semec_attr('autofocus', $focar) ?>>
  <h2 id="<?= semec_e($id) ?>-titulo" class="semec-error-summary__title"><?= semec_e(semec_param($p, 'titulo', 'Há um problema')) ?></h2>
  <ul class="semec-error-summary__list">
<?php foreach ($erros as $erro): ?>
    <li><a href="#<?= semec_e($erro['campo'] ?? '') ?>"><?= semec_e($erro['mensagem'] ?? '') ?></a></li>
<?php endforeach ?>
  </ul>
</div>
<?php endif ?>
