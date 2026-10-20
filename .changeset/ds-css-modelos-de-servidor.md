---
"@semec/ds-css": minor
---

Modelos oficiais de servidor em `templates/` (ADR-030): as parciais `pagina`, `pular-para-o-conteudo`, `cabecalho`, `rodape`, `campo`, `resumo-de-erros`, `alerta` e `botao` em PHP puro, Jinja2 (Django com django-jinja e Flask), Twig e Blade, com os mesmos nomes e parâmetros (tabela em `templates/README.md`), escape em toda saída e o HTML e o ARIA dos componentes React. O layout `pagina` carrega o CSS, as fontes e o `@semec/ds-elements`. As quatro linguagens são testadas contra um HTML canônico único, com axe-core, classes do `classes.json` e XSS.
