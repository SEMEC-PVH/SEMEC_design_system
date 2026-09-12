---
title: "Popover"
code: "popover"
slug: "popover"
file: "base/components/popover.tsx"
category: "feedback"
variants: "composição: Popover · PopoverTrigger · PopoverContent · PopoverAnchor · props: sideOffset · align · side (top/right/bottom/left)"
---

# Popover — `popover`

> Camada flutuante ancorada a um elemento. Tooltips interativos, filtros, menus.

**Arquivo:** `base/components/popover.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/popover`

## Variantes

- **composição**: Popover · PopoverTrigger · PopoverContent · PopoverAnchor
- **props**: sideOffset · align · side (top/right/bottom/left)

## Instalação (kit @semec/base)

```bash
# 1. Copie base/ para seu projeto
# 2. Instale deps (ver base/README.md)
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
import { Popover, PopoverTrigger, PopoverContent, Button } from "@semec/base";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Filtros</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Opções de filtro aqui.</p>
  </PopoverContent>
</Popover>
```

## Prompt para IA

```text
Crie um popover (Popover) usando @semec/base (`base/components/popover.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: Popover · PopoverTrigger · PopoverContent · PopoverAnchor · props: sideOffset · align · side (top/right/bottom/left). Camada flutuante ancorada a um elemento. Tooltips interativos, filtros, menus.
```

## Fonte

```tsx
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "../lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border border-border bg-card p-4 text-card-foreground shadow-elevation-2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };

```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
