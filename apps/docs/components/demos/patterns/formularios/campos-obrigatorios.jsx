"use client";

import { useState } from "react";
import { Button, ErrorSummary, FormField, Input } from "semec-ds/react";

/**
 * Campos obrigatórios: asterisco no rótulo + `required` no input e
 * ErrorSummary no topo. Ao enviar, o resumo recebe o foco (focusKey muda a
 * cada tentativa) e cada link leva ao campo correspondente.
 */
export function CamposObrigatoriosDemo() {
  const [valores, setValores] = useState({ nome: "", email: "" });
  const [erros, setErros] = useState([]);
  const [tentativa, setTentativa] = useState(0);
  const [enviado, setEnviado] = useState(false);

  const erroDe = (id) => erros.find((erro) => erro.id === id)?.message;

  function aoEnviar(event) {
    event.preventDefault();
    const encontrados = [];
    if (!valores.nome.trim()) {
      encontrados.push({ id: "ob-nome", message: "Informe o nome completo." });
    }
    if (!valores.email.includes("@")) {
      encontrados.push({ id: "ob-email", message: "Informe o e-mail institucional." });
    }
    setErros(encontrados);
    setEnviado(encontrados.length === 0);
    setTentativa((n) => n + 1);
  }

  function alterar(campo, valor) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
    setEnviado(false);
  }

  return (
    <div className="w-full max-w-[520px] space-y-4 p-4 text-left">
      <p className="text-sm text-muted-foreground">
        Campos com <span className="font-medium text-destructive">*</span> são
        obrigatórios.
      </p>

      <form onSubmit={aoEnviar} noValidate className="space-y-4">
        <ErrorSummary errors={erros} focusKey={tentativa} />

        <FormField
          id="ob-nome-campo"
          label="Nome completo"
          htmlFor="ob-nome"
          required
          error={erroDe("ob-nome")}
        >
          <Input
            id="ob-nome"
            required
            value={valores.nome}
            onChange={(e) => alterar("nome", e.target.value)}
            aria-invalid={erroDe("ob-nome") ? true : undefined}
            aria-describedby={erroDe("ob-nome") ? "ob-nome-campo-error" : undefined}
          />
        </FormField>

        <FormField
          id="ob-email-campo"
          label="E-mail institucional"
          htmlFor="ob-email"
          required
          error={erroDe("ob-email")}
        >
          <Input
            id="ob-email"
            type="email"
            required
            value={valores.email}
            onChange={(e) => alterar("email", e.target.value)}
            aria-invalid={erroDe("ob-email") ? true : undefined}
            aria-describedby={erroDe("ob-email") ? "ob-email-campo-error" : undefined}
          />
        </FormField>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Enviar</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {enviado
              ? "Dados válidos — nada a corrigir."
              : erros.length > 0
                ? "Resumo de erros no topo, com foco automático."
                : "Aguardando envio."}
          </p>
        </div>
      </form>
    </div>
  );
}
