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
import fs from "node:fs";
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
  // Link do resumo de erros (#id) rola o campo para o topo: a margem mantém o rótulo
  // (ou a legenda do grupo) visível acima dele (CONS-11).
  add(".semec-field, .semec-checkbox, .semec-radio, .semec-combobox__input", ["scroll-mt-12"], "alvo do link do resumo de erros: rótulo continua visível");

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

  // ==== Interativos (onda 3, F1) ==================================================
  // Os estados são os atributos que o Radix põe (data-state, data-highlighted,
  // data-disabled, aria-selected, aria-expanded, hidden; a opção escolhida do
  // combobox leva data-state="checked", como o item marcado do Radix); os Web Components do
  // @semec/ds-elements põem os mesmos. Nenhuma classe de estado própria.
  //
  // Classe-gancho: parte da API (o elemento do @semec/ds-elements a procura),
  // mas o componente React não tem classe nessa parte. Entra no classes.json sem CSS.
  const hook = (selector, source) => rules.push({ selector, classes: [], source });
  const sourceOf = (file) => fs.readFileSync(path.join(kitRoot, "src/components", `${file}.tsx`), "utf8");
  /** `sideOffset` do popup no TSX (prop do Radix, não classe): vira a distância do gatilho. */
  const sideOffset = (file) => {
    const m = sourceOf(file).match(/sideOffset(?:=\{|\s*=\s*)(\d+)/);
    if (!m) throw new Error(`${file}.tsx: sideOffset não encontrado`);
    return Number(m[1]);
  };
  /** Divide `variantes:utilitário` no último `:` fora de colchetes. */
  const splitVariant = (c) => {
    let depth = 0;
    let at = -1;
    for (let i = 0; i < c.length; i++) {
      if (c[i] === "[") depth++;
      else if (c[i] === "]") depth--;
      else if (c[i] === ":" && depth === 0) at = i;
    }
    return at < 0 ? ["", c] : [c.slice(0, at + 1), c.slice(at + 1)];
  };
  /**
   * Popup posicionado pelo CSS (combobox e menu), no lugar do popper do Radix:
   * absoluto logo abaixo do gatilho, dentro do wrapper relativo, à distância do
   * `sideOffset`; largura mínima = a do wrapper (sem perder o mínimo do TSX);
   * `data-side="top"` (posto pelo elemento quando não cabe embaixo) inverte.
   * `--radix-popover-trigger-width` (medido pelo Radix) vira 100% do wrapper.
   */
  const popup = (c) => {
    const [variants, utility] = splitVariant(c);
    if (utility === "w-[var(--radix-popover-trigger-width)]") return [`${variants}w-full`];
    const min = utility.match(/^min-w-\[(.+)\]$/);
    if (min) return [`${variants}min-w-[max(${min[1]},100%)]`];
    // O elemento só marca o lado de cima; embaixo é o padrão (sem data-side).
    if (variants.startsWith("data-[side=bottom]:")) return [`not-data-[side=top]:${variants.slice("data-[side=bottom]:".length)}${utility}`];
    return [c];
  };
  const placement = (file) => {
    const offset = `${sideOffset(file)}px`;
    // `data-align="end"` (posto pelo elemento quando o popup não cabe à direita) ancora
    // pela direita; a largura nunca passa da tela (A11Y-04, reflow em 320 px).
    return ["absolute", "top-full", "left-0", `mt-[${offset}]`, "data-[side=top]:top-auto", "data-[side=top]:bottom-full", "data-[side=top]:mt-0", `data-[side=top]:mb-[${offset}]`, "data-[align=end]:left-auto", "data-[align=end]:right-0", "max-w-[calc(100vw-2rem)]"];
  };
  /** `disabled:` também por `data-disabled` (o Radix marca os dois; o elemento pode marcar só o atributo). */
  const dataDisabled = (c) => (c.startsWith("disabled:") ? [c, `data-disabled:${c.slice("disabled:".length)}`] : [c]);

  // ---- Dialog e AlertDialog -------------------------------------------------------
  // `.semec-dialog` vai no <dialog> nativo (aberto com showModal()): é o painel do
  // DialogContent; o overlay vira o ::backdrop (variante `backdrop:` do Tailwind).
  // O AlertDialog é o modificador `--alert` só onde o cva/className difere.
  const dialog = read("dialog");
  const alertDialog = read("alert-dialog");
  const toBackdrop = (c) => {
    const [variants, utility] = splitVariant(c);
    return [`${variants}backdrop:${utility}`];
  };
  function dialogPart(suffix, [dComp, dIndex], [aComp, aIndex], extra) {
    const sel = `.semec-dialog${suffix}`;
    const ctx = (outer) => (suffix ? `${outer} ${sel}` : outer);
    decompose({
      block: `semec-dialog${suffix}`,
      file: "dialog/alert-dialog",
      dims: [{ prop: "kind", values: [
        { value: "dialog", names: [], selector: ctx(".semec-dialog:where(:not(.semec-dialog--alert))") },
        { value: "alert", names: [], selector: ctx(".semec-dialog--alert") },
      ] }],
      classesOf: ({ kind }) => (kind === "alert" ? alertDialog.classes(aComp, aIndex) : dialog.classes(dComp, dIndex)),
      extra,
    });
  }
  dialogPart("", ["DialogContent", 0], ["AlertDialogContent", 0]);
  // Overlay → ::backdrop do próprio <dialog> (mesmo seletor-raiz, sem descendente).
  dialogPart("", ["DialogOverlay", 0], ["AlertDialogOverlay", 0], toBackdrop);
  // <dialog> nativo: o navegador dá margin:auto e inset 0 nos quatro lados; o painel
  // do Radix só tem left/top. Sem isso, top:50% + bottom:0 encolhe o painel.
  add(".semec-dialog", ["m-0", "right-auto", "bottom-auto"], "<dialog> nativo: zera margin e inset que o navegador põe (o painel do Radix não tem)");
  // `grid` do painel venceria o display:none do navegador no <dialog> fechado.
  add(".semec-dialog:not([open])", ["hidden"], "<dialog> nativo fechado continua oculto (o grid do painel venceria o navegador)");
  dialogPart("__header", ["DialogHeader", 0], ["AlertDialogHeader", 0]);
  dialogPart("__title", ["DialogTitle", 0], ["AlertDialogTitle", 0]);
  dialogPart("__description", ["DialogDescription", 0], ["AlertDialogDescription", 0]);
  dialogPart("__footer", ["DialogFooter", 0], ["AlertDialogFooter", 0]);
  part(".semec-dialog__close", "dialog", "DialogContent", 1);
  // Ícone X do React (lucide, h-4 w-4) como máscara no ::before: o HTML não precisa de <svg>.
  add(".semec-dialog__close::before", tokens(dialog.classes("DialogContent", 2)), "dialog.tsx › DialogContent[2] (<X>)");

  // ---- Tabs -------------------------------------------------------------------------
  hook(".semec-tabs", "tabs.tsx › Tabs (Radix Root, sem classe)");
  part(".semec-tabs__list", "tabs", "TabsList");
  part(".semec-tabs__trigger", "tabs", "TabsTrigger", 0, {}, dataDisabled);
  part(".semec-tabs__panel", "tabs", "TabsContent");

  // ---- Combobox -------------------------------------------------------------------
  const combobox = read("combobox");
  // `block`: o wrapper pode ser o próprio <semec-combobox> (inline por padrão); o campo é w-full como o gatilho.
  add(".semec-combobox, :where(semec-combobox)", ["relative", "block"], "contrato F1: wrapper relativo do popup (no lugar do popper do Radix)");
  // O campo é o gatilho do React (Combobox[1]) com o placeholder do campo de busca (Combobox[6]).
  part(".semec-combobox__input", "combobox", "Combobox", 1, {}, dataDisabled);
  add(".semec-combobox__input", adaptClasses(tokens(combobox.classes("Combobox", 6)).filter((c) => c.startsWith("placeholder:"))), "combobox.tsx › Combobox[6] (placeholder)");
  // Popup = PopoverContent (Combobox[4]) + <ul role=listbox> (Combobox[7]).
  add(".semec-combobox__listbox", [...placement("combobox"), ...adaptClasses(tokens(cn(combobox.classes("Combobox", 4), combobox.classes("Combobox", 7))), popup)], "combobox.tsx › Combobox[4] + Combobox[7] (popup posicionado pelo CSS)");
  // Opção ativa (a do Enter) = data-highlighted (+ aria-selected="true", padrão APG com
  // aria-activedescendant, sem efeito no CSS); escolhida = data-state="checked".
  decompose({
    block: "semec-combobox__option",
    file: "combobox",
    dims: [
      { prop: "isActive", values: [
        { value: false, names: [], selector: ".semec-combobox__option:where(:not([data-highlighted]))" },
        { value: true, names: [], selector: ".semec-combobox__option:where([data-highlighted])" },
      ] },
      { prop: "isChosen", values: [
        { value: false, names: [], selector: '.semec-combobox__option:where(:not([data-state="checked"]))' },
        { value: true, names: [], selector: '.semec-combobox__option:where([data-state="checked"])' },
      ] },
    ],
    classesOf: (props) => combobox.classes("Combobox", 8, props),
  });
  add(".semec-combobox__check", tokens(combobox.classes("Combobox", 9)), "combobox.tsx › Combobox[9] (<Check>)");
  // O React só desenha o check na opção escolhida; aqui ele some nas outras.
  add('.semec-combobox__option:not([data-state="checked"]) .semec-combobox__check', ["invisible"], "combobox.tsx › <Check> só na opção escolhida");
  // Sem resultado, a mensagem ocupa o lugar da lista: o popup (Combobox[4]) com o texto do <p> (Combobox[10]).
  add(".semec-combobox__empty", [...placement("combobox"), ...adaptClasses(tokens(cn(combobox.classes("Combobox", 4), combobox.classes("Combobox", 10, { "filtered.length > 0": false }))), popup)], "combobox.tsx › Combobox[4] + Combobox[10] (mensagem sem resultado, no lugar da lista)");

  // ---- DropdownMenu -------------------------------------------------------------
  // O wrapper relativo é o próprio <semec-menu> (sem classe no contrato).
  add(":where(semec-menu)", ["relative", "inline-block"], "contrato F1: <semec-menu> é o wrapper relativo do popup");
  const menu = read("dropdown-menu");
  // `w-max`: o wrapper do popper do Radix tem min-width: max-content (o menu não quebra
  // linha dentro de um gatilho estreito); aqui o popup absoluto faria shrink-to-fit no wrapper.
  add(".semec-menu", [...placement("dropdown-menu"), "w-max", ...adaptClasses(tokens(menu.classes("DropdownMenuContent")), popup)], "dropdown-menu.tsx › DropdownMenuContent (popup posicionado pelo CSS)");
  // Item ativo: o Radix foca o item e marca data-highlighted; vale qualquer um dos dois.
  // Vale também dentro de outras variantes (ex.: `forced-colors:focus:`).
  const highlighted = (c) => {
    const alt = c.replace(/(^|:)focus:/, "$1data-highlighted:");
    return alt === c ? [c] : [c, alt];
  };
  // Item desabilitado: o Radix marca data-disabled; sem JS, o <button disabled> do HTML
  // (ou aria-disabled no <a>) recebe a mesma aparência (A11Y-17).
  const nativeDisabled = (c) => (c.startsWith("data-[disabled]:") ? [c, `disabled:${c.slice("data-[disabled]:".length)}`, `aria-disabled:${c.slice("data-[disabled]:".length)}`] : [c]);
  part(".semec-menu__item", "dropdown-menu", "DropdownMenuItem", 0, { inset: false }, (c) => highlighted(c).flatMap(nativeDisabled));
  // O item do Radix é uma <div>; aqui pode ser <button>, que não estica nem alinha à esquerda sozinho.
  add(".semec-menu__item", ["w-full", "text-left"], "item como <button>/<a> nativo: ocupa a linha como a <div> do Radix");
  part(".semec-menu__separator", "dropdown-menu", "DropdownMenuSeparator");
  part(".semec-menu__label", "dropdown-menu", "DropdownMenuLabel", 0, { inset: false });
  // Sem JavaScript (o <semec-menu> não foi definido), o popup é uma lista comum no
  // fluxo da página: posicionado, ele cobriria o conteúdo seguinte (A11Y-05). O
  // `role="menu"` é posto pelo elemento; quem o escreve à mão já promete o comportamento.
  add(":where(semec-menu:not(:defined)) .semec-menu:not([role=\"menu\"])", ["static", "shadow-none"], "aprimoramento progressivo: sem JS (sem o role=menu que o elemento põe), os itens ficam no fluxo");

  // ---- Popups dentro do diálogo -------------------------------------------------
  // O painel do diálogo rola (overflow-y-auto do DialogContent): um popup absoluto
  // seria cortado pela borda dele. Dentro do diálogo, o popup entra no fluxo e empurra
  // o conteúdo, e a rolagem do diálogo alcança a última opção (A11Y-06). O Radix
  // resolve isso com portal, que o HTML sem React não tem.
  add(".semec-dialog .semec-menu, .semec-dialog .semec-combobox__listbox, .semec-dialog .semec-combobox__empty", ["relative", "inset-auto"], "popup dentro do <dialog> rolável: no fluxo, nunca cortado (sem portal)");

  // ---- Accordion ------------------------------------------------------------------
  const accordion = read("accordion");
  hook(".semec-accordion", "accordion.tsx › Accordion (Radix Root, sem classe)");
  part(".semec-accordion__item", "accordion", "AccordionItem");
  part(".semec-accordion__header", "accordion", "AccordionTrigger", 0);
  // `>svg` do React = o ícone `.semec-accordion__icon` (`\_` = `_` no seletor arbitrário).
  part(".semec-accordion__trigger", "accordion", "AccordionTrigger", 1, {}, (c) => [c.replaceAll(">svg]", String.raw`>.semec-accordion\_\_icon]`)]);
  add(".semec-accordion__icon", tokens(accordion.classes("AccordionTrigger", 2)), "accordion.tsx › AccordionTrigger[2] (<ChevronDown>)");
  // Painel = Content + div interna (padding). A animação de altura do Radix usa
  // --radix-accordion-content-height, medida por JS; sem ela, sai (o hidden abre e fecha).
  add(".semec-accordion__panel", adaptClasses(tokens(cn(accordion.classes("AccordionContent", 0), accordion.classes("AccordionContent", 1))), (c) => (/animate-accordion-/.test(c) ? [] : [c])), "accordion.tsx › AccordionContent[0] + [1]");

  return rules;
}

/** Ícones do kit (lucide) desenhados como máscara nas partes sem <svg> no HTML. */
export const ICON_MASKS = [
  { selector: ".semec-dialog__close::before", icon: "X", pseudo: true },
  { selector: ".semec-accordion__icon", icon: "ChevronDown" },
  { selector: ".semec-combobox__check", icon: "Check" },
];

/** Classes de bloco/elemento que recebem o preflight escopado. */
export function semecClasses(rules) {
  const names = new Set();
  for (const { selector } of rules) for (const m of selector.matchAll(/\.(semec-[\w-]+)/g)) names.add(m[1]);
  return [...names].sort();
}

export const kitRootFrom = (here) => path.resolve(here, "../../react");
