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