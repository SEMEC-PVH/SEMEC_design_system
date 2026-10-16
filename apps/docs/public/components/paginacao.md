---
title: "Paginação"
code: "pagination"
slug: "paginacao"
file: "src/components/pagination.tsx"
category: "navegacao"
variants: "props: page · pageCount · onPageChange · siblingCount · labels?: Partial<{ navigation, previous, next, page(n) }> · a11y: role=navigation · aria-label=Paginação · aria-current=page · aria-label 'Página N' nos números · aria-label nos botões prev/next · aria-hidden nos elipses"
---

# Paginação — `pagination`

> Controle de páginas com elipses (janela por `siblingCount`). Navegação por teclado completa. Botões de 44px. Textos em PT-BR, sobrescrevíveis por `labels`.

**Arquivo:** `src/components/pagination.tsx` | **Categoria:** Navegação | **Rota:** `/componentes/paginacao`

## Variantes

- **props**: page · pageCount · onPageChange · siblingCount · labels?: Partial<{ navigation, previous, next, page(n) }>
- **a11y**: role=navigation · aria-label=Paginação · aria-current=page · aria-label "Página N" nos números · aria-label nos botões prev/next · aria-hidden nos elipses

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers zod.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Pagination } from "@semec/ds/react";

<Pagination page={pagina} pageCount={42} onPageChange={setPagina} />

<Pagination
  page={pagina}
  pageCount={42}
  onPageChange={setPagina}
  labels={{ navigation: "Paginação dos protocolos" }}
/>
```

## Prompt para IA

```text
Use o componente `Pagination` (Paginação) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Controle de páginas com elipses (janela por `siblingCount`). Navegação por teclado completa. Botões de 44px. Textos em PT-BR, sobrescrevíveis por `labels`. API e variantes: props: page · pageCount · onPageChange · siblingCount · labels?: Partial<{ navigation, previous, next, page(n) }> · a11y: role=navigation · aria-label=Paginação · aria-current=page · aria-label "Página N" nos números · aria-label nos botões prev/next · aria-hidden nos elipses. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

/** Textos anunciados pela Pagination. Todos têm padrão em PT-BR (AUD-31). */
export interface PaginationLabels {
  /** Nome do `<nav>`. Padrão: "Paginação". */
  navigation: string;
  /** Botão de voltar. Padrão: "Página anterior". */
  previous: string;
  /** Botão de avançar. Padrão: "Próxima página". */
  next: string;
  /** Nome de cada botão numérico. Padrão: `Página N`. */
  page: (page: number) => string;
}

const DEFAULT_LABELS: PaginationLabels = {
  navigation: "Paginação",
  previous: "Página anterior",
  next: "Próxima página",
  page: (n) => `Página ${n}`,
};

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  /** Sobrescreve os textos anunciados. */
  labels?: Partial<PaginationLabels>;
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, page, pageCount, onPageChange, siblingCount = 1, labels, ...props }, ref) => {
    const text = { ...DEFAULT_LABELS, ...labels };
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
        aria-label={text.navigation}
        className={cn("flex items-center justify-center gap-1", className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label={text.previous}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-input text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={text.page(p)}
              className={cn(
                "inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-input px-2 text-sm text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
          aria-label={text.next}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-input text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
