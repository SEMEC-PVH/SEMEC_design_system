---
title: "Separador"
code: "separator"
slug: "separador"
file: "src/components/separator.tsx"
category: "conteudo-dados"
variants: "orientation: horizontal · vertical · decorative: true (role=none) · false (role=separator)"
---

# Separador — `separator`

> Linha divisória visual. Horizontal ou vertical. Decorativo ou semântico.

**Arquivo:** `src/components/separator.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/separador`

## Variantes

- **orientation**: horizontal · vertical
- **decorative**: true (role=none) · false (role=separator)

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
import { Separator } from "@semec/ds-react";

<Separator />
<Separator orientation="vertical" className="h-6" />
```

## Prompt para IA

```text
Crie um separator (Separador) usando @semec/ds-react (`src/components/separator.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: orientation: horizontal · vertical · decorative: true (role=none) · false (role=separator). Linha divisória visual. Horizontal ou vertical. Decorativo ou semântico.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={!decorative ? orientation : undefined}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };

```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
