<?php /** Parcial "pular-para-o-conteudo". Use semec_render('pular-para-o-conteudo', [...]). */ ?>
<a href="#<?= semec_e(semec_param($p, 'alvo', 'conteudo')) ?>" class="semec-skip-link"><?= semec_e(semec_param($p, 'texto', 'Pular para o conteúdo principal')) ?></a>
