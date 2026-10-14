---
title: "Link"
code: "link"
slug: "link"
file: "src/components/link.tsx"
category: "acoes"
variants: "variant: primary · onSurface · muted · underline: true (padrão) · false (sublinha só no hover; use apenas em menus, rodapés e listas de navegação, nunca em texto corrido)"
---

# Link — `link`

> Link tipográfico com variantes de cor, sublinhado por padrão (a cor sozinha não distingue o link do texto: 2,91:1, WCAG 1.4.1). `onSurface` para links sobre superfícies elevadas.

**Arquivo:** `src/components/link.tsx` | **Categoria:** Ações e links | **Rota:** `/componentes/link`

## Variantes

- **variant**: primary · onSurface · muted
- **underline**: true (padrão) · false (sublinha só no hover; use apenas em menus, rodapés e listas de navegação, nunca em texto corrido)

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Link } from "@semec/ds/react";

<p>Consulte o <Link href="/iptu">guia do IPTU 2026</Link> antes de emitir a guia.</p>
<Link href="/protocolo" variant="onSurface">Acompanhar protocolo</Link>
<Link href="/ajuda" variant="muted">Saiba mais sobre prazos</Link>

// Só em contexto de navegação, em que a posição já identifica o link:
<Link href="/servicos" underline={false}>Serviços</Link>
```

## Prompt para IA

```text
Use o componente `Link` (Link) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Link tipográfico com variantes de cor, sublinhado por padrão (a cor sozinha não distingue o link do texto: 2,91:1, WCAG 1.4.1). `onSurface` para links sobre superfícies elevadas. API e variantes: variant: primary · onSurface · muted · underline: true (padrão) · false (sublinha só no hover; use apenas em menus, rodapés e listas de navegação, nunca em texto corrido). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const linkVariants = cva(
  "inline-flex items-center gap-1 text-sm font-medium underline-offset-4 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary: "text-primary",
        onSurface: "text-foreground",
        muted: "text-muted-foreground hover:text-foreground",
      },
      /**
       * AUD-25: sublinhado por padrão. O `primary` tem só 2,91:1 contra o texto
       * comum, então a cor sozinha não identifica o link num parágrafo (WCAG 1.4.1).
       * `underline={false}` sublinha só no hover: use apenas em contextos em que
       * o link já é evidente pela posição (menu, rodapé, lista de navegação).
       */
      underline: {
        true: "underline",
        false: "no-underline hover:underline",
      },
    },
    defaultVariants: {
      variant: "primary",
      underline: true,
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, underline, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(linkVariants({ variant, underline, className }))}
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
