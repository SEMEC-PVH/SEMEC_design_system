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
import { Breadcrumb } from "@semec/ds-react";

<Breadcrumb items={[
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "IPTU" },
]} />
```

## Prompt para IA

```text
Crie um breadcrumb (Trilha de navegação) usando @semec/ds-react (`src/components/breadcrumb.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: items: { label, href? }[] · a11y: aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores. Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela.
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
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
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
                  className="underline-offset-4 transition-colors duration-fast ease-standard hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
