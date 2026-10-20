<?php
/**
 * Parcial "combobox". Use semec_render('combobox', [...]).
 * Um <select> nativo dentro do <semec-combobox> (@semec/ds-elements): sem
 * JavaScript, o select funciona sozinho; com ele, vira campo com filtro. O
 * elemento envolve só o <select> (o popup abre colado ao campo, não depois da
 * dica ou do erro). O campo de busca assume o id: o link do resumo é #id.
 */
$id = (string) semec_param($p, 'id', '');
$valor = semec_param($p, 'valor');
$dica = semec_param($p, 'dica');
$erro = semec_param($p, 'erro');
$dicaId = ($dica !== null && $erro === null) ? $id . '-hint' : null;
$erroId = $erro !== null ? $id . '-error' : null;
$descritores = implode(' ', array_filter([$dicaId, $erroId]));
?>
<div class="semec-form-field">
  <label for="<?= semec_e($id) ?>" class="semec-label"><?= semec_e(semec_param($p, 'rotulo')) ?><?php if (!empty($p['obrigatorio'])): ?><span class="semec-label__required" aria-hidden="true"> *</span><?php endif ?></label>
  <semec-combobox class="semec-combobox"<?= semec_attr('empty-text', semec_param($p, 'texto_vazio')) ?>>
    <select<?= semec_attr('id', $id) . semec_attr('name', semec_param($p, 'nome', $id)) ?> class="semec-field"<?= semec_attr('required', !empty($p['obrigatorio'])) . semec_attr('disabled', !empty($p['desabilitado'])) . semec_attr('aria-invalid', $erro !== null ? 'true' : null) . semec_attr('aria-describedby', $descritores) ?>>
<?php if (semec_param($p, 'opcao_vazia') !== null): ?>
      <option value=""><?= semec_e($p['opcao_vazia']) ?></option>
<?php endif ?>
<?php foreach (($p['opcoes'] ?? []) as $opcao): ?>
      <option value="<?= semec_e($opcao['valor'] ?? '') ?>"<?= semec_attr('selected', $valor !== null && (string) ($opcao['valor'] ?? '') === (string) $valor) ?>><?= semec_e($opcao['texto'] ?? '') ?></option>
<?php endforeach ?>
    </select>
  </semec-combobox>
<?php if ($dicaId !== null): ?>
  <p id="<?= semec_e($dicaId) ?>" class="semec-hint"><?= semec_e($dica) ?></p>
<?php endif ?>
<?php if ($erroId !== null): ?>
  <p id="<?= semec_e($erroId) ?>" class="semec-error"><?= semec_e($erro) ?></p>
<?php endif ?>
</div>
