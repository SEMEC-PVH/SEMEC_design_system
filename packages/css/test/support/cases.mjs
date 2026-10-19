/**
 * Casos de paridade: o mesmo conteúdo renderizado pelo componente React do kit
 * e pelo HTML recomendado com as classes `.semec-*`.
 *
 * Cada caso: id, react(h, DS, I) → elemento, html(icon) → string,
 * parts: [nome, seletor no React, seletor no HTML] (relativos ao contêiner do
 * caso; "" = primeiro filho), states: { parte: ["hover", "focus"] },
 * shot: entra na comparação de screenshot (true = contêiner; nome = só a parte), narrow: contêiner de 388 px
 * (largura do toast no viewport do Radix), flex: contêiner flex (posição inteira).
 */

const ROOT = ["root", "", ""];
const BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive", "success", "link"];
const BUTTON_SIZES = ["sm", "md", "lg"];
const TEXT = "Enviar solicitação";

export const cases = [];
const add = (c) => cases.push({ parts: [ROOT], states: {}, ...c });

// ---- Botão --------------------------------------------------------------------
for (const variant of BUTTON_VARIANTS) {
  for (const size of BUTTON_SIZES) {
    add({
      id: `btn-${variant}-${size}`,
      react: (h, DS) => h(DS.Button, { variant, size, type: "button" }, TEXT),
      html: () => `<button type="button" class="semec-btn semec-btn--${variant} semec-btn--${size}">${TEXT}</button>`,
      states: size === "md" ? { root: ["hover", "focus"] } : {},
      shot: size === "md",
    });
  }
}
add({
  id: "btn-icon",
  react: (h, DS, I) => h(DS.Button, { size: "icon", type: "button", "aria-label": "Fechar" }, h(I.X, { "aria-hidden": true })),
  html: (icon) => `<button type="button" class="semec-btn semec-btn--icon" aria-label="Fechar">${icon("X")}</button>`,
});
add({
  id: "btn-padrao",
  react: (h, DS) => h(DS.Button, { type: "button" }, TEXT),
  html: () => `<button type="button" class="semec-btn">${TEXT}</button>`,
  states: { root: ["hover", "focus"] },
});
add({
  id: "btn-disabled",
  react: (h, DS) => h(DS.Button, { type: "button", disabled: true }, TEXT),
  html: () => `<button type="button" class="semec-btn" disabled>${TEXT}</button>`,
});
add({
  id: "btn-aria-disabled",
  react: (h, DS) => h(DS.Button, { type: "button", disabled: true }, TEXT),
  html: () => `<a href="#conteudo" class="semec-btn" aria-disabled="true">${TEXT}</a>`,
});
add({
  id: "btn-link-como-botao",
  react: (h, DS) => h(DS.Button, { asChild: true, variant: "outline" }, h("a", { href: "#conteudo" }, TEXT)),
  html: () => `<a href="#conteudo" class="semec-btn semec-btn--outline">${TEXT}</a>`,
  states: { root: ["hover", "focus"] },
});

// ---- Campos -------------------------------------------------------------------
const fieldCases = [
  ["input", (h, DS, p) => h(DS.Input, { "aria-label": "Nome completo", defaultValue: "Maria", ...p }), (a) => `<input class="semec-field" aria-label="Nome completo" value="Maria"${a}>`],
  ["select", (h, DS, p) => h(DS.Select, null, h(DS.SelectTrigger, { "aria-label": "Escola", ...p }, h(DS.SelectValue, { placeholder: "Selecione a escola" }))), (a) => `<select class="semec-field" aria-label="Escola"${a}><option value="">Selecione a escola</option></select>`],
  ["textarea", (h, DS, p) => h(DS.Textarea, { "aria-label": "Motivo", ...p }), (a) => `<textarea class="semec-field" aria-label="Motivo"${a}></textarea>`],
];
for (const [name, react, html] of fieldCases) {
  add({ id: `field-${name}`, react: (h, DS) => react(h, DS, {}), html: () => html(""), states: { root: ["focus"] }, shot: name !== "select" });
  add({ id: `field-${name}-invalid`, react: (h, DS) => react(h, DS, { invalid: true }), html: () => html(' aria-invalid="true"'), states: { root: ["focus"] }, shot: name !== "select" });
  add({ id: `field-${name}-disabled`, react: (h, DS) => react(h, DS, { disabled: true }), html: () => html(" disabled") });
}

