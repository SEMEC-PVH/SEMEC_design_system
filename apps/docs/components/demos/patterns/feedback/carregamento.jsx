"use client";

import { useEffect, useState } from "react";
import { Button, Spinner } from "semec-ds/react";

export function CarregamentoDemo() {
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("Nenhum envio em andamento.");

  useEffect(() => {
    if (!enviando) return;
    const timers = [
      setTimeout(() => setMensagem("Validando os anexos…"), 900),
      setTimeout(() => setMensagem("Registrando o protocolo…"), 1800),
      setTimeout(() => {
        setMensagem("Formulário enviado — protocolo 2026.042 gerado.");
        setEnviando(false);
      }, 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [enviando]);

  function enviar() {
    setMensagem("Enviando o formulário…");
    setEnviando(true);
  }

  return (
    <div className="w-full max-w-xl space-y-4 p-4 text-left">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={enviar} disabled={enviando}>
          {enviando && <Spinner className="h-4 w-4" aria-hidden="true" />}
          {enviando ? "Enviando…" : "Enviar"}
        </Button>
        <span className="text-sm text-muted-foreground">
          O botão fica desabilitado enquanto a ação roda.
        </span>
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        {mensagem}
      </p>
    </div>
  );
}
