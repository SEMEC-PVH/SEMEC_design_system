/**
 * Casos de paridade dos componentes interativos (onda 3, F1), ABERTOS: o mesmo
 * conteúdo no React do kit (Radix) e no HTML com as classes `.semec-*` e os
 * atributos de estado que o Radix põe (e que o @semec/ds-elements põe também).
 *
 * Um caso por página (`/react-i?caso=<id>` × `/html-i?caso=<id>`): o Dialog e o
 * menu modais tornam o resto da página inerte. Formato igual ao de cases.mjs, mais:
 * - `actions`: interação no React depois de montar ({ target, click | key });
 *   `doc:` = seletor no documento (portal do Radix);
 * - `shotLayer`: seletor que vira camada composta nos dois lados só no screenshot;
 * - `geometry`: { name, react, html, keys?, relative? }: caixas que têm de coincidir
 *   (x, y, largura por padrão). `relative`: medidas a partir do contêiner do caso
 *   (o Radix modal zera o padding do body com o react-remove-scroll).
 * No HTML, o <dialog> abre com showModal() (top layer e ::backdrop de verdade).
 */

const showModal = '<script>document.currentScript.previousElementSibling.showModal()</script>';
const CLOSE = '<button type="button" class="semec-dialog__close" data-semec-dialog-close><span class="semec-sr-only">Fechar</span></button>';

export const interactiveCases = [];
const add = (c) => interactiveCases.push({ states: {}, geometry: [], ...c });

// ---- Dialog -----------------------------------------------------------------------
add({
  id: "dialog-aberto",
  react: (h, DS) => h(DS.Dialog, { defaultOpen: true },
    h(DS.DialogContent, null,
      h(DS.DialogHeader, null, h(DS.DialogTitle, null, "Cancelar a solicitação?"), h(DS.DialogDescription, null, "O protocolo 2026-000318 deixa de valer.")),
      h(DS.DialogFooter, null, h(DS.Button, { variant: "outline", type: "button" }, "Voltar"), h(DS.Button, { variant: "destructive", type: "button" }, "Cancelar solicitação")))),
  html: () => `<semec-dialog><dialog class="semec-dialog" aria-labelledby="h-dlg-t" aria-describedby="h-dlg-d" data-state="open"><div class="semec-dialog__header"><h2 id="h-dlg-t" class="semec-dialog__title">Cancelar a solicitação?</h2><p id="h-dlg-d" class="semec-dialog__description">O protocolo 2026-000318 deixa de valer.</p></div><div class="semec-dialog__footer"><button type="button" class="semec-btn semec-btn--outline" data-semec-dialog-close>Voltar</button><button type="button" class="semec-btn semec-btn--destructive">Cancelar solicitação</button></div>${CLOSE}</dialog>${showModal}</semec-dialog>`,
  parts: [
    ["panel", "doc:[role=dialog]", "dialog"],
    ["overlay", "doc:[data-state=open].fixed.inset-0:not([role])", "dialog::backdrop"],
    ["header", "doc:[role=dialog] > div:first-child", ".semec-dialog__header"],
    ["title", "doc:[role=dialog] h2", "h2"],
    ["description", "doc:[role=dialog] p", "p"],
    ["footer", "doc:[role=dialog] > div:nth-child(2)", ".semec-dialog__footer"],
    ["close", "doc:[role=dialog] > button:last-child", ".semec-dialog__close"],
  ],
  states: { close: ["hover", "focus"] },
  geometry: [{ name: "panel", react: "doc:[role=dialog]", html: "dialog" }, { name: "close", react: "doc:[role=dialog] > button:last-child", html: ".semec-dialog__close" }],
  shot: "panel",
});

