"use client";

import { useState } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "semec-ds/react";

const MESES = [
  { mes: "Jan", rotulo: "janeiro", valor: 145, faixa: "baixo" },
  { mes: "Fev", rotulo: "fevereiro", valor: 120, faixa: "baixo" },
  { mes: "Mar", rotulo: "março", valor: 240, faixa: "medio" },
  { mes: "Abr", rotulo: "abril", valor: 330, faixa: "alto" },
  { mes: "Mai", rotulo: "maio", valor: 265, faixa: "medio" },
  { mes: "Jun", rotulo: "junho", valor: 355, faixa: "alto" },
  { mes: "Jul", rotulo: "julho", valor: 420, faixa: "maximo" },
];

/** Alturas por faixa — classes fixas (Tailwind não gera `h-[${n}px]` dinâmico). */
const ALTURA = {
  baixo: "h-[55px]",
  medio: "h-[105px]",
  alto: "h-[145px]",
  maximo: "h-[180px]",
};

const TOTAL = MESES.reduce((soma, m) => soma + m.valor, 0);
const MAXIMO = MESES.reduce((a, b) => (b.valor > a.valor ? b : a));
const MINIMO = MESES.reduce((a, b) => (b.valor < a.valor ? b : a));

const RESUMO =
  `Gráfico de barras de protocolos por mês em 2026. ` +
  `Maior volume em ${MAXIMO.rotulo}, com ${MAXIMO.valor} protocolos. ` +
  `Menor volume em ${MINIMO.rotulo}, com ${MINIMO.valor} protocolos. ` +
  `Total de ${TOTAL} protocolos no período. Use o botão "Ver tabela de dados" para a lista completa.`;

export function GraficosDemo() {
  const [mostrarTabela, setMostrarTabela] = useState(false);

  return (
    <div className="w-full max-w-2xl space-y-3 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Protocolos por mês — 2026</h3>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={mostrarTabela}
          aria-controls="gf-tabela"
          onClick={() => setMostrarTabela((v) => !v)}
        >
          {mostrarTabela ? "Ocultar tabela de dados" : "Ver tabela de dados"}
        </Button>
      </div>

      <div role="img" aria-label={RESUMO} className="rounded-lg border border-border bg-surface p-4">
        <ul className="flex h-[220px] items-end gap-2">
          {MESES.map((m) => (
            <li key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-medium tabular-nums text-foreground">{m.valor}</span>
              <div className={`w-full rounded-t-sm bg-primary/80 ${ALTURA[m.faixa]}`} />
            </li>
          ))}
        </ul>
        <ul className="mt-2 flex gap-2">
          {MESES.map((m) => (
            <li key={m.mes} className="flex-1 text-center text-xs text-muted-foreground">
              {m.mes}
            </li>
          ))}
        </ul>
      </div>

      <div id="gf-tabela" hidden={!mostrarTabela}>
        <Table>
          <TableCaption>Protocolos por mês em 2026 — a mesma informação do gráfico.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Protocolos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MESES.map((m) => (
              <TableRow key={m.mes}>
                <TableCell>{m.rotulo}</TableCell>
                <TableCell className="text-right tabular-nums">{m.valor}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{TOTAL}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {mostrarTabela
          ? "Tabela de dados exibida, com os 7 meses e o total."
          : "Tabela de dados oculta. O gráfico resumido está disponível em texto."}
      </p>
    </div>
  );
}
