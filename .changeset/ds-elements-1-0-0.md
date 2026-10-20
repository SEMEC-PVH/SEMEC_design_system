---
"@semec/ds-elements": major
---

Primeira versão do `@semec/ds-elements`: Web Components acessíveis para HTML, PHP e qualquer stack sem React. `<semec-dialog>` (inclusive `alert`), `<semec-tabs>`, `<semec-combobox>` (a partir de um `<select>` nativo, que continua sendo o valor do formulário), `<semec-menu>` e `<semec-accordion>`, em light DOM e sem dependências de runtime. Seguem os padrões WAI-ARIA APG e põem os mesmos atributos de estado do Radix (`data-state`, `data-highlighted`, `data-disabled`, `aria-selected`, `aria-expanded`, `hidden`), que as classes `.semec-*` do `@semec/ds-css` estilizam. Sem JavaScript, o conteúdo continua legível. Publica `dist/index.js` (classes + `defineSemecElements()`), `./auto` e `dist/semec-elements.js`, arquivo único para `<script type="module">` no CDN (ADR-029).
