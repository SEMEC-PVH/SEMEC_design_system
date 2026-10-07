"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle, Button, Input, Label, Spinner } from "semec-ds/react";

const CAUSA =
  "O servidor de protocolos não respondeu em 30 s (erro 504). Verifique a conexão e tente de novo.";

export function ErroDemo() {
  const [estado, setEstado] = useState("idle");

  function enviar(evento) {
    evento.preventDefault();
    setEstado("enviando");
    setTimeout(() => setEstado("falhou"), 700);
  }

  function tentarNovamente() {
    setEstado("tentando");
    setTimeout(() => setEstado("falhou"), 700);
  }

  const ocupado = estado === "enviando" || estado === "tentando";
  const falhou = estado === "falhou" || estado === "tentando";

  return (
    <form onSubmit={enviar} noValidate className="w-full max-w-xl space-y-4 p-4 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="erro-email">E-mail para receber o comprovante</Label>
        <Input
          id="erro-email"
          type="email"
          defaultValue="maria@prefeitura"
          aria-invalid="true"
          aria-describedby="erro-email-ajuda"
        />
        <p id="erro-email-ajuda" className="text-xs text-destructive">
          Informe um e-mail válido, ex.: maria@prefeitura.gov.br.
        </p>
      </div>

      {falhou && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível enviar a solicitação</AlertTitle>
          <AlertDescription>{CAUSA}</AlertDescription>
          <span className="mt-2 block">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={tentarNovamente}
              disabled={estado === "tentando"}
            >
              {estado === "tentando" && <Spinner className="h-4 w-4" aria-hidden="true" />}
              {estado === "tentando" ? "Tentando…" : "Tentar novamente"}
            </Button>
          </span>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={ocupado}>
          {estado === "enviando" && <Spinner className="h-4 w-4" aria-hidden="true" />}
          {estado === "enviando" ? "Enviando…" : "Enviar solicitação"}
        </Button>
        <span className="text-sm text-muted-foreground">Nesta simulação o envio sempre falha.</span>
      </div>
    </form>
  );
}
