---
title: "Trilha de navegação"
code: "breadcrumb"
slug: "trilha-de-navegacao"
file: "src/components/breadcrumb.tsx"
category: "navegacao"
variants: "props: items: { label, href? }[] · a11y: aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores"
---

# Trilha de navegação — `breadcrumb`

> Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela.

**Arquivo:** `src/components/breadcrumb.tsx` | **Categoria:** Navegação | **Rota:** `/componentes/trilha-de-navegacao`

## Variantes

- **props**: items: { label, href? }[]
- **a11y**: aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores

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
import { Breadcrumb } from "@semec/ds/react";

<Breadcrumb items={[
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "IPTU" },
]} />
```

## Prompt para IA

```text
Crie um breadcrumb (Trilha de navegação) usando @semec/ds/react (`src/components/breadcrumb.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: items: { label, href? }[] · a11y: aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores. Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela.
```

## Fonte

```tsx
import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, ...props }, ref) => (
    <nav ref={ref} aria-label="Trilha de navegação" className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-4">
              {index > 0 ? (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 opacity-50"
                  aria-hidden="true"
                />
              ) : null}
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-medium text-foreground")}>
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="transition-colors duration-fast ease-standard hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  )
);
Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
