"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "semec-ds/react";
import { X } from "lucide-react";

const PROTOCOLOS = [
  { id: "2026.0412", requerente: "Maria de Souza", servico: "IPTU", status: "em-analise", urgente: true, comAnexo: true },
  { id: "2026.0418", requerente: "João Pereira", servico: "Alvará", status: "deferido", urgente: false, comAnexo: true },
  { id: "2026.0421", requerente: "Ana Beatriz Lima", servico: "IPTU", status: "indeferido", urgente: false, comAnexo: false },
  { id: "2026.0430", requerente: "Carlos Mendes", servico: "Alvará", status: "em-analise", urgente: true, comAnexo: false },
  { id: "2026.0437", requerente: "Fernanda Dias", servico: "Cadastro", status: "deferido", urgente: false, comAnexo: true },
  { id: "2026.0444", requerente: "Rogério Alves", servico: "Cadastro", status: "em-analise", urgente: false, comAnexo: false },
  { id: "2026.0451", requerente: "Patrícia Nunes", servico: "IPTU", status: "deferido", urgente: true, comAnexo: true },
  { id: "2026.0459", requerente: "Sérgio Ramos", servico: "Alvará", status: "indeferido", urgente: false, comAnexo: false },
];

const STATUS_NOME = { "em-analise": "Em análise", deferido: "Deferido", indeferido: "Indeferido" };

const STATUS_VARIANT = { "em-analise": "warning", deferido: "success", indeferido: "danger" };

export function FiltrosDemo() {
  const [status, setStatus] = useState("todos");
  const [urgente, setUrgente] = useState(false);
  const [comAnexo, setComAnexo] = useState(false);

  const filtrados = useMemo(
    () =>
      PROTOCOLOS.filter(
        (p) =>
          (status === "todos" || p.status === status) &&
          (!urgente || p.urgente) &&
          (!comAnexo || p.comAnexo)
      ),
    [status, urgente, comAnexo]
  );

  const chips = [];
  if (status !== "todos") {
    chips.push({ id: "status", texto: `Status: ${STATUS_NOME[status]}`, aoRemover: () => setStatus("todos") });
  }
  if (urgente) chips.push({ id: "urgente", texto: "Somente urgentes", aoRemover: () => setUrgente(false) });
  if (comAnexo) chips.push({ id: "anexo", texto: "Somente com anexo", aoRemover: () => setComAnexo(false) });

  function limparFiltros() {
    setStatus("todos");
    setUrgente(false);
    setComAnexo(false);
  }

  return (
    <div className="w-full max-w-xl space-y-4 text-left">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Filtros</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-44">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Filtrar por status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="em-analise">Em análise</SelectItem>
                <SelectItem value="deferido">Deferido</SelectItem>
                <SelectItem value="indeferido">Indeferido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <fieldset className="min-w-40">
            <legend className="mb-1 text-xs font-medium text-muted-foreground">Recursos</legend>
            <div className="flex items-center gap-2">
              <Checkbox id="fl-urgente" checked={urgente} onCheckedChange={(v) => setUrgente(v === true)} />
              <Label htmlFor="fl-urgente" className="text-sm">
                Somente urgentes
              </Label>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Checkbox id="fl-anexo" checked={comAnexo} onCheckedChange={(v) => setComAnexo(v === true)} />
              <Label htmlFor="fl-anexo" className="text-sm">
                Somente com anexo
              </Label>
            </div>
          </fieldset>

          <Button variant="outline" size="sm" onClick={limparFiltros} disabled={chips.length === 0}>
            Limpar filtros
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {chips.map((chip) => (
            <li key={chip.id}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {chip.texto}
                <button
                  type="button"
                  onClick={chip.aoRemover}
                  aria-label={`Remover filtro: ${chip.texto}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
          {chips.length === 0 && <li className="text-xs text-muted-foreground">Nenhum filtro aplicado.</li>}
        </ul>

        <p role="status" aria-live="polite" className="text-sm font-medium text-foreground">
          {filtrados.length} de {PROTOCOLOS.length} resultados
        </p>
      </div>

      <ul className="space-y-2">
        {filtrados.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
          >
            <div>
              <p className="font-mono text-xs text-muted-foreground">Protocolo {p.id}</p>
              <p className="text-sm font-medium text-foreground">
                {p.requerente} · {p.servico}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_NOME[p.status]}</Badge>
          </li>
        ))}
        {filtrados.length === 0 && (
          <li className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhum protocolo com esses filtros. Remova um chip ou limpe tudo.
          </li>
        )}
      </ul>
    </div>
  );
}
