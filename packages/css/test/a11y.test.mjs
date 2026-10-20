/**
 * Página de exemplo (examples/transferencia.html) só com dist/semec-ds.css:
 * axe-core sem violações (inicial, com erros e com aviso), foco visível em
 * todos os interativos pelo teclado, alvo de 44 px e layout no celular.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { startServer, pkgRoot, kitDist, cssDist } from "./support/harness.mjs";

const require = createRequire(import.meta.url);
const examples = path.join(pkgRoot, "examples");
const file = (p, type) => ({ type, body: () => fs.readFileSync(p) });

let srv;
let browser;
let page;

async function axe() {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
    return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
  });
}

const focusInfo = () => page.evaluate(() => {
  const el = document.activeElement;
  const s = getComputedStyle(el);
  // Anel do kit: sombra sólida "cor 0 0 0 Npx" com N ≥ 2 (ring-2 + offset); a elevação não conta.
  const ring = [...s.boxShadow.matchAll(/(rgba?\([^)]*\)) 0px 0px 0px (\d+(?:\.\d+)?)px/g)].some(([, color, spread]) => Number(spread) >= 2 && !/,\s*0\)$/.test(color));
  const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
  const rect = el.getBoundingClientRect();
  const choice = el.closest(".semec-choice")?.getBoundingClientRect().height ?? 0;
  return {
    key: el.getAttribute("data-tab"),
    id: el.id || el.getAttribute("href") || el.getAttribute("name") || el.tagName,
    tag: el.tagName,
    cls: el.className,
    visible: ring || outline,
    height: rect.height,
    choice,
    inline: Boolean(el.closest(".semec-error-summary__list")),
  };
});

before(async () => {
  srv = await startServer({
    "/exemplo/": file(path.join(examples, "transferencia.html"), "text/html; charset=utf-8"),
    "/exemplo/exemplo.css": file(path.join(examples, "exemplo.css"), "text/css"),
    "/exemplo/exemplo.js": file(path.join(examples, "exemplo.js"), "text/javascript"),
    "/exemplo/marca.svg": file(path.join(examples, "marca.svg"), "image/svg+xml"),
    "/exemplo/vendor/semec-ds.css": file(path.join(cssDist, "semec-ds.css"), "text/css"),
    "/exemplo/vendor/fonts.css": file(path.join(kitDist, "fonts.css"), "text/css"),
    ...Object.fromEntries(fs.readdirSync(path.join(kitDist, "fonts")).map((f) => [`/exemplo/vendor/fonts/${f}`, file(path.join(kitDist, "fonts", f), "font/woff2")])),
  });
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${srv.base}/exemplo/`);
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(errors, []);
});

after(async () => {
  await browser?.close();
  await srv?.close();
});

test("axe-core: zero violações na página inicial", async () => {
  assert.deepEqual(await axe(), []);
});

test("teclado: todos os interativos recebem foco visível e alvo ≥ 44 px", async () => {
  const expected = await page.evaluate(() => {
    const all = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]')].filter((el) => !el.closest("[hidden]") && !(el.type === "radio" && el.value !== "manha"));
    all.forEach((el, i) => el.setAttribute("data-tab", String(i)));
    return all.length;
  });
  await page.locator("body").focus();
  const visited = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const info = await focusInfo();
    if (info.tag === "BODY" || (visited.length && info.key === visited[0].key)) break;
    // input type=date tem várias paradas internas (dia/mês/ano): conta uma vez.
    if (visited.at(-1)?.key !== info.key) visited.push(info);
  }
  assert.equal(visited[0].cls, "semec-skip-link", "o primeiro foco é o link de pular");
  assert.equal(visited.length, expected, `paradas de tabulação: ${visited.map((v) => v.id).join(" → ")}`);
  const semFoco = visited.filter((v) => !v.visible).map((v) => v.id);
  assert.deepEqual(semFoco, [], "foco invisível");
  const pequenos = visited.filter((v) => v.tag !== "DIV" && !v.inline && v.height < 44 && v.choice < 44).map((v) => `${v.id} (${v.height}px)`);
  assert.deepEqual(pequenos, [], "alvo menor que 44 px");
});

test("envio inválido: resumo recebe o foco, links levam aos campos e axe continua zero", async () => {
  await page.locator("#enviar").focus();
  await page.keyboard.press("Enter");
  await page.locator("#resumo").waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.id), "resumo");
  const resumo = await page.locator("#resumo").evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, width: s.outlineWidth, border: s.borderLeftWidth };
  });
  assert.equal(resumo.border, "3px");
  assert.equal(await page.locator("#nome").getAttribute("aria-invalid"), "true");
  await page.waitForTimeout(400); // transição de cor do kit (duration-fast)
  const borda = await page.locator("#nome").evaluate((el) => getComputedStyle(el).borderColor);
  const perigo = await page.evaluate(() => { const p = document.createElement("p"); p.className = "semec-error"; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; });
  assert.equal(borda, perigo, "campo inválido com a borda de perigo");
  await page.locator("#resumo a").first().click();
  assert.equal(await page.evaluate(() => document.activeElement.id), "nome");
  assert.deepEqual(await axe(), []);
});

test("envio válido: aviso de sucesso, axe zero e fechar devolve o foco", async () => {
  await page.fill("#nome", "Maria Clara Souza");
  await page.fill("#nascimento", "2015-03-10");
  await page.fill("#cpf", "52998224725");
  await page.fill("#telefone", "69999998888");
  await page.selectOption("#escola", "emef-rio-madeira");
  await page.locator('input[name="turno"][value="tarde"]').check();
  await page.fill("#motivo", "Mudança de endereço da família.");
  await page.locator("#declaracao").check();
  await page.locator("#enviar").click();
  await page.locator(".semec-toast").waitFor();
  assert.equal(await page.locator("#resumo").isHidden(), true);
  assert.deepEqual(await axe(), []);
  await page.keyboard.press("Tab"); // modalidade de teclado: o foco por script também fica :focus-visible
  await page.locator(".semec-toast__close").focus();
  assert.equal((await focusInfo()).visible, true);
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".semec-toast").count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement.id), "enviar");
});

test("celular (375 px): sem rolagem horizontal, campo com 16 px e tabela rolável", async () => {
  await page.setViewportSize({ width: 375, height: 800 });
  const m = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    input: getComputedStyle(document.getElementById("nome")).fontSize,
    tabela: (() => { const w = document.querySelector(".semec-table__wrapper"); return { overflow: getComputedStyle(w).overflowX, rola: w.scrollWidth > w.clientWidth }; })(),
  }));
  assert.ok(m.scroll <= 375, `rolagem horizontal: ${m.scroll}px`);
  assert.equal(m.input, "16px");
  assert.equal(m.tabela.overflow, "auto");
  assert.equal(m.tabela.rola, true);
  assert.deepEqual(await axe(), []);
  await page.setViewportSize({ width: 1280, height: 900 });
});