// ---- FormField (rótulo, obrigatório, dica, erro) ------------------------------------
add({
  id: "form-field-erro",
  react: (h, DS) => h(DS.FormField, { label: "E-mail", required: true, htmlFor: "ff-email", error: "Informe um e-mail válido." }, h(DS.Input, { id: "ff-email", type: "email" })),
  html: () => `<div class="semec-form-field"><label for="h-ff-email" class="semec-label">E-mail<span class="semec-label__required"> *</span></label><input id="h-ff-email" type="email" class="semec-field" aria-invalid="true" aria-describedby="h-ff-email-error" required><p id="h-ff-email-error" class="semec-error">Informe um e-mail válido.</p></div>`,
  parts: [ROOT, ["label", "label", "label"], ["required", "label span", "label span"], ["control", "input", "input"], ["error", "p", "p"]],
  states: { control: ["focus"] },
  shot: true,
});
add({
  id: "form-field-dica",
  react: (h, DS) => h(DS.FormField, { label: "Nome completo", htmlFor: "ff-nome", hint: "Como consta na certidão de nascimento." }, h(DS.Input, { id: "ff-nome" })),
  html: () => `<div class="semec-form-field"><label for="h-ff-nome" class="semec-label">Nome completo</label><input id="h-ff-nome" class="semec-field" aria-describedby="h-ff-nome-hint"><p id="h-ff-nome-hint" class="semec-hint">Como consta na certidão de nascimento.</p></div>`,
  parts: [ROOT, ["label", "label", "label"], ["control", "input", "input"], ["hint", "p", "p"]],
  shot: true,
});

// ---- Checkbox e rádio nativos -------------------------------------------------------------
for (const [suffix, props, attrs] of [["", {}, ""], ["-marcado", { defaultChecked: true }, " checked"], ["-invalido", { invalid: true }, ' aria-invalid="true"'], ["-desabilitado", { disabled: true }, " disabled"]]) {
  add({
    id: `checkbox${suffix}`,
    react: (h, DS) => h(DS.Checkbox, { "aria-label": "Declaro que as informações são verdadeiras", ...props }),
    html: () => `<input type="checkbox" class="semec-checkbox" aria-label="Declaro que as informações são verdadeiras"${attrs}>`,
    states: suffix === "" ? { root: ["focus"] } : {},
    // Só o controle, num contêiner flex: solto num bloco, a linha de texto muda com inline-block × inline-grid.
    shot: "root",
    flex: true,
  });
}
for (const [suffix, group, attrs, groupAttrs] of [["", {}, "", ""], ["-marcado", { defaultValue: "manha" }, " checked", ""], ["-invalido", { invalid: true }, "", ' aria-invalid="true"']]) {
  add({
    id: `radio${suffix}`,
    react: (h, DS) => h(DS.RadioGroup, { "aria-label": "Turno", ...group }, h(DS.RadioGroupItem, { value: "manha", "aria-label": "Manhã" })),
    html: () => `<div role="radiogroup" aria-label="Turno" class="semec-form-field"${groupAttrs}><input type="radio" name="turno${suffix}" value="manha" class="semec-radio" aria-label="Manhã"${attrs}></div>`,
    parts: [["root", "[role=radio]", "input"]],
    states: suffix === "" ? { root: ["focus"] } : {},
    shot: "root",
    flex: true,
    // Só o controle, num contêiner flex: solto num bloco, a linha de texto muda com inline-block × inline-grid.
    shot: "root",
    flex: true,
  });
}

