/**
 * Paridade de estilo (Playwright Chromium): cada classe/variante do
 * @semec/ds-css contra o componente React equivalente do kit.
 * Estilo computado em repouso, :hover e :focus-visible (forçados via CDP)
 * + screenshot lado a lado dos principais.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { cases } from "./support/cases.mjs";
import { startServer, measure, diff, compareImages, htmlCases, cssDist } from "./support/harness.mjs";

/**
 * Divergências aceitas, com motivo. Qualquer outra diferença reprova.
 * Chave: "<caso>/<parte>" + propriedade.
 */
const ACCEPTED = [
  {
    match: (key, prop) => /^field-select/.test(key) && prop === "lineHeight",
    reason: "O Chromium fixa line-height: normal no <select> nativo (menulist). A altura (44 px), o padding e a fonte são iguais ao gatilho do Select React.",
  },
];
const SCREENSHOT_TOLERANCE = 0.01; // até 1% dos pixels (antialiasing de texto e borda arredondada)

let srv;
let browser;
let react;
let html;

before(async () => {
  srv = await startServer();
  browser = await chromium.launch();
  react = await measure(browser, `${srv.base}/react`);
  html = await measure(browser, `${srv.base}/html`);
});

after(async () => {
  await browser?.close();
  await srv?.close();
});

test("as duas páginas montam sem erro e todas as partes existem", () => {
  assert.deepEqual(react.errors, []);
  assert.deepEqual(html.errors, []);
  const missing = Object.entries({ ...react.result }).filter(([key, v]) => v.missing || html.result[key]?.missing).map(([key]) => key);
  assert.deepEqual(missing, [], `partes não encontradas: ${missing.join(", ")}`);
});

test("estilo computado igual ao React (repouso, hover e foco)", () => {
  const problems = [];
  const accepted = new Set();
  for (const [key, states] of Object.entries(react.result)) {
    for (const [state, values] of Object.entries(states)) {
      for (const d of diff(values, html.result[key][state])) {
        const rule = ACCEPTED.find((a) => a.match(key, d.prop));
        if (rule) accepted.add(rule.reason);
        else problems.push(`${key} [${state}] ${d.prop}: React ${d.react} × CSS ${d.html}`);
      }
    }
  }
  assert.deepEqual(problems, [], `divergências de paridade:\n${problems.join("\n")}`);
  const states = Object.values(react.result).reduce((n, s) => n + Object.keys(s).length, 0);
  console.log(`paridade: ${Object.keys(react.result).length} partes, ${states} estados medidos; divergências aceitas: ${[...accepted].join(" | ") || "nenhuma"}`);
});

test("o estado de foco é visível em todo interativo medido", () => {
  const invisible = [];
  for (const [key, states] of Object.entries(html.result)) {
    if (!states.focus) continue;
    const { focus, default: rest } = states;
    const ring = focus.boxShadow !== rest.boxShadow && focus.boxShadow !== "none";
    const outline = focus.outlineStyle !== "none" && parseFloat(focus.outlineWidth) >= 2;
    if (!ring && !outline) invisible.push(key);
  }
  assert.deepEqual(invisible, []);
});

test("todas as classes publicadas aparecem nos casos de paridade", () => {
  const { classes } = JSON.parse(fs.readFileSync(path.join(cssDist, "classes.json"), "utf8"));
  const markup = htmlCases();
  // Aliases do contrato com a mesma regra de outra classe já medida.
  const aliases = new Set(["semec-error-summary__link", "semec-table__caption"]);
  const absent = classes.filter((c) => !aliases.has(c) && !new RegExp(`["\\s]${c}["\\s]`).test(markup.replaceAll("class=\"", "class=\" ")));
  assert.deepEqual(absent, []);
});

test("screenshot lado a lado dos principais (tolerância pequena)", async () => {
  const shots = cases.filter((c) => c.shot);
  assert.ok(shots.length >= 20);
  const pageReact = react.page;
  const pageHtml = html.page;
  for (const p of [pageReact, pageHtml]) {
    await p.mouse.move(0, 0);
    await p.evaluate(() => document.activeElement?.blur());
  }
  const failures = [];
  const report = [];
  for (const c of shots) {
    const target = c.shot === true ? `[data-case="${c.id}"]` : `[data-measure="${c.id}/${c.shot}"]`;
    const a = await pageReact.locator(target).screenshot({ animations: "disabled" });
    const b = await pageHtml.locator(target).screenshot({ animations: "disabled" });
    const r = await compareImages(pageHtml, a, b);
    report.push(`${c.id}: ${(r.ratio * 100).toFixed(2)}%`);
    const sameSize = Math.abs(r.sizeA[0] - r.sizeB[0]) <= 1 && Math.abs(r.sizeA[1] - r.sizeB[1]) <= 1;
    if (!sameSize || r.ratio > SCREENSHOT_TOLERANCE) {
      failures.push(`${c.id}: ${(r.ratio * 100).toFixed(2)}% diferente; React ${r.sizeA.join("×")} × CSS ${r.sizeB.join("×")}`);
      const dir = path.join(cssDist, "..", "test-results");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${c.id}-react.png`), a);
      fs.writeFileSync(path.join(dir, `${c.id}-css.png`), b);
    }
  }
  console.log(`screenshots: ${report.join(" · ")}`);
  assert.deepEqual(failures, []);
});
