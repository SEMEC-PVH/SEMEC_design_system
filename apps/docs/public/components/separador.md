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

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Separator } from "@semec/ds/react";

<Separator />
<Separator orientation="vertical" className="h-6" />
```

## Prompt para IA

```text
Crie um separator (Separador) usando @semec/ds/react (`src/components/separator.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: orientation: horizontal · vertical · decorative: true (role=none) · false (role=separator). Linha divisória visual. Horizontal ou vertical. Decorativo ou semântico.
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
