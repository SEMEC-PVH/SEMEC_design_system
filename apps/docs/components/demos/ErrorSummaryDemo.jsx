"use client";

import { useState } from "react";
import { ErrorSummary } from "@semec/ds-react";

const CAMPOS = [
  { id: "nome", label: "Nome completo", tipo: "text" },
  { id: "cpf", label: "CPF", tipo: "text", inputMode: "numeric" },
  { id: "email", label: "E-mail", tipo: "email" },
];

/** Mensagem diz o que fazer, não só o que está errado (WCAG 3.3.3). */
function validar(valores) {
  const erros = [];

  if (!valores.nome.trim()) {
    erros.push({ id: "nome", message: "Informe o nome completo." });
  }

  const cpf = valores.cpf.replace(/\D/g, "");
  if (!cpf) {
    erros.push({ id: "cpf", message: "Informe o CPF." });
  } else if (cpf.length !== 11) {
    erros.push({ id: "cpf", message: "O CPF precisa ter 11 dígitos." });
  }

  if (!valores.email.trim()) {
    erros.push({ id: "email", message: "Informe o e-mail." });
  } else if (!valores.email.includes("@")) {
    erros.push({ id: "email", message: "O e-mail precisa conter @." });
  }

  return erros;
}

export default function ErrorSummaryDemo() {
  const [valores, setValores] = useState({ nome: "", cpf: "", email: "" });
  const [erros, setErros] = useState([]);
  const [tentativa, setTentativa] = useState(0);
  const [enviado, setEnviado] = useState(false);

  function aoEnviar(event) {
    event.preventDefault();
    const encontrados = validar(valores);
    setErros(encontrados);
    setEnviado(encontrados.length === 0);
    // Muda a cada envio para que o resumo refoque mesmo quando a lista
    // de erros é a mesma da tentativa anterior.
    setTentativa((n) => n + 1);
  }

  const erroDe = (id) => erros.find((e) => e.id === id);

  return (
    <form onSubmit={aoEnviar} noValidate>
      <ErrorSummary errors={erros} focusKey={tentativa} />

      {enviado && (
        <p role="status" style={{ marginBottom: "var(--space-4)" }}>
          Formulário válido — nada foi enviado, isto é uma demonstração.
        </p>
      )}

      {CAMPOS.map((campo) => {
        const erro = erroDe(campo.id);
        return (
          <div
            key={campo.id}
            className="ds-field"
            data-invalid={erro ? "true" : "false"}
          >
            <label htmlFor={campo.id}>{campo.label}</label>
            <input
              id={campo.id}
              name={campo.id}
              type={campo.tipo}
              inputMode={campo.inputMode}
              value={valores[campo.id]}
              aria-invalid={erro ? "true" : undefined}
              aria-describedby={erro ? `${campo.id}-erro` : undefined}
              onChange={(event) =>
                setValores((v) => ({ ...v, [campo.id]: event.target.value }))
              }
            />
            {erro && (
              <span id={`${campo.id}-erro`} className="ds-field__error">
                {erro.message}
              </span>
            )}
          </div>
        );
      })}

      <button type="submit" className="btn primary">
        Enviar
      </button>
    </form>
  );
}
