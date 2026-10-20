<?php
/**
 * Parcial "radio-grupo". Use semec_render('radio-grupo', [...]).
 * <fieldset> com <legend>, um rádio por opção, dica e erro ligados ao grupo.
 * O primeiro rádio leva o id (o link do resumo é #id); os outros, id-2, id-3…
 */
$id = (string) semec_param($p, 'id', '');
$nome = semec_param($p, 'nome', $id);
$valor = semec_param($p, 'valor');
$dica = semec_param($p, 'dica');
$erro = semec_param($p, 'erro');
$obrigatorio = !empty($p['obrigatorio']);
$dicaId = ($dica !== null && $erro === null) ? $id . '-hint' : null;
$erroId = $erro !== null ? $id . '-error' : null;
$descritores = implode(' ', array_filter([$dicaId, $erroId]));
?>
<fieldset class="semec-form-field"<?= semec_attr('disabled', !empty($p['desabilitado'])) . semec_attr('aria-describedby', $descritores) ?>>
  <legend class="semec-label"><?= semec_e(semec_param($p, 'rotulo')) ?><?php if ($obrigatorio): ?><span class="semec-label__required" aria-hidden="true"> *</span><?php endif ?></legend>
<?php foreach (array_values($p['opcoes'] ?? []) as $i => $opcao): ?>
  <label class="semec-choice"><input type="radio"<?= semec_attr('id', $i === 0 ? $id : $id . '-' . ($i + 1)) . semec_attr('name', $nome) ?> value="<?= semec_e($opcao['valor'] ?? '') ?>" class="semec-radio"<?= semec_attr('checked', $valor !== null && (string) ($opcao['valor'] ?? '') === (string) $valor) . semec_attr('required', $obrigatorio) . semec_attr('aria-invalid', $erro !== null ? 'true' : null) ?>> <?= semec_e($opcao['texto'] ?? '') ?></label>
<?php endforeach ?>
<?php if ($dicaId !== null): ?>
  <p id="<?= semec_e($dicaId) ?>" class="semec-hint"><?= semec_e($dica) ?></p>
<?php endif ?>
<?php if ($erroId !== null): ?>
  <p id="<?= semec_e($erroId) ?>" class="semec-error"><?= semec_e($erro) ?></p>
<?php endif ?>
</fieldset>
