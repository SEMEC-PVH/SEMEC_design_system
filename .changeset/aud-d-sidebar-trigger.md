---
"@semec/ds": patch
---

`SidebarToggleButton`: `label` deixa de ser obrigatório (#28). Sem ele, o nome acessível alterna entre `labelOpen`/`labelClosed` ("Fechar menu"/"Abrir menu"); com ele, vira rótulo fixo, e o estado continua em `aria-expanded`.
