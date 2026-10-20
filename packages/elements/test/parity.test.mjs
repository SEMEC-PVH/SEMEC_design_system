/**
 * Paridade de comportamento com o kit React (Radix), no Chromium: a mesma
 * sequência de teclas na bancada dos elementos e nos componentes React tem de
 * levar ao mesmo foco e ao mesmo estado. As divergências decididas no
 * contrato (padrão APG onde o Radix difere) ficam fora daqui e estão testadas
 * em elements.test.mjs: ↑ no gatilho do menu, volta ao início no menu, Tab no
 * menu aberto e o Esc que limpa o combobox.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startServer, open } from "./support/harness.mjs";

let srv;
let browser;

before(async () => {
  srv = await startServer();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await srv?.close();
});

/** Lê o estado só por ARIA e atributos do Radix, igual nas duas páginas. */
function snapshot(kind) {
  const visible = (el) => Boolean(el) && !el.closest("[hidden]") && el.getClientRects().length > 0;
  const text = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
  const el = document.activeElement;
  const implicit = { BUTTON: "button", A: "link", INPUT: "textbox", DIALOG: "dialog" };
  const focus = !el || el === document.body
    ? "body"
    : `${el.getAttribute("role") ?? implicit[el.tagName] ?? el.tagName.toLowerCase()}:${el.id || el.getAttribute("aria-label") || text(el)}`;
  let state;
  if (kind === "dialog") {
    const d = [...document.querySelectorAll("dialog, [role=dialog], [role=alertdialog]")].find((x) => visible(x) && (x.open || x.getAttribute("data-state") === "open"));
    state = d ? { role: d.getAttribute("role") ?? "dialog", title: text(document.getElementById(d.getAttribute("aria-labelledby"))), description: text(document.getElementById(d.getAttribute("aria-describedby"))) } : null;
  } else if (kind === "tabs") {
    state = {
      selected: [...document.querySelectorAll("[role=tab][aria-selected=true]")].map(text),
      panels: [...document.querySelectorAll("[role=tabpanel]")].filter(visible).map(text),
      tabindex: [...document.querySelectorAll("[role=tab]")].map((t) => t.getAttribute("tabindex")),
    };
  } else if (kind === "accordion") {
    state = {
      expanded: [...document.querySelectorAll("[id^=ac-][aria-expanded=true]")].map(text),
      regions: [...document.querySelectorAll("[role=region]")].filter(visible).map(text),
    };
  } else if (kind === "menu") {
    const m = [...document.querySelectorAll("[role=menu]")].find(visible);
    const trigger = document.getElementById("menu-gatilho");
    state = { open: Boolean(m), expanded: trigger.getAttribute("aria-expanded"), highlighted: m ? [...m.querySelectorAll("[data-highlighted]")].map(text) : [] };
  } else if (kind === "combobox") {
    const combo = [...document.querySelectorAll("[role=combobox]")].find(visible);
    const active = combo?.getAttribute("aria-activedescendant");
    const listbox = [...document.querySelectorAll("[role=listbox]")].find(visible);
    state = {
      expanded: combo?.getAttribute("aria-expanded") ?? "false",
      active: active ? text(document.getElementById(active)) : null,
      options: listbox ? listbox.querySelectorAll("[role=option]").length : 0,
      value: document.querySelector("[name=escola]").value,
    };
  }
  return { focus, state };
}

async function run(url, kind, steps) {
  const { page, errors } = await open(browser, url);
  const out = [];
  for (const step of steps) {
    const [action, arg] = step;
    if (action === "focus") await page.focus(arg);
    else if (action === "press") await page.keyboard.press(arg);
    else if (action === "type") await page.keyboard.type(arg);
    else if (action === "wait") await page.waitForTimeout(arg);
    else if (action === "click-outside") await page.mouse.click(1200, 850); // canto da tela: fora do painel nas duas páginas
    else if (action === "snap") {
      await page.waitForTimeout(50);
      out.push({ label: arg, ...(await page.evaluate(snapshot, kind)) });
    }
  }
  await page.close();
  return { out, errors };
}

