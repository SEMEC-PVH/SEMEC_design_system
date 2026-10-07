"use client";

import { useState } from "react";
import { Badge, Pagination } from "semec-ds/react";

const REGISTROS = [
  { id: "2026.0412", requerente: "Maria de Souza", servico: "IPTU 2026", status: "Em análise" },
  { id: "2026.0418", requerente: "João Pereira", servico: "Alvará", status: "Deferido" },
  { id: "2026.0421", requerente: "Ana Beatriz Lima", servico: "Reforma de fachada", status: "Indeferido" },
  { id: "2026.0430", requerente: "Carlos Mendes", servico: "Alvará", status: "Em análise" },
  { id: "2026.0437", requerente: "Fernanda Dias", servico: "Cadastro", status: "Deferido" },
  { id: "2026.0444", requerente: "Rogério Alves", servico: "Reforma interna", status: "Em análise" },
  { id: "2026.0451", requerente: "Patrícia Nunes", servico: "IPTU 2026", status: "Deferido" },
  { id: "2026.0459", requerente: "Sérgio Ramos", servico: "Alvará sanitário", status: "Indeferido" },
  { id: "2026.0463", requerente: "Juliana Prado", servico: "Cadastro", status: "Deferido" },
  { id: "2026.0470", requerente: "Eduardo Campos", servico: "Reforma interna", status: "Em análise" },
];

const STATUS_VARIANT = { "Em análise": "warning", Deferido: "success", Indeferido: "danger" };

const POR_PAGINA = 4;

export function PaginacaoResultadosDemo() {
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.ceil(REGISTROS.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const fim = Math.min(inicio + POR_PAGINA, REGISTROS.length);
  const fatia = REGISTROS.slice(inicio, fim);

  return (
    <div className="w-full max-w-xl space-y-3 text-left">
      <p role="status" aria-live="polite" className="text-sm font-medium text-foreground">
        Exibindo {inicio + 1}–{fim} de {REGISTROS.length} registros
      </p>

      <ul className="rounded-lg border border-border">
        {fatia.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 last:border-b-0"
          >
            <div>
              <p className="font-mono text-xs text-muted-foreground">{r.id}</p>
              <p className="text-sm text-foreground">
                {r.requerente} · {r.servico}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
          </li>
        ))}
      </ul>

      <Pagination page={pagina} pageCount={totalPaginas} onPageChange={setPagina} />
    </div>
  );
}
