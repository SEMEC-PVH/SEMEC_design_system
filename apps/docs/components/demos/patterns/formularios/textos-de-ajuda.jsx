"use client";

import { useEffect, useRef, useState } from "react";
import { Button, FormField, Input } from "semec-ds/react";

/**
 * Textos de ajuda (hint) na ordem correta: rótulo → campo → dica → erro.
 * O FormField renderiza hint e erro depois do campo; o input referencia o
 * texto com `aria-describedby`, apontando para a dica quando o campo está
 * válido e para o erro depois da validação no envio.
 */
export function TextosDeAjudaDemo() {
  const [valores, setValores] = useState({ email: "", telefone: "" });
  const [erros, setErros] = useState({});
  const [status, setStatus] = useState("");
  const focarErro = useRef(false);

  // Foca depois da renderização do erro: assim aria-describedby já resolve.
  useEffect(() => {
    if (!focarErro.current) return;
    focarErro.current = false;
    const alvo = erros.email ? "ajuda-email" : erros.telefone ? "ajuda-telefone" : null;
    if (alvo) document.getElementById(alvo)?.focus();
  }, [erros]);

  function aoEnviar(event) {
    event.preventDefault();
    const encontrados = {};
    if (!valores.email.includes("@")) {
      encontrados.email = "Informe um e-mail válido, com @.";
    }
    if (valores.telefone.replace(/\D/g, "").length < 10) {
      encontrados.telefone = "Informe o telefone com DDD, ex.: (69) 99999-9999.";
    }
    setErros(encontrados);
    focarErro.current = Object.keys(encontrados).length > 0;
    setStatus(
      Object.keys(encontrados).length > 0
        ? "Envio bloqueado: corrija os campos destacados."
        : "Dados validados — nenhuma correção pendente."
    );
  }

  return (
    <div className="w-full max-w-[520px] space-y-5 p-4 text-left">
      <p className="text-xs text-muted-foreground">
        Ordem do conteúdo no DOM: rótulo → campo → dica → erro.
      </p>

      <form onSubmit={aoEnviar} noValidate className="space-y-5">
        <FormField
          id="ajuda-email"
          label="E-mail institucional"
          htmlFor="ajuda-email-input"
          hint="Usado para enviar o comprovante. Ex.: nome@semec.pvh.br"
          error={erros.email}
        >
          <Input
            id="ajuda-email-input"
            type="email"
            value={valores.email}
            onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
            aria-invalid={erros.email ? true : undefined}
            aria-describedby={erros.email ? "ajuda-email-error" : "ajuda-email-hint"}
          />
        </FormField>

        <FormField
          id="ajuda-telefone"
          label="Telefone com DDD"
          htmlFor="ajuda-telefone-input"
          hint="Ex.: (69) 99999-9999."
          error={erros.telefone}
        >
          <Input
            id="ajuda-telefone-input"
            type="tel"
            value={valores.telefone}
            onChange={(e) => setValores((v) => ({ ...v, telefone: e.target.value }))}
            aria-invalid={erros.telefone ? true : undefined}
            aria-describedby={erros.telefone ? "ajuda-telefone-error" : "ajuda-telefone-hint"}
          />
        </FormField>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Validar</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        </div>
      </form>
    </div>
  );
}
