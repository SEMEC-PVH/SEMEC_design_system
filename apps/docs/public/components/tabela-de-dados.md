---
title: "Tabela de dados"
code: "data-table"
slug: "tabela-de-dados"
file: "src/components/data-table.tsx"
category: "conteudo-dados"
variants: "props: columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · rowLabel?: (row, index) => string (aria-label da linha; use com onRowClick) · emptyMessage · caption · labels (sortBy: descrição 'Ordenar por …' do botão de ordenação, via aria-describedby, não o nome dele · pageOf · previous · next) · a11y: columnheader e botão de ordenação nomeados só pela coluna; 'Ordenar por …' como descrição (aria-describedby) · aria-sort no cabeçalho ordenado · botão de ordenação com alvo de 44px · linha focável e ativável por Enter/Espaço quando há onRowClick · rowLabel nomeia a linha clicável · cliques e teclas em controles da célula (e em portais abertos por ela) não ativam a linha · rodapé empilha abaixo de sm · paginação com alvos de 44px"
---

# Tabela de dados — `data-table`

> Tabela com ordenação, paginação e estados vazios. Com `onRowClick`, passe `rowLabel` para dar nome à linha clicável.

**Arquivo:** `src/components/data-table.tsx` | **Categoria:** Conteúdo e dados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/tabela-de-dados/

## Variantes

- **props**: columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · rowLabel?: (row, index) => string (aria-label da linha; use com onRowClick) · emptyMessage · caption · labels (sortBy: descrição "Ordenar por …" do botão de ordenação, via aria-describedby, não o nome dele · pageOf · previous · next)
- **a11y**: columnheader e botão de ordenação nomeados só pela coluna; "Ordenar por …" como descrição (aria-describedby) · aria-sort no cabeçalho ordenado · botão de ordenação com alvo de 44px · linha focável e ativável por Enter/Espaço quando há onRowClick · rowLabel nomeia a linha clicável · cliques e teclas em controles da célula (e em portais abertos por ela) não ativam a linha · rodapé empilha abaixo de sm · paginação com alvos de 44px

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

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 4 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.1.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.2.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { DataTable, Button } from "@semec/ds/react";

// Quando a linha tem várias ações, prefira uma coluna de ações com render + Button a onRowClick
<DataTable
  caption="Protocolos do contribuinte"
  columns={[
    { key: "nome", header: "Nome", sortable: true },
    { key: "status", header: "Status" },
    {
      key: "acoes",
      header: "Ações",
      render: (row) => (
        <Button variant="outline" onClick={() => abrirProtocolo(row)}>Ver detalhes</Button>
      ),
    },
  ]}
  data={registros}
  sortKey={sortField}
  sortDir={sortDir}
  onSort={handleSort}
  page={pagina}
  pageCount={totalPaginas}
  onPageChange={setPagina}
/>

// Linha inteira clicável (uma ação só): rowLabel diz ao leitor de tela o que o Enter faz
<DataTable
  caption="Protocolos abertos"
  columns={[
    { key: "numero", header: "Número", sortable: true },
    { key: "status", header: "Status" },
  ]}
  data={protocolos}
  onRowClick={(protocolo) => abrirProtocolo(protocolo)}
  rowLabel={(protocolo) => "Abrir protocolo " + protocolo.numero}
/>
```

## Prompt para IA

```text
Use o componente `DataTable` (Tabela de dados) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Tabela com ordenação, paginação e estados vazios. Com `onRowClick`, passe `rowLabel` para dar nome à linha clicável. API e variantes: props: columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · rowLabel?: (row, index) => string (aria-label da linha; use com onRowClick) · emptyMessage · caption · labels (sortBy: descrição "Ordenar por …" do botão de ordenação, via aria-describedby, não o nome dele · pageOf · previous · next) · a11y: columnheader e botão de ordenação nomeados só pela coluna; "Ordenar por …" como descrição (aria-describedby) · aria-sort no cabeçalho ordenado · botão de ordenação com alvo de 44px · linha focável e ativável por Enter/Espaço quando há onRowClick · rowLabel nomeia a linha clicável · cliques e teclas em controles da célula (e em portais abertos por ela) não ativam a linha · rodapé empilha abaixo de sm · paginação com alvos de 44px. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

type SortDirection = "asc" | "desc" | null;

