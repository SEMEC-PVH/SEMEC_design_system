---
title: "Dica"
code: "tooltip"
slug: "dica"
file: "src/components/tooltip.tsx"
category: "feedback"
variants: "composição: TooltipProvider · Tooltip · TooltipTrigger · TooltipContent"
---

# Dica — `tooltip`

> Dica curta ao passar o ponteiro ou focar o elemento.

**Arquivo:** `src/components/tooltip.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/dica`

## Variantes

- **composição**: TooltipProvider · Tooltip · TooltipTrigger · TooltipContent

## Instalação (@semec/ds-react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale @semec/ds-react pelo registry)
# 2. Instale deps (ver packages/react/README.md)
npm i class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
  @radix-ui/react-toast @radix-ui/react-tooltip
```

```css
/* globals.css */
@import "tailwindcss";
@import "./base/tokens.css";
@import "./base/shadcn.css";
/* ou @config "./base/pv-preset.ts" */
```

## Uso

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, IconButton } from "@semec/ds-react";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><IconButton aria-label="Ajuda"><HelpCircle /></IconButton></TooltipTrigger>
    <TooltipContent>Explica o campo ao lado</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Prompt para IA

```text
Crie um tooltip (Dica) usando @semec/ds-react (`src/components/tooltip.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: TooltipProvider · Tooltip · TooltipTrigger · TooltipContent. Dica curta ao passar o ponteiro ou focar o elemento.
```

## Fonte

```tsx
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "../lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-elevation-2 data-[state=delayed-open]:animate-in data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
