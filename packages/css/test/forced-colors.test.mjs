/**
 * Alto contraste forçado (Windows, `forced-colors: active`) · A11Y-02.
 *
 * Em forced-colors o navegador remove o `box-shadow` (o anel `ring-*` do kit) e
 * força os fundos para Canvas. Um foco desenhado só com anel some, e um item
 * ativo marcado só pelo fundo fica igual aos outros. Este teste abre o React do
 * kit e o HTML do @semec/ds-css com a emulação de forced-colors (Chromium e,
 * se instalado, Firefox; o WebKit não emula) e confere:
 *   - foco: o elemento focado ganha contorno (`outline` ≠ none, ≥ 2px) e os
 *     pixels em volta dele mudam;
 *   - opção do combobox e item do menu ativos: pintados diferente dos outros;
 *   - aba ativa: a barra (`::after`) aparece, na inativa não (pixels).
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, firefox } from "playwright";
import { startServer } from "./support/harness.mjs";

const browsers = [["chromium", chromium]];
if (fs.existsSync(firefox.executablePath())) browsers.push(["firefox", firefox]);

/** Focáveis: [caso, nome, seletor no React (`doc:` = documento), seletor no HTML]. */
const FOCUS = [
  ["dialog-aberto", "fechar (X)", "doc:[role=dialog] > button:last-child", ".semec-dialog__close"],
  ["dialog-aberto", "botão", "doc:[role=dialog] > div:nth-child(2) button:last-child", ".semec-dialog__footer .semec-btn:last-child"],
  ["tabs-aba-ativa", "aba", "[role=tab][data-state=active]", "[role=tab][data-state=active]"],
  ["tabs-aba-ativa", "painel", "[role=tabpanel][data-state=active]", "[role=tabpanel][data-state=active]"],
  ["combobox-fechado", "campo", "button", "input"],
];

/** Ativo × comum: [caso, nome, ativo React, comum React, ativo HTML, comum HTML]. */
const HIGHLIGHT = [
  ["combobox-aberto", "opção ativa", "doc:[role=option][aria-selected=true]", "doc:[role=option][aria-selected=false]", "[role=option][data-highlighted]", "[role=option]:not([data-highlighted])"],
  ["menu-aberto", "item ativo", "doc:[role=menuitem][data-highlighted]", "doc:[role=menuitem]:not([data-highlighted]):not([data-disabled])", "[role=menuitem][data-highlighted]", "[role=menuitem]:not([data-highlighted]):not([data-disabled])"],
];

let srv;
before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv?.close();
});

async function open(browser, kind, id) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: "active", reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${srv.base}/${kind}-i?caso=${id}`);
  await page.waitForFunction(() => document.querySelectorAll("[data-case]").length > 0 && (!document.getElementById("root") || window.__ready));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => matchMedia("(forced-colors: active)").matches), "forced-colors emulado");
  return { page, close: () => context.close() };
}

const locate = (page, sel) => (sel.startsWith("doc:") ? page.locator(sel.slice(4)).first() : page.locator(`[data-case] ${sel}`).first());

async function around(page, loc) {
  const b = await loc.boundingBox();
  const pad = 6;
  return page.screenshot({ clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + 2 * pad, height: b.height + 2 * pad } });
}

for (const [name, type] of browsers) {
  test(`forced-colors (${name}): foco visível no React e no HTML`, async () => {
    const browser = await type.launch();
    const falhas = [];
    try {
      for (const [id, parte, reactSel, htmlSel] of FOCUS) {
        for (const [kind, sel] of [["react", reactSel], ["html", htmlSel]]) {
          const { page, close } = await open(browser, kind, id);
          try {
            const loc = locate(page, sel);
            const antes = await around(page, loc);
            await loc.evaluate((el) => el.focus({ focusVisible: true }));
            await page.waitForTimeout(50);
            const estilo = await loc.evaluate((el) => {
              const s = getComputedStyle(el);
              return { focado: el === document.activeElement || el.matches(":focus"), visivel: el.matches(":focus-visible"), style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
            });
            const depois = await around(page, loc);
            const onde = `${kind} · ${id} · ${parte}`;
            if (!estilo.focado || !estilo.visivel) falhas.push(`${onde}: não recebeu :focus-visible`);
            else if (estilo.style === "none" || estilo.width < 2) falhas.push(`${onde}: sem contorno (outline ${estilo.style} ${estilo.width}px)`);
            if (antes.equals(depois)) falhas.push(`${onde}: nenhum pixel mudou ao focar`);
          } finally {
            await close();
          }
        }
      }
    } finally {
      await browser.close();
    }
    assert.deepEqual(falhas, []);
  });

  test(`forced-colors (${name}): opção, item e aba ativos se distinguem`, async () => {
    const browser = await type.launch();
    const falhas = [];
    // O getComputedStyle devolve a cor do autor, não a forçada: a prova é o pixel
    // pintado. Amostra 4 × 4 px numa área sem texto (o padding direito do item;
    // a faixa da barra, embaixo e no meio da aba).
    const patch = async (page, loc, where) => {
      const b = await loc.boundingBox();
      const clip = where === "barra"
        ? { x: b.x + b.width / 2 - 2, y: b.y + b.height - 3, width: 4, height: 2 }
        : { x: b.x + b.width - 7, y: b.y + b.height / 2 - 2, width: 4, height: 4 };
      return page.screenshot({ clip });
    };
    try {
      for (const [id, parte, rAtivo, rComum, hAtivo, hComum] of HIGHLIGHT) {
        for (const [kind, ativo, comum] of [["react", rAtivo, rComum], ["html", hAtivo, hComum]]) {
          const { page, close } = await open(browser, kind, id);
          try {
            if ((await patch(page, locate(page, ativo))).equals(await patch(page, locate(page, comum)))) falhas.push(`${kind} · ${parte}: pintado igual aos outros`);
          } finally {
            await close();
          }
        }
      }
      for (const kind of ["react", "html"]) {
        const { page, close } = await open(browser, kind, "tabs-aba-ativa");
        try {
          const a = await patch(page, locate(page, "[role=tab][data-state=active]"), "barra");
          const i = await patch(page, locate(page, "[role=tab][data-state=inactive]:not([disabled])"), "barra");
          if (a.equals(i)) falhas.push(`${kind} · aba ativa: sem barra (igual à inativa)`);
        } finally {
          await close();
        }
      }
    } finally {
      await browser.close();
    }
    assert.deepEqual(falhas, []);
  });
}