async function compare(kind, steps, normalize = (x) => x) {
  const react = await run(`${srv.base}/react`, kind, steps);
  const elements = await run(`${srv.base}/bancada`, kind, steps);
  assert.deepEqual(elements.errors, [], "erros no console dos elementos");
  assert.deepEqual(elements.out.map(normalize), react.out.map(normalize));
  return elements.out;
}

const snap = (label) => ["snap", label];

test("dialog: Enter abre, foco no 1º campo, Tab circula, Shift+Tab volta, Esc fecha e devolve o foco", async () => {
  const out = await compare("dialog", [
    ["focus", "#abrir-dialogo"], ["press", "Enter"], snap("aberto"),
    ["press", "Tab"], snap("tab 1"), ["press", "Tab"], snap("tab 2"), ["press", "Tab"], snap("tab 3 (X)"), ["press", "Tab"], snap("tab 4 volta"),
    ["press", "Shift+Tab"], snap("shift+tab vai ao último"),
    ["press", "Escape"], snap("fechado"),
  ]);
  assert.equal(out[0].focus, "textbox:telefone");
  assert.deepEqual(out[0].state, { role: "dialog", title: "Editar contato", description: "Altere o telefone do responsável." });
  assert.equal(out[4].focus, "textbox:telefone");
  assert.equal(out.at(-1).focus, "button:abrir-dialogo");
  assert.equal(out.at(-1).state, null);
});

test("dialog: botão de fechar e clique no fundo fecham", async () => {
  await compare("dialog", [
    ["focus", "#abrir-dialogo"], ["press", "Enter"], ["press", "Tab"], ["press", "Enter"], snap("cancelar fecha"),
    ["press", "Enter"], snap("reaberto"), ["click-outside"], snap("fundo fecha"),
  ]);
});

test("alertdialog: foco no Cancelar, clique no fundo não fecha, Esc fecha e devolve o foco", async () => {
  const out = await compare("dialog", [
    ["focus", "#abrir-alerta"], ["press", "Enter"], snap("aberto"),
    ["press", "Tab"], snap("tab"), ["press", "Tab"], snap("tab volta"),
    ["click-outside"], snap("fundo não fecha"),
    ["press", "Escape"], snap("fechado"),
  ],
  // Clique no fundo: o Radix deixa o foco no body; o elemento mantém o foco no Cancelar
  // (dentro do modal, testado em elements.test.mjs). Só o estado conta nesse passo.
  (s) => (s.label === "fundo não fecha" ? { ...s, focus: "(ignorado)" } : s));
  assert.equal(out[0].focus, "button:alerta-cancelar");
  assert.equal(out[0].state.role, "alertdialog");
  assert.notEqual(out[3].state, null);
  assert.equal(out.at(-1).focus.endsWith(":abrir-alerta"), true);
});

test("tabs: setas com volta, Home/End, ativação automática, Tab vai ao painel", async () => {
  const out = await compare(
    "tabs",
    [
      ["focus", "#aba-1"], snap("início"),
      ["press", "ArrowRight"], snap("→"), ["press", "ArrowRight"], snap("→ →"), ["press", "ArrowRight"], snap("volta ao 1º"),
      ["press", "ArrowLeft"], snap("← vai ao último"), ["press", "Home"], snap("Home"), ["press", "End"], snap("End"),
      ["press", "ArrowDown"], snap("↓ ignorado na horizontal"),
      ["press", "Tab"], snap("painel"),
    ],
    // O papel do gatilho é "tab" nas duas; o painel do Radix não tem id fixo.
    (s) => ({ ...s, focus: s.focus.startsWith("tabpanel:") ? "tabpanel" : s.focus })
  );
  assert.deepEqual(out[1].state.selected, ["Documentos"]);
  assert.equal(out.at(-1).focus.split(":")[0], "tabpanel");
});

