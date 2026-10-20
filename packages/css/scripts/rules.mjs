/**
 * Contrato de classes `.semec-*` (ADR-028) → classes Tailwind REAIS dos componentes React.
 *
 * Nenhuma lista de utilitários é escrita aqui para os componentes: cada parte
 * lê o `className`/`cva` do TSX do kit (packages/react/src/components) com o
 * mesmo avaliador das receitas (INT-A-02). Se o `cva` mudar, o CSS muda junto.
 *
 * Variantes viram modificadores BEM por decomposição: para cada combinação de
 * props, o conjunto de classes final (já passado pelo `cn`/twMerge) é dividido
 * em base ∩ e modificadores por dimensão. O build falha se base ∪ modificadores
 * não reproduzir exatamente a lista do React para alguma combinação.
 */
import path from "node:path";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { readComponentClasses } from "../../react/scripts/component-recipes.mjs";

const cn = (...values) => twMerge(clsx(values));
const tokens = (value) => String(value ?? "").split(/\s+/).filter(Boolean);

/**
 * Ajustes de variante para HTML sem React. Só trocam o SELETOR do estado
 * (o utilitário aplicado continua o do componente):
 * - marcadores `group`/`peer` não geram CSS;
 * - `disabled:X` ganha o par `aria-disabled:X` (contrato: [disabled] e [aria-disabled="true"]);
 * - `peer-disabled:X` (Label ao lado do controle) vira `has-disabled:X` na linha `.semec-choice`.
 */
export function adaptClasses(list, extra = (c) => [c]) {
  const out = [];
  for (const raw of list) {
    if (raw === "group" || raw === "peer" || /^(group|peer)\/[\w-]+$/.test(raw)) continue;
    for (const c of extra(raw)) {
      const adapted = c.replace(/^peer-disabled:/, "has-disabled:");
      out.push(adapted);
      if (adapted.startsWith("disabled:")) out.push(`aria-disabled:${adapted.slice("disabled:".length)}`);
    }
  }
  return [...new Set(out)];
}

/** Radix → input nativo: o estado marcado vem de `:checked`; o grupo inválido, de um ancestral com aria-invalid. */
const nativeChoice = (c) => [c.replace(/^data-\[state=checked\]:/, "checked:").replace(/^group-aria-\[invalid=true\]\/radio-group:/, "in-aria-[invalid=true]:")];