add({
  id: "alert-dialog-aberto",
  react: (h, DS) => h(DS.AlertDialog, { defaultOpen: true },
    h(DS.AlertDialogContent, null,
      h(DS.AlertDialogHeader, null, h(DS.AlertDialogTitle, null, "Excluir o rascunho?"), h(DS.AlertDialogDescription, null, "Esta ação não pode ser desfeita.")),
      h(DS.AlertDialogFooter, null, h(DS.AlertDialogCancel, null, "Cancelar"), h(DS.AlertDialogAction, { variant: "destructive" }, "Excluir")))),
  html: () => `<semec-dialog alert><dialog class="semec-dialog semec-dialog--alert" role="alertdialog" aria-modal="true" aria-labelledby="h-adlg-t" aria-describedby="h-adlg-d" data-state="open"><div class="semec-dialog__header"><h2 id="h-adlg-t" class="semec-dialog__title">Excluir o rascunho?</h2><p id="h-adlg-d" class="semec-dialog__description">Esta ação não pode ser desfeita.</p></div><div class="semec-dialog__footer"><button type="button" class="semec-btn semec-btn--outline" data-semec-dialog-close>Cancelar</button><button type="button" class="semec-btn semec-btn--destructive">Excluir</button></div></dialog>${showModal}</semec-dialog>`,
  parts: [
    ["panel", "doc:[role=alertdialog]", "dialog"],
    ["overlay", "doc:[data-state=open].fixed.inset-0:not([role])", "dialog::backdrop"],
    ["header", "doc:[role=alertdialog] > div:first-child", ".semec-dialog__header"],
    ["title", "doc:[role=alertdialog] h2", "h2"],
    ["description", "doc:[role=alertdialog] p", "p"],
    ["footer", "doc:[role=alertdialog] > div:nth-child(2)", ".semec-dialog__footer"],
  ],
  geometry: [{ name: "panel", react: "doc:[role=alertdialog]", html: "dialog" }],
  shot: "panel",
});

// ---- Tabs (aba ativa) -------------------------------------------------------------
add({
  id: "tabs-aba-ativa",
  react: (h, DS) => h(DS.Tabs, { defaultValue: "dados" },
    h(DS.TabsList, { "aria-label": "Solicitação" },
      h(DS.TabsTrigger, { value: "dados" }, "Dados"),
      h(DS.TabsTrigger, { value: "documentos" }, "Documentos"),
      h(DS.TabsTrigger, { value: "historico", disabled: true }, "Histórico")),
    h(DS.TabsContent, { value: "dados" }, "Dados do estudante e da escola de destino."),
    h(DS.TabsContent, { value: "documentos" }, "Documentos enviados.")),
  html: () => `<semec-tabs class="semec-tabs" value="dados"><div class="semec-tabs__list" role="tablist" aria-label="Solicitação"><button type="button" role="tab" id="h-tab-1" aria-controls="h-pan-1" aria-selected="true" data-state="active" tabindex="0" class="semec-tabs__trigger">Dados</button><button type="button" role="tab" id="h-tab-2" aria-controls="h-pan-2" aria-selected="false" data-state="inactive" tabindex="-1" class="semec-tabs__trigger">Documentos</button><button type="button" role="tab" id="h-tab-3" aria-selected="false" data-state="inactive" data-disabled disabled tabindex="-1" class="semec-tabs__trigger">Histórico</button></div><div role="tabpanel" id="h-pan-1" aria-labelledby="h-tab-1" data-state="active" tabindex="0" class="semec-tabs__panel">Dados do estudante e da escola de destino.</div><div role="tabpanel" id="h-pan-2" aria-labelledby="h-tab-2" data-state="inactive" tabindex="0" hidden class="semec-tabs__panel">Documentos enviados.</div></semec-tabs>`,
  parts: [
    ["list", "[role=tablist]", "[role=tablist]"],
    ["active", "[role=tab][data-state=active]", "[role=tab][data-state=active]"],
    ["inactive", "[role=tab][data-state=inactive]:not([disabled])", "[role=tab][data-state=inactive]:not([disabled])"],
    ["disabled", "[role=tab][disabled]", "[role=tab][disabled]"],
    ["panel", "[role=tabpanel][data-state=active]", "[role=tabpanel][data-state=active]"],
  ],
  states: { active: ["hover", "focus"], inactive: ["hover", "focus"], panel: ["focus"] },
  shot: true,
});

// ---- Combobox ---------------------------------------------------------------------
const SCHOOLS = [["centro", "Escola Centro"], ["norte", "Escola Norte"], ["sul", "Escola Sul"]];
const comboboxReact = (h, DS) => h("div", null,
  h(DS.Label, { htmlFor: "r-cb" }, "Escola de destino"),
  h(DS.Combobox, { id: "r-cb", options: SCHOOLS.map(([value, label]) => ({ value, label })), defaultValue: "norte", name: "escola" }));
