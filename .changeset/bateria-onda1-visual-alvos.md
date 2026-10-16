---
"@semec/ds": minor
---

Correções visuais e de acessibilidade da bateria de testes de 16/10/2026 (onda 1, #55).

**Mudanças visuais (atualizar baselines):**

- `Heading` (TST-16): a escala segue o `tokens.css` e a SKILL. `level={1}` passa de 24 px para **32 px** (`text-3xl`), `level={2}` de 20 px para 24 px (`text-2xl`) e `level={3}` de 18 px para 20 px (`text-xl`). Os níveis 4 a 6 não mudam. A entrelinha passa a vir da escala (`--text-*--line-height`). Quem usa `size` para fixar o visual não é afetado.
- `Toggle` (TST-03, #50): o estado ligado deixa de ser um cinza quase igual ao fundo (1,01:1). Agora usa fundo `tint`, contorno de 2 px em `primary` (borda + `inset-ring`) e texto `foreground`. Contraste: `primary` contra `background` 5,00:1, contra `surface` 5,42:1 e contra `tint` 4,89:1. O texto contra `tint` dá 14,24:1. Na variante `outline`, a borda solta (`input`) fica a 1,44:1 do `primary`, e por isso o anel interno: o pixel interno passa de superfície a `primary` (5,00:1 / 5,42:1). No hover solto, a borda vira `border-strong` (3,49:1 / 3,77:1) na `default` e `foreground` na `outline`. A variante `default` ganhou uma borda transparente de 1 px, o que deixa o botão 2 px mais largo.
- `DropdownMenu` (TST-09): `Item`, `CheckboxItem`, `RadioItem` e `SubTrigger` ganham alvo de 44 px (`min-h-11`), como o `SelectItem`. Antes mediam 33 px.
- `NavigationMenuLink` (TST-08): passa a ter estilo próprio, com `min-h-11`, `px-4`, hover e foco em `tint`, anel de foco interno e semibold quando `active`. Antes era o `Link` cru do Radix, com 23 px de altura. Também ganha o novo export `navigationMenuLinkStyle`. Quem passa `className={navigationMenuTriggerStyle()}` mantém o visual do gatilho.
- `Slider` (TST-22): a área de toque do polegar sobe de 40×40 para 44×44 (`after:-inset-3.5`). O visual do polegar não muda.

**Comportamento:**

- `ScrollArea` (TST-05, #52): a viewport recebe `tabIndex={0}` e um anel de foco interno quando não há nada focável dentro dela. Com isso, o axe deixa de acusar `scrollable-region-focusable` com overflow no Chromium. Há duas props novas: `focusable` (`"auto"` é o padrão, além de `true` e `false`) e `viewportProps`, que serve, por exemplo, para dar `aria-label` à região.
- `Button` (TST-21): um rótulo longo quebra em linhas balanceadas e não gera mais rolagem horizontal. Para isso, `whitespace-nowrap` sai e a altura fixa (`h-9`, `h-11`, `h-12`) vira altura mínima (`min-h-*`). Rótulos curtos ficam com o mesmo tamanho (36, 44 ou 48 px). Se você reduzia a altura com `className="h-*"`, agora também precisa sobrescrever o `min-h-*`.
- `TabsList` (TST-29): a lista não passa da largura do pai (`max-w-full`) e rola dentro de si (`overflow-x-auto`), então a página não rola mais em 320 px. `justify-center-safe` só centraliza quando as abas cabem.
- `Avatar` (TST-26): quando a foto quebra, o `AvatarFallback` anuncia o `alt` da `AvatarImage` em texto `sr-only` e esconde as iniciais do leitor de tela. Isso não acontece se o fallback já tiver `aria-label` ou `aria-labelledby`, nem se o `alt` for vazio.