// Linha da opção: padrão do manifest (`flex min-h-11 items-center gap-2` + Label) com alvo de 44 px.
add({
  id: "choice",
  react: (h, DS) => h("div", { className: "flex min-h-11 items-center gap-2 text-sm font-medium text-foreground" }, h(DS.Checkbox, { id: "r-choice" }), h(DS.Label, { htmlFor: "r-choice" }, "Declaro que as informações são verdadeiras")),
  html: () => `<label class="semec-choice"><input type="checkbox" class="semec-checkbox"> Declaro que as informações são verdadeiras</label>`,
  parts: [ROOT, ["control", "[role=checkbox]", "input"]],
  shot: true,
});

// ---- Cartão ---------------------------------------------------------------------------------
add({
  id: "card",
  react: (h, DS) => h(DS.Card, null,
    h(DS.CardHeader, null, h(DS.CardTitle, { as: "h2" }, "Dados da solicitação"), h(DS.CardDescription, null, "Confira os dados antes de enviar.")),
    h(DS.CardContent, null, "Conteúdo do cartão."),
    h(DS.CardFooter, null, "Protocolo disponível após o envio.")),
  html: () => `<section class="semec-card" aria-labelledby="h-card-t"><div class="semec-card__header"><h2 id="h-card-t" class="semec-card__title">Dados da solicitação</h2><div class="semec-card__description">Confira os dados antes de enviar.</div></div><div class="semec-card__content">Conteúdo do cartão.</div><div class="semec-card__footer">Protocolo disponível após o envio.</div></section>`,
  parts: [ROOT, ["header", ":scope > * > :nth-child(1)", ".semec-card__header"], ["title", "h2", "h2"], ["description", ":scope > * > :nth-child(1) > :nth-child(2)", ".semec-card__description"], ["content", ":scope > * > :nth-child(2)", ".semec-card__content"], ["footer", ":scope > * > :nth-child(3)", ".semec-card__footer"]],
  shot: true,
});

// ---- Alerta -----------------------------------------------------------------------------------
const ALERT_ICON = { default: "Info", success: "CheckCircle2", warning: "AlertTriangle", destructive: "AlertCircle" };
for (const [variant, modifier] of [["default", "info"], ["success", "success"], ["warning", "warning"], ["destructive", "danger"]]) {
  const role = variant === "destructive" ? "alert" : "status";
  add({
    id: `alert-${modifier}`,
    react: (h, DS) => h(DS.Alert, { variant }, h(DS.AlertTitle, null, "Prazo de matrícula"), h(DS.AlertDescription, null, h("p", null, "As inscrições vão até 30 de novembro."))),
    html: (icon) => `<div role="${role}" class="semec-alert semec-alert--${modifier}">${icon(ALERT_ICON[variant])}<div class="semec-alert__title">Prazo de matrícula</div><div class="semec-alert__description"><p>As inscrições vão até 30 de novembro.</p></div></div>`,
    parts: [ROOT, ["icon", "svg", "svg"], ["title", ":scope > * > div:nth-of-type(1)", ".semec-alert__title"], ["description", ":scope > * > div:nth-of-type(2)", ".semec-alert__description"], ["paragraph", "p", "p"]],
    shot: true,
  });
}

