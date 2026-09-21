---
title: "Área de scroll"
code: "scroll-area"
slug: "scroll-area"
file: "src/components/scroll-area.tsx"
category: "navegacao"
variants: "composição: ScrollArea · ScrollBar · orientation: vertical · horizontal"
---

# Área de scroll — `scroll-area`

> Scroll customizado e consistente entre navegadores.

**Arquivo:** `src/components/scroll-area.tsx` | **Categoria:** Navegação | **Rota:** `/componentes/scroll-area`

## Variantes

- **composição**: ScrollArea · ScrollBar
- **orientation**: vertical · horizontal

## Instalação (@semec/ds/react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale @semec/ds/react pelo registry)
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
import { ScrollArea } from "semec-ds/react";

<ScrollArea className="h-48">
  <div className="p-4">Conteúdo longo aqui…</div>
</ScrollArea>
```

## Prompt para IA

```text
Crie um scroll-area (Área de scroll) usando semec-ds/react (`src/components/scroll-area.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: ScrollArea · ScrollBar · orientation: vertical · horizontal. Scroll customizado e consistente entre navegadores.
```

## Fonte

```tsx
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "../lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors duration-fast ease-standard",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };

```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
