---
title: "Toggle"
code: "toggle"
slug: "toggle"
file: "src/components/toggle.tsx"
category: "formularios"
variants: "variant: default · outline · size: sm (36px visual, alvo 44px) · md (44px, padrão) · lg (48px)"
---

# Toggle — `toggle`

> Botão binário para estados on/off em toolbars (`pressed`/`onPressedChange`, API Radix). Não é controle de formulário: não envia valor em `<form>` nem tem `name`/`invalid`; para opção de formulário, use Checkbox ou Switch. Alvo de toque de 44px em todos os tamanhos.

**Arquivo:** `src/components/toggle.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/toggle`

## Variantes

- **variant**: default · outline
- **size**: sm (36px visual, alvo 44px) · md (44px, padrão) · lg (48px)

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

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
Use o componente `Toggle` (Toggle) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Botão binário para estados on/off em toolbars (`pressed`/`onPressedChange`, API Radix). Não é controle de formulário: não envia valor em `<form>` nem tem `name`/`invalid`; para opção de formulário, use Checkbox ou Switch. Alvo de toque de 44px em todos os tamanhos. API e variantes: variant: default · outline · size: sm (36px visual, alvo 44px) · md (44px, padrão) · lg (48px). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-fast ease-standard hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
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
