<?php
/** Parcial "resumo-de-erros". Use semec_render('resumo-de-erros', [...]). Sem erros, não imprime nada. */
// Aceita a lista [['campo' => 'cpf', 'mensagem' => '…']] ou o mapa ['cpf' => '…']
// (o mesmo que a parcial "campo" lê). Item sem campo ou sem mensagem não vira link.
$itens = [];
foreach ((is_array($p['erros'] ?? null) ? $p['erros'] : []) as $chave => $erro) {
    if (is_array($erro)) {
        $itens[] = [$erro['campo'] ?? null, $erro['mensagem'] ?? null];
    } elseif (is_string($chave)) {
        $itens[] = [$chave, $erro];
    }
}
$itens = array_values(array_filter($itens, static fn (array $i): bool => is_scalar($i[0]) && (string) $i[0] !== '' && is_scalar($i[1]) && (string) $i[1] !== ''));
$id = (string) semec_param($p, 'id', 'resumo-de-erros');
$focar = !empty($p['focar'] ?? true);
?>
<?php if (!empty($itens)): ?>
<div id="<?= semec_e($id) ?>" class="semec-error-summary" role="alert" tabindex="-1" aria-labelledby="<?= semec_e($id) ?>-titulo"<?= semec_attr('autofocus', $focar) ?>>
  <h2 id="<?= semec_e($id) ?>-titulo" class="semec-error-summary__title"><?= semec_e(semec_param($p, 'titulo', 'Há um problema')) ?></h2>
  <ul class="semec-error-summary__list">
<?php foreach ($itens as [$campo, $mensagem]): ?>
    <li><a href="#<?= semec_e($campo) ?>"><?= semec_e($mensagem) ?></a></li>
<?php endforeach ?>
  </ul>
</div>
<?php endif ?>
