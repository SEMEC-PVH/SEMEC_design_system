#!/usr/bin/env node
/** Paridade real do dist + reprodução dos seis pontos de INT-A-02/INT-D-01. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { compile } from "@tailwindcss/node";
import { chromium } from "playwright";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(process.argv[2] ?? path.join(pkgRoot, "dist"));
const lite = JSON.parse(fs.readFileSync(path.join(dist, "lite/manifest.json"), "utf8"));
const full = JSON.parse(fs.readFileSync(path.join(dist, "skills/manifest.json"), "utf8"));
assert.deepEqual(lite.classes, full.classes, "Receitas full/lite divergiram");
const { classes } = lite;
assert.equal(Object.keys(classes.recipes).length, 11);
assert.equal(Object.keys(classes.recipes.Button.entries).length, 29, "7 variantes × 4 tamanhos + padrão");
assert(!/@(?:apply|theme|utility|tailwind|source)\b/.test(classes.css), "CSS puro contém diretiva Tailwind");
const skill = fs.readFileSync(path.join(dist, "lite/semec-ds-lite/SKILL.md"), "utf8");
assert(skill.includes("## Anatomia dos componentes (sem React)"));
assert(skill.includes(classes.css.trim()));
const reactDir = path.join(dist, "react");
const compiler = await compile(`@import "tailwindcss";\n@import "${path.join(reactDir, "tokens.css").replaceAll("\\", "/")}";`, { base: pkgRoot, onDependency() {} });
const candidates = Object.values(classes.recipes).flatMap((r) => Object.values(r.entries).flatMap((e) => e.className.split(/\s+/)));
const tailwindCss = compiler.build(candidates);
const bundle = await build({ entryPoints: [path.join(pkgRoot, "scripts/recipes.browser.mjs")], bundle: true, write: false, platform: "browser", format: "iife", alias: { "semec-recipe-kit": path.join(reactDir, "index.js") }, define: { "process.env.NODE_ENV": '"production"' }, logLevel: "silent" });
const recipe = (name, tw) => classes.recipes[name][tw ? "htmlTailwind" : "html"];
const cls = (name, key, tw) => classes.recipes[name].entries[key][tw ? "className" : "selector"];
function screen(tw) {
  return recipe("Header", tw) + `<main id="conteudo"><h1>Solicitação</h1><section class="${cls("Card", "root", tw)}"><div class="${cls("Card", "header", tw)}"><h2 class="${cls("Card", "title", tw)}">Dados</h2></div><div class="${cls("Card", "content", tw)}"><form><div class="${cls("FormField", "root", tw)}">${recipe("Input", tw)}</div>${recipe("Button", tw)}</form></div></section><section id="ajuda"><h2>Ajuda</h2>${recipe("Select", tw)}${recipe("Textarea", tw)}${recipe("FormField", tw)}${recipe("ErrorSummary", tw)}${recipe("Alert", tw)}${recipe("Badge", tw)}${recipe("Toast", tw)}</section></main>`;
}
const behavior = `document.querySelector('form')?.addEventListener('submit', event => { event.preventDefault(); document.getElementById('resumo')?.focus(); }); document.querySelector('[toast-close]')?.addEventListener('click', event => { event.currentTarget.closest('[role="status"]').remove(); document.querySelector('button[type="submit"]').focus(); });`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost").pathname;
  const assets = { "/recipe.css": [classes.css, "text/css"], "/tailwind.css": [tailwindCss, "text/css"], "/app.js": [bundle.outputFiles[0].text, "text/javascript"], "/behavior.js": [behavior, "text/javascript"] };
  if (assets[url]) { res.setHeader("Content-Type", assets[url][1]); res.end(assets[url][0]); return; }
  if (url === "/fonts.css" || url === "/variables.css" || url === "/base.css" || /^\/fonts\/[\w.-]+\.woff2$/.test(url)) { res.setHeader("Content-Type", url.endsWith("css") ? "text/css" : "font/woff2"); res.end(fs.readFileSync(path.join(reactDir, url.slice(1)))); return; }
  const react = ["/react", "/parity"].includes(url);
  const tw = url === "/tailwind";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Receitas SEMEC</title><link rel="stylesheet" href="/fonts.css">${!react && !tw ? '<link rel="stylesheet" href="/variables.css"><link rel="stylesheet" href="/base.css">' : ""}<link rel="stylesheet" href="/${react || tw ? "tailwind" : "recipe"}.css"></head><body>${react ? '<div id="root"></div><script>window.recipeData=' + JSON.stringify(classes).replaceAll("<", "\\u003c") + '</script><script src="/app.js"></script>' : screen(tw) + '<script src="/behavior.js"></script>'}</body></html>`);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (error) => console.error(error));
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${base}/parity`);
  await page.waitForSelector('[data-parity="Toast-success"]', { state: "attached" });
  const parity = await page.evaluate(() => window.readParity());
  assert.deepEqual(parity, [], "Classes publicadas diferentes do DOM React");
  const measurements = {};
  for (const mode of ["react", "html", "tailwind"]) {
    await page.goto(`${base}/${mode}`);
    await page.waitForSelector("#nome");
    await page.evaluate(() => document.fonts.ready);
    measurements[mode] = await page.evaluate(() => {
      const cs = (selector) => getComputedStyle(document.querySelector(selector));
      const button = getComputedStyle([...document.querySelectorAll("button")].find((b) => /revisar/i.test(b.textContent)));
      return { header: cs("header").backgroundColor, labelSize: cs('label[for="nome"]').fontSize, labelWeight: cs('label[for="nome"]').fontWeight, inputSize: cs("#nome").fontSize, inputPadding: cs("#nome").paddingLeft, buttonRadius: button.borderRadius, buttonPadding: button.paddingLeft };
    });
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })));
    assert.deepEqual(violations, [], `${mode}: axe`);
    await page.locator("#nome").focus();
    await page.keyboard.press("Tab");
    assert.match(await page.locator(":focus").textContent(), /Revisar/);
    const focus = await page.locator(":focus").evaluate((el) => { const s = getComputedStyle(el); return s.boxShadow !== "none" || (s.outlineStyle !== "none" && s.outlineWidth !== "0px"); });
    assert(focus, `${mode}: foco invisível`);
    if (mode !== "react") {
      await page.keyboard.press("Enter");
      await page.locator("#resumo").waitFor();
      assert.equal(await page.locator(":focus").getAttribute("id"), "resumo");
      await page.locator('#resumo a').click();
      assert.equal(await page.locator(":focus").getAttribute("id"), "email");
      await page.getByLabel("Fechar notificação").click();
      assert.equal(await page.getByLabel("Fechar notificação").count(), 0);
    }
    await page.setViewportSize({ width: 375, height: 900 });
    assert.equal(await page.locator("#nome").evaluate((el) => getComputedStyle(el).fontSize), "16px");
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  assert.deepEqual(measurements.html, measurements.react, "HTML puro diverge do React");
  assert.deepEqual(measurements.tailwind, measurements.react, "HTML Tailwind diverge do React");
  assert.equal(measurements.html.labelSize, "14px");
  assert.equal(measurements.html.labelWeight, "500");
  assert.equal(measurements.html.inputPadding, "16px");
  assert.equal(measurements.html.buttonPadding, "20px");
  console.log(JSON.stringify(measurements, null, 2));
  console.log(`Receitas: ${Object.values(classes.recipes).reduce((n, r) => n + Object.keys(r.entries).length, 0)} entradas em paridade; três telas; seis pontos iguais; axe 0; teclado/foco/clique e fonte mobile OK.`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
