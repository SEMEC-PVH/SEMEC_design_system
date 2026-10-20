# @semec/ds-elements

## 1.0.0

### Major Changes

- 1307a75: Primeira versão do `@semec/ds-elements`: Web Components acessíveis para HTML, PHP e qualquer stack sem React. `<semec-dialog>` (inclusive `alert`), `<semec-tabs>`, `<semec-combobox>` (a partir de um `<select>` nativo, que continua sendo o valor do formulário), `<semec-menu>` e `<semec-accordion>`, em light DOM e sem dependências de runtime. Seguem os padrões WAI-ARIA APG e põem os mesmos atributos de estado do Radix (`data-state`, `data-highlighted`, `data-disabled`, `aria-selected`, `aria-expanded`, `hidden`), que as classes `.semec-*` do `@semec/ds-css` estilizam. Sem JavaScript, o conteúdo continua legível. Publica `dist/index.js` (classes + `defineSemecElements()`), `./auto` e `dist/semec-elements.js`, arquivo único para `<script type="module">` no CDN (ADR-029). Exige o `@semec/ds-css` 1.1.0 ou mais novo (as classes interativas). Partes acrescentadas depois de montado (abas, itens, opções e atributos do `<select>`) são lidas de novo, e um link `#id` para um painel escondido de abas ou acordeão o mostra antes de navegar.
