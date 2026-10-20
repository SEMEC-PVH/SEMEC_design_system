<?php
/** Parcial "cabecalho". Use semec_render('cabecalho', [...]). */
$servico = semec_param($p, 'servico');
$nav = $p['nav'] ?? [];
?>
<header class="semec-header">
  <a href="<?= semec_e(semec_param($p, 'inicio', '/')) ?>" class="semec-header__brand">
    <img src="<?= semec_e(semec_param($p, 'marca_src')) ?>" alt="<?= semec_e(semec_param($p, 'marca_alt', 'Prefeitura de Porto Velho')) ?>" width="<?= semec_e(semec_param($p, 'marca_largura', 90)) ?>" height="<?= semec_e(semec_param($p, 'marca_altura', 36)) ?>">
    <span aria-hidden="true" class="semec-header__divider"></span>
    <span class="semec-header__org"><?= semec_e(semec_param($p, 'orgao', 'SEMEC')) ?><?php if ($servico !== null): ?> <span aria-hidden="true" class="semec-header__separator">|</span> <span class="semec-header__service"><?= semec_e($servico) ?></span><?php endif ?></span>
    <span class="semec-sr-only">— <?= semec_e(semec_param($p, 'rotulo_inicio', 'ir para o início')) ?></span>
  </a>
<?php if (!empty($nav)): ?>
  <nav aria-label="<?= semec_e(semec_param($p, 'nav_rotulo', 'Menu principal')) ?>" class="semec-header__nav">
<?php foreach ($nav as $item): ?>
    <a href="<?= semec_e($item['href'] ?? '') ?>" class="semec-header__link"<?= semec_attr('aria-current', !empty($item['atual']) ? 'page' : null) ?>><?= semec_e($item['texto'] ?? '') ?></a>
<?php endforeach ?>
  </nav>
<?php endif ?>
</header>
