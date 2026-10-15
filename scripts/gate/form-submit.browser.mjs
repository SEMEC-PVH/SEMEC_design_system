/**
 * Entrada empacotada (esbuild) e carregada no Chromium pelo gate de envio
 * nativo de formulário (check-form-submit.mjs). Monta formulários reais com o
 * FileUpload e expõe `window.__semecFormSubmit` para o Playwright inspecionar
 * `input.files`, `FormData` e `checkValidity()`.
 */
import React from "react";
import { createRoot } from "react-dom/client";

import * as ds from "../../packages/react/dist/react/index.js";

const h = React.createElement;
const changes = { naoControlado: 0, controlado: 0 };

function Controlado() {
  const [files, setFiles] = React.useState([]);
  return h(
    "form",
    { id: "form-controlado", onSubmit: (e) => e.preventDefault() },
    h(ds.FileUpload, {
      id: "doc-controlado",
      label: "Documento (controlado)",
      name: "doc",
      required: true,
      value: files,
      onValueChange: (next) => {
        changes.controlado += 1;
        setFiles(next);
      },
    }),
    h(
      "button",
      { type: "button", id: "remover", onClick: () => setFiles((prev) => prev.slice(0, -1)) },
      "Remover último"
    )
  );
}

function App() {
  return h(
    React.Fragment,
    null,
    h(
      "form",
      { id: "form-nao-controlado", onSubmit: (e) => e.preventDefault() },
      h(ds.FileUpload, {
        id: "doc",
        label: "Documento",
        name: "doc",
        required: true,
        accept: ".pdf",
        onValueChange: () => {
          changes.naoControlado += 1;
        },
      })
    ),
    h(Controlado)
  );
}

window.__semecFormSubmit = {
  mount() {
    const el = document.createElement("div");
    document.body.appendChild(el);
    createRoot(el).render(h(App));
  },
  changes: () => ({ ...changes }),
  /** Estado do formulário: arquivos no input, nomes no FormData e validade. */
  inspect(formId) {
    const form = document.getElementById(formId);
    const input = form.querySelector('input[type="file"]');
    return {
      inputFiles: Array.from(input.files ?? []).map((f) => f.name),
      formData: new FormData(form).getAll("doc").map((v) => (typeof v === "string" ? v : v.name)).filter(Boolean),
      valid: form.checkValidity(),
      listed: Array.from(form.querySelectorAll("li span.truncate")).map((s) => s.textContent),
    };
  },
  /** Solta um arquivo na zona, como o arrastar-e-soltar do usuário. */
  drop(formId, name) {
    const form = document.getElementById(formId);
    const zone = form.querySelector('input[type="file"]').parentElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(["%PDF-1.4"], name, { type: "application/pdf" }));
    zone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  },
  cancel(inputId) {
    document.getElementById(inputId).dispatchEvent(new Event("cancel", { bubbles: false }));
  },
};
