---
title: "Link"
code: "link"
slug: "link"
file: "src/components/link.tsx"
category: "acoes"
variants: "variant: primary · onSurface · muted"
---

# Link — `link`

> Link tipográfico com variantes de cor. `onSurface` para links sobre superfícies elevadas.

**Arquivo:** `src/components/link.tsx` | **Categoria:** Ações e links | **Rota:** `/componentes/link`

## Variantes

- **variant**: primary · onSurface · muted

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
import { Link } from "@semec/ds/react";

<Link href="/iptu">Acessar guia do IPTU 2026</Link>
<Link href="/protocolo" variant="onSurface">Acompanhar protocolo</Link>
<Link href="/ajuda" variant="muted">Saiba mais sobre prazos</Link>
```

## Prompt para IA

```text
Crie um link (Link) usando @semec/ds/react (`src/components/link.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: variant: primary · onSurface · muted. Link tipográfico com variantes de cor. `onSurface` para links sobre superfícies elevadas.
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
