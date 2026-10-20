/**
 * Bancada dos elementos: servidor local com
 *   /bancada        test/fixtures/bancada.html + dist/semec-elements.js (CDN)
 *   /bancada?nojs   a mesma página sem JavaScript (fallback)
 *   /bancada?esm    a mesma página importando dist/index.js + defineSemecElements()
 *   /react          os mesmos cenários com os componentes do kit React (dist do @semec/ds)
 *   /eco            devolve a query do envio do formulário (JSON)
 * O CSS é o do @semec/ds-css (dist/semec-ds.css) e a fonte a do kit.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium, firefox, webkit } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
export const pkgRoot = path.resolve(here, "../..");
export const repoRoot = path.resolve(pkgRoot, "../..");
export const dist = path.join(pkgRoot, "dist");
export const kitDist = path.join(repoRoot, "packages/react/dist/react");
export const cssDist = path.join(repoRoot, "packages/css/dist");

function requireBuilds() {
  const missing = [];
  if (!fs.existsSync(path.join(dist, "semec-elements.js"))) missing.push("packages/elements/dist (npm run build --workspace @semec/ds-elements)");
  if (!fs.existsSync(path.join(kitDist, "index.js"))) missing.push("packages/react/dist (npm run build:ds)");
  if (!fs.existsSync(path.join(cssDist, "semec-ds.css"))) missing.push("packages/css/dist (npm run build:pacotes)");
  if (missing.length) throw new Error(`Falta build: ${missing.join("; ")}`);
}

const BANCADA = fs.readFileSync(path.join(here, "../fixtures/bancada.html"), "utf8");

// Sem animação na bancada: o estado lido não pode pegar o meio da transição.
const BENCH_CSS = "<style>*, ::before, ::after { transition: none !important; animation: none !important; }</style>";

function bancada(query) {
  let script = '<script type="module" src="/semec-elements.js"></script>';
  if (query.has("nojs")) script = "";
  if (query.has("esm")) script = '<script type="module">import { defineSemecElements } from "/dist/index.js"; defineSemecElements(); defineSemecElements();</script>';
  if (query.has("duplo")) script += '<script type="module" src="/semec-elements.js?segunda-copia"></script>';
  return BANCADA.replace("<!--SCRIPT-->", `${BENCH_CSS}${script}`);
}

async function reactBundle() {
  const result = await build({
    entryPoints: [path.join(here, "react-cenarios.jsx")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    alias: { "semec-kit": path.join(kitDist, "index.js") },
    nodePaths: [path.join(repoRoot, "node_modules")],
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });
  return result.outputFiles[0].text;
}

const REACT_PAGE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cenários React</title><link rel="stylesheet" href="/fonts.css"><link rel="stylesheet" href="/styles.css">${BENCH_CSS}</head><body><main id="conteudo"><div id="root"></div></main><script src="/react.js"></script></body></html>`;

const TYPES = { ".js": "text/javascript", ".css": "text/css", ".map": "application/json", ".woff2": "font/woff2", ".html": "text/html; charset=utf-8" };

export async function startServer() {
  requireBuilds();
  const reactJs = await reactBundle();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const send = (body, type) => {
      res.setHeader("Content-Type", type);
      res.end(body);
    };
    if (url.pathname === "/bancada") return send(bancada(url.searchParams), TYPES[".html"]);
    if (url.pathname === "/react") return send(REACT_PAGE, TYPES[".html"]);
    if (url.pathname === "/react.js") return send(reactJs, TYPES[".js"]);
    if (url.pathname === "/eco") return send(JSON.stringify(Object.fromEntries(url.searchParams)), "application/json");
    let file = null;
    if (url.pathname === "/semec-elements.js") file = path.join(dist, "semec-elements.js");
    else if (url.pathname.startsWith("/dist/")) file = path.join(dist, path.basename(url.pathname));
    else if (url.pathname === "/semec-ds.css") file = path.join(cssDist, "semec-ds.css");
    else if (url.pathname === "/fonts.css") file = path.join(kitDist, "fonts.css");
    else if (url.pathname === "/styles.css") file = path.join(kitDist, "styles.css");
    else if (/^\/fonts\/[\w.-]+\.woff2$/.test(url.pathname)) file = path.join(kitDist, url.pathname.slice(1));
    if (file && fs.existsSync(file)) return send(fs.readFileSync(file), TYPES[path.extname(file)] ?? "application/octet-stream");
    res.statusCode = 404;
    res.end("404");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

/**
 * Navegadores para os testes. Chromium é obrigatório; Firefox e WebKit entram
 * quando estão instalados (como no gate). SEMEC_BROWSERS=chromium restringe.
 */
export async function availableBrowsers() {
  const wanted = (process.env.SEMEC_BROWSERS ?? "chromium,firefox,webkit").split(",").map((s) => s.trim());
  const types = { chromium, firefox, webkit };
  const out = [];
  for (const name of wanted) {
    const type = types[name];
    if (!type) continue;
    try {
      const browser = await type.launch();
      await browser.close();
      out.push(name);
    } catch (error) {
      if (name === "chromium") throw error;
      console.warn(`[ds-elements] ${name} não está instalado: pulando (${String(error.message).split("\n")[0]})`);
    }
  }
  return out;
}

export const launch = (name) => ({ chromium, firefox, webkit })[name].launch();

/** Abre uma página e espera os elementos registrados (ou o React montado). */
export async function open(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(url);
  if (url.includes("/react")) await page.waitForFunction(() => window.__ready === true);
  else if (!url.includes("nojs")) await page.waitForFunction(() => Boolean(customElements.get("semec-accordion")) && document.querySelector("#combo input[role=combobox]"));
  await page.evaluate(() => document.fonts.ready);
  return { page, errors };
}

export async function axe(page, extraRules = {}) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  return page.evaluate(async (rules) => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, rules });
    return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
  }, extraRules);
}

/** Foco atual: papel ARIA (explícito ou implícito), nome curto e id. */
export const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { role: "body", name: "", id: "" };
    const implicit = { BUTTON: "button", A: "link", INPUT: "textbox", SELECT: "combobox", DIALOG: "dialog", TEXTAREA: "textbox" };
    const role = el.getAttribute("role") ?? implicit[el.tagName] ?? el.tagName.toLowerCase();
    const name = (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
    return { role, name, id: el.id };
  });
