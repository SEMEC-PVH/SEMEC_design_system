/**
 * Regressão visual de TODOS os componentes do manifest (packages/react/manifest.js).
 *
 * Por componente:
 *   padrao  — fixture do smoke do gate (getComponentElement, scripts/gate/smoke.fixtures.mjs);
 *   foco    — padrão + Tab até o primeiro controle (foco visível por teclado);
 *   hover   — padrão + mouse sobre o primeiro controle (só desktop: no toque não há hover);
 *   aberto  — camadas abertas pelo caminho do usuário (openStateCases do gate);
 *   extras  — disabled / invalid / marcado / variantes / texto longo (visual.fixtures.mjs).
 *
 * Sem skip silencioso (TST-B2): quem não recebe foco ou não tem controle para
 * hover está numa lista explícita abaixo, e o teste CONFERE que continua assim.
 * Qualquer outro componente que perca a focabilidade falha.
 *
 * Só tema claro. Estabilidade: Poppins do kit com os 4 pesos carregados (conferido
 * pelas FontFace, TST-B3), prefers-reduced-motion, animações desligadas no print e
 * relógio fixo (Calendar). Roda em Linux, no contêiner do Playwright (TST-B1).
 */
import { test, expect } from "@playwright/test";

import { dsComponents } from "../../packages/react/manifest.js";
import { openStateCases } from "../../scripts/gate/open-states.fixtures.mjs";
import { extraStateNames } from "./visual.fixtures.mjs";

// Só os códigos dos casos abertos interessam aqui; o namespace falso não renderiza nada.
const fakeDs = new Proxy({}, { get: () => "div" });
const OPEN_CODES = new Set(openStateCases(fakeDs).map((c) => c.code));

/**
 * Componentes cujo estado padrão NÃO tem nada que receba foco por Tab.
 * Cada entrada diz por quê. Se um deles passar a receber foco, o teste falha
 * pedindo para tirá-lo daqui (e a baseline de foco passa a existir).
 */
const SEM_FOCO = {
  alert: "mensagem estática, sem ação",
  avatar: "só imagem/iniciais",
  badge: "rótulo estático",
  card: "contêiner sem controle no fixture",
  "empty-state": "fixture sem ação",
  heading: "texto",
  label: "rótulo solto (htmlFor sem campo)",
  progress: "indicador",
  separator: "decorativo",
  skeleton: "placeholder",
  spinner: "indicador",
  table: "tabela estática",
  timeline: "lista estática",
};

/**
 * Componentes sem controle visível para hover no desktop. Mesma regra: se
 * aparecer um controle, o teste falha pedindo para tirá-lo daqui.
 */
const SEM_HOVER = {
  ...SEM_FOCO,
  "scroll-area": "só texto (a rolagem recebe foco, mas não tem estado de hover)",
  "skip-link": "invisível até receber foco",
  toast: "o toast do fixture não tem ação nem botão de fechar",
};

/**
 * Conferências do estado padrão (TST-B3): o print só vale se o fixture mostra
 * o que promete. Sem isso, uma ScrollArea que não rola, um Toast que não se
 * desenha ou uma Sidebar sem gatilho no mobile viram baselines "verdes" vazias.
 */
const CONFERE_PADRAO = {
  "scroll-area": async (page) => {
    const transborda = await page.evaluate(() => {
      const v = document.querySelector("[data-radix-scroll-area-viewport]");
      return Boolean(v) && v.scrollHeight > v.clientHeight;
    });
    expect(transborda, "o conteúdo da ScrollArea transborda a área").toBe(true);
  },
  toast: async (page) => {
    await expect(page.getByText("Arquivo salvo com sucesso", { exact: true })).toBeVisible();
  },
  sidebar: async (page) => {
    await expect(page.getByRole("button", { name: "Alternar barra lateral" })).toBeVisible();
  },
};

const FIXED_NOW = new Date("2026-10-16T10:00:00-04:00");
const INTERACTIVE =
  'button:not([disabled]), a[href], input:not([type="hidden"]):not([disabled]), textarea, [role="button"], [role="checkbox"], [role="switch"], [role="tab"], [role="slider"], [role="radio"], [role="combobox"], .cursor-pointer';
const PESOS = ["400", "500", "600", "700"];

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
  const carregados = await page.evaluate(async (pesos) => {
    // Carrega os 4 pesos do kit antes do print (o navegador só baixa o peso quando ele é usado).
    await Promise.all(pesos.map((w) => document.fonts.load(`${w} 16px "Poppins"`)));
    await document.fonts.ready;
    // Espera as animações finitas (entrada de Sheet/Dialog…): o hover só "pega" se o
    // controle já estiver na posição final quando o mouse chega. As infinitas (Spinner,
    // Skeleton) ficam de fora, senão a espera não termina.
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {}))
    );
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    // TST-B3: document.fonts.check() devolve true até para família inexistente;
    // aqui conferimos as FontFace da Poppins que de fato carregaram.
    const ok = new Set();
    for (const face of document.fonts) {
      if (face.family.replace(/["']/g, "") === "Poppins" && face.status === "loaded") ok.add(String(face.weight));
    }
    return [...ok].sort();
  }, PESOS);
  expect(carregados, "FontFace da Poppins carregadas (400, 500, 600, 700)").toEqual(PESOS);
}

async function snap(page, name) {
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}

/**
 * Centro do primeiro controle visível de verdade (ignora sr-only e o input file
 * oculto; `.cursor-pointer` pega a zona de soltar do FileUpload). Procura no body inteiro: camadas abertas no fixture (Dialog, Sheet…)
 * ficam em portal, fora de #root.
 */
function firstVisibleControl(page) {
  return page.evaluate((sel) => {
    for (const el of document.querySelectorAll(`body :is(${sel})`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  }, INTERACTIVE);
}

const isMobile = (testInfo) => testInfo.project.name.startsWith("mobile");

for (const { code } of dsComponents) {
  test.describe(code, () => {
    test("padrao", async ({ page }) => {
      const errors = await mount(page, code, "default");
      await CONFERE_PADRAO[code]?.(page);
      await snap(page, `${code}--padrao`);
      expect(errors, "erros de página").toEqual([]);
    });

    test("foco", async ({ page }) => {
      await mount(page, code, "default");
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement && document.activeElement !== document.body);
      if (code in SEM_FOCO) {
        expect(focused, `'${code}' recebeu foco: tire-o de SEM_FOCO em visual.spec.mjs`).toBe(false);
        return;
      }
      expect(focused, `'${code}' não recebeu foco por Tab (perdeu a focabilidade?)`).toBe(true);
      await settle(page);
      await snap(page, `${code}--foco`);
    });

    test("hover", async ({ page }, testInfo) => {
      // Por projeto, não por resultado: no toque não existe hover.
      test.skip(isMobile(testInfo), "sem hover em toque");
      await mount(page, code, "default");
      const box = await firstVisibleControl(page);
      if (code in SEM_HOVER) {
        expect(box, `'${code}' ganhou controle visível: tire-o de SEM_HOVER em visual.spec.mjs`).toBeNull();
        return;
      }
      expect(box, `'${code}' sem controle visível para hover`).not.toBeNull();
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

// TST-B3: no mobile a Sidebar vira folha fechada; abre pelo SidebarTrigger do fixture.
test.describe("sidebar", () => {
  test("aberto-mobile", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), "a folha da Sidebar só existe no mobile");
    await mount(page, "sidebar", "default");
    await page.getByRole("button", { name: "Alternar barra lateral" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("link", { name: "Painel" })).toBeVisible();
    await settle(page);
    await snap(page, "sidebar--aberto-mobile");
  });
});
