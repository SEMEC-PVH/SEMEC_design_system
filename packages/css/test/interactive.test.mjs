/**
 * Paridade dos interativos ABERTOS (onda 3, F1 · Playwright Chromium): Dialog,
 * AlertDialog, Tabs, Combobox, DropdownMenu e Accordion do @semec/ds-css contra
 * o React aberto do kit. Estilo computado (repouso, :hover, :focus-visible),
 * posição do painel/popup, screenshot, axe e o comportamento dos atributos de
 * estado (hidden, data-side) que o @semec/ds-elements usa.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { interactiveCases, flippedComboboxHtml } from "./support/interactive-cases.mjs";
import { startServer, measure, diff, compareImages, cssDist } from "./support/harness.mjs";

const require = createRequire(import.meta.url);

/** Divergências aceitas, com motivo. Qualquer outra diferença reprova. */
const ACCEPTED = [
  {
    match: (key, prop) => key === "combobox-sem-resultado/text" && /^border|^backgroundColor$|^boxShadow$|^height$/.test(prop),
    reason: "Sem resultado: no React o texto é um <p> dentro do popover (a moldura é do popover); aqui o .semec-combobox__empty é o próprio popup, com a moldura e o mesmo texto (cor, fonte e padding iguais).",
  },
  {
    match: (key, prop) => /\/overlay$/.test(key) && prop === "backgroundColor",
    reason: "Overlay: o Lightning CSS grava o preto a 50% como oklab(0% none none / .5) e o React tem oklab(0 0 0 / 0.5); `none` vale 0, a cor é a mesma.",
  },
  {
    match: (key, prop) => /\/(check|icon)$/.test(key) && prop === "backgroundColor",
    reason: "Ícone (check do combobox, chevron do accordion): no React é um <svg> com stroke currentColor; aqui é o mesmo lucide como máscara pintada com background-color: currentColor (mesma cor e tamanho, sem <svg> no HTML).",
  },
  {
    match: (key, prop) => /^combobox-(aberto|sem-resultado)\/popup$/.test(key) && /^padding|^height$|^color$|^font|^lineHeight$/.test(prop),
    reason: "No React o campo de busca fica dentro do popup (o padding e o texto são da <ul> ou do <p> internos); no HTML o campo é o próprio .semec-combobox__input e o popup é a <ul> (ou a mensagem sem resultado). Borda, fundo, raio, sombra e posição são iguais.",
  },
];
const SCREENSHOT_TOLERANCE = 0.01;

let srv;
let browser;
const pages = {};

