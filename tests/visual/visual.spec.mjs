/**
 * Regressão visual de TODOS os componentes do manifest (packages/react/manifest.js).
 *
 * Por componente:
 *   padrao  — fixture do smoke do gate (getComponentElement);
 *   foco    — padrão + Tab até o primeiro controle (foco visível por teclado);
 *   hover   — padrão + mouse sobre o primeiro controle (só desktop: no toque não há hover);
 *   aberto  — camadas abertas pelo caminho do usuário (openStateCases do gate);
 *   extras  — disabled / invalid / marcado / variantes / texto longo (visual.fixtures.mjs).
 *
 * Só tema claro. Estabilidade: fonte local (Poppins do kit) com document.fonts.ready,
 * prefers-reduced-motion, animações desligadas no print e relógio fixo (Calendar).
 */
import { test, expect } from "@playwright/test";

import { dsComponents } from "../../packages/react/manifest.js";
import { openStateCases } from "../../scripts/gate/open-states.fixtures.mjs";
import { extraStateNames } from "./visual.fixtures.mjs";

// Só os códigos dos casos abertos interessam aqui; o namespace falso não renderiza nada.
const fakeDs = new Proxy({}, { get: () => "div" });
const OPEN_CODES = new Set(openStateCases(fakeDs).map((c) => c.code));

const FIXED_NOW = new Date("2026-10-16T10:00:00-04:00");
const INTERACTIVE =
  'button:not([disabled]), a[href], input:not([type="hidden"]):not([disabled]), textarea, [role="button"], [role="checkbox"], [role="switch"], [role="tab"], [role="slider"], [role="radio"], [role="combobox"]';

async function mount(page, code, state) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto("/index.html");
  await page.waitForFunction(() => window.__visualReady === true);
  const result = await page.evaluate(([c, s]) => window.__visual.mount(c, s), [code, state]);
  expect(result.error ?? null, `montagem de ${code}/${state}`).toBeNull();
  await settle(page);
  return errors;
}

async function settle(page) {
  await page.evaluate(async () => {
    // Carrega os 4 pesos do kit antes do print (o navegador só baixa o peso quando ele é usado).
    await Promise.all(["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 16px "Poppins"`)));
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  const poppins = await page.evaluate(() =>
    ["400", "500", "600", "700"].every((w) => document.fonts.check(`${w} 16px "Poppins"`))
  );
  expect(poppins, "Poppins carregada").toBe(true);
}

async function snap(page, name) {
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}

for (const { code } of dsComponents) {
  test.describe(code, () => {
    test("padrao", async ({ page }) => {
      const errors = await mount(page, code, "default");
      await snap(page, `${code}--padrao`);
      expect(errors, "erros de página").toEqual([]);
    });

    test("foco", async ({ page }) => {
      await mount(page, code, "default");
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement && document.activeElement !== document.body);
      test.skip(!focused, "sem controle focável por teclado");
      await settle(page);
      await snap(page, `${code}--foco`);
    });

    test("hover", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name.startsWith("mobile"), "sem hover em toque");
      await mount(page, code, "default");
      // Primeiro controle visível de verdade (ignora sr-only e o input file oculto).
      const box = await page.evaluate((sel) => {
        for (const el of document.querySelectorAll(`#root :is(${sel})`)) {
          const r = el.getBoundingClientRect();
          if (r.width > 4 && r.height > 4) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }
        return null;
      }, INTERACTIVE);
      test.skip(!box, "sem controle visível para hover");
      await page.mouse.move(box.x, box.y);
      await settle(page);
      await snap(page, `${code}--hover`);
    });

    if (OPEN_CODES.has(code)) {
      test("aberto", async ({ page }) => {
        await mount(page, code, "open");
        await snap(page, `${code}--aberto`);
      });
    }

    for (const state of extraStateNames(code)) {
      test(state, async ({ page }) => {
        await mount(page, code, state);
        await snap(page, `${code}--${state}`);
      });
    }
  });
}
