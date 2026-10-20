# @semec/ds-css

## 1.1.0

### Minor Changes

- 87e633f: Classes dos componentes interativos, geradas do TSX/`cva` do kit como as demais: diálogo e alerta (`semec-dialog`, `semec-dialog--alert`, no `<dialog>` nativo, com o overlay no `::backdrop`), abas (`semec-tabs__*`), combobox (`semec-combobox__*`), menu (`semec-menu`, `semec-menu__*`) e accordion (`semec-accordion__*`). Os estados são os atributos do Radix (`data-state`, `data-highlighted`, `data-disabled`, `aria-selected`, `aria-expanded`, `hidden`; a opção escolhida do combobox leva `data-state="checked"` e a ativa, `data-highlighted`), os mesmos que os elementos `<semec-*>` do `@semec/ds-elements` põem. O popup do combobox e do menu é posicionado pelo CSS, abaixo do gatilho, e sobe com `data-side="top"`. A paridade compara cada um aberto com o React (estilo computado, posição, screenshot e axe).
- d929b63: Modelos oficiais de servidor em `templates/` (ADR-030): as parciais `pagina`, `pular-para-o-conteudo`, `cabecalho`, `rodape`, `campo`, `resumo-de-erros`, `alerta` e `botao` em PHP puro, Jinja2 (Django com django-jinja e Flask), Twig e Blade, com os mesmos nomes e parâmetros (tabela em `templates/README.md`), escape em toda saída e o HTML e o ARIA dos componentes React. O layout `pagina` carrega o CSS, as fontes e o `@semec/ds-elements`. As quatro linguagens são testadas contra um HTML canônico único, com axe-core, classes do `classes.json` e XSS.
- e79e682: Modelos de servidor: parciais novas `combobox` (um `<select>` dentro do `<semec-combobox>`, com a lista colada ao campo), `radio-grupo` e `checkbox` (caixa única ou grupo em `<fieldset>`), nas quatro linguagens. `campo` e `botao` aceitam `atributos` (só `data-*`, `aria-*` e uma lista de atributos de formulário, com o valor escapado), para os gatilhos do `@semec/ds-elements`, `inputmode`, `maxlength` e afins. O `resumo-de-erros` aceita também o mapa `campo → mensagem` (o mesmo do `erro` de cada campo) e não gera link para item sem campo ou mensagem. O `cabecalho` sem `marca_src` não gera mais `<img src="">`. O README dos modelos corrige os exemplos (um mapa de erros só, `<h1>`, `StrictUndefined`, Blade isolado com `view()->render()`), explica a configuração de autoescape do Flask para `.jinja` e diz que a marca não vem no pacote; os exemplos rodam no teste como estão.

### Patch Changes

- d504019: Foco visível em alto contraste do Windows (`forced-colors: active`, WCAG 2.4.7): os componentes trocam `outline-none` por `outline-hidden` (Tailwind v4), um contorno transparente que o navegador pinta com a cor do sistema quando o anel `ring-*` (box-shadow) é removido. O item ativo do menu e do Select e a opção ativa do Combobox passam a usar `Highlight`/`HighlightText` nesse modo, e a aba ativa mantém a barra. Com cores normais, nada muda na tela. O `AccordionTrigger` alinha a pergunta longa ao início da linha (`text-start`). O avaliador de classes do kit aceita fixar uma expressão de estado pelo texto exato (usado pelo `@semec/ds-css` no Combobox).

  No `@semec/ds-css`, as mesmas classes chegam ao CSS gerado, e mais: sem JavaScript, o popup do `<semec-menu>` fica no fluxo da página em vez de cobrir o conteúdo; o item `disabled` (ou `aria-disabled`) aparece apagado; o popup do menu e do combobox alinha pela direita com `data-align="end"` e nunca passa de `calc(100vw - 2rem)`; o listbox e o menu dentro de `.semec-dialog` entram no fluxo do diálogo e não são cortados pela rolagem dele; `prefers-reduced-motion` também vale para o `::backdrop`; e o campo alvo do link do resumo de erros tem margem de rolagem para o rótulo continuar visível.

- Updated dependencies [03072f3]
  - @semec/ds-tokens@1.0.1

## 1.0.0

### Major Changes

- 30cf9d2: Primeira versão do `@semec/ds-css`: CSS puro com classes `.semec-*` (botão, campos, checkbox e rádio nativos, cartão, alerta, cabeçalho, rodapé, pular para o conteúdo, tabela, resumo de erros, badge, toast e títulos) para HTML, PHP e qualquer stack sem React. As classes são geradas dos mesmos `cva`/classes dos componentes React do `@semec/ds` e têm teste de paridade de estilo e screenshot. Publica `components.css`, `index.css` (com os tokens e a base do `@semec/ds-tokens`) e `dist/semec-ds.css`, arquivo único para `<link>` e CDN (ADR-028).

### Patch Changes

- Updated dependencies [30cf9d2]
  - @semec/ds-tokens@1.0.0