before(async () => {
  srv = await startServer({
    "/html-flip": { type: "text/html; charset=utf-8", body: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Popup invertido</title><link rel="stylesheet" href="/semec-ds.css"><style>body{padding:16px}.case{width:640px;margin-top:400px}</style></head><body><main id="conteudo"><div class="case">${flippedComboboxHtml()}</div></main></body></html>` },
  });
  browser = await chromium.launch();
  for (const c of interactiveCases) {
    pages[c.id] = {
      react: await measure(browser, `${srv.base}/react-i?caso=${c.id}`, [c]),
      html: await measure(browser, `${srv.base}/html-i?caso=${c.id}`, [c]),
    };
  }
});

after(async () => {
  await browser?.close();
  await srv?.close();
});

test("as páginas montam sem erro e todas as partes existem (React aberto × HTML)", () => {
  const problems = [];
  for (const [id, { react, html }] of Object.entries(pages)) {
    problems.push(...react.errors.map((e) => `${id} React: ${e}`), ...html.errors.map((e) => `${id} HTML: ${e}`));
    for (const [key, v] of Object.entries(react.result)) if (v.missing || html.result[key]?.missing) problems.push(`${key}: parte não encontrada (${v.missing ? "React" : "HTML"})`);
  }
  assert.deepEqual(problems, []);
});

test("estilo computado igual ao React aberto (repouso, hover e foco)", () => {
  const problems = [];
  const accepted = new Set();
  let parts = 0;
  for (const { react, html } of Object.values(pages)) {
    for (const [key, states] of Object.entries(react.result)) {
      parts++;
      for (const [state, values] of Object.entries(states)) {
        for (const d of diff(values, html.result[key][state])) {
          const rule = ACCEPTED.find((a) => a.match(key, d.prop));
          if (rule) accepted.add(rule.reason);
          else problems.push(`${key} [${state}] ${d.prop}: React ${d.react} × CSS ${d.html}`);
        }
      }
    }
  }
  assert.deepEqual(problems, [], `divergências de paridade:\n${problems.join("\n")}`);
  console.log(`paridade (interativos): ${parts} partes; divergências aceitas: ${[...accepted].join(" | ") || "nenhuma"}`);
});

test("painel e popup na mesma posição do React (x, y e largura)", async () => {
  const problems = [];
  const rect = (page, sel, relative) => page.evaluate(({ sel, relative }) => {
    const el = sel.startsWith("doc:") ? document.querySelector(sel.slice(4)) : document.querySelector(`[data-case] ${sel}`);
    const r = el.getBoundingClientRect();
    const o = relative ? document.querySelector("[data-case]").getBoundingClientRect() : { x: 0, y: 0 };
    return { x: Math.round(r.x - o.x), y: Math.round(r.y - o.y), width: Math.round(r.width) };
  }, { sel, relative });
  for (const c of interactiveCases) {
    for (const g of c.geometry) {
      const a = await rect(pages[c.id].react.page, g.react, g.relative);
      const b = await rect(pages[c.id].html.page, g.html, g.relative);
      for (const k of g.keys ?? ["x", "y", "width"]) if (Math.abs(a[k] - b[k]) > 1) problems.push(`${c.id}/${g.name} ${k}: React ${a[k]} × CSS ${b[k]}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("popup abaixo do gatilho, com a largura do wrapper; data-side=\"top\" inverte", async () => {
  const page = pages["combobox-aberto"].html.page;
  const below = await page.evaluate(() => {
    const input = document.querySelector(".semec-combobox__input").getBoundingClientRect();
    const list = document.querySelector(".semec-combobox__listbox").getBoundingClientRect();
    const wrap = document.querySelector(".semec-combobox").getBoundingClientRect();
    return { gap: list.top - input.bottom, left: list.left - wrap.left, width: list.width - wrap.width, z: getComputedStyle(document.querySelector(".semec-combobox__listbox")).zIndex };
  });
  assert.deepEqual(below, { gap: 4, left: 0, width: 0, z: "50" });
  const flip = await browser.newPage();
  await flip.goto(`${srv.base}/html-flip`);
  const above = await flip.evaluate(() => {
    const input = document.querySelector(".semec-combobox__input").getBoundingClientRect();
    const list = document.querySelector(".semec-combobox__listbox").getBoundingClientRect();
    return { gap: input.top - list.bottom, left: list.left - input.left };
  });
  await flip.close();
  assert.deepEqual(above, { gap: 4, left: 0 });
  const menu = await pages["menu-aberto"].html.page.evaluate(() => {
    const btn = document.querySelector("semec-menu > button").getBoundingClientRect();
    const pop = document.querySelector(".semec-menu").getBoundingClientRect();
    return { gap: pop.top - btn.bottom, left: pop.left - btn.left, wide: pop.width >= btn.width };
  });
  assert.deepEqual(menu, { gap: 4, left: 0, wide: true });
});

test("o atributo hidden e o <dialog> fechado escondem mesmo com display da classe", async () => {
  const page = await browser.newPage();
  await page.setContent(`<link rel="stylesheet" href="${srv.base}/semec-ds.css">
    <ul class="semec-combobox__listbox"><li class="semec-combobox__option" hidden>A</li></ul>
    <div class="semec-tabs__panel" hidden>B</div><div class="semec-accordion__panel" hidden>C</div>
    <div class="semec-menu" hidden><button class="semec-menu__item">D</button></div>
    <dialog class="semec-dialog">E</dialog>`, { waitUntil: "load" });
  const shown = await page.evaluate(() => [...document.querySelectorAll("[hidden], dialog")].filter((el) => getComputedStyle(el).display !== "none").map((el) => el.className));
  await page.close();
  assert.deepEqual(shown, []);
});

test("o estado de foco é visível em todo interativo medido", () => {
  const invisible = [];
  for (const { html } of Object.values(pages)) {
    for (const [key, states] of Object.entries(html.result)) {
      if (!states.focus) continue;
      const { focus, default: rest } = states;
      const ring = focus.boxShadow !== rest.boxShadow && focus.boxShadow !== "none";
      const outline = focus.outlineStyle !== "none" && parseFloat(focus.outlineWidth) >= 2;
      if (!ring && !outline) invisible.push(key);
    }
  }
  assert.deepEqual(invisible, []);
});

test("axe-core sem violações nas páginas HTML abertas", async () => {
  const violations = [];
  for (const c of interactiveCases) {
    const page = pages[c.id].html.page;
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const found = await page.evaluate(async () => {
      // A bancada é um fragmento (sem <h1>); a página completa é coberta por a11y.test.mjs.
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, rules: { "page-has-heading-one": { enabled: false } } });
      return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    });
    violations.push(...found.map((v) => `${c.id} ${v}`));
  }
  assert.deepEqual(violations, []);
});

test("screenshot lado a lado dos abertos (tolerância pequena)", async () => {
  const failures = [];
  const report = [];
  for (const c of interactiveCases.filter((x) => x.shot)) {
    const shots = [];
    for (const side of ["react", "html"]) {
      const page = pages[c.id][side].page;
      await page.mouse.move(0, 0);
      // O popper do Radix põe o popup numa camada composta (texto em tons de cinza);
      // a mesma camada nos dois lados deixa só a diferença de CSS na comparação.
      if (c.shotLayer) await page.addStyleTag({ content: `${c.shotLayer} { will-change: transform; }` });
      const target = c.shot === true ? `[data-case="${c.id}"]` : `[data-measure~="${c.id}/${c.shot}"]`;
      shots.push(await page.locator(target).screenshot({ animations: "disabled" }));
    }
    const r = await compareImages(pages[c.id].html.page, shots[0], shots[1]);
    report.push(`${c.id}: ${(r.ratio * 100).toFixed(2)}%`);
    const sameSize = Math.abs(r.sizeA[0] - r.sizeB[0]) <= 1 && Math.abs(r.sizeA[1] - r.sizeB[1]) <= 1;
    if (!sameSize || r.ratio > SCREENSHOT_TOLERANCE) {
      failures.push(`${c.id}: ${(r.ratio * 100).toFixed(2)}% diferente; React ${r.sizeA.join("×")} × CSS ${r.sizeB.join("×")}`);
      const dir = path.join(cssDist, "..", "test-results");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${c.id}-react.png`), shots[0]);
      fs.writeFileSync(path.join(dir, `${c.id}-css.png`), shots[1]);
    }
  }
  console.log(`screenshots (interativos): ${report.join(" · ")}`);
  assert.deepEqual(failures, []);
});
