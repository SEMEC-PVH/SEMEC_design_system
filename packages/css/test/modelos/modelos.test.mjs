/**
 * Modelos de servidor do @semec/ds-css (issue #82, ADR-030).
 *
 * Renderiza cada caso de fixtures.json nas 4 linguagens (PHP puro, Jinja2,
 * Twig e Blade; Jinja e Twig também com o autoescape do ambiente desligado) e
 * confere:
 *   1. equivalência: cada saída, normalizada, é igual ao HTML canônico único
 *      (canonico/<caso>.html);
 *   2. classes: toda classe usada existe no dist/classes.json;
 *   3. XSS: <script>, aspas e atributos on* dos dados saem escapados;
 *   4. axe-core: zero violações no Chromium com o dist/semec-ds.css;
 *   5. parâmetros: a tabela do templates/README.md bate com as 4 linguagens;
 *   6. pagina com o bundle real do @semec/ds-elements: os elementos registram,
 *      sobem dentro do layout e o axe continua zero (fechados e abertos).
 *
 * Rode com `npm run test:modelos` (raiz) depois de `npm run build:pacotes`.
 * Motores: binários locais (php 8.2+, composer, python 3) ou Docker
 * (veja motores.mjs).
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { renderizarTodos } from "./motores.mjs";
import { normalizar, parse } from "./normalizar.mjs";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const cssRoot = path.resolve(here, "../..");
const repoRoot = path.resolve(cssRoot, "../..");
const templatesDir = path.join(cssRoot, "templates");
const cssDist = path.join(cssRoot, "dist");
const tokensDist = path.join(repoRoot, "packages/tokens/dist");

const casos = JSON.parse(fs.readFileSync(path.join(here, "fixtures.json"), "utf8"));
const canonico = (id) => fs.readFileSync(path.join(here, "canonico", `${id}.html`), "utf8");
const LINGUAGENS = ["php", "jinja", "twig", "blade"];
const PARCIAIS = ["alerta", "botao", "cabecalho", "campo", "pagina", "pular-para-o-conteudo", "resumo-de-erros", "rodape"];
const ARQUIVO = {
  php: (p) => `php/${p}.php`,
  jinja: (p) => `jinja/${p}.jinja`,
  twig: (p) => `twig/${p}.html.twig`,
  blade: (p) => `blade/${p}.blade.php`,
};

let saidas;

before(() => {
  for (const f of ["semec-ds.css", "classes.json"]) {
    if (!fs.existsSync(path.join(cssDist, f))) throw new Error(`dist/${f} não existe: rode \`npm run build:pacotes\` antes.`);
  }
  const r = renderizarTodos(casos);
  saidas = r.saidas;
  console.log(`# motores: ${Object.entries(r.motores).map(([k, v]) => `${k} = ${v}`).join("; ")}`);
});

test("as 4 linguagens têm as mesmas parciais", () => {
  for (const lang of LINGUAGENS) {
    for (const p of PARCIAIS) assert.ok(fs.existsSync(path.join(templatesDir, ARQUIVO[lang](p))), `${ARQUIVO[lang](p)} existe`);
  }
  assert.ok(fs.existsSync(path.join(templatesDir, "php/semec.php")));
  const casosPorParcial = new Set(casos.map((c) => c.parcial));
  for (const p of PARCIAIS) assert.ok(casosPorParcial.has(p), `há caso de teste para ${p}`);
});

test("cada saída (6 variantes × 4 linguagens) é equivalente ao HTML canônico", () => {
  const variantes = Object.keys(saidas);
  assert.deepEqual(variantes.sort(), ["blade", "jinja", "jinja-sem-autoescape", "php", "twig", "twig-sem-autoescape"]);
  const falhas = [];
  for (const c of casos) {
    const esperado = normalizar(canonico(c.id));
    for (const v of variantes) {
      const obtido = normalizar(saidas[v][c.id] ?? "");
      if (obtido !== esperado) falhas.push(`${c.id} [${v}]\n--- obtido\n${obtido}\n--- canônico\n${esperado}`);
    }
  }
  assert.equal(falhas.length, 0, `saídas diferentes do canônico:\n\n${falhas.join("\n\n")}`);
});

test("toda classe usada existe no classes.json", () => {
  const { classes } = JSON.parse(fs.readFileSync(path.join(cssDist, "classes.json"), "utf8"));
  const conhecidas = new Set(classes);
  const usadas = new Set();
  const htmls = [...casos.map((c) => canonico(c.id)), ...Object.values(saidas).flatMap((o) => Object.values(o))];
  for (const html of htmls) {
    for (const el of parse(html).querySelectorAll("[class]")) for (const c of el.getAttribute("class").split(/\s+/).filter(Boolean)) usadas.add(c);
  }
  const fora = [...usadas].filter((c) => !conhecidas.has(c));
  assert.deepEqual(fora, [], `classes fora do contrato: ${fora.join(", ")}`);
  assert.ok(usadas.size >= 30, `cobertura de classes: ${usadas.size}`);
});

test("XSS: dados com <script>, aspas e on* saem escapados em todas as variantes", () => {
  const xss = casos.filter((c) => c.xss);
  assert.ok(xss.length >= 8, "casos de XSS para as parciais");
  assert.deepEqual(new Set(xss.map((c) => c.parcial)), new Set(PARCIAIS.filter((p) => p !== "pular-para-o-conteudo")));
  const falhas = [];
  for (const c of xss) {
    for (const [v, porCaso] of Object.entries(saidas)) {
      const html = porCaso[c.id];
      const onde = `${c.id} [${v}]`;
      if (/<script>alert|<img src=x|<b>|<i>|<option>falsa/i.test(html)) falhas.push(`${onde}: marcação dos dados saiu crua`);
      const raiz = parse(html);
      for (const el of raiz.querySelectorAll("*")) {
        for (const a of el.attributes) if (/^on/i.test(a.name)) falhas.push(`${onde}: atributo ${a.name} em <${el.localName}>`);
        if (el.hasAttribute("autofocus") && !el.matches(".semec-error-summary")) falhas.push(`${onde}: autofocus injetado em <${el.localName}>`);
      }
      for (const s of raiz.querySelectorAll("script")) {
        if (c.zona !== "documento" || !s.getAttribute("src") || s.textContent !== "") falhas.push(`${onde}: <script> inesperado`);
      }
      const imgs = [...raiz.querySelectorAll("img")].filter((i) => !i.matches(".semec-header__brand > img"));
      if (imgs.length) falhas.push(`${onde}: <img> injetado`);
      const classes = [...raiz.querySelectorAll("[class]")].flatMap((el) => el.getAttribute("class").split(/\s+/));
      if (classes.some((k) => !/^semec-[a-z0-9_-]+$/.test(k) || k === "semec-btn--danger")) falhas.push(`${onde}: classe injetada`);
    }
  }
  assert.deepEqual(falhas, []);
});

test("parâmetros: a tabela do templates/README.md bate com as 4 linguagens", () => {
  const readme = fs.readFileSync(path.join(templatesDir, "README.md"), "utf8");
  const tabela = {};
  for (const [, parcial, param] of readme.matchAll(/^\| `([a-z-]+)` \| `([a-z_]+)` \|/gm)) (tabela[parcial] ??= new Set()).add(param);
  assert.deepEqual(Object.keys(tabela).sort(), [...PARCIAIS].sort(), "uma linha por parâmetro de cada parcial");

  const falhas = [];
  for (const p of PARCIAIS) {
    const doc = tabela[p];
    if (p !== "pagina") {
      // Jinja: a assinatura da macro é a lista exata de parâmetros.
      const fonte = fs.readFileSync(path.join(templatesDir, ARQUIVO.jinja(p)), "utf8");
      const assinatura = fonte.match(new RegExp(`macro ${p.replaceAll("-", "_")}\\(([^)]*)\\)`))?.[1] ?? "";
      const params = new Set(assinatura.split(",").map((s) => s.split("=")[0].trim()).filter(Boolean));
      if ([...params].sort().join() !== [...doc].sort().join()) falhas.push(`${p}: macro Jinja (${[...params]}) ≠ README (${[...doc]})`);
    }
    for (const lang of ["php", "twig", "blade", "jinja"]) {
      const fonte = fs.readFileSync(path.join(templatesDir, ARQUIVO[lang](p)), "utf8");
      for (const param of doc) {
        const usa = {
          php: new RegExp(`'${param}'`),
          blade: new RegExp(`\\$${param}\\b|'${param}'`),
          twig: new RegExp(`\\b${param}\\b`),
          jinja: new RegExp(`\\b${param}\\b`),
        }[lang];
        if (!usa.test(fonte)) falhas.push(`${p}: ${lang} não usa o parâmetro ${param}`);
      }
    }
  }
  assert.deepEqual(falhas, []);
});

// --- axe-core no Chromium --------------------------------------------------

const BASE = "http://modelos.semec.test";
const H1 = '<h1 class="semec-heading semec-heading--1">Teste dos modelos</h1>';
const MAIN = (conteudo = "") => `<main id="conteudo" tabindex="-1">${H1}${conteudo}</main>`;
const ZONA = {
  topo: (f) => f + MAIN(),
  banner: (f) => f + MAIN(),
  main: (f) => MAIN(f),
  contentinfo: (f) => MAIN() + f,
};
const envolver = (corpo) =>
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Teste dos modelos</title><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/semec-ds.css"></head><body>${corpo}</body></html>`;

let browser;
after(async () => {
  await browser?.close();
});

function arquivoEstatico(pathname) {
  const fonts = pathname.match(/^\/css\/fonts\/([\w.-]+)$/);
  if (pathname === "/css/semec-ds.css") return { body: fs.readFileSync(path.join(cssDist, "semec-ds.css")), contentType: "text/css" };
  if (pathname === "/css/fonts.css") return { body: fs.readFileSync(path.join(tokensDist, "fonts.css")), contentType: "text/css" };
  if (fonts) return { body: fs.readFileSync(path.join(tokensDist, "fonts", fonts[1])), contentType: "font/woff2" };
  if (pathname === "/img/marca.svg") return { body: fs.readFileSync(path.join(cssRoot, "examples/marca.svg")), contentType: "image/svg+xml" };
  if (pathname === "/js/semec-elements.js") {
    // O bundle do @semec/ds-elements (F2), quando existir no monorepo; senão, um módulo vazio.
    const bundle = path.join(repoRoot, "packages/elements/dist/semec-elements.js");
    return { body: fs.existsSync(bundle) ? fs.readFileSync(bundle) : "export {};", contentType: "text/javascript" };
  }
  return null;
}

test("axe-core: zero violações em cada parcial renderizada, nas 4 linguagens", async () => {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let atual = "";
  const erros = [];
  page.on("pageerror", (e) => erros.push(String(e)));
  await page.route(`${BASE}/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/teste") return route.fulfill({ body: atual, contentType: "text/html; charset=utf-8" });
    const f = arquivoEstatico(pathname);
    return f ? route.fulfill(f) : route.fulfill({ status: 404, body: "" });
  });
  page.on("response", (r) => { if (r.status() >= 400) erros.push(`${r.status()} ${r.url()}`); });

  const falhas = [];
  let auditadas = 0;
  for (const c of casos.filter((k) => !k.xss)) {
    for (const lang of LINGUAGENS) {
      const html = saidas[lang][c.id];
      if (html.trim() === "") continue; // resumo sem erros: nada a auditar
      atual = c.zona === "documento" ? html : envolver(ZONA[c.zona](html));
      erros.length = 0;
      await page.goto(`${BASE}/teste`);
      await page.evaluate(() => document.fonts.ready);
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const violacoes = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
        return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      });
      auditadas++;
      if (violacoes.length || erros.length) falhas.push(`${c.id} [${lang}]: ${[...violacoes, ...erros].join(" | ")}`);
    }
  }
  assert.ok(auditadas >= 90, `páginas auditadas: ${auditadas}`);
  assert.deepEqual(falhas, []);
});

// --- pagina + bundle real do @semec/ds-elements ------------------------------
// O layout `pagina` carrega /js/semec-elements.js. Com o bundle do monorepo
// (packages/elements/dist), os elementos têm de registrar e subir dentro do
// <main> do layout, e o axe continua zero com eles fechados e abertos.
const bundleElements = path.join(repoRoot, "packages/elements/dist/semec-elements.js");
const bancada = path.join(repoRoot, "packages/elements/test/fixtures/bancada.html");

test("pagina com o bundle real do @semec/ds-elements: registra, sobe e axe zero (fechado e aberto)", { skip: !fs.existsSync(bundleElements) && "sem packages/elements/dist (npm run build:pacotes)" }, async () => {
  const fonte = fs.readFileSync(bancada, "utf8");
  const ini = fonte.indexOf('<section aria-labelledby="t-dialogo">');
  const fim = fonte.lastIndexOf("</section>") + "</section>".length;
  assert.ok(ini > 0 && fim > ini, "seções da bancada do ds-elements encontradas");
  const interativos = fonte.slice(ini, fim);

  const b = await chromium.launch();
  try {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    let atual = "";
    const erros = [];
    page.on("pageerror", (e) => erros.push(String(e)));
    page.on("response", (r) => { if (r.status() >= 400) erros.push(`${r.status()} ${r.url()}`); });
    await page.route(`${BASE}/**`, (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname === "/teste") return route.fulfill({ body: atual, contentType: "text/html; charset=utf-8" });
      const f = arquivoEstatico(pathname);
      return f ? route.fulfill(f) : route.fulfill({ status: 404, body: "" });
    });
    const axe = async () => {
      // Medir no fim da animação de entrada (fade/zoom do kit): no meio dela a
      // opacidade parcial derruba o contraste e o axe acusa um estado transitório.
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      return page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
        return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      });
    };

    const falhas = [];
    for (const lang of LINGUAGENS) {
      const html = saidas[lang].pagina;
      assert.match(html, /<script type="module" src="\/js\/semec-elements\.js"><\/script>/, `${lang}: pagina carrega o bundle`);
      atual = html;
      erros.length = 0;
      await page.goto(`${BASE}/teste`);
      await page.evaluate(() => document.fonts.ready);
      const definidos = await page.evaluate(async () => {
        const nomes = ["semec-dialog", "semec-tabs", "semec-combobox", "semec-menu", "semec-accordion"];
        await Promise.race([Promise.all(nomes.map((n) => customElements.whenDefined(n))), new Promise((r) => setTimeout(r, 5000))]);
        return nomes.filter((n) => customElements.get(n));
      });
      assert.equal(definidos.length, 5, `${lang}: elementos registrados pelo bundle (${definidos.join(", ")})`);
      await page.evaluate((h) => document.getElementById("conteudo").insertAdjacentHTML("beforeend", h), interativos);
      // Subiram: o combobox criou o campo, as abas o tablist, o menu o role=menu.
      await page.waitForSelector("#combo input[role=combobox]");
      await page.waitForSelector("#abas [role=tablist]");
      await page.waitForSelector("#menu [role=menu]", { state: "attached" });

      const cenarios = [
        ["fechado", async () => {}],
        ["diálogo aberto", async () => { await page.click("#abrir-dialogo"); await page.waitForSelector("#dialogo dialog[open]"); }],
        ["alerta aberto", async () => { await page.keyboard.press("Escape"); await page.click("#abrir-alerta"); await page.waitForSelector("#excluir dialog[open]"); }],
        ["menu aberto", async () => { await page.keyboard.press("Escape"); await page.click("#menu-gatilho"); await page.waitForSelector("#menu [role=menu]:not([hidden])"); }],
        ["listbox aberto", async () => { await page.keyboard.press("Escape"); await page.click("#combo input[role=combobox]"); await page.keyboard.press("ArrowDown"); await page.waitForSelector("#combo [role=listbox]:not([hidden])"); }],
        ["aba 2 e item aberto", async () => { await page.keyboard.press("Escape"); await page.click("#aba-2"); await page.click("#ac-2"); await page.waitForSelector("#ac-painel-2:not([hidden])"); }],
      ];
      for (const [nome, passo] of cenarios) {
        await passo();
        const v = await axe();
        if (v.length || erros.length) falhas.push(`${lang} · ${nome}: ${[...v, ...erros].join(" | ")}`);
      }
    }
    assert.deepEqual(falhas, []);
  } finally {
    await b.close();
  }
});