// ---- Cabeçalho ----------------------------------------------------------------------------------
add({
  id: "header",
  react: (h, DS) => h(DS.Header, null,
    h(DS.HeaderBrand, { href: "#conteudo", orgName: "SEMEC", serviceName: "Matrícula e transferência", logo: h("img", { src: "/logo.svg", alt: "Prefeitura de Porto Velho", width: 90, height: 36 }) }),
    h(DS.HeaderNav, null, h(DS.HeaderNavLink, { href: "#matricula" }, "Matrícula"), h(DS.HeaderNavLink, { href: "#transferencia", current: true }, "Transferência"))),
  html: () => `<header class="semec-header"><a href="#conteudo" class="semec-header__brand"><img src="/logo.svg" alt="Prefeitura de Porto Velho" width="90" height="36"> <span aria-hidden="true" class="semec-header__divider"></span> <span class="semec-header__org">SEMEC <span aria-hidden="true" class="semec-header__separator">|</span> <span class="semec-header__service">Matrícula e transferência</span></span> <span class="semec-sr-only">— ir para o início</span></a><nav aria-label="Menu principal" class="semec-header__nav"><a href="#matricula" class="semec-header__link">Matrícula</a><a href="#transferencia" class="semec-header__link" aria-current="page">Transferência</a></nav></header>`,
  parts: [ROOT, ["brand", "header > a", "header > a"], ["divider", "header > a > span:nth-of-type(1)", ".semec-header__divider"], ["org", "header > a > span:nth-of-type(2)", ".semec-header__org"], ["separator", "header > a > span:nth-of-type(2) > span:first-child", ".semec-header__separator"], ["service", "header > a > span:nth-of-type(2) > span:last-child", ".semec-header__service"], ["srOnly", "header > a > span:nth-of-type(3)", ".semec-sr-only"], ["nav", "nav", "nav"], ["link", "nav a:not([aria-current])", "nav a:not([aria-current])"], ["current", "nav a[aria-current=page]", "nav a[aria-current=page]"]],
  states: { brand: ["focus"], link: ["hover", "focus"], current: ["hover", "focus"] },
  shot: true,
});

// ---- Rodapé -----------------------------------------------------------------------------------------
add({
  id: "footer",
  react: (h, DS) => h(DS.Footer, null,
    h(DS.FooterContent, null, h(DS.FooterSection, { title: "Serviços" }, h(DS.FooterLinks, null, h(DS.FooterLink, { href: "#matricula" }, "Matrícula"), h(DS.FooterLink, { href: "#transporte" }, "Transporte escolar")))),
    h(DS.FooterBottom, null, "© 2026 Prefeitura de Porto Velho · SEMEC")),
  html: () => `<footer class="semec-footer"><div class="semec-footer__content"><div class="semec-footer__section"><h2 class="semec-footer__title">Serviços</h2><ul class="semec-footer__links"><li><a href="#matricula" class="semec-footer__link">Matrícula</a></li><li><a href="#transporte" class="semec-footer__link">Transporte escolar</a></li></ul></div></div><div class="semec-footer__bottom">© 2026 Prefeitura de Porto Velho · SEMEC</div></footer>`,
  parts: [ROOT, ["content", "footer > div:first-child", ".semec-footer__content"], ["section", "footer > div:first-child > div", ".semec-footer__section"], ["title", "h2", "h2"], ["links", "ul", "ul"], ["link", "a", "a"], ["bottom", "footer > div:last-child", ".semec-footer__bottom"]],
  states: { link: ["hover", "focus"] },
});

// ---- Pular para o conteúdo -----------------------------------------------------------------------
add({
  id: "skip-link",
  react: (h, DS) => h(DS.SkipLink, { href: "#conteudo" }),
  html: () => `<a href="#conteudo" class="semec-skip-link">Pular para o conteúdo principal</a>`,
  states: { root: ["focus"] },
});

// ---- Tabela --------------------------------------------------------------------------------------------
const rows = [["2026-000318", "Ana Beatriz Souza", "Deferida"], ["2026-000322", "Carlos Henrique Lima", "Em análise"]];
add({
  id: "table",
  react: (h, DS) => h(DS.Table, null,
    h(DS.TableCaption, null, "Solicitações de transferência enviadas"),
    h(DS.TableHeader, null, h(DS.TableRow, null, ["Protocolo", "Estudante", "Situação"].map((t) => h(DS.TableHead, { key: t }, t)))),
    h(DS.TableBody, null, rows.map((r) => h(DS.TableRow, { key: r[0] }, r.map((c) => h(DS.TableCell, { key: c }, c)))))),
  html: () => `<div class="semec-table__wrapper" role="region" aria-label="Solicitações de transferência" tabindex="0"><table class="semec-table"><caption class="semec-table__caption">Solicitações de transferência enviadas</caption><thead><tr>${["Protocolo", "Estudante", "Situação"].map((t) => `<th scope="col">${t}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
  parts: [ROOT, ["table", "table", "table"], ["caption", "caption", "caption"], ["headRow", "thead tr", "thead tr"], ["th", "th", "th"], ["row", "tbody tr:first-child", "tbody tr:first-child"], ["lastRow", "tbody tr:last-child", "tbody tr:last-child"], ["td", "td", "td"]],
  states: { row: ["hover"] },
  shot: true,
});

