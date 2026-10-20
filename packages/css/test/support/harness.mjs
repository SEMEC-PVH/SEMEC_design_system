/**
 * Bancada de paridade: um servidor local com duas páginas do mesmo conteúdo.
 *   /react  componentes do kit (dist do @semec/ds) + styles.css do kit
 *   /html   HTML recomendado + dist/semec-ds.css deste pacote (sem React, sem Tailwind)
 * Ambas carregam a Poppins do kit e o mesmo CSS de bancada (só largura dos casos).
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Icons from "lucide-react";
import { build } from "esbuild";
import { cases } from "./cases.mjs";
import { interactiveCases } from "./interactive-cases.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const pkgRoot = path.resolve(here, "../..");
export const repoRoot = path.resolve(pkgRoot, "../..");
export const kitDist = path.join(repoRoot, "packages/react/dist/react");
export const cssDist = path.join(pkgRoot, "dist");

export function requireKitDist() {
  if (!fs.existsSync(path.join(kitDist, "index.js")) || !fs.existsSync(path.join(kitDist, "styles.css"))) {
    throw new Error("packages/react/dist não existe: rode `npm run build:ds` antes dos testes do @semec/ds-css.");
  }
}

/** Ícone lucide como no React (aria-hidden), para o HTML puro. */
export const icon = (name) => renderToStaticMarkup(createElement(Icons[name], { "aria-hidden": "true" }));

// Sem transição na bancada: a leitura do estado forçado não pode pegar o meio da animação.
const BENCH_CSS = `*, ::before, ::after { transition: none !important; animation: none !important; }
body { padding: 16px; }
.case { width: 640px; margin-bottom: 24px; position: relative; }
.case--narrow { width: 388px; }
.case--flex { display: flex; align-items: flex-start; }`;

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 36" width="90" height="36"><rect width="90" height="36" rx="6" fill="currentColor"/></svg>`;

function page({ title, head, body }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="stylesheet" href="/fonts.css">${head}<style>${BENCH_CSS}</style></head><body>${body}</body></html>`;
}

const caseClass = (c) => ["case", c.narrow && "case--narrow", c.flex && "case--flex"].filter(Boolean).join(" ");

export function htmlCases(list = cases) {
  return list.map((c) => `<div class="${caseClass(c)}" data-case="${c.id}">${c.html(icon)}</div>`).join("\n");
}

/**
 * Bundle React dos casos. `?caso=<id>` monta só aquele caso (os interativos abertos
 * ficam um por página: o Dialog e o menu modais tornam o resto inerte). `c.actions`
 * roda depois da montagem (clique ou tecla), para abrir o que o Radix só abre por interação.
 */
async function reactBundle(file = "cases.mjs", exportName = "cases") {
  const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import * as DS from "semec-kit";
import * as I from "lucide-react";
import { ${exportName} as all } from ${JSON.stringify(path.join(here, file).replaceAll("\\", "/"))};
const h = React.createElement;
const only = new URLSearchParams(location.search).get("caso");
const cases = only ? all.filter((c) => c.id === only) : all;
createRoot(document.getElementById("root")).render(
  h(React.Fragment, null, cases.map((c) => h("div", { key: c.id, className: ["case", c.narrow && "case--narrow", c.flex && "case--flex"].filter(Boolean).join(" "), "data-case": c.id }, c.react(h, DS, I))))
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await wait(50);
  for (const c of cases) {
    for (const a of c.actions ?? []) {
      const el = a.target.startsWith("doc:") ? document.querySelector(a.target.slice(4)) : document.querySelector('[data-case="' + c.id + '"] ' + a.target);
      if (a.click) el.click();
      if (a.key) el.dispatchEvent(new KeyboardEvent("keydown", { key: a.key, bubbles: true, cancelable: true }));
      if (a.type !== undefined) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, a.type);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      await wait(150);
    }
  }
  window.__ready = true;
})();`;
  const result = await build({
    stdin: { contents: entry, resolveDir: pkgRoot, loader: "js" },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    alias: { "semec-kit": path.join(kitDist, "index.js") },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });
  return result.outputFiles[0].text;
}

