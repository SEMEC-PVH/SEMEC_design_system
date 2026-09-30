---
title: "Tabela"
code: "table"
slug: "tabela"
file: "src/components/table.tsx"
category: "conteudo-dados"
variants: "composição: Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption · a11y: role=table · scope=col (TableHead) · aria-sort · aria-rowcount · aria-colcount"
---

# Tabela — `table`

> Tabela de dados semântica com caption, header, body e footer. Para ordenação, filtros e seleção, ver padrão avançado em /padroes/dados-relatorios/tabelas.

**Arquivo:** `src/components/table.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/tabela`

## Variantes

- **composição**: Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption
- **a11y**: role=table · scope=col (TableHead) · aria-sort · aria-rowcount · aria-colcount

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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@semec/ds/react";

// Básico
<Table>
  <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>IPTU</TableCell><TableCell>Aberto</TableCell></TableRow></TableBody>
</Table>

// Avançado: ordenação + filtro + paginação + seleção
// Ver padroes/dados-relatorios/tabelas → demo com TableAdvanced
```

## Prompt para IA

```text
Crie um table (Tabela) usando @semec/ds/react (`src/components/table.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption · a11y: role=table · scope=col (TableHead) · aria-sort · aria-rowcount · aria-colcount. Tabela de dados semântica com caption, header, body e footer. Para ordenação, filtros e seleção, ver padrão avançado em /padroes/dados-relatorios/tabelas.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      role="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    scope="col"
    className={cn(
      "h-11 px-4 text-left align-middle font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
