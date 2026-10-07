"use client";

import { useEffect, useState } from "react";
import { Button, Progress } from "semec-ds/react";

const ETAPAS = 4;
const PASSO = 4;

export function ProgressoDemo() {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (valor >= 100) return;
    const id = setInterval(() => setValor((atual) => Math.min(100, atual + PASSO)), 150);
    return () => clearInterval(id);
  }, [valor]);

  const concluido = valor >= 100;
  const etapa = Math.min(ETAPAS, Math.floor(valor / (100 / ETAPAS)) + 1);
  const texto = `Etapa ${etapa} de ${ETAPAS} — ${valor}%`;

  return (
    <div className="w-full max-w-xl space-y-3 p-4 text-left">
      <Progress value={valor} aria-valuetext={texto} />
      <p className="text-sm text-foreground">{texto}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => setValor(0)}>
          Reiniciar
        </Button>
        <span className="text-sm text-muted-foreground">
          {concluido ? "Todas as etapas foram concluídas." : "A tarefa avança automaticamente…"}
        </span>
      </div>

      {concluido && (
        <p role="status" className="text-sm text-muted-foreground">
          Progresso concluído — etapa {ETAPAS} de {ETAPAS}, 100%.
        </p>
      )}
    </div>
  );
}
