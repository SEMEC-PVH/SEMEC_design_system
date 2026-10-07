"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FormField,
  Input,
} from "semec-ds/react";

/**
 * Confirmação de envio: depois do envio válido, o formulário é substituído
 * por um Alert de sucesso com o protocolo gerado. A mensagem entra com
 * aria-live e recebe o foco; "Nova solicitação" reinicia o fluxo e devolve o
 * foco ao primeiro campo.
 */
export function ConfirmacaoEnvioDemo() {
  const [valores, setValores] = useState({
    assunto: "Segunda via de IPTU 2026",
    email: "contribuinte@email.com",
  });
  const [erros, setErros] = useState({});
  const [protocolo, setProtocolo] = useState("");
  const sequencia = useRef(41);
  const confirmacaoRef = useRef(null);
  const focarFormulario = useRef(false);

  useEffect(() => {
    if (protocolo) {
      confirmacaoRef.current?.focus();
    } else if (focarFormulario.current) {
      focarFormulario.current = false;
      document.getElementById("cf-assunto")?.focus();
    }
  }, [protocolo]);

  function aoEnviar(event) {
    event.preventDefault();
    const encontrados = {};
    if (!valores.assunto.trim()) {
      encontrados.assunto = "Informe o assunto da solicitação.";
    }
    if (!valores.email.includes("@")) {
      encontrados.email = "Informe um e-mail para retorno.";
    }
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    sequencia.current += 1;
    setProtocolo("2026." + String(sequencia.current).padStart(3, "0"));
  }

  function novaSolicitacao() {
    setValores({ assunto: "", email: "" });
    setErros({});
    setProtocolo("");
    focarFormulario.current = true;
  }

  if (protocolo) {
    return (
      <div className="w-full max-w-[520px] space-y-4 p-4 text-left">
        <Alert
          ref={confirmacaoRef}
          tabIndex={-1}
          variant="success"
          aria-live="polite"
          className="focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
        >
          <AlertTitle>Solicitação enviada com sucesso</AlertTitle>
          <AlertDescription>
            Protocolo <strong>{protocolo}</strong>. A resposta chega em{" "}
            {valores.email} em até 5 dias úteis.
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" onClick={novaSolicitacao}>
          Nova solicitação
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] space-y-4 p-4 text-left">
      <form onSubmit={aoEnviar} noValidate className="space-y-4">
        <FormField
          id="cf-assunto-campo"
          label="Assunto da solicitação"
          htmlFor="cf-assunto"
          hint="Resumo exibido no comprovante."
          error={erros.assunto}
        >
          <Input
            id="cf-assunto"
            value={valores.assunto}
            onChange={(e) => setValores((v) => ({ ...v, assunto: e.target.value }))}
            aria-invalid={erros.assunto ? true : undefined}
            aria-describedby={
              erros.assunto ? "cf-assunto-campo-error" : "cf-assunto-campo-hint"
            }
          />
        </FormField>

        <FormField
          id="cf-email-campo"
          label="E-mail para retorno"
          htmlFor="cf-email"
          hint="Para acompanhar o protocolo."
          error={erros.email}
        >
          <Input
            id="cf-email"
            type="email"
            value={valores.email}
            onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
            aria-invalid={erros.email ? true : undefined}
            aria-describedby={erros.email ? "cf-email-campo-error" : "cf-email-campo-hint"}
          />
        </FormField>

        <Button type="submit">Enviar solicitação</Button>
      </form>
    </div>
  );
}
