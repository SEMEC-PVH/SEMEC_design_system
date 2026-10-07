"use client";

import { useState } from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "semec-ds/react";
import { ArrowDown, ArrowUp } from "lucide-react";

const KPIS = {
  "7": [
    {
      rotulo: "Protocolos recebidos",
      valor: "1.284",
      variacao: "+12%",
      direcao: "up",
      sentido: "melhora",
      periodo: "Últimos 7 dias",
      calc: "Soma dos requerimentos protocolados de 01/10 a 07/10, comparada aos 7 dias anteriores.",
    },
    {
      rotulo: "Tempo médio de análise",
      valor: "4,2 dias",
      variacao: "-0,8 dia",
      direcao: "down",
      sentido: "melhora",
      periodo: "Últimos 7 dias",
      calc: "Soma dos prazos de análise ÷ protocolos encerrados no período.",
    },
    {
      rotulo: "Taxa de deferimento",
      valor: "78%",
      variacao: "+3 p.p.",
      direcao: "up",
      sentido: "melhora",
      periodo: "Últimos 7 dias",
      calc: "Deferidos ÷ encerrados no período, em pontos percentuais.",
    },
    {
      rotulo: "Reaberturas",
      valor: "31",
      variacao: "+5",
      direcao: "up",
      sentido: "piora",
      periodo: "Últimos 7 dias",
      calc: "Recursos que voltaram para nova análise após encerramento.",
    },
  ],
  "30": [
    {
      rotulo: "Protocolos recebidos",
      valor: "5.731",
      variacao: "+8%",
      direcao: "up",
      sentido: "melhora",
      periodo: "Últimos 30 dias",
      calc: "Soma dos requerimentos protocolados de 08/09 a 07/10, comparada aos 30 dias anteriores.",
    },
    {
      rotulo: "Tempo médio de análise",
      valor: "5,1 dias",
      variacao: "-1,4 dia",
      direcao: "down",
      sentido: "melhora",
      periodo: "Últimos 30 dias",
      calc: "Soma dos prazos de análise ÷ protocolos encerrados no período.",
    },
    {
      rotulo: "Taxa de deferimento",
      valor: "74%",
      variacao: "-2 p.p.",
      direcao: "down",
      sentido: "piora",
      periodo: "Últimos 30 dias",
      calc: "Deferidos ÷ encerrados no período, em pontos percentuais.",
    },
    {
      rotulo: "Reaberturas",
      valor: "108",
      variacao: "-12",
      direcao: "down",
      sentido: "melhora",
      periodo: "Últimos 30 dias",
      calc: "Recursos que voltaram para nova análise após encerramento.",
    },
  ],
};

const PERIODOS = [
  { valor: "7", rotulo: "7 dias" },
  { valor: "30", rotulo: "30 dias" },
];

const BOTAO_BASE =
  "rounded-sm px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

export function IndicadoresDemo() {
  const [periodo, setPeriodo] = useState("7");
  const indicadores = KPIS[periodo];

  return (
    <div className="w-full max-w-2xl space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Período dos indicadores" className="inline-flex rounded-md border border-border bg-background p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              aria-pressed={periodo === p.valor}
              onClick={() => setPeriodo(p.valor)}
              className={
                periodo === p.valor
                  ? `${BOTAO_BASE} bg-primary text-primary-foreground`
                  : `${BOTAO_BASE} text-muted-foreground hover:text-foreground`
              }
            >
              {p.rotulo}
            </button>
          ))}
        </div>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          Indicadores dos últimos {periodo} dias — 08/09 a 07/10 de 2026.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {indicadores.map((kpi) => {
          const Icone = kpi.direcao === "up" ? ArrowUp : ArrowDown;
          return (
            <Card key={kpi.rotulo}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{kpi.rotulo}</CardTitle>
                <CardDescription>{kpi.periodo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-3xl font-bold tabular-nums text-foreground">{kpi.valor}</span>
                  <Badge variant={kpi.sentido === "melhora" ? "success" : "danger"} className="gap-1">
                    <Icone className="h-3 w-3" aria-hidden="true" />
                    {kpi.variacao}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-foreground">
                  {kpi.sentido === "melhora" ? "Melhora" : "Piora"} frente ao período anterior
                </p>
                <p className="text-xs text-muted-foreground">Cálculo: {kpi.calc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