// ---- Resumo de erros -------------------------------------------------------------------------------
add({
  id: "error-summary",
  react: (h, DS) => h(DS.ErrorSummary, { id: "resumo-r", autoFocus: false, errors: [{ id: "ff-email", message: "Informe um e-mail válido." }, { id: "ff-nome", message: "Informe o nome completo." }] }),
  html: () => `<div id="resumo-h" class="semec-error-summary" role="alert" tabindex="-1" aria-labelledby="resumo-h-title"><h2 id="resumo-h-title" class="semec-error-summary__title">Há um problema</h2><ul class="semec-error-summary__list"><li><a href="#h-ff-email">Informe um e-mail válido.</a></li><li><a href="#h-ff-nome">Informe o nome completo.</a></li></ul></div>`,
  parts: [ROOT, ["title", "h2", "h2"], ["list", "ul", "ul"], ["link", "a", "a"]],
  states: { root: ["focus"], link: ["hover", "focus"] },
  shot: true,
});

// ---- Badge -------------------------------------------------------------------------------------------------
for (const variant of ["default", "secondary", "outline", "success", "warning", "danger", "info"]) {
  add({
    id: `badge-${variant}`,
    react: (h, DS) => h(DS.Badge, { variant }, "Em análise"),
    html: () => `<span class="semec-badge semec-badge--${variant}">Em análise</span>`,
  });
}

// ---- Toast (aparência) ---------------------------------------------------------------------------------------
for (const [variant, modifier] of [["default", "info"], ["success", "success"], ["warning", "warning"], ["destructive", "danger"]]) {
  add({
    id: `toast-${modifier}`,
    narrow: true,
    react: (h, DS) => h(DS.ToastProvider, null,
      h(DS.Toast, { variant, open: true, duration: Infinity }, h("div", { className: "grid gap-1" }, h(DS.ToastTitle, null, "Solicitação enviada"), h(DS.ToastDescription, null, "Protocolo 2026-000331.")), h(DS.ToastAction, { altText: "Ver protocolo" }, "Ver"), h(DS.ToastClose)),
      h(DS.ToastViewport)),
    html: (icon) => `<div class="semec-toast semec-toast--${modifier}"><div class="semec-toast__body"><p class="semec-toast__title">Solicitação enviada</p><p class="semec-toast__description">Protocolo 2026-000331.</p></div><button type="button" class="semec-toast__action">Ver</button><button type="button" class="semec-toast__close" aria-label="Fechar notificação">${icon("X")}</button></div>`,
    parts: [["root", "li", ":scope > div"], ["body", "li > div", ".semec-toast__body"], ["title", "li > div > :first-child", ".semec-toast__title"], ["description", "li > div > :last-child", ".semec-toast__description"], ["action", "button:not([toast-close])", ".semec-toast__action"], ["close", "button[toast-close]", ".semec-toast__close"]],
    states: { action: ["hover", "focus"], close: ["hover", "focus"] },
  });
}

// ---- Título ---------------------------------------------------------------------------------------------------
for (const level of [1, 2, 3, 4, 5, 6]) {
  add({
    id: `heading-${level}`,
    react: (h, DS) => h(DS.Heading, { level }, "Solicitação de transferência escolar"),
    html: () => `<h${level} class="semec-heading semec-heading--${level}">Solicitação de transferência escolar</h${level}>`,
  });
}
add({
  id: "heading-sem-bloco",
  react: (h, DS) => h(DS.Heading, { level: 3 }, "Solicitação de transferência escolar"),
  html: () => `<h3 class="semec-heading--3">Solicitação de transferência escolar</h3>`,
});
