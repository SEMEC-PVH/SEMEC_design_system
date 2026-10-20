<?php
/** Parcial "botao". Use semec_render('botao', [...]). */
$variante = semec_opcao($p, 'variante', ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success', 'link'], 'primary');
$tamanho = semec_opcao($p, 'tamanho', ['sm', 'md', 'lg'], 'md');
$classe = 'semec-btn semec-btn--' . $variante . ($tamanho !== 'md' ? ' semec-btn--' . $tamanho : '');
$href = semec_param($p, 'href');
$desabilitado = !empty($p['desabilitado']);
$extras = semec_atributos($p['atributos'] ?? null, ['aria-label', 'aria-disabled']);
?>
<?php if ($href !== null): ?>
<a<?= semec_attr('href', $desabilitado ? null : $href) ?> class="<?= semec_e($classe) ?>"<?= semec_attr('id', semec_param($p, 'id')) ?><?= semec_attr('aria-disabled', $desabilitado ? 'true' : null) ?><?= semec_attr('aria-label', semec_param($p, 'rotulo')) ?><?= $extras ?>><?= semec_e(semec_param($p, 'texto')) ?></a>
<?php else: ?>
<button type="<?= semec_opcao($p, 'tipo', ['button', 'submit', 'reset'], 'button') ?>" class="<?= semec_e($classe) ?>"<?= semec_attr('id', semec_param($p, 'id')) ?><?= semec_attr('name', semec_param($p, 'nome')) ?><?= semec_attr('value', semec_param($p, 'valor')) ?><?= semec_attr('disabled', $desabilitado) ?><?= semec_attr('aria-label', semec_param($p, 'rotulo')) ?><?= $extras ?>><?= semec_e(semec_param($p, 'texto')) ?></button>
<?php endif ?>
