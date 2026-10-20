---
"@semec/ds-css": minor
---

Modelos de servidor: parciais novas `combobox` (um `<select>` dentro do `<semec-combobox>`, com a lista colada ao campo), `radio-grupo` e `checkbox` (caixa única ou grupo em `<fieldset>`), nas quatro linguagens. `campo` e `botao` aceitam `atributos` (só `data-*`, `aria-*` e uma lista de atributos de formulário, com o valor escapado), para os gatilhos do `@semec/ds-elements`, `inputmode`, `maxlength` e afins. O `resumo-de-erros` aceita também o mapa `campo → mensagem` (o mesmo do `erro` de cada campo) e não gera link para item sem campo ou mensagem. O `cabecalho` sem `marca_src` não gera mais `<img src="">`. O README dos modelos corrige os exemplos (um mapa de erros só, `<h1>`, `StrictUndefined`, Blade isolado com `view()->render()`), explica a configuração de autoescape do Flask para `.jinja` e diz que a marca não vem no pacote; os exemplos rodam no teste como estão.