// O check é o <svg> que o <semec-combobox> põe na opção escolhida (com a classe, vira máscara).
const CHECK_SVG = '<svg class="semec-combobox__check" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const option = ([value, label], i, { chosen, active }) => `<li role="option" id="h-cb-o${i}" data-value="${value}" class="semec-combobox__option" aria-selected="${chosen ? "true" : "false"}"${active ? " data-highlighted" : ""}>${label}${chosen ? CHECK_SVG : ""}</li>`;
// Markup depois do <semec-combobox> subir (o <select> continua como fonte das opções e valor do formulário).
const comboboxHtml = ({ open, side, empty } = {}) => `<div><label id="h-cb-l" for="h-cb" class="semec-label">Escola de destino</label><semec-combobox class="semec-combobox" data-state="${open ? "open" : "closed"}"><input id="h-cb" type="text" role="combobox" class="semec-combobox__input" aria-autocomplete="list" aria-expanded="${open && !empty ? "true" : "false"}" aria-controls="h-cb-lb"${open && !empty ? ' aria-activedescendant="h-cb-o2"' : ""} autocomplete="off" placeholder="Selecione…" value="${empty ? "Escola Leste" : "Escola Norte"}"><ul id="h-cb-lb" role="listbox" aria-labelledby="h-cb-l" class="semec-combobox__listbox" data-state="${open ? "open" : "closed"}"${side ? ` data-side="${side}"` : ""}${open && !empty ? "" : " hidden"}>${SCHOOLS.map((s, i) => option(s, i, { chosen: i === 1, active: i === 2 })).join("")}</ul><div class="semec-combobox__empty"${open && empty ? "" : " hidden"}>Nenhum resultado.</div><div class="semec-sr-only" role="status">${empty ? "Nenhum resultado." : ""}</div><select id="h-cb-nativo" name="escola" hidden aria-hidden="true" tabindex="-1">${SCHOOLS.map(([v, l]) => `<option value="${v}"${v === "norte" ? " selected" : ""}>${l}</option>`).join("")}</select></semec-combobox></div>`;

add({
  id: "combobox-fechado",
  react: comboboxReact,
  html: () => comboboxHtml(),
  parts: [["input", "button", "input"]],
  states: { input: ["focus"] },
  shot: "input",
});

// Aberto com a escolhida (Norte) e a ativa (Sul) diferentes: o ↓ do React move a ativa.
add({
  id: "combobox-aberto",
  react: comboboxReact,
  actions: [{ target: "button", click: true }, { target: "doc:input[role=combobox]", key: "ArrowDown" }],
  html: () => comboboxHtml({ open: true }),
  parts: [
    ["popup", "doc:[data-radix-popper-content-wrapper] > div", "[role=listbox]"],
    ["plain", "doc:[role=option]:nth-child(1)", "[role=option]:nth-child(1)"],
    ["chosen", "doc:[role=option]:nth-child(2)", "[role=option]:nth-child(2)"],
    ["highlighted", "doc:[role=option]:nth-child(3)", "[role=option]:nth-child(3)"],
    ["check", "doc:[role=option]:nth-child(2) svg", "[role=option]:nth-child(2) .semec-combobox__check"],
  ],
  geometry: [
    { name: "popup", react: "doc:[data-radix-popper-content-wrapper] > div", html: "[role=listbox]", relative: true },
    // Na vertical, a opção do React fica abaixo do campo de busca interno do popup.
    { name: "option", react: "doc:[role=option]:nth-child(2)", html: "[role=option]:nth-child(2)", keys: ["x", "width"], relative: true },
  ],
  shot: "highlighted",
  shotLayer: "[role=listbox]",
});

// Sem resultado: a mensagem é o popup (no React, o <p> dentro do popover, abaixo da busca).
add({
  id: "combobox-sem-resultado",
  react: comboboxReact,
  actions: [{ target: "button", click: true }, { target: "doc:input[role=combobox]", type: "Escola Leste" }],
  html: () => comboboxHtml({ open: true, empty: true }),
  parts: [
    ["popup", "doc:[data-radix-popper-content-wrapper] > div", ".semec-combobox__empty"],
    ["text", "doc:[data-radix-popper-content-wrapper] p[role=status]", ".semec-combobox__empty"],
  ],
  geometry: [{ name: "popup", react: "doc:[data-radix-popper-content-wrapper] > div", html: ".semec-combobox__empty", relative: true }],
});

