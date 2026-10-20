---
adr: 29
titulo: "Web Components em light DOM sem dependências"
status: Aceito
data: 2026-10-20
---

# ADR-029 — Web Components em light DOM sem dependências

**Status:** Aceito (20/10/2026, onda 3, issue #81). Complementa o [ADR-028](0028-pacote-ds-css-classes-semec.md), que deixou o comportamento fora do `@semec/ds-css`.

**Contexto.** O `@semec/ds-css` entregou o visual do kit para HTML, PHP e outras stacks sem React, mas deixou de fora os componentes que dependem de comportamento: Dialog, AlertDialog, Tabs, Combobox, DropdownMenu e Accordion. Sem eles, cada sistema da prefeitura reescreveria foco preso, navegação por setas e `aria-activedescendant` à mão, que é justamente onde os erros de acessibilidade aparecem (WCAG 2.1 AA é bloqueante, [ADR-014](0014-wcag-21-aa-criterio-bloqueante.md)). O público são páginas renderizadas no servidor, muitas sem bundler, algumas trocando trechos por HTMX ou Turbo.

Restrições: o mesmo comportamento do kit React (Radix, [ADR-005](0005-radix-ui-base-comportamento-acessibilidade.md)); o visual vem das classes do `@semec/ds-css`, sem cópia; conteúdo legível sem JavaScript; somente ESM ([ADR-027](0027-sem-build-commonjs.md)); nada de cor literal nem `style` inline.

**Decisão.** Criamos o pacote `@semec/ds-elements` (`packages/elements/`) com cinco custom elements: `<semec-dialog>`, `<semec-tabs>`, `<semec-combobox>`, `<semec-menu>` e `<semec-accordion>`.

1. **Light DOM, sem shadow DOM.** O autor escreve o HTML semântico com as classes `.semec-*`; o elemento envolve esse HTML e só acrescenta comportamento e ARIA. Assim o CSS do `@semec/ds-css` (e o do app) alcança tudo, `<label for>` e formulários funcionam, e ferramentas como axe e leitores de tela veem a árvore real.
2. **Aprimoramento progressivo.** Sem JavaScript: abas viram sumário de links com todos os painéis, acordeão fica aberto, menu vira lista de botões e links, e o combobox é um `<select>` nativo, que continua sendo a fonte das opções e o valor do formulário depois do JavaScript. O diálogo é o único que não funciona sem JavaScript; a recomendação é um link como gatilho para uma página equivalente.
3. **Estados do Radix como API de estilo.** Os elementos põem os mesmos atributos que o Radix põe no kit (`data-state`, `data-highlighted`, `data-disabled`, `aria-selected`, `aria-expanded`, `hidden`), e o `@semec/ds-css` estiliza por eles. Nenhuma classe de estado própria; nada depende do CSS para esconder. No combobox, `aria-selected="true"` fica na opção ativa (a do `aria-activedescendant`, como no APG e no kit) e a escolhida é marcada com `data-state="checked"`.
4. **Comportamento = APG = kit.** Teclado e foco seguem os padrões WAI-ARIA APG. Onde o Radix difere do APG, vale o APG: no menu, ↑ no botão abre no último item, as setas voltam ao início e Tab fecha; o combobox é editável ("Editable Combobox With List Autocomplete"). O diálogo usa o `<dialog>` nativo com `showModal()` (fundo inerte, camada superior) e acrescenta o que o nativo não faz: foco circulando dentro, foco de volta ao gatilho, `role="alertdialog"` sem fechar no fundo e trava de rolagem.
5. **Sem dependências de runtime.** Nada de Lit nem floating-ui. O posicionamento do popup é do CSS (abaixo do gatilho); o elemento só marca `data-side="top"` quando não cabe embaixo. A trava de rolagem usa uma folha construída (`adoptedStyleSheets`) com uma regra por atributo no `<html>`, sem `style` inline e sem esbarrar em CSP.
6. **Publicação.** TypeScript em `src/`, build com tsup: `dist/index.js` (classes + `defineSemecElements()`, com tipos, sem efeito colateral), `./auto` (registra ao importar) e `dist/semec-elements.js` (arquivo único minificado para `<script type="module">` no CDN). `defineSemecElements()` ignora tags já registradas: duas cópias na página não quebram. Cada elemento monta no `connectedCallback` e remove os ouvintes no `disconnectedCallback` (`AbortController`), então mover ou trocar o HTML não duplica comportamento. Importar no servidor (sem `HTMLElement`) não quebra.
7. **Testes no navegador.** `npm run test --workspace @semec/ds-elements` (também no `test:pacotes`) roda no Playwright: Chromium sempre, Firefox e WebKit quando instalados. Cobre teclado completo, foco, ARIA, axe-core em cada estado aberto (com o CSS atual do `@semec/ds-css`), fallback sem JavaScript, envio de formulário, registro duplo, reconexão e `data-side`, além da paridade: a mesma sequência de teclas na bancada dos elementos e nos componentes React do kit tem de dar o mesmo foco e o mesmo estado.

**Alternativas descartadas.**

- *Shadow DOM com estilos encapsulados.* Isolaria o CSS do `@semec/ds-css` e do app, quebraria `<label for>`, a participação em formulários (exigiria `ElementInternals`) e as referências ARIA por id entre árvores.
- *Lit ou outra biblioteca de componentes.* Resolve reatividade que esses elementos não precisam e acrescenta dependência e versão para acompanhar.
- *Script de comportamento por atributos (`data-*`), sem custom elements.* Precisaria de inicialização manual e não teria ciclo de vida: HTML trocado por HTMX ficaria sem comportamento ou com ouvintes duplicados.
- *Recomendar só elementos nativos (`<details>`, `<select>`, `<dialog>` cru).* `<details>` não dá o padrão de botão em heading com região; `<select>` não filtra; o `<dialog>` cru não devolve o foco em todos os navegadores nem tem o modo alerta.
- *Floating-ui para posicionar.* Para um popup abaixo do gatilho, o CSS resolve; a inversão para cima cobre o caso de borda.

**Consequências.**

- HTML, PHP, Django e Flask passam a ter os cinco componentes interativos com o comportamento do kit, com uma linha de `<script>`.
- O contrato entre os pacotes são os atributos de estado do Radix: mudar um deles exige mudar o `@semec/ds-css` junto. Renomear uma tag, um atributo de configuração ou um evento é mudança *major*.
- O teste de paridade usa o `dist` do kit (`npm run build:ds`) e o do `@semec/ds-css`: mudança de comportamento no Radix aparece como falha aqui.
- Ficam para depois: `<optgroup>` no combobox, submenus e itens de marcar no menu, e a verificação com leitores de tela reais, que a bateria automática não substitui.