/** Toast estático: sem data-state/data-swipe do Radix; o botão de fechar é a classe `__close` (`\_` = `_` no seletor arbitrário). */
const staticToast = (c) => (/data-\[(state|swipe)/.test(c) ? [] : [c.replaceAll("[toast-close]", String.raw`.semec-toast\_\_close`)]);

export function buildRules(kitRoot) {
  const rules = [];
  const readers = new Map();
  const read = (file) => {
    if (!readers.has(file)) readers.set(file, readComponentClasses(kitRoot, file));
    return readers.get(file);
  };
  const add = (selector, classes, source) => {
    const list = Array.isArray(classes) ? classes : tokens(classes);
    if (!list.length) return;
    rules.push({ selector, classes: list, source });
  };
  const part = (selector, file, component, index = 0, props = {}, extra) =>
    add(selector, adaptClasses(tokens(read(file).classes(component, index, props)), extra), `${file}.tsx › ${component}[${index}]`);

  /**
   * dims: [{ prop, values: [{ value, names: [modificadores], default?: true, selector? }] }]
   * classesOf(props) devolve a string final do React para a combinação.
   */
  function decompose({ block, file, dims, classesOf, extra, alsoBase = [] }) {
    let combos = [{}];
    for (const dim of dims) combos = combos.flatMap((props) => dim.values.map((v) => ({ ...props, [dim.prop]: v.value })));
    const sets = combos.map((props) => ({ props, set: new Set(adaptClasses(tokens(classesOf(props)), extra)) }));
    const base = [...sets[0].set].filter((c) => sets.every(({ set }) => set.has(c)));
    const mods = dims.map((dim) => new Map(dim.values.map((v) => {
      const matching = sets.filter(({ props }) => props[dim.prop] === v.value);
      const first = [...matching[0].set].filter((c) => !base.includes(c));
      return [v.value, first.filter((c) => matching.every(({ set }) => set.has(c)))];
    })));
    for (const { props, set } of sets) {
      const rebuilt = new Set([...base, ...dims.flatMap((dim, i) => mods[i].get(props[dim.prop]))]);
      const missing = [...set].filter((c) => !rebuilt.has(c));
      const extraCls = [...rebuilt].filter((c) => !set.has(c));
      if (missing.length || extraCls.length) {
        throw new Error(`${block}: a decomposição em base + modificadores não reproduz ${JSON.stringify(props)} (faltam ${missing.join(" ")}; sobram ${extraCls.join(" ")}). Revise as variantes do cva.`);
      }
    }
    add([`.${block}`, ...alsoBase].join(", "), base, `${file}.tsx (base)`);
    dims.forEach((dim, i) => {
      const allNames = dim.values.flatMap((v) => v.names);
      for (const v of dim.values) {
        let selector;
        if (v.selector) selector = v.selector;
        else if (v.default) {
          const others = allNames.filter((n) => !v.names.includes(n)).map((n) => `.${block}--${n}`);
          selector = [`.${block}:where(:not(${others.join(", ")}))`, ...v.names.map((n) => `.${block}--${n}`)].join(", ");
        } else selector = v.names.map((n) => `.${block}--${n}`).join(", ");
        add(selector, mods[i].get(v.value), `${file}.tsx (${dim.prop}=${v.value})`);
      }
    });
  }

  // ---- Botão ---------------------------------------------------------------
  const button = read("button");
  const variantDim = (reader, cvaName, prop, map = {}, def) => ({
    prop,
    values: Object.keys(reader.variants(cvaName)[prop]).map((value) => ({ value, names: map[value] ?? [value], default: value === def })),
  });
  decompose({
    block: "semec-btn",
    file: "button",
    dims: [variantDim(button, "buttonVariants", "variant", {}, "primary"), variantDim(button, "buttonVariants", "size", {}, "md")],
    classesOf: (props) => button.classes("Button", 0, props),
  });

  // ---- Formulário ------------------------------------------------------------
  const fieldSources = { input: ["input", "Input"], select: ["select", "SelectTrigger"], textarea: ["textarea", "Textarea"] };
  decompose({
    block: "semec-field",
    file: "input/select/textarea",
    dims: [{ prop: "element", values: Object.keys(fieldSources).map((el) => ({ value: el, names: [], selector: `.semec-field:where(${el})` })) }],
    classesOf: ({ element }) => read(fieldSources[element][0]).classes(fieldSources[element][1]),
  });
  part(".semec-form-field", "form-field", "FormField", 0);
  part(".semec-label", "form-field", "FormField", 1);
  part(".semec-label__required", "form-field", "FormField", 2);
  part(".semec-hint", "form-field", "FormField", 3);
  part(".semec-error", "form-field", "FormField", 4);

  // Checkbox/rádio nativos: raiz e indicador do Radix aplicados ao <input>.
  const indicator = (file, component) => tokens(read(file).classes(component, 2));
  part(".semec-checkbox", "checkbox", "Checkbox", 0, {}, nativeChoice);
  add(".semec-checkbox, .semec-radio", ["appearance-none", "inline-grid", "place-content-center", "align-middle"], "input nativo (equivale ao <button> do Radix)");
  add(".semec-checkbox::before", indicator("checkbox", "Checkbox"), "checkbox.tsx › <Check> (indicador)");
  part(".semec-radio", "radio-group", "RadioGroupItem", 0, {}, nativeChoice);
  add(".semec-radio::before", indicator("radio-group", "RadioGroupItem").filter((c) => c !== "fill-current"), "radio-group.tsx › <Circle> (indicador)");
  // Linha da opção: padrão documentado no manifest (`flex min-h-11 items-center gap-2` + Label).
  add(".semec-choice", ["flex", "min-h-11", "items-center", "gap-2", "cursor-pointer"], "manifest.js › Checkbox/RadioGroup (linha com alvo de 44 px)");
  part(".semec-choice", "label", "Label", 0);

  // ---- Cartão ----------------------------------------------------------------
  for (const [suffix, component] of [["", "Card"], ["__header", "CardHeader"], ["__title", "CardTitle"], ["__description", "CardDescription"], ["__content", "CardContent"], ["__footer", "CardFooter"]]) {
    part(`.semec-card${suffix}`, "card", component);
  }

  // ---- Alerta ----------------------------------------------------------------
  const alert = read("alert");
  decompose({
    block: "semec-alert",
    file: "alert",
    dims: [variantDim(alert, "alertVariants", "variant", { default: ["info"], destructive: ["danger"] }, "default")],
    classesOf: (props) => alert.classes("Alert", 0, props),
  });
  part(".semec-alert__title", "alert", "AlertTitle");
  part(".semec-alert__description", "alert", "AlertDescription");

  // ---- Cabeçalho ----------------------------------------------------------
  part(".semec-header", "header", "Header");
  part(".semec-header__brand", "header", "HeaderBrand", 5);
  part(".semec-header__divider", "header", "HeaderBrand", 1);
  part(".semec-header__org", "header", "HeaderBrand", 2);
  part(".semec-header__separator", "header", "HeaderBrand", 3);
  part(".semec-header__service", "header", "HeaderBrand", 4);
  part(".semec-header__nav", "header", "HeaderNav");
  const header = read("header");
  decompose({
    block: "semec-header__link",
    file: "header",
    dims: [{ prop: "current", values: [
      { value: false, names: [], selector: '.semec-header__link:where(:not([aria-current="page"]))' },
      { value: true, names: [], selector: '.semec-header__link:where([aria-current="page"])' },
    ] }],
    classesOf: (props) => header.classes("HeaderNavLink", 0, props),
  });
  part(".semec-sr-only", "header", "HeaderBrand", 6);

  // ---- Rodapé ----------------------------------------------------------------
  part(".semec-footer", "footer", "Footer");
  part(".semec-footer__content", "footer", "FooterContent");
  part(".semec-footer__section", "footer", "FooterSection", 0);
  part(".semec-footer__title", "footer", "FooterSection", 1);
  part(".semec-footer__links", "footer", "FooterLinks");
  part(".semec-footer__link", "footer", "FooterLink");
  part(".semec-footer__bottom", "footer", "FooterBottom");

  // ---- Pular para o conteúdo ----------------------------------------------
  part(".semec-skip-link", "skip-link", "SkipLink");

  // ---- Tabela -----------------------------------------------------------------
  part(".semec-table__wrapper", "table", "Table", 0);
  part(".semec-table", "table", "Table", 1);
  part(".semec-table thead", "table", "TableHeader");
  part(".semec-table tbody", "table", "TableBody");
  part(".semec-table tfoot", "table", "TableFooter");
  part(".semec-table tr", "table", "TableRow");
  part(".semec-table th", "table", "TableHead");
  part(".semec-table td", "table", "TableCell");
  part(".semec-table__caption, .semec-table caption", "table", "TableCaption");

  // ---- Resumo de erros ---------------------------------------------------------
  part(".semec-error-summary", "error-summary", "ErrorSummary", 0);
  part(".semec-error-summary__title", "error-summary", "ErrorSummary", 1);
  part(".semec-error-summary__list", "error-summary", "ErrorSummary", 2);
  part(".semec-error-summary__link, .semec-error-summary__list a", "error-summary", "ErrorSummary", 3);

  // ---- Badge ---------------------------------------------------------------------
  const badge = read("badge");
  decompose({
    block: "semec-badge",
    file: "badge",
    dims: [variantDim(badge, "badgeVariants", "variant", {}, "default")],
    classesOf: (props) => badge.classes("Badge", 0, props),
  });

  // ---- Toast (só a aparência) ---------------------------------------------------
  // As partes vêm antes da raiz: no React, `[&_[toast-close]]:` da variante vence o hover do botão.
  part(".semec-toast__body", "toast", "Toaster", 0);
  part(".semec-toast__title", "toast", "ToastTitle");
  part(".semec-toast__description", "toast", "ToastDescription");
  part(".semec-toast__close", "toast", "ToastClose");
  part(".semec-toast__action", "toast", "ToastAction");
  const toast = read("toast");
  decompose({
    block: "semec-toast",
    file: "toast",
    dims: [variantDim(toast, "toastVariants", "variant", { default: ["info"], destructive: ["danger"] }, "default")],
    classesOf: (props) => toast.classes("Toast", 0, props),
    extra: staticToast,
  });

  // ---- Título -------------------------------------------------------------------
  const heading = read("heading");
  const headingFn = heading.variantFunction("headingVariants");
  const sizes = Object.keys(heading.variants("headingVariants").size);
  decompose({
    block: "semec-heading",
    file: "heading",
    dims: [{ prop: "size", values: sizes.map((s) => ({ value: s, names: [s], default: s === "2" })) }],
    classesOf: ({ size }) => cn(headingFn({ size: Number(size) })),
    // `.semec-heading--3` sozinho também funciona (o bloco é opcional).
    alsoBase: sizes.map((s) => `.semec-heading--${s}`),
  });

  return rules;
}

/** Classes de bloco/elemento que recebem o preflight escopado. */
export function semecClasses(rules) {
  const names = new Set();
  for (const { selector } of rules) for (const m of selector.matchAll(/\.(semec-[\w-]+)/g)) names.add(m[1]);
  return [...names].sort();
}

export const kitRootFrom = (here) => path.resolve(here, "../../react");