/** Sobe o servidor. `extra` mapeia rotas adicionais → { body, type }. */
export async function startServer(extra = {}) {
  requireKitDist();
  const bundle = await reactBundle();
  const bundleI = await reactBundle("interactive-cases.mjs", "interactiveCases");
  const routes = {
    "/react": { type: "text/html; charset=utf-8", body: page({ title: "Paridade · React", head: '<link rel="stylesheet" href="/styles.css">', body: '<div id="root"></div><script src="/react.js"></script>' }) },
    "/html": { type: "text/html; charset=utf-8", body: page({ title: "Paridade · CSS", head: '<link rel="stylesheet" href="/semec-ds.css">', body: `<main id="conteudo">${htmlCases()}</main>` }) },
    "/react.js": { type: "text/javascript", body: bundle },
    // Interativos abertos: um caso por página (?caso=<id>).
    "/react-i": { type: "text/html; charset=utf-8", body: page({ title: "Paridade · React (interativos)", head: '<link rel="stylesheet" href="/styles.css">', body: '<div id="root"></div><script src="/react-i.js"></script>' }) },
    "/react-i.js": { type: "text/javascript", body: bundleI },
    "/html-i": { type: "text/html; charset=utf-8", body: (url) => page({ title: "Paridade · CSS (interativos)", head: '<link rel="stylesheet" href="/semec-ds.css">', body: `<main id="conteudo">${htmlCases(interactiveCases.filter((c) => c.id === url.searchParams.get("caso")))}</main>` }) },
    "/logo.svg": { type: "image/svg+xml", body: LOGO },
    ...extra,
  };
  const files = {
    "/fonts.css": path.join(kitDist, "fonts.css"),
    "/styles.css": path.join(kitDist, "styles.css"),
    "/semec-ds.css": path.join(cssDist, "semec-ds.css"),
  };
  const server = http.createServer((req, res) => {
    const full = new URL(req.url, "http://localhost");
    const url = full.pathname;
    const route = routes[url];
    if (route) {
      res.setHeader("Content-Type", route.type);
      res.end(typeof route.body === "function" ? route.body(full) : route.body);
      return;
    }
    let file = files[url];
    if (!file && /^\/fonts\/[\w.-]+\.woff2$/.test(url)) file = path.join(kitDist, url.slice(1));
    if (file && fs.existsSync(file)) {
      res.setHeader("Content-Type", file.endsWith(".css") ? "text/css" : "font/woff2");
      res.end(fs.readFileSync(file));
      return;
    }
    res.statusCode = 404;
    res.end("404");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

export const PROPS = [
  "color", "backgroundColor",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
  "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
  "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textDecorationLine",
  "height", "minHeight", "boxShadow", "opacity",
  "outlineStyle", "outlineWidth", "outlineColor", "outlineOffset",
];

/** Abre a página, marca as partes de cada caso e devolve a medição por estado. */
export async function measure(browser, url, list = cases) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll("[data-case]").length > 0 && (!document.getElementById("root") || window.__ready));
  await page.waitForTimeout(200);
  await page.evaluate(() => document.fonts.ready);
  const isReact = /\/react(-i)?(\?|$)/.test(url);
  const keys = await page.evaluate(({ list, isReact }) => {
    const out = [];
    for (const c of list) {
      const box = document.querySelector(`[data-case="${c.id}"]`);
      if (!box) continue;
      for (const [name, reactSel, htmlSel] of c.parts) {
        // `doc:` = no documento (portal do Radix); sufixo `::backdrop` = pseudo do <dialog>.
        const raw = isReact ? reactSel : htmlSel;
        const pseudo = raw?.endsWith("::backdrop") ? "::backdrop" : null;
        const sel = pseudo ? raw.slice(0, -pseudo.length) : raw;
        const el = sel ? (sel.startsWith("doc:") ? document.querySelector(sel.slice(4)) : box.querySelector(sel)) : box.firstElementChild;
        const key = `${c.id}/${name}`;
        if (!el) { out.push({ key, missing: true }); continue; }
        // Lista: o mesmo elemento pode ser duas partes (o <dialog> e o seu ::backdrop).
        el.setAttribute("data-measure", `${el.getAttribute("data-measure") ?? ""} ${key}`.trim());
        out.push({ key, pseudo, states: c.states[name] ?? [] });
      }
    }
    return out;
  }, { list: list.map(({ id, parts, states }) => ({ id, parts, states })), isReact });

  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument", { depth: -1 });
  const read = (key, pseudo) => page.evaluate(({ key, pseudo, props }) => {
    const el = document.querySelector(`[data-measure~="${CSS.escape(key)}"]`);
    const s = getComputedStyle(el, pseudo);
    const out = {};
    for (const p of props) out[p] = s[p];
    // ::backdrop não tem caixa no DOM: vale a altura computada (fixed, inset 0).
    out.height = pseudo ? s.height : `${Math.round(el.getBoundingClientRect().height * 2) / 2}px`;
    return out;
  }, { key, pseudo, props: PROPS });

  const result = {};
  for (const { key, missing, states, pseudo } of keys) {
    if (missing) { result[key] = { missing: true }; continue; }
    result[key] = { default: await read(key, pseudo) };
    if (!states.length) continue;
    const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector: `[data-measure~="${key}"]` });
    for (const state of states) {
      const forced = state === "focus" ? ["focus", "focus-visible"] : [state];
      await client.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: forced });
      result[key][state] = await read(key, pseudo);
      await client.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
    }
  }
  return { page, result, errors };
}

/**
 * Diferenças relevantes entre duas leituras.
 * - Lado de borda com largura computada 0 nas duas leituras é invisível: estilo e cor não contam.
 * - Contorno só conta quando há outline nas duas (ou em uma) leituras.
 * - min-height `auto` (item de flex/grid) e `0px` (bloco) resolvem igual para layout.
 */
export function diff(a, b) {
  const out = [];
  for (const p of PROPS) {
    const side = p.match(/^border(Top|Right|Bottom|Left)(Style|Color)$/)?.[1];
    if (side && parseFloat(a[`border${side}Width`]) === 0 && parseFloat(b[`border${side}Width`]) === 0) continue;
    if ((p === "outlineColor" || p === "outlineWidth" || p === "outlineOffset") && a.outlineStyle === "none" && b.outlineStyle === "none") continue;
    if (p === "minHeight" && ["auto", "0px"].includes(a[p]) && ["auto", "0px"].includes(b[p])) continue;
    if (a[p] !== b[p]) out.push({ prop: p, react: a[p], html: b[p] });
  }
  return out;
}

/** Compara duas imagens PNG no navegador (canvas). Devolve a fração de pixels diferentes. */
export async function compareImages(page, pngA, pngB, threshold = 40) {
  return page.evaluate(async ({ a, b, threshold }) => {
    const load = (src) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    const draw = (img) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0); return ctx.getImageData(0, 0, w, h).data; };
    const da = draw(ia);
    const db = draw(ib);
    let different = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]), Math.abs(da[i + 3] - db[i + 3]));
      if (d > threshold) different++;
    }
    return { ratio: different / (w * h), sizeA: [ia.width, ia.height], sizeB: [ib.width, ib.height] };
  }, { a: pngA.toString("base64"), b: pngB.toString("base64"), threshold });
}
