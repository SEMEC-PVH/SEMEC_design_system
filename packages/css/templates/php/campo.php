<?php
/** Parcial "campo". Use semec_render('campo', [...]). */
$id = (string) semec_param($p, 'id', '');
$tipo = semec_opcao($p, 'tipo', ['text', 'email', 'tel', 'number', 'date', 'password', 'url', 'search', 'textarea', 'select'], 'text');
$valor = semec_param($p, 'valor');
$dica = semec_param($p, 'dica');
$erro = semec_param($p, 'erro');
// Como no FormField do kit: com erro, a mensagem substitui a dica.
$dicaId = ($dica !== null && $erro === null) ? $id . '-hint' : null;
$erroId = $erro !== null ? $id . '-error' : null;
$descritores = implode(' ', array_filter([$dicaId, $erroId]));
$atributos = semec_attr('id', $id)
    . semec_attr('name', semec_param($p, 'nome', $id))
    . ($tipo !== 'textarea' && $tipo !== 'select' ? semec_attr('type', $tipo) : '')
    . ' class="semec-field"'
    . ($tipo !== 'textarea' && $tipo !== 'select' ? semec_attr('value', $valor) : '')
    . semec_attr('autocomplete', semec_param($p, 'autocomplete'))
    . semec_attr('required', !empty($p['obrigatorio']))
    . semec_attr('disabled', !empty($p['desabilitado']))
    . semec_attr('aria-invalid', $erro !== null ? 'true' : null)
    . semec_attr('aria-describedby', $descritores);
?>
<div class="semec-form-field">
  <label for="<?= semec_e($id) ?>" class="semec-label"><?= semec_e(semec_param($p, 'rotulo')) ?><?php if (!empty($p['obrigatorio'])): ?><span class="semec-label__required" aria-hidden="true"> *</span><?php endif ?></label>
<?php if ($tipo === 'textarea'): ?>
  <textarea<?= $atributos ?>><?= semec_e($valor) ?></textarea>
<?php elseif ($tipo === 'select'): ?>
  <select<?= $atributos ?>>
<?php if (semec_param($p, 'opcao_vazia') !== null): ?>
    <option value=""><?= semec_e($p['opcao_vazia']) ?></option>
<?php endif ?>
<?php foreach (($p['opcoes'] ?? []) as $opcao): ?>
    <option value="<?= semec_e($opcao['valor'] ?? '') ?>"<?= semec_attr('selected', $valor !== null && (string) ($opcao['valor'] ?? '') === (string) $valor) ?>><?= semec_e($opcao['texto'] ?? '') ?></option>
<?php endforeach ?>
  </select>
<?php else: ?>
  <input<?= $atributos ?>>
<?php endif ?>
<?php if ($dicaId !== null): ?>
  <p id="<?= semec_e($dicaId) ?>" class="semec-hint"><?= semec_e($dica) ?></p>
<?php endif ?>
<?php if ($erroId !== null): ?>
  <p id="<?= semec_e($erroId) ?>" class="semec-error"><?= semec_e($erro) ?></p>
<?php endif ?>
</div>
