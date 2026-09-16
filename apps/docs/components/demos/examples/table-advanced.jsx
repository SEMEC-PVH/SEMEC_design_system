"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@semec/ds-react";
import { ArrowUpDown, Inbox } from "lucide-react";

// Dataset exemplo — SIGO contratos
const DATA = [
  { id: "CT-2026.001", objeto: "Manutenção ar-condicionado — EMEF Jorge Vicente", status: "Em análise", valor: 12500, data: "2026-08-10" },
  { id: "CT-2026.002", objeto: "Aquisição carteiras escolares — lote 2", status: "Deferido", valor: 89000, data: "2026-08-12" },
  { id: "CT-2026.003", objeto: "Reforma quadra — EMEF Liberdade", status: "Indeferido", valor: 45000, data: "2026-08-14" },
  { id: "CT-2026.004", objeto: "Contratação transporte escolar — zona rural", status: "Pendente", valor: 210000, data: "2026-08-15" },
  { id: "CT-2026.005", objeto: "Compra livros didáticos PNLD", status: "Deferido", valor: 34000, data: "2026-08-16" },
  { id: "CT-2026.006", objeto: "Licença software gestão", status: "Em análise", valor: 15000, data: "2026-08-18" },
  { id: "CT-2026.007", objeto: "Merenda escolar — 2º semestre", status: "Deferido", valor: 95000, data: "2026-08-19" },
  { id: "CT-2026.008", objeto: "Uniformes escolares", status: "Pendente", valor: 62000, data: "2026-08-20" },
];

const STATUS_VARIANT = {
  Deferido: "success",
  "Em análise": "warning",
  Pendente: "secondary",
  Indeferido: "danger",
};

function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TableAdvanced() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [sortDir, setSortDir] = useState("asc"); // por objeto
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const pageSize = 4;

  const filtered = useMemo(() => {
    let r = DATA.filter((d) => {
      if (status !== "todos" && d.status !== status) return false;
      if (query && !`${d.objeto} ${d.id}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      const c = a.objeto.localeCompare(b.objeto);
      return sortDir === "asc" ? c : -c;
    });
    return r;
  }, [query, status, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allIdsPage = paginated.map((r) => r.id);
  const allSelected = allIdsPage.length > 0 && allIdsPage.every((id) => selected.has(id));
  const someSelected = allIdsPage.some((id) => selected.has(id)) && !allSelected;

  function toggleAll() {
    const next = new Set(selected);
    if (allSelected) allIdsPage.forEach((id) => next.delete(id));
    else allIdsPage.forEach((id) => next.add(id));
    setSelected(next);
  }
  function toggleOne(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function simulateLoading(nextStatus) {
    setLoading(true);
    setTimeout(() => {
      setStatus(nextStatus);
      setPage(1);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="space-y-4">
      {/* Barra filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="tbl-busca" className="mb-1 block text-xs font-medium text-muted-foreground">Buscar</label>
          <Input id="tbl-busca" placeholder="ID ou objeto" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <div className="w-44">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Status</span>
          <Select value={status} onValueChange={(v) => simulateLoading(v)}>
            <SelectTrigger aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Deferido">Deferido</SelectItem>
              <SelectItem value="Em análise">Em análise</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Indeferido">Indeferido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => { setQuery(""); setStatus("todos"); setPage(1); }}>Limpar</Button>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} resultado(s){selected.size > 0 ? ` · ${selected.size} selecionado(s)` : ""}</span>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border">
        <Table aria-rowcount={filtered.length} aria-colcount={6}>
          <TableCaption>Contratos — exemplo SIGO Módulo IV. Use seleção para ação em lote.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox aria-label="Selecionar todos da página" checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead aria-sort={sortDir === "asc" ? "ascending" : "descending"}>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                  aria-label={`Ordenar por objeto, ${sortDir === "asc" ? "crescente" : "decrescente"}`}
                >
                  Objeto <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={<Inbox />}
                    title="Nenhum contrato encontrado"
                    description="Ajuste busca ou filtro. Tente limpar ou selecionar outro status."
                    action={<Button variant="outline" onClick={() => { setQuery(""); setStatus("todos"); }}>Limpar filtros</Button>}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.id) ? "selected" : undefined}>
                  <TableCell><Checkbox aria-label={`Selecionar ${row.id}`} checked={selected.has(row.id)} onCheckedChange={() => toggleOne(row.id)} /></TableCell>
                  <TableCell className="max-w-64 truncate font-medium">{row.objeto}</TableCell>
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge></TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatBRL(row.valor)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(row.data).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
          <span className="text-sm">{selected.size} selecionado(s)</span>
          <Button size="sm" onClick={() => alert(`Exportar: ${[...selected].join(", ")}`)}>Exportar CSV</Button>
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>Limpar seleção</Button>
        </div>
      )}
    </div>
  );
}
