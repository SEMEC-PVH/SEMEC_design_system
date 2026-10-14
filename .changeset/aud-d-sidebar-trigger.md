---
"@semec/ds": patch
---

`SidebarToggleButton`: `label` deixa de ser obrigatório (#28). Sem ele, o nome acessível alterna entre `labelOpen`/`labelClosed` ("Fechar menu"/"Abrir menu"); com ele, vira rótulo fixo, e o estado continua em `aria-expanded`.

**Migração:** antes, o `label` passado ao `SidebarToggleButton` era descartado em silêncio. Agora ele é usado como rótulo fixo do botão (o estado aberto/fechado continua anunciado por `aria-expanded`). Se você passava `label` só para o TypeScript compilar e quer manter o rótulo dinâmico ("Fechar menu"/"Abrir menu"), remova a prop ou use `labelOpen`/`labelClosed`.