// ---- DropdownMenu (aberto, primeiro item ativo) ---------------------------------
add({
  id: "menu-aberto",
  react: (h, DS) => h(DS.DropdownMenu, { defaultOpen: true },
    h(DS.DropdownMenuTrigger, { asChild: true }, h(DS.Button, { variant: "outline", type: "button" }, "Ações")),
    h(DS.DropdownMenuContent, { align: "start" },
      h(DS.DropdownMenuLabel, null, "Solicitação"),
      h(DS.DropdownMenuItem, null, "Ver detalhes"),
      h(DS.DropdownMenuItem, null, "Baixar comprovante"),
      h(DS.DropdownMenuSeparator),
      h(DS.DropdownMenuItem, { disabled: true }, "Cancelar solicitação"))),
  actions: [{ target: "doc:[role=menu]", key: "ArrowDown" }],
  html: () => `<semec-menu><button type="button" class="semec-btn semec-btn--outline" id="h-menu-b" aria-haspopup="menu" aria-expanded="true" aria-controls="h-menu">Ações</button><div id="h-menu" role="menu" aria-labelledby="h-menu-b" class="semec-menu" data-state="open"><div class="semec-menu__label" role="presentation">Solicitação</div><button type="button" role="menuitem" tabindex="-1" class="semec-menu__item" data-highlighted>Ver detalhes</button><a href="#comprovante" role="menuitem" tabindex="-1" class="semec-menu__item">Baixar comprovante</a><div role="separator" class="semec-menu__separator"></div><button type="button" role="menuitem" tabindex="-1" class="semec-menu__item" aria-disabled="true" data-disabled>Cancelar solicitação</button></div></semec-menu>`,
  parts: [
    ["popup", "doc:[role=menu]", "[role=menu]"],
    ["label", "doc:[role=menu] > div:first-child", ".semec-menu__label"],
    ["highlighted", "doc:[role=menuitem]:nth-child(2)", "[role=menuitem]:nth-child(2)"],
    ["item", "doc:[role=menuitem]:nth-child(3)", "[role=menuitem]:nth-child(3)"],
    ["separator", "doc:[role=separator]", "[role=separator]"],
    ["disabled", "doc:[role=menuitem][data-disabled]", "[role=menuitem][data-disabled]"],
  ],
  states: { item: ["hover", "focus"] },
  geometry: [
    { name: "popup", react: "doc:[role=menu]", html: "[role=menu]", relative: true },
    { name: "item", react: "doc:[role=menuitem]:nth-child(3)", html: "[role=menuitem]:nth-child(3)", relative: true },
  ],
  shot: "popup",
  shotLayer: "[role=menu]",
});

// ---- Accordion (item expandido) -------------------------------------------------
add({
  id: "accordion-expandido",
  react: (h, DS) => h(DS.Accordion, { type: "single", collapsible: true, defaultValue: "prazo" },
    h(DS.AccordionItem, { value: "prazo" }, h(DS.AccordionTrigger, null, "Qual é o prazo da transferência?"), h(DS.AccordionContent, null, "Até 10 dias úteis após o envio.")),
    h(DS.AccordionItem, { value: "docs" }, h(DS.AccordionTrigger, null, "Quais documentos preciso?"), h(DS.AccordionContent, null, "Certidão de nascimento e histórico escolar."))),
  html: () => `<semec-accordion class="semec-accordion" type="single" collapsible><div class="semec-accordion__item" data-state="open"><h3 class="semec-accordion__header"><button type="button" id="h-acc-t1" aria-expanded="true" aria-controls="h-acc-p1" data-state="open" class="semec-accordion__trigger">Qual é o prazo da transferência?<span class="semec-accordion__icon" aria-hidden="true"></span></button></h3><div id="h-acc-p1" role="region" aria-labelledby="h-acc-t1" data-state="open" class="semec-accordion__panel">Até 10 dias úteis após o envio.</div></div><div class="semec-accordion__item" data-state="closed"><h3 class="semec-accordion__header"><button type="button" id="h-acc-t2" aria-expanded="false" aria-controls="h-acc-p2" data-state="closed" class="semec-accordion__trigger">Quais documentos preciso?<span class="semec-accordion__icon" aria-hidden="true"></span></button></h3><div id="h-acc-p2" role="region" aria-labelledby="h-acc-t2" data-state="closed" hidden class="semec-accordion__panel">Certidão de nascimento e histórico escolar.</div></div></semec-accordion>`,
  parts: [
    ["item", "[data-state=open][data-orientation]:not(h3):not(button):not([role=region])", ".semec-accordion__item[data-state=open]"],
    ["header", "h3", "h3"],
    ["open", "button[data-state=open]", "button[data-state=open]"],
    ["closed", "button[data-state=closed]", "button[data-state=closed]"],
    ["icon", "button[data-state=open] svg", "button[data-state=open] .semec-accordion__icon"],
    ["panel", "[role=region] > div", "[role=region]"],
  ],
  states: { open: ["hover", "focus"], closed: ["hover", "focus"] },
  shot: true,
});

/** Popup que não cabe embaixo: o elemento marca data-side="top" e o CSS inverte (só HTML). */
export const flippedComboboxHtml = () => comboboxHtml({ open: true, side: "top" });
