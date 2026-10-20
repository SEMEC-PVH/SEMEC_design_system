<?php
/**
 * Parcial "checkbox". Use semec_render('checkbox', [...]).
 * Sem "opcoes": uma caixa só (ex.: declaração), com o rótulo ao lado.
 * Com "opcoes": um grupo em <fieldset>/<legend>; "valor" é a lista das marcadas
 * e o primeiro checkbox leva o id (link do resumo: #id).
 */
$id = (string) semec_param($p, 'id', '');
$nome = semec_param($p, 'nome', $id);
$dica = semec_param($p, 'dica');
$erro = semec_param($p, 'erro');
$obrigatorio = !empty($p['obrigatorio']);
$dicaId = ($dica !== null && $erro === null) ? $id . '-hint' : null;
$erroId = $erro !== null ? $id . '-error' : null;
$descritores = implode(' ', array_filter([$dicaId, $erroId]));
$opcoes = array_values(is_array($p['opcoes'] ?? null) ? $p['opcoes'] : []);
$marcados = array_map('strval', array_filter((array) ($p['valor'] ?? []), 'is_scalar'));
$invalido = semec_attr('aria-invalid', $erro !== null ? 'true' : null);
?>
<?php if (empty($opcoes)): ?>
<div class="semec-form-field">
  <label class="semec-choice"><input type="checkbox"<?= semec_attr('id', $id) . semec_attr('name', $nome) . semec_attr('value', semec_param($p, 'valor')) ?> class="semec-checkbox"<?= semec_attr('checked', !empty($p['marcado'])) . semec_attr('required', $obrigatorio) . semec_attr('disabled', !empty($p['desabilitado'])) . $invalido . semec_attr('aria-describedby', $descritores) ?>> <?= semec_e(semec_param($p, 'rotulo')) ?><?php if ($obrigatorio): ?><span class="semec-label__required" aria-hidden="true"> *</span><?php endif ?></label>
<?php else: ?>
<fieldset class="semec-form-field"<?= semec_attr('disabled', !empty($p['desabilitado'])) . semec_attr('aria-describedby', $descritores) ?>>
  <legend class="semec-label"><?= semec_e(semec_param($p, 'rotulo')) ?><?php if ($obrigatorio): ?><span class="semec-label__required" aria-hidden="true"> *</span><?php endif ?></legend>
<?php foreach ($opcoes as $i => $opcao): ?>
  <label class="semec-choice"><input type="checkbox"<?= semec_attr('id', $i === 0 ? $id : $id . '-' . ($i + 1)) . semec_attr('name', $nome) ?> value="<?= semec_e($opcao['valor'] ?? '') ?>" class="semec-checkbox"<?= semec_attr('checked', in_array((string) ($opcao['valor'] ?? ''), $marcados, true)) . $invalido ?>> <?= semec_e($opcao['texto'] ?? '') ?></label>
<?php endforeach ?>
<?php endif ?>
<?php if ($dicaId !== null): ?>
  <p id="<?= semec_e($dicaId) ?>" class="semec-hint"><?= semec_e($dica) ?></p>
<?php endif ?>
<?php if ($erroId !== null): ?>
  <p id="<?= semec_e($erroId) ?>" class="semec-error"><?= semec_e($erro) ?></p>
<?php endif ?>
<?php if (empty($opcoes)): ?>
</div>
<?php else: ?>
</fieldset>
<?php endif ?>
