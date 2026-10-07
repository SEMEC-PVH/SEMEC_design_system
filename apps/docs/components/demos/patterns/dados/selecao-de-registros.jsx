"use client";

import { useState } from "react";
import {
  Badge,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "semec-ds/react";

const REGISTROS = [
  { id: "2026.0412", requerente: "Maria de Souza", servico: "IPTU 2026", status: "Em análise" },
  { id: "2026.0418", requerente: "João Pereira", servico: "Alvará", status: "Deferido" },
  { id: "2026.0421", requerente: "Ana Beatriz Lima", servico: "Reforma de fachada", status: "Indeferido" },
  { id: "2026.0430", requerente: "Carlos Mendes", servico: "Alvará", status: "Em análise" },
  { id: "2026.0437", requerente: "Fernanda Dias", servico: "Cadastro", status: "Deferido" },
  { id: "2026.0444", requerente: "Rogério Alves", servico: "Reforma interna", status: "Em análise" },
];

const STATUS_VARIANT = { "Em análise": "warning", Deferido: "success", Indeferido: "danger" };

export function SelecaoRegistrosDemo() {
  const [selecionados, setSelecionados] = useState(() => new Set());

  const todosMarcados = REGISTROS.every((r) => selecionados.has(r.id));
  const algumMarcado = REGISTROS.some((r) => selecionados.has(r.id));
  const indeterminado = algumMarcado && !todosMarcados;

  function alternarTodos() {
    setSelecionados((prev) => {
      const proximo = new Set(prev);
      if (todosMarcados) REGISTROS.forEach((r) => proximo.delete(r.id));
      else REGISTROS.forEach((r) => proximo.add(r.id));
      return proximo;
    });
  }

  function alternarUm(id) {
    setSelecionados((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  const nomes = REGISTROS.filter((r) => selecionados.has(r.id)).map((r) => r.id);

  return (
    <div className="w-full max-w-2xl space-y-3 text-left">
      <div className="overflow-hidden rounded-lg border border-border">
        <Table aria-rowcount={REGISTROS.length}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  aria-label={todosMarcados ? "Desmarcar todos" : "Marcar todos"}
                  checked={todosMarcados ? true : indeterminado ? "indeterminate" : false}
                  onCheckedChange={alternarTodos}
                />
              </TableHead>
              <TableHead>Protocolo</TableHead>
              <TableHead>Requerente</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {REGISTROS.map((r) => (
              <TableRow key={r.id} data-state={selecionados.has(r.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    aria-label={`Selecionar protocolo ${r.id}`}
                    checked={selecionados.has(r.id)}
                    onCheckedChange={() => alternarUm(r.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell className="text-sm">{r.requerente}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" aria-live="polite" className="text-sm font-medium text-foreground">
          {selecionados.size} de {REGISTROS.length} registros selecionados
        </p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {nomes.length > 0 ? `Selecionados: ${nomes.join(", ")}` : "Marque as linhas para ações em conjunto."}
        </p>
      </div>
    </div>
  );
}
