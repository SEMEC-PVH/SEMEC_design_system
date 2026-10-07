"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle, Button, Skeleton, Spinner } from "semec-ds/react";

const LINHAS = [
  { id: "2026.042", servico: "IPTU — 2ª via" },
  { id: "2026.043", servico: "Alvará de funcionamento" },
  { id: "2026.044", servico: "Cadastro de contribuinte" },
];

export function ProcessamentoDemo() {
  const [fase, setFase] = useState("processando");
  const [atualizacoes, setAtualizacoes] = useState(0);

  useEffect(() => {
    if (fase !== "processando") return;
    const timer = setTimeout(() => setFase("concluido"), 2600);
    return () => clearTimeout(timer);
  }, [fase]);

  const processando = fase === "processando";

  return (
    <div className="w-full max-w-xl space-y-4 p-4 text-left">
      {processando ? (
        <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" aria-hidden="true" />
          <span>Importando 240 registros em segundo plano…</span>
        </div>
      ) : (
        <Alert variant="success">
          <AlertTitle>Importação concluída</AlertTitle>
          <AlertDescription>
            240 registros adicionados. A lista abaixo já mostra os dados novos.
          </AlertDescription>
        </Alert>
      )}

      <ul className="space-y-3 rounded-lg border border-border bg-surface p-3">
        {processando
          ? LINHAS.map((linha) => (
              <li key={linha.id} className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-40" />
              </li>
            ))
          : LINHAS.map((linha) => (
              <li
                key={linha.id}
                className="flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <span className="text-foreground">{linha.servico}</span>
                <span className="text-muted-foreground">protocolo {linha.id}</span>
              </li>
            ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setAtualizacoes((n) => n + 1)}>
          Atualizar lista
        </Button>
        {!processando && (
          <Button variant="ghost" onClick={() => setFase("processando")}>
            Processar de novo
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {processando
            ? "A tela continua liberada enquanto a importação roda."
            : "Processamento encerrado — a lista já está atualizada."}
        </span>
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        {atualizacoes > 0
          ? `Lista atualizada — ${atualizacoes} ${
              atualizacoes === 1 ? "vez" : "vezes"
            } nesta sessão.`
          : ""}
      </p>
    </div>
  );
}
