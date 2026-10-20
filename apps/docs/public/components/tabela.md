---
title: "Tabela"
code: "table"
slug: "tabela"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/table.tsx"
category: "conteudo-dados"
variants: "composição: Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption · a11y: scope=col (TableHead) · aria-sort repassado pelo consumidor em TableHead · TableCaption para nome"
---

# Tabela — `table`

> Tabela de dados semântica com caption, header, body e footer. Para ordenação, filtros e seleção, ver https://semec-pvh.github.io/SEMEC_design_system/padroes/dados-relatorios/tabelas/. Se houver rolagem horizontal, use uma região nomeada e focável, como no exemplo, e teste Tab e setas em tela estreita.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/table.tsx) | **Categoria:** Conteúdo e dados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/tabela/

## Variantes

- **composição**: Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption
- **a11y**: scope=col (TableHead) · aria-sort repassado pelo consumidor em TableHead · TableCaption para nome

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers@^5 zod@^4.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.1. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@semec/ds/react";

// A região recebe o foco e a rolagem; o wrapper interno da Table fica overflow-visible.
<div role="region" aria-label="Serviços solicitados" tabIndex={0} className="overflow-x-auto [&>div]:overflow-visible">
  <Table className="min-w-[40rem]">
    <TableCaption>Serviços solicitados</TableCaption>
    <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableCell>IPTU</TableCell><TableCell>Aberto</TableCell></TableRow></TableBody>
  </Table>
</div>

// Avançado: ordenação + filtro + paginação + seleção
// Ver https://semec-pvh.github.io/SEMEC_design_system/padroes/dados-relatorios/tabelas/ → demo com TableAdvanced
```

## Prompt para IA

```text
Use o componente `Table` (Tabela) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Tabela de dados semântica com caption, header, body e footer. Para ordenação, filtros e seleção, ver https://semec-pvh.github.io/SEMEC_design_system/padroes/dados-relatorios/tabelas/. Se houver rolagem horizontal, use uma região nomeada e focável, como no exemplo, e teste Tab e setas em tela estreita. API e variantes: composição: Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption · a11y: scope=col (TableHead) · aria-sort repassado pelo consumidor em TableHead · TableCaption para nome. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
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
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
    {...props}
  />
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
    className={cn(
      "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
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
      "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
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
