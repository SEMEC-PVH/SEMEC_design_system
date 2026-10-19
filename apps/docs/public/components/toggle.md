---
title: "Toggle"
code: "toggle"
slug: "toggle"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/toggle.tsx"
category: "formularios"
variants: "variant: default (solto sem borda) · outline (solto com borda input) · estado ligado: data-state=on · aria-pressed=true · fundo tint · contorno primary de 2px (borda + inset-ring) · hover escurece para primary-hover · size: sm (36px visual, alvo 44px) · md (44px, padrão) · lg (48px)"
---

# Toggle — `toggle`

> Botão binário para estados on/off em toolbars (`pressed`/`onPressedChange`, API Radix). Não é controle de formulário: não envia valor em `<form>` nem tem `name`/`invalid`; para opção de formulário, use Checkbox ou Switch. Alvo de toque de 44px em todos os tamanhos. Ligado = fundo `tint` + contorno de 2px em `primary` (5,00:1 sobre `--bg`, 5,42:1 sobre branco) e texto `foreground`; o estado vai ao leitor de tela por `aria-pressed`.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/toggle.tsx) | **Categoria:** Formulários | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/toggle/

## Variantes

- **variant**: default (solto sem borda) · outline (solto com borda input)
- **estado ligado**: data-state=on · aria-pressed=true · fundo tint · contorno primary de 2px (borda + inset-ring) · hover escurece para primary-hover
- **size**: sm (36px visual, alvo 44px) · md (44px, padrão) · lg (48px)

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers@^5 zod@^4.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

## Uso

```tsx
import { Toggle } from "@semec/ds/react";
import { Bold } from "lucide-react";

<Toggle variant="outline" aria-label="Negrito">
  <Bold />
</Toggle>
```

## Prompt para IA

```text
Use o componente `Toggle` (Toggle) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Botão binário para estados on/off em toolbars (`pressed`/`onPressedChange`, API Radix). Não é controle de formulário: não envia valor em `<form>` nem tem `name`/`invalid`; para opção de formulário, use Checkbox ou Switch. Alvo de toque de 44px em todos os tamanhos. Ligado = fundo `tint` + contorno de 2px em `primary` (5,00:1 sobre `--bg`, 5,42:1 sobre branco) e texto `foreground`; o estado vai ao leitor de tela por `aria-pressed`. API e variantes: variant: default (solto sem borda) · outline (solto com borda input) · estado ligado: data-state=on · aria-pressed=true · fundo tint · contorno primary de 2px (borda + inset-ring) · hover escurece para primary-hover · size: sm (36px visual, alvo 44px) · md (44px, padrão) · lg (48px). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const toggleVariants = cva(
  // TST-03: o estado ligado não pode depender de um cinza quase igual ao fundo
  // (antes `bg-accent`, 1,01:1). Ligado = fundo `tint` + contorno de 2px em
  // `primary` (borda + inset-ring de 1px), texto `foreground`:
  //   primary × background (pv-gray-50) 5,00:1 · × surface (branco) 5,42:1
  //   · × tint 4,89:1 · foreground × tint 14,24:1 (mínimo 3:1 / 4,5:1).
  // Contra o estado solto: na variante `default` o solto não tem contorno, e a
  // borda primary fica sobre a superfície (5,00:1 / 5,42:1). Na `outline` a
  // borda solta é `input` (pv-gray-400, 1,44:1 contra primary), por isso o
  // inset-ring: o pixel interno passa de superfície a primary (5,00:1 / 5,42:1).
  // Hover solto: borda `border-strong` (3,49:1 / 3,77:1) na `default` e
  // `foreground` na `outline`; hover ligado escurece para `primary-hover`.
  "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-tint data-[state=on]:text-foreground data-[state=on]:inset-ring data-[state=on]:inset-ring-primary data-[state=on]:hover:border-primary-hover data-[state=on]:hover:inset-ring-primary-hover",
  {
    variants: {
      variant: {
        default: "border-transparent bg-transparent hover:border-border-strong",
        outline: "border-input bg-transparent hover:border-foreground",
      },
      size: {
        // AUD-10: `md` (padrão) e `lg` têm 44px. `sm` mantém o visual de 36px,
        // com área clicável estendida a 44×44px por pseudo-elemento.
        sm: "h-9 px-3 relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2",
        md: "h-11 min-w-11 px-3",
        lg: "h-12 min-w-12 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
