---
title: "Paginação"
code: "pagination"
slug: "paginacao"
file: "base/components/pagination.tsx"
category: "navegacao"
variants: "props: page · pageCount · onPageChange · siblingCount"
---

# Paginação — `pagination`

> Controle de páginas com elipses (janela por `siblingCount`).

**Arquivo:** `base/components/pagination.tsx` | **Categoria:** Navegação | **Rota:** `/componentes/paginacao`

## Variantes

- **props**: page · pageCount · onPageChange · siblingCount

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
import { Pagination } from "@semec/base";

<Pagination page={pagina} pageCount={42} onPageChange={setPagina} />
```

## Prompt para IA

```text
Crie um pagination (Paginação) usando @semec/base (`base/components/pagination.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: page · pageCount · onPageChange · siblingCount. Controle de páginas com elipses (janela por `siblingCount`).
```

## Fonte

```tsx
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, page, pageCount, onPageChange, siblingCount = 1, ...props }, ref) => {
    const go = (p: number) => {
      if (p >= 1 && p <= pageCount && p !== page) onPageChange(p);
    };

    const pages = React.useMemo(() => {
      const total = pageCount;
      const current = page;
      const sib = Math.max(siblingCount, 1);
      const first = 1;
      const last = total;

      if (total <= 7) return range(first, last);

      const left = Math.max(current - sib, first);
      const right = Math.min(current + sib, last);
      const withLeftGap = left > first + 1;
      const withRightGap = right < last - 1;

      const out: (number | "…")[] = [];
      if (!withLeftGap) {
        out.push(...range(first, right));
      } else {
        out.push(first, "…", ...range(left, right));
      }
      if (withRightGap) out.push("…", last);
      else out.push(...range(right + 1, last));
      return out;
    }, [page, pageCount, siblingCount]);

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Paginação"
        className={cn("flex items-center justify-center gap-1", className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-input px-2 text-sm text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                p === page && "border-transparent bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= pageCount}
          aria-label="Próxima página"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    );
  }
);
Pagination.displayName = "Pagination";

export { Pagination };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
