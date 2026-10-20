<?php
/** Parcial "alerta". Use semec_render('alerta', [...]). Ícones Lucide, como no Alert do kit. */
$variante = semec_opcao($p, 'variante', ['info', 'success', 'warning', 'danger'], 'info');
// Como no Alert do kit: só "danger" interrompe (role="alert"); os demais são role="status".
$anuncio = semec_opcao($p, 'anuncio', ['assertive', 'polite', 'off'], $variante === 'danger' ? 'assertive' : 'polite');
$papel = ['assertive' => 'alert', 'polite' => 'status', 'off' => null][$anuncio];
$titulo = semec_param($p, 'titulo');
?>
<div<?= semec_attr('id', semec_param($p, 'id')) ?><?= semec_attr('role', $papel) ?> class="semec-alert semec-alert--<?= $variante ?>">
<?php if ($variante === 'success'): ?>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m16 9-5.5 5.5L8 12"></path></svg>
<?php elseif ($variante === 'warning'): ?>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
<?php elseif ($variante === 'danger'): ?>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
<?php else: ?>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
<?php endif ?>
<?php if ($titulo !== null): ?>
  <div class="semec-alert__title"><?= semec_e($titulo) ?></div>
<?php endif ?>
  <div class="semec-alert__description"><p><?= semec_e(semec_param($p, 'descricao')) ?></p></div>
</div>
