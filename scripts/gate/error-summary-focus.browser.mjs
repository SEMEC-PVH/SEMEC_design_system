/**
 * Entrada empacotada (esbuild) e carregada no Chromium pelo gate de foco do
 * ErrorSummary (check-error-summary-focus.mjs). Monta um formulário com
 * validação ao vivo depois do 1º envio, como o React Hook Form com
 * `reValidateMode: "onChange"`, em dois modos:
 * - `receita`: renderização condicional, como na SKILL;
 * - `sempre`: o resumo fica sempre montado.
 */
import React from "react";
import { createRoot } from "react-dom/client";

import * as ds from "../../packages/react/dist/react/index.js";

const h = React.createElement;

function validar({ nome, email }) {
  const lista = [];
  if (nome.length < 3) lista.push({ id: "nome", message: "Informe o nome completo." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) lista.push({ id: "email", message: "Informe um e-mail válido." });
  return lista;
}

function Formulario({ modo }) {
  const [valores, setValores] = React.useState({ nome: "", email: "" });
  const [tentativa, setTentativa] = React.useState(0);
  const lista = tentativa > 0 ? validar(valores) : [];
  const campo = (id, label) => [
    h("label", { key: `${id}-l`, htmlFor: `${modo}-${id}` }, label),
    h("input", {
      key: id,
      id: `${modo}-${id}`,
      value: valores[id],
      onChange: (e) => setValores((v) => ({ ...v, [id]: e.target.value })),
    }),
  ];
  const resumo = h(ds.ErrorSummary, {
    errors: lista.map((e) => ({ ...e, id: `${modo}-${e.id}` })),
    focusKey: tentativa,
  });
  return h(
    "form",
    {
      id: `form-${modo}`,
      noValidate: true,
      onSubmit: (e) => {
        e.preventDefault();
        if (validar(valores).length > 0) setTentativa((t) => t + 1);
      },
    },
    modo === "receita" ? lista.length > 0 && resumo : resumo,
    ...campo("nome", "Nome"),
    ...campo("email", "E-mail"),
    h("button", { type: "submit" }, "Enviar")
  );
}

window.__semecErrorSummaryFocus = {
  mount(modo) {
    const el = document.createElement("div");
    el.id = `root-${modo}`;
    document.body.appendChild(el);
    createRoot(el).render(h(Formulario, { modo }));
  },
};
