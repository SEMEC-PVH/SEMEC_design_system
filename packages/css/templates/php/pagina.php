<?php
/**
 * Parcial "pagina": layout base. Use semec_render('pagina', [...]) com
 * 'conteudo' => function () { ... } (imprime o HTML do app dentro do <main>)
 * e, opcionalmente, 'head' => function () { ... } (no fim do <head>).
 */
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= semec_e(semec_param($p, 'titulo')) ?></title>
<?php if (semec_param($p, 'fontes_href', '/css/fonts.css') !== false): ?>
  <link rel="stylesheet" href="<?= semec_e(semec_param($p, 'fontes_href', '/css/fonts.css')) ?>">
<?php endif ?>
  <link rel="stylesheet" href="<?= semec_e(semec_param($p, 'css_href', '/css/semec-ds.css')) ?>">
<?php if (semec_param($p, 'elements_src', '/js/semec-elements.js') !== false): ?>
  <script type="module" src="<?= semec_e(semec_param($p, 'elements_src', '/js/semec-elements.js')) ?>"></script>
<?php endif ?>
<?php semec_bloco($p['head'] ?? null) ?>
</head>
<body>
<?= semec_render('pular-para-o-conteudo', ['texto' => semec_param($p, 'pular_texto')]) ?>
<?php if (!empty($p['cabecalho'])): ?>
<?= semec_render('cabecalho', $p['cabecalho']) ?>
<?php endif ?>
<main id="conteudo" tabindex="-1">
<?php semec_bloco($p['conteudo'] ?? null) ?>
</main>
<?php if (!empty($p['rodape'])): ?>
<?= semec_render('rodape', $p['rodape']) ?>
<?php endif ?>
</body>
</html>
