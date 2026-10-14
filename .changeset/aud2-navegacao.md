---
"@semec/ds": minor
---

Navegação e controles (onda 2 da auditoria 2026-10).

- **Calendar no padrão APG de grade de datas (AUD-37).** `role="grid"` rotulado pelo mês (`aria-live="polite"`), uma parada de `Tab` (roving tabindex), setas, `Home`/`End`, `PageUp`/`PageDown` (mês) e `Shift+PageUp`/`PageDown` (ano), `Enter`/`Espaço` para selecionar, `aria-selected`, `aria-current="date"` no dia de hoje e `aria-disabled` fora de `min`/`max`. Cada dia tem nome completo em PT-BR via `Intl` ("14 de outubro de 2026"). `min`/`max` em `AAAA-MM-DD` passam a ser lidos como data local (antes, o `new Date()` em UTC deslocava um dia). Nova prop `labels` (`previousMonth`, `nextMonth`) e tipos `CalendarProps`/`CalendarLabels` exportados.
- **Alvos de 44px (AUD-10).** `TabsTrigger`, `NavigationMenuTrigger`, `Toggle` `md` (padrão), células e botões do `Calendar` passam a ter 44px; `Toggle` `lg` vai a 48px. `Button` `sm` e `Toggle` `sm` mantêm o visual de 36px, com a área clicável estendida a 44×44px por pseudo-elemento.
- **Aba ativa sem depender só de cor (AUD-38).** Barra inferior de 3px em `primary` (4,97:1 contra a lista e 5,00:1 contra o fundo da aba) e peso semibold.
- **Link sublinhado por padrão (AUD-25).** Nova prop `underline` (padrão `true`); `underline={false}` sublinha só no hover e fica restrito a contextos de navegação.
- **NavigationMenu em PT-BR (AUD-31).** O `<nav>` passa a se chamar "Menu principal" (antes, "Main" do Radix); sobrescreva com `aria-label`. O `aria-hidden-focus` com o menu aberto vem do sentinela de foco do Radix e foi incluído na EXC-01 com a evidência.
- **Pagination com textos sobrescrevíveis (AUD-31).** Nova prop `labels` (`navigation`, `previous`, `next`, `page(n)`); os botões numéricos passam a se chamar "Página N".
- **`DropdownMenuShortcut` com contraste AA (AUD-39).** `opacity-60` (4,28:1) trocado por `text-muted-foreground` (7,56:1).
- **Sombras por token (AUD-29), ícones decorativos com `aria-hidden` (AUD-59) e props exportadas (AUD-64)** em Tabs, NavigationMenu, DropdownMenu, Calendar e Breadcrumb (`BreadcrumbProps`, `DropdownMenuItemProps` e afins).
