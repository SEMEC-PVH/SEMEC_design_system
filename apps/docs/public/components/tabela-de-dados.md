---
title: "Tabela de dados"
code: "data-table"
slug: "tabela-de-dados"
file: "src/components/data-table.tsx"
category: "conteudo-dados"
variants: "props: columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · emptyMessage · caption"
---

# Tabela de dados — `data-table`

> Tabela com ordenação visual, paginação e empty states.

**Arquivo:** `src/components/data-table.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/tabela-de-dados`

## Variantes

- **props**: columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · emptyMessage · caption

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
import { DataTable } from "@semec/ds/react";

const columns = [
  { key: "nome", header: "Nome", sortable: true },
  { key: "status", header: "Status" },
];

<DataTable
  columns={columns}
  data={registros}
  sortKey={sortField}
  sortDir={sortDir}
  onSort={handleSort}
  page={pagina}
  pageCount={totalPaginas}
  onPageChange={setPagina}
/>
```

## Prompt para IA

```text
Crie um data-table (Tabela de dados) usando @semec/ds/react (`src/components/data-table.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · emptyMessage · caption. Tabela com ordenação visual, paginação e empty states.
```

## Fonte

```tsx
import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string | null;
  sortDir?: SortDirection;
  onSort?: (key: string) => void;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  caption?: string;
}

function DataTableInner<T extends Record<string, unknown>>(
  {
    columns,
    data,
    sortKey,
    sortDir,
    onSort,
    page,
    pageCount,
    onPageChange,
    emptyMessage = "Nenhum registro encontrado.",
    rowKey,
    onRowClick,
    caption,
    className,
    ...props
  }: DataTableProps<T>,
  _ref: React.Ref<HTMLDivElement>
) {
  const handleSort = (key: string) => {
    onSort?.(key);
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    if (sortDir === "asc") return <ArrowUp className="h-3 w-3" />;
    return <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div ref={_ref} className={cn("w-full", className)} {...props}>
      <div className="relative w-full overflow-auto rounded-md border border-border">
        <table className="w-full caption-bottom text-sm">
          {caption && (
            <caption className="mt-4 text-sm text-muted-foreground">
              {caption}
            </caption>
          )}
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    col.sortable
                      ? sortKey === col.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  className={cn(
                    "h-11 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                    col.sortable && "select-none hover:text-foreground",
                    col.className
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      aria-label={`Ordenar por ${col.header}`}
                      className="inline-flex items-center gap-2 rounded-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {col.header}
                      {getSortIcon(col.key)}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">{col.header}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={rowKey ? rowKey(row, index) : index}
                  className={cn(
                    "border-b border-border transition-colors duration-fast ease-standard hover:bg-muted/50 data-[state=selected]:bg-muted",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row, index)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {page !== undefined && pageCount !== undefined && pageCount > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Página {page} de {pageCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= pageCount}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const DataTable = React.forwardRef(DataTableInner) as <
  T extends Record<string, unknown>
>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

export { DataTable };
export type { Column, DataTableProps, SortDirection };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