test("accordion: Enter/Espaço alternam, collapsible fecha, ↑/↓ com volta, Home/End", async () => {
  const out = await compare("accordion", [
    ["focus", "#ac-1"], ["press", "Enter"], snap("abre 1"),
    ["press", "ArrowDown"], ["press", "Space"], snap("abre 2 e fecha 1"),
    ["press", "Space"], snap("fecha 2"),
    ["press", "End"], snap("End"), ["press", "ArrowDown"], snap("↓ volta ao 1º"), ["press", "ArrowUp"], snap("↑ vai ao último"), ["press", "Home"], snap("Home"),
  ]);
  assert.deepEqual(out[0].state.expanded, ["Quem pode pedir transferência?"]);
  assert.deepEqual(out[2].state.expanded, []);
});

test("menu: Enter/Espaço/↓ abrem no 1º, setas, Home/End, busca por letra, Esc devolve o foco, Enter escolhe", async () => {
  const out = await compare("menu", [
    ["focus", "#menu-gatilho"], ["press", "Enter"], snap("Enter abre"),
    ["press", "ArrowDown"], snap("↓"), ["press", "ArrowDown"], snap("↓ link"), ["press", "ArrowDown"], snap("↓ pula o desabilitado? não: último habilitado"),
    ["press", "Home"], snap("Home"), ["press", "End"], snap("End"),
    ["press", "d"], snap("d"), ["press", "d"], snap("d de novo"),
    ["press", "Escape"], snap("Esc"),
    ["press", "ArrowDown"], snap("↓ abre"), ["press", "Escape"], ["wait", 150], // o Radix devolve o foco depois de um quadro
    ["press", "Space"], snap("Espaço abre"), ["press", "ArrowDown"], ["press", "Enter"], snap("Enter escolhe e fecha"),
  ]);
  assert.deepEqual(out[0].state, { open: true, expanded: "true", highlighted: ["Editar"] });
  assert.equal(out[0].focus, "menuitem:Editar");
  assert.equal(out[3].focus, "menuitem:Dividir");
  assert.equal(out[5].focus, "menuitem:Dividir", "End vai ao último habilitado");
  assert.equal(out[6].focus, "menuitem:Duplicar");
  assert.equal(out[7].focus, "menuitem:Dividir");
  assert.equal(out[8].focus, "button:menu-gatilho");
  assert.equal(out.at(-1).state.open, false);
});

test("combobox: ↓ abre na escolhida, ↓/↑ param nas pontas, Home/End, Enter escolhe, filtro, lista vazia, Esc fecha", async () => {
  const out = await compare(
    "combobox",
    [
      ["focus", "#escola"], ["press", "ArrowDown"], snap("↓ abre"),
      ["press", "ArrowUp"], snap("↑ para no 1º"), ["press", "ArrowDown"], snap("↓"), ["press", "End"], snap("End"), ["press", "ArrowDown"], snap("↓ para no último"), ["press", "Home"], snap("Home"),
      ["press", "Enter"], snap("Enter escolhe"),
      ["press", "ArrowDown"], snap("reabre na escolhida"), ["type", "santa"], snap("filtra"), ["press", "Enter"], snap("escolhe filtrada"),
      ["press", "ArrowDown"], ["type", "xyz"], snap("sem resultado"), ["press", "Escape"], snap("Esc fecha"),
    ],
    // O gatilho do kit é um botão que abre o campo de busca; o elemento é o próprio campo.
    // Compara o papel do foco quando a lista está aberta (combobox nos dois).
    (s) => ({ ...s, focus: s.state.expanded === "true" ? s.focus.split(":")[0] : "fora da lista" })
  );
  assert.equal(out[0].state.active, "EMEF Rio Madeira");
  assert.equal(out[3].state.active, "EMEIEF Ulisses Guimarães");
  assert.equal(out[6].state.value, "rio-madeira");
  assert.equal(out[7].state.active, "EMEF Rio Madeira");
  assert.deepEqual([out[8].state.options, out[8].state.active], [1, "EMEF Santa Marcelina"]);
  assert.equal(out[9].state.value, "santa-marcelina");
  assert.deepEqual([out[10].state.expanded, out[10].state.options], ["false", 0]);
  assert.equal(out[11].state.value, "santa-marcelina");
});
