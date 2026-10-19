import React from "react";
import { createRoot } from "react-dom/client";
import * as DS from "semec-recipe-kit";

const h = React.createElement;
const recipes = window.recipeData.recipes;
const cases = [];
for (const [name, recipe] of Object.entries(recipes)) {
  for (const [key, entry] of Object.entries(recipe.entries)) {
    const id = `${name}-${key}`;
    const props = { ...entry.props, "data-parity": id };
    if (entry.component === "ToastAction") props.altText = "Reabrir a solicitação";
    let children;
    if (entry.component === "FormField") Object.assign(props, { label: "Nome", required: true, htmlFor: id, hint: "Dica", ...(key === "error" ? { error: "Erro" } : {}) });
    if (entry.component === "HeaderBrand") Object.assign(props, { logo: h("svg", { "aria-hidden": true }), orgName: "SEMEC", serviceName: "Serviço" });
    if (entry.component === "ErrorSummary") Object.assign(props, { autoFocus: false, errors: [{ id: "nome", message: "Preencha o nome" }] });
    if (entry.component === "Button" || entry.component === "Badge") children = "Exemplo";
    let node = h(DS[entry.component], props, children);
    if (name === "Select") node = h(DS.Select, null, node);
    if (name === "Toast") {
      if (entry.component === "ToastViewport") node = h(DS.ToastProvider, null, node);
      else if (entry.component === "Toast") node = h(DS.ToastProvider, null, h(DS.Toast, { ...props, open: true, duration: Infinity }), h(DS.ToastViewport));
      else node = h(DS.ToastProvider, null, h(DS.Toast, { open: true, duration: Infinity }, node), h(DS.ToastViewport));
    }
    cases.push(h("div", { key: id }, node));
  }
}

const form = h("main", { id: "conteudo" }, h("h1", null, "Solicitação"),
  h(DS.Card, null, h(DS.CardHeader, null, h(DS.CardTitle, { as: "h2" }, "Dados")),
    h(DS.CardContent, null,
      h("form", null,
        h(DS.FormField, { htmlFor: "nome", label: "Nome completo", hint: "Informe seu nome completo." }, h(DS.Input, { id: "nome", name: "nome", autoComplete: "name" })),
        h(DS.Button, { type: "button" }, "Revisar solicitação")))));
const header = h(DS.Header, null, h(DS.HeaderBrand, { href: "#conteudo", orgName: "SEMEC", serviceName: "Atendimento", logo: h("svg", { "aria-hidden": true }) }), h(DS.HeaderNav, null, h(DS.HeaderNavLink, { href: "#conteudo", current: true }, "Solicitações")));
createRoot(document.getElementById("root")).render(window.location.pathname === "/parity" ? h(React.Fragment, null, ...cases) : h(React.Fragment, null, header, form));

window.readParity = () => {
  const errors = [];
  for (const [name, recipe] of Object.entries(recipes)) for (const [key, entry] of Object.entries(recipe.entries)) {
    const root = document.querySelector(`[data-parity="${name}-${key}"]`);
    let target = root;
    if (entry.component === "FormField" && key !== "root") target = root?.querySelector({ label: "label", required: "label span", hint: "p", error: "p" }[key]);
    if (entry.component === "HeaderBrand" && key !== "brand") target = root?.querySelector({ brandText: ":scope > span:nth-of-type(2)", separator: ":scope > span:nth-of-type(2) > span:first-child", service: ":scope > span:nth-of-type(2) > span:last-child" }[key]);
    if (entry.component === "ErrorSummary" && key !== "root") target = root?.querySelector({ title: "h2", list: "ul", link: "a" }[key]);
    const actual = target?.getAttribute("class");
    if (actual !== entry.className) errors.push({ name, key, expected: entry.className, actual });
    if (entry.props.invalid && root?.getAttribute("aria-invalid") !== "true") errors.push({ name, key, error: "Estado inválido ausente" });
    if (entry.props.current && root?.getAttribute("aria-current") !== "page") errors.push({ name, key, error: "Link atual ausente" });
  }
  return errors;
};
