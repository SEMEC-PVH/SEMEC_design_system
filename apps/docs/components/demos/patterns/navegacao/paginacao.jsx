"use client";

import { useState } from "react";
import { Badge, Pagination } from "semec-ds/react";

const SERVICOS = ["IPTU 2026", "Alvará de funcionamento", "Licença de obra", "Certidão negativa"];
const SITUACOES = [
  { rotulo: "Em análise", variant: "warning" },
  { rotulo: "Deferido", variant: "success" },
  { rotulo: "Pendente", variant: "secondary" },
];

/** 36 registros → 9 páginas de 4, para a janela de números usar as elipses. */
const REQUERIMENTOS = Array.from({ length: 36 }, (_, indice) => ({
  protocolo: `2026.${String(401 + indice).padStart(4, "0")}`,
  servico: SERVICOS[indice % SERVICOS.length],
  data: `${String((indice % 28) + 1).padStart(2, "0")}/09/2026`,
  situacao: SITUACOES[indice % SITUACOES.length],
}));

const POR_PAGINA = 4;

/**
 * Lista longa recortada em páginas: o intervalo exibido é anunciado em
 * aria-live, a página correta recebe aria-current="page" (feito pelo kit)
 * e a janela de números usa elipses quando há muitas páginas.
 */
export function PaginacaoDemo() {
  const [pagina, setPagina] = useState(4);
  const totalPaginas = Math.ceil(REQUERIMENTOS.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const visiveis = REQUERIMENTOS.slice(inicio, inicio + POR_PAGINA);
  const fim = inicio + visiveis.length;

  return (
    <div className="w-full max-w-2xl space-y-4 text-left">
      <p role="status" aria-live="polite" className="text-sm font-medium text-foreground">
        Mostrando {inicio + 1}–{fim} de {REQUERIMENTOS.length} requerimentos · Página {pagina} de{" "}
        {totalPaginas}
      </p>

      <ul className="space-y-2">
        {visiveis.map((requerimento) => (
          <li
            key={requerimento.protocolo}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
          >
            <div>
              <p className="font-mono text-xs text-muted-foreground">{requerimento.protocolo}</p>
              <p className="text-sm font-medium text-foreground">{requerimento.servico}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{requerimento.data}</span>
              <Badge variant={requerimento.situacao.variant}>{requerimento.situacao.rotulo}</Badge>
            </div>
          </li>
        ))}
      </ul>

      <Pagination page={pagina} pageCount={totalPaginas} onPageChange={setPagina} />
    </div>
  );
}
