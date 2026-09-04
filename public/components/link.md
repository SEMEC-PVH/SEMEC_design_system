---
title: "Link"
code: "link"
slug: "link"
file: "base/components/link.tsx"
category: "acoes"
variants: "variant: primary · muted"
---

# Link — `link`

> Link tipográfico com variantes de cor.

**Arquivo:** `base/components/link.tsx` | **Categoria:** Ações e links | **Rota:** `/componentes/link`

## Variantes

- **variant**: primary · muted

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
import { Link } from "@semec/base";

<Link href="/pagina">Ir para a página</Link>
<Link href="/ajuda" variant="muted">Texto de ajuda</Link>
```

## Prompt para IA

```text
Crie um link (Link) usando @semec/base (`base/components/link.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: variant: primary · muted. Link tipográfico com variantes de cor.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const linkVariants = cva(
  "inline-flex items-center gap-1 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary: "text-primary underline-offset-4 hover:underline",
        onSurface: "text-foreground underline-offset-4 hover:underline",
        muted: "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(linkVariants({ variant, className }))}
      {...props}
    />
  )
);
Link.displayName = "Link";

export { Link, linkVariants };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