/** Controles que tratam o próprio clique e não devem ativar a linha (TST-11). */
const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[contenteditable]:not([contenteditable=false])",
  "[role=button]",
  "[role=link]",
  "[role=checkbox]",
  "[role=radio]",
  "[role=switch]",
  "[role=menuitem]",
  "[role=option]",
  "[role=combobox]",
  "[role=tab]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface DataTableLabels {
  /**
   * Instrução do botão de ordenação, exposta como **descrição**
   * (`aria-describedby`). Padrão: `Ordenar por ${header}`. O nome do botão e do
   * cabeçalho é só o texto da coluna (TST-27): antes este texto virava o nome
   * do `columnheader` e era repetido a cada célula pelo leitor de tela.
   */
  sortBy: (header: string) => string;
  /** Texto da paginação. Padrão: `Página ${page} de ${pageCount}`. */
  pageOf: (page: number, pageCount: number) => string;
  /** Padrão: "Anterior". */
  previous: string;
  /** Padrão: "Próximo". */
  next: string;
}

const defaultDataTableLabels: DataTableLabels = {
  sortBy: (header) => `Ordenar por ${header}`,
  pageOf: (page, pageCount) => `Página ${page} de ${pageCount}`,
  previous: "Anterior",
  next: "Próximo",
};

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
  /**
   * Ativação da linha inteira. A linha fica focável (Tab) e responde a
   * Enter/Espaço, além do clique. Para várias ações por linha, prefira uma
   * coluna de ações com botões (`render`) — ver manifest/usage.
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * Nome acessível da linha (`aria-label` na `<tr>`), por exemplo
   * `(row) => "Abrir protocolo " + row.numero`. Recomendado junto com
   * `onRowClick`: a linha focável não tem nome próprio e o leitor de tela não
   * diz o que o Enter faz (TST-28).
   */
  rowLabel?: (row: T, index: number) => string;
  caption?: string;
  /** Textos embutidos (PT-BR por padrão), sobrescrevíveis um a um. */
  labels?: Partial<DataTableLabels>;
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
    rowLabel,
    caption,
    labels: labelsProp,
    className,
    ...props
  }: DataTableProps<T>,
  _ref: React.Ref<HTMLDivElement>
) {
  const labels = { ...defaultDataTableLabels, ...labelsProp };
  const idBase = React.useId();

  const handleSort = (key: string) => {
    onSort?.(key);
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key || !sortDir)
      return <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />;
    if (sortDir === "asc") return <ArrowUp className="h-3 w-3" aria-hidden="true" />;
    return <ArrowDown className="h-3 w-3" aria-hidden="true" />;
  };

  // Enter/Espaço ativam a linha só quando o foco está nela mesma, para não
  // sequestrar teclas de botões/links dentro das células.
  const handleRowKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    row: T,
    index: number
  ) => {
    if (!onRowClick || event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row, index);
    }
  };

  // O clique (do mouse, ou o sintético que o Enter/Espaço gera num botão) sobe
  // até a <tr>. Ignora o que vem de um controle dentro da célula e o que vem
  // de um portal (menu/diálogo aberto por uma célula), que sobe pela árvore do
  // React sem estar dentro da linha no DOM (TST-11).
  const handleRowClick = (
    event: React.MouseEvent<HTMLTableRowElement>,
    row: T,
    index: number
  ) => {
    if (!onRowClick) return;
    const rowEl = event.currentTarget;
    const target = event.target as Element | null;
    if (!target || !rowEl.contains(target)) return;
    const interactive = target.closest(INTERACTIVE_SELECTOR);
    if (interactive && interactive !== rowEl && rowEl.contains(interactive)) return;
    onRowClick(row, index);
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
              {columns.map((col, colIndex) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    col.sortable
                      ? sortKey === col.key && sortDir
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
                    <>
                      {/* min-h-11/min-w-11: alvo de 44 px (TST-10) sem
                          crescer o cabeçalho, que já tem h-11. */}
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        aria-describedby={`${idBase}-sort-${colIndex}`}
                        className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {col.header}
                        {getSortIcon(col.key)}
                      </button>
                      {/* `hidden`: fora do nome do columnheader (calculado
                          pelo conteúdo), mas referenciável como descrição. */}
                      <span id={`${idBase}-sort-${colIndex}`} hidden>
                        {labels.sortBy(col.header)}
                      </span>
                    </>
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
                    onRowClick &&
                      "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={rowLabel ? rowLabel(row, index) : undefined}
                  onClick={
                    onRowClick
                      ? (event) => handleRowClick(event, row, index)
                      : undefined
                  }
                  onKeyDown={
                    onRowClick
                      ? (event) => handleRowKeyDown(event, row, index)
                      : undefined
                  }
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
        // Abaixo de `sm` o rodapé vira coluna e os botões podem quebrar de
        // linha, em vez de o texto quebrar dentro do botão (TST-23).
        <div className="flex flex-col gap-2 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {labels.pageOf(page, pageCount)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {labels.previous}
            </button>
            <button
              type="button"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= pageCount}
              className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {labels.next}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
