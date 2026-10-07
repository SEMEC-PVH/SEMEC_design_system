"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "semec-ds/react";

const REGISTROS = [
  { id: "2026.0412", requerente: "Maria de Souza", status: "Em análise" },
  { id: "2026.0418", requerente: "João Pereira", status: "Deferido" },
  { id: "2026.0421", requerente: "Ana Beatriz Lima", status: "Indeferido" },
  { id: "2026.0430", requerente: "Carlos Mendes", status: "Em análise" },
  { id: "2026.0437", requerente: "Fernanda Dias", status: "Deferido" },
];

const STATUS_VARIANT = { "Em análise": "warning", Deferido: "success", Indeferido: "danger" };

export function OperacoesEmLoteDemo() {
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [mensagem, setMensagem] = useState("");

  const total = selecionados.size;
  const todosMarcados = REGISTROS.every((r) => selecionados.has(r.id));
  const algumMarcado = REGISTROS.some((r) => selecionados.has(r.id));

  function alternarTodos() {
    setMensagem("");
    setSelecionados((prev) => {
      const proximo = new Set(prev);
      if (todosMarcados) REGISTROS.forEach((r) => proximo.delete(r.id));
      else REGISTROS.forEach((r) => proximo.add(r.id));
      return proximo;
    });
  }

  function alternarUm(id) {
    setMensagem("");
    setSelecionados((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function limparSelecao() {
    setSelecionados(new Set());
    setMensagem("Seleção limpa.");
  }

  function exportar() {
    setMensagem(`${total} registro(s) exportado(s) em CSV.`);
  }

  function arquivar() {
    setSelecionados(new Set());
    setMensagem(`${total} registro(s) arquivado(s).`);
  }

  function excluir() {
    setSelecionados(new Set());
    setMensagem(`${total} registro(s) excluído(s).`);
  }

  return (
    <div className="w-full max-w-2xl space-y-3 text-left">
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  aria-label={todosMarcados ? "Desmarcar todos" : "Marcar todos"}
                  checked={todosMarcados ? true : algumMarcado ? "indeterminate" : false}
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

      {total > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-primary/10 px-3 py-2">
          <span className="text-sm font-semibold text-foreground">
            {total} selecionado{total > 1 ? "s" : ""}
          </span>
          <Button size="sm" variant="outline" onClick={exportar}>
            Exportar
          </Button>
          <Button size="sm" variant="outline" onClick={arquivar}>
            Arquivar
          </Button>
          <Button size="sm" variant="ghost" onClick={limparSelecao}>
            Limpar seleção
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Excluir {total} registro{total > 1 ? "s" : ""}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Os {total} protocolo{total > 1 ? "s" : ""} selecionado
                  {total > 1 ? "s" : ""} sairão da fila de atendimento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={excluir}
                >
                  Excluir {total} registro{total > 1 ? "s" : ""}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {mensagem || (total === 0 ? "Nenhum registro selecionado." : `${total} registro(s) pronto(s) para ação em lote.`)}
      </p>
    </div>
  );
}
