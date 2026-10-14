---
"@semec/ds": patch
---

DataTable e Pagination acessíveis por teclado (#19, AUD-05): publica a ordenação por botão com `aria-sort` (b142658), `aria-sort="none"` quando `sortDir` é nulo, linha com `onRowClick` focável e ativável por Enter/Espaço com contorno de foco visível, ícones decorativos com `aria-hidden` e alvos de paginação de 44px (`h-11`).
