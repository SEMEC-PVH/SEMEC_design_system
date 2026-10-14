---
"@semec/ds": minor
---

Sidebar: gaveta mobile acessível, landmark, `aria-current`, `tooltip` e breakpoint único (AUD-09, AUD-32, AUD-33, AUD-10, AUD-31, AUD-59, AUD-64, AUD-29; Refs #23).

- **Gaveta mobile (AUD-09):** agora é um modal sobre o Radix Dialog. O foco fica preso na gaveta, Esc fecha, o conteúdo de trás fica inerte (`aria-hidden` e rolagem travada) e o foco volta para quem abriu (o `SidebarTrigger`, outro gatilho ou o elemento focado antes do Ctrl/⌘+B). A gaveta tem título acessível (sr-only, "Menu de navegação") e um botão visível "Fechar menu" de 44×44. O portal fica dentro do `SidebarProvider`, então as variáveis `--sidebar-*` continuam valendo.
- **`SidebarTrigger`:** 44×44 (`h-11 w-11`, antes 36), `aria-expanded` e `aria-controls` (aponta para o painel só quando ele existe no DOM), `type="button"` e nova prop `label` (padrão "Alternar barra lateral").
- **Landmark (AUD-32):** no desktop (e dentro da gaveta), o conteúdo fica num `<nav aria-label="Menu lateral">`. Nova prop `as` (`"nav"` · `"aside"` · `"div"`) e `aria-label` direto sobrescreve o nome.
- **`SidebarInset`:** nova prop `as` (`"main"` padrão · `"div"` · `"section"`). Sem a prop, continua `<main>`; use `as="div"` quando o layout já tiver o próprio `<main>`. Ganhou `min-w-0` de fábrica (AUD-33) e a sombra do `variant="inset"` passou a `shadow-elevation-1` (AUD-29).
- **Item ativo:** `SidebarMenuButton isActive` e `SidebarMenuSubButton isActive` geram `aria-current="page"` (sobrescrevível pela própria prop `aria-current`).
- **`tooltip`:** a prop de `SidebarMenuButton` agora funciona (Tooltip do kit, à direita, só no modo recolhido `collapsible="icon"`) e não vaza mais para o DOM. O `SidebarProvider` inclui um `TooltipProvider`.
- **Breakpoint (AUD-33):** a troca para gaveta usa `matchMedia("not all and (min-width: 48rem)")` com listener e é segura em SSR (no servidor vale desktop). O breakpoint é único: abaixo de 768px (48rem), o complemento exato do `md:` que a versão desktop já usava. Ao alargar a tela, a gaveta aberta fecha.
- **Alvos de 44px (AUD-10):** `SidebarMenuButton` e `SidebarMenuSubButton` com `min-h-11`; no modo recolhido o botão tem 44×44, e a largura do modo ícone passou de 3rem para 3,75rem.
- **Desktop recolhido em `offcanvas`:** a barra fora da tela fica `inert` (sai da ordem de Tab), a menos que você passe `inert` explicitamente.
- **Textos (AUD-31):** nova prop `labels` em `Sidebar` (`navigation`, `mobileTitle`, `close`), todos com padrão em PT-BR.
- **Ícones (AUD-59):** `PanelLeft` e o X da gaveta com `aria-hidden="true"`.
- **Tipos (AUD-64):** novas interfaces exportadas `SidebarProviderProps`, `SidebarProps`, `SidebarLabels`, `SidebarTriggerProps`, `SidebarInsetProps`, `SidebarMenuButtonProps` e `SidebarMenuSubButtonProps`. `setOpenMobile` do `useSidebar()` passa a aceitar função (`setOpenMobile((v) => !v)`), como já funcionava na prática.

**Migração:** nenhuma quebra de API. Quem testava o painel mobile por `aria-label="Navegação"` deve usar o papel `dialog` com nome "Menu de navegação" (ou passar `labels.mobileTitle`). Na gaveta fechada o painel não fica mais no DOM, então o `ref` da `Sidebar` em telas estreitas é `null` até ela abrir.
