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

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@config "@semec/ds/react/pv-preset";
```

## Uso

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, IconButton } from "@semec/ds/react";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><IconButton aria-label="Ajuda"><HelpCircle /></IconButton></TooltipTrigger>
    <TooltipContent>Explica o campo ao lado</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Prompt para IA

```text
Crie um tooltip (Dica) usando @semec/ds/react (`src/components/tooltip.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: TooltipProvider · Tooltip · TooltipTrigger · TooltipContent. Dica curta ao passar o ponteiro ou focar o elemento.
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
        "z-50 overflow-hidden rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-elevation-2 data-[state=delayed-open]:animate-in data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
