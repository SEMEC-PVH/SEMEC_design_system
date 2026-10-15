---
"@semec/ds": minor
---

Fundação (onda 2 da auditoria 2026-10):

- **AUD-26** — Poppins auto-hospedada: novo `@semec/ds/react/fonts.css` com `@font-face` 400, 500, 600 e 700 (`font-display: swap`) e os `.woff2` em `dist/react/fonts/`, com a licença SIL OFL 1.1 (`fonts/OFL.txt`). Não há 800/900. Importe antes do `tokens.css`.
- **AUD-27** — a escala `--space-*` vira utilitário: `p-space-4`, `gap-space-2`, `mt-space-12`… (CSS-first e preset JS com os mesmos nomes). Os utilitários numéricos do Tailwind continuam como estão.
- **AUD-28** — escala tipográfica completa: `--text-3xl` passa a 32px (era o 30px do Tailwind) e entra `--text-display` (40px). Cada `text-*` aplica a entrelinha do degrau (`--leading-*`); entram `leading-xs`…`leading-display` e `font-regular`. *Mudança visual:* a entrelinha padrão de `text-xs`/`sm`/`lg`/`xl`/`2xl` passa à da especificação (ex.: `text-sm` 20px → 21px).
- **AUD-30** — novos `text-text-muted`, `text-text-secondary`, `text-text-strong` e `text-text-on-brand`. `text-muted`/`text-secondary` continuam sendo a cor de fundo `--surface-alt` (1,09:1) e não devem ser usados para texto; `bg-muted`/`bg-secondary` não mudam.
- **AUD-53** — novo `--surface-sunken` (`bg-surface-sunken`, primitivo `--pv-gray-300`): 1,47:1 sobre `--surface`; preenchimento `--action-primary` sobre ele, 3,68:1.
- **AUD-60** — novo `--focus-ring-inverse` (`ring-ring-inverse`). Dentro de `data-surface="brand"` ou `bg-brand-hero`, o anel de foco (outline global e `ring-ring`) passa ao inverso: 9,38:1 sobre `--brand-hero` (antes 1,00:1). `data-surface="default"` volta ao anel padrão.
- **AUD-25** (parte global) — o reset de `a` continua em `@layer base`, então `underline` sempre vence; `<a>` sem `class` passa a ser sublinhado.
