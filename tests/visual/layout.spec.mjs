/**
 * Conferências de LAYOUT em telas de consumidor (validação da 4.2.0 como
 * consumidor). Sem print: cada teste mede o que o achado descreveu, com o CSS
 * do kit aplicado (Tailwind v4 contra o dist, como na regressão visual).
 *
 * Roda nos mesmos projetos da regressão visual (desktop-1366 e mobile-390);
 * o que é de 320 px redimensiona a página dentro do teste.
 */
import { test, expect } from "@playwright/test";

const isMobile = (testInfo) => testInfo.project.name.startsWith("mobile");

async function mountLayout(page, code) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/index.html");
  await page.waitForFunction(() => window.__visualReady === true);
  const result = await page.evaluate((c) => window.__visual.mount(c, "layout"), code);
  expect(result.error ?? null, `montagem de ${code}`).toBeNull();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  return errors;
}

/**
 * Área de toque efetiva por hit-test: a partir do centro do elemento, quanto
 * dá para andar em cada eixo e ainda acertar o próprio elemento (inclui o
 * `::after` que amplia o alvo). Devolve largura e altura em px.
 */
function hitArea(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const hits = (x, y) => {
      const t = document.elementFromPoint(x, y);
      return !!t && (t === el || el.contains(t));
    };
    const reach = (dx, dy) => {
      let d = 0;
      while (d < 60 && hits(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
      return d;
    };
    return { width: reach(-1, 0) + reach(1, 0) + 1, height: reach(0, -1) + reach(0, 1) + 1 };
  }, selector);
}

test.describe("layout de consumidor", () => {
  test("HeaderNav com 4 links não cria rolagem horizontal a 320 px (NEXT42-02, WCAG 1.4.10)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    const errors = await mountLayout(page, "header-4-links");
    const medida = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      navRight: document.querySelector("nav[aria-label='Principal']").getBoundingClientRect().right,
    }));
    expect(medida.scrollWidth, JSON.stringify(medida)).toBeLessThanOrEqual(medida.clientWidth);
    expect(medida.navRight).toBeLessThanOrEqual(medida.clientWidth);
    for (const nome of ["Início", "Protocolos", "Requerimento", "Painel"]) {
      await expect(page.getByRole("link", { name: nome, exact: true })).toBeInViewport({ ratio: 1 });
    }
    expect(errors).toEqual([]);
  });

  test("FooterLink curto tem alvo de 44×44 no mobile (NEXT42-05)", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), "a área ampliada vale só abaixo de sm");
    await mountLayout(page, "footer-link-curto");
    const area = await hitArea(page, "a[href='#iptu']");
    expect(area.width, JSON.stringify(area)).toBeGreaterThanOrEqual(44);
    expect(area.height, JSON.stringify(area)).toBeGreaterThanOrEqual(44);
  });

  test("links do painel do NavigationMenu cabem numa linha (V42-VITE-03)", async ({ page }) => {
    await mountLayout(page, "navigation-menu-painel");
    await page.getByRole("button", { name: "Serviços" }).click();
    const alvara = page.getByRole("link", { name: "Alvará de funcionamento" });
    await expect(alvara).toBeVisible();
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
    for (const nome of ["IPTU", "Alvará de funcionamento", "Certidão negativa"]) {
      const box = await page.getByRole("link", { name: nome }).boundingBox();
      // min-h-11 = 44 px; duas linhas de texto passam de 50.
      expect(box.height, `${nome}: ${JSON.stringify(box)}`).toBeLessThanOrEqual(46);
    }
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(scroll, "o painel não cria rolagem horizontal").toBeLessThanOrEqual(0);
  });

  test("campos de digitação têm 16 px no mobile e 14 px no desktop (NAV-01, zoom do iOS)", async ({ page }, testInfo) => {
    await mountLayout(page, "campos-digitacao");
    await page.getByRole("button", { name: /^Município/ }).click();
    await expect(page.locator("input[aria-autocomplete=list]")).toBeVisible();
    const tamanhos = await page.evaluate(() => {
      const px = (el) => parseFloat(getComputedStyle(el).fontSize);
      const busca = document.querySelector("input[aria-autocomplete=list]");
      return {
        input: px(document.getElementById("c-input")),
        textarea: px(document.getElementById("c-textarea")),
        mask: px(document.getElementById("c-mask")),
        senha: px(document.getElementById("c-senha")),
        data: px(document.getElementById("c-data")),
        busca: busca ? px(busca) : null,
      };
    });
    const esperado = isMobile(testInfo) ? 16 : 14;
    for (const [campo, valor] of Object.entries(tamanhos)) {
      expect(valor, `${campo}: ${JSON.stringify(tamanhos)}`).toBe(esperado);
    }
  });

  test("caption do DataTable fica inteira na tela com a tabela rolando (V42-VITE-05)", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), "a tabela só transborda no mobile");
    await mountLayout(page, "data-table-larga");
    const m = await page.evaluate(() => {
      const scroller = document.querySelector("table").parentElement;
      const cap = [...document.querySelectorAll("caption, p, div, span")].find(
        (el) => el.textContent === "Protocolos abertos em 2026" && el.children.length === 0
      );
      const r = cap.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(cap);
      const t = range.getBoundingClientRect();
      return {
        transborda: scroller.scrollWidth > scroller.clientWidth,
        textoLeft: t.left,
        textoRight: t.right,
        viewport: document.documentElement.clientWidth,
        capWidth: r.width,
      };
    });
    expect(m.transborda, "a fixture precisa transbordar").toBe(true);
    expect(m.textoLeft, JSON.stringify(m)).toBeGreaterThanOrEqual(0);
    expect(m.textoRight, JSON.stringify(m)).toBeLessThanOrEqual(m.viewport);
    await expect(page.getByRole("table", { name: "Protocolos abertos em 2026" })).toBeVisible();
  });
});
