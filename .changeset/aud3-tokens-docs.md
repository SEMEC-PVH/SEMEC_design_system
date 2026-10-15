---
"@semec/ds": minor
---

Tokens e documentação canônica (onda 3 da auditoria de 14/10/2026). Nenhum valor renderizado muda.

- **Novo primitivo `--pv-yellow-50`** (`#fdf6e3`, AUD-56): `--feedback-warning-surface` passa a apontar para ele, em vez de um hex solto no L1. Primitivo novo não ganha utilitário `bg-pv-*`.
- **Elevações sem `rgba()`** (AUD-56): `--elevation-1/2/3` usam `rgb(var(--pv-gray-900-rgb) / 0.08 | 0.1 | 0.14)`, com o novo primitivo `--pv-gray-900-rgb: 20 35 58` (canais de `--pv-gray-900`), e resultam exatamente nos `rgba(20, 35, 58, …)` anteriores. Sem `color-mix`, de propósito: o Tailwind gera para ele um fallback de sombra opaca em navegadores antigos (Chrome < 111).
- **Raio sem autorreferência** (AUD-57): a escala fica como está (`rounded-sm` 2px · `rounded-md` 8px · `rounded-lg` 12px · `rounded-full`). O valor passa a morar em `--pv-radius-*`; `--radius-*` continua no `:root` apontando para ele, e o `@theme` deixa de declarar `--radius-sm: var(--radius-sm)`, que entrava em ciclo quando o `tokens.css` era importado dentro de `@layer`. `var(--radius-*)` e `rounded-*` seguem funcionando. `rounded-xl` e acima são o padrão do Tailwind, fora da escala.
- **Tipografia sem autorreferência** (AUD-57, mesmo caso do raio): o valor da escala passa a morar em `--pv-text-*` e `--pv-leading-*`; `--text-*` e `--leading-*` continuam no `:root` como apelidos, e o `@theme` deixa de declarar `--text-xs: var(--text-xs)` e `--leading-xs: var(--leading-xs)` (16 autorreferências). `text-*`, `leading-*` e `var(--text-*)` seguem iguais.
- Depreciação: utilitários de primitivo `bg-pv-*` / `text-pv-*` / `border-pv-*` (de `--color-pv-*` no `@theme` e das cores `pv-*` do `pv-preset`) saem na 4.0 (AUD-55, anunciado na 3.1.0). O comentário do `tokens.css` que os chamava de "uso direto" foi corrigido e marca o bloco como `@deprecated`; as variáveis `--pv-*` continuam. Use os semânticos (`bg-primary`, `bg-brand-hero`, `text-foreground`, `bg-success-surface`…).
- **Avisos cancelados:** a escala de raio não muda na 4.0 (AUD-57) e o `Button` mantém `disabled` nativo; `aria-disabled` focalizável vale só durante o `loading` (AUD-63).
- **Licença e crédito** (AMB-09, AUD-69): crédito à SEMEC é recomendado, não obrigatório (MIT). As skills `semec-ds` e `semec-ds-lite` deixam de dizer "Crédito obrigatório", o `manifest.json` do lite passa a `credit.required: false` e o README do pacote ganha a seção "Licença e crédito".
