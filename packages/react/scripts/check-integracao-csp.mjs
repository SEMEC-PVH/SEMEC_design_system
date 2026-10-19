/** INT-A-01 / INT-B2-01/02/08: tarball, SSR e Chromium com CSP estrita. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { compile } from "tailwindcss";
import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
// Tudo fica no worktree, sem instalar nem alterar os projetos consumidores.
const work = path.join(packageRoot, ".check-dts-int0");
mkdirSync(work, { recursive: true });
const npmCli = process.env.npm_execpath ?? path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
const packed = JSON.parse(execFileSync(process.execPath, [npmCli, "pack", "--ignore-scripts", "--json", "--pack-destination", work], {
  cwd: packageRoot, encoding: "utf8",
}));
const unpack = mkdtempSync(path.join(work, "pack-"));
execFileSync("tar", ["-xf", path.join("..", packed[0].filename)], { cwd: unpack });
const packedRoot = path.join(unpack, "package");
const reactRoot = path.join(packedRoot, "dist/react");
const fixture = path.join(packageRoot, "scripts/fixtures/integracao-csp.tsx");
const aliases = {
  "@semec/ds/react/semec-provider": path.join(reactRoot, "components/semec-provider.js"),
  "@semec/ds/react": path.join(reactRoot, "index.js"),
};
await build({ entryPoints: [fixture], outfile: path.join(work, "ssr.mjs"), bundle: true,
  platform: "node", format: "esm", jsx: "automatic", alias: aliases,
  packages: "external", logLevel: "silent" });
const { App } = await import(pathToFileURL(path.join(work, "ssr.mjs")).href);
const markup = renderToString(createElement(App));
assert.ok(markup.includes('<style nonce="semec-integracao"'), "ScrollArea deve herdar o nonce no tarball/SSR");
assert.ok(markup.includes('width="75%"'), "Progress deve preencher 75% no SSR");
assert.ok(markup.includes('width="40%"'), "Slider deve preencher 40% no SSR");
assert.ok(markup.includes('aria-label="Menu principal"'));
assert.ok(readFileSync(path.join(reactRoot, "components/header.d.ts"), "utf8").includes('@default "SEMEC"'));
if (!process.argv.includes("--browser")) {
  console.log("check-integracao-csp: OK (npm pack, SSR, contexto entre subpath/barrel, nonce, preenchimentos e JSDoc). Chromium: npm run test:csp --workspace @semec/ds.");
  process.exit(0);
}
console.log("check-integracao-csp: tarball e SSR prontos");
await build({ stdin: { contents: `import { hydrate } from ${JSON.stringify(fixture)}; hydrate();`,
  resolveDir: packageRoot, loader: "tsx" }, outfile: path.join(work, "client.js"),
  bundle: true, format: "esm", jsx: "automatic", alias: aliases, logLevel: "silent",
  define: { "process.env.NODE_ENV": '"production"' } });
const tokens = readFileSync(path.join(reactRoot, "tokens.css"), "utf8");
const compiler = await compile('@import "tailwindcss";\n' + tokens, {
  base: packageRoot,
  loadStylesheet: async (id) => {
    const file = require.resolve(id === "tailwindcss" ? "tailwindcss/index.css" : id);
    return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
  },
});
const candidates = new Set(readFileSync(fixture, "utf8").split(/[\s"'`{}()]+/));
for (const file of readdirSync(path.join(reactRoot, "components"))) {
  if (file.endsWith(".js")) for (const token of readFileSync(path.join(reactRoot, "components", file), "utf8").split(/[\s"'`{}()]+/)) candidates.add(token);
}
const css = compiler.build([...candidates]);
console.log("check-integracao-csp: JS e CSS compilados");
const html = (body, stylesheet, script = "") => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Integração SEMEC</title><link rel="stylesheet" href="/${stylesheet}"></head><body>${body}${script}</body></html>`;
const server = createServer((request, response) => {
  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'nonce-semec-integracao'; style-src-attr 'none'; img-src 'self' data:");
  const url = request.url?.split("?")[0];
  if (url === "/tokens.css" || url === "/app.css") {
    response.setHeader("Content-Type", "text/css"); response.end(url === "/tokens.css" ? tokens + "\nheader { padding: 1rem; }" : css);
  } else if (url === "/client.js") {
    response.setHeader("Content-Type", "text/javascript"); response.end(readFileSync(path.join(work, "client.js")));
  } else {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(url === "/focus" ? html('<header class="bg-brand-hero"><a href="#fim">Início</a></header>', "tokens.css")
      : html(`<div id="root">${markup}</div>`, "app.css", url === "/ssr" ? "" : '<script type="module" src="/client.js"></script>'));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
console.log("check-integracao-csp: Chromium aberto");
const results = { tarball: packed[0].filename };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => window.cspViolations.push(event.effectiveDirective));
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/focus`);
  await page.keyboard.press("Tab");
  results.focus = await page.locator("a").evaluate((link) => {
    const style = getComputedStyle(link);
    const background = getComputedStyle(link.parentElement).backgroundColor;
    const luminance = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number).map((n) => {
      const c = n / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
    }).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
    const a = luminance(style.outlineColor), b = luminance(background);
    return { focused: link === document.activeElement, outline: style.outline, background,
      contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  });
  assert.equal(results.focus.focused, true);
  assert.ok(results.focus.contrast >= 3);
  await page.screenshot({ path: path.join(work, "foco-sem-tailwind.png") });
  const inspectControls = () => page.evaluate(() => ({
    hiddenInputs: [...document.querySelectorAll('button + input[aria-hidden="true"], [data-semec-slider] > input')].map((input) => {
      const s = getComputedStyle(input); return { type: input.type, opacity: s.opacity, position: s.position, pointerEvents: s.pointerEvents, display: s.display };
    }),
    progress: (() => {
      const svg = document.querySelector('[role="progressbar"] svg');
      return svg.querySelector("rect").getBoundingClientRect().width / svg.getBoundingClientRect().width;
    })(),
    sliderFill: (() => {
      const svg = document.querySelector('[data-semec-slider] svg');
      return svg.querySelector("rect").getBoundingClientRect().width / svg.getBoundingClientRect().width;
    })(),
    slider: [...document.querySelectorAll('[data-semec-slider] span')].map((span) => ({ role: span.role, width: span.getBoundingClientRect().width, left: span.getBoundingClientRect().left, position: getComputedStyle(span).position })),
  }));
  await page.goto(`${base}/ssr`);
  results.ssr = await inspectControls();
  await page.goto(base);
  await page.waitForSelector('html[data-hydrated="true"]');
  results.hydrated = await inspectControls();
  for (const state of [results.ssr, results.hydrated]) {
    assert.equal(state.hiddenInputs.length, 5);
    assert.ok(state.hiddenInputs.every((input) => input.display === "none" || (input.opacity === "0" && input.position === "absolute" && input.pointerEvents === "none")));
    assert.ok(Math.abs(state.progress - .75) < .01);
    assert.ok(Math.abs(state.sliderFill - .4) < .01);
  }
  const link = page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Destino" });
  const linkBox = await link.boundingBox();
  const viewportBox = await page.getByRole("list").boundingBox();
  assert.ok(linkBox.x + linkBox.width / 2 >= viewportBox.x && linkBox.y + linkBox.height / 2 >= viewportBox.y);
  assert.ok(linkBox.x + linkBox.width / 2 <= viewportBox.x + viewportBox.width && linkBox.y + linkBox.height / 2 <= viewportBox.y + viewportBox.height);
  assert.equal(await page.getByRole("region", { name: "Notificações (F8)" }).evaluate((element) => getComputedStyle(element).pointerEvents), "auto");
  await link.click();
  assert.equal(await page.getByText("Link acionado").count(), 1);
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("checkbox", { name: "Aceite" }).evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("Space");
  assert.equal(await page.getByRole("checkbox").getAttribute("aria-checked"), "true");
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("switch", { name: "Avisos" }).evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("Space");
  assert.equal(await page.getByRole("switch").getAttribute("aria-checked"), "true");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: "Manhã" })).toBeFocused();
  await page.keyboard.down("ArrowDown");
  await expect(page.getByRole("radio", { name: "Tarde" })).toBeFocused();
  await page.keyboard.up("ArrowDown");
  await expect(page.getByRole("radio", { name: "Tarde" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("slider", { name: "Volume" }).evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.getByRole("slider").getAttribute("aria-valuenow"), "41");
  await page.waitForFunction(() => document.querySelector('[data-semec-slider] rect').getAttribute("width") === "41%");
  assert.equal(await page.locator('[data-semec-slider] rect').getAttribute("width"), "41%");
  const sliderBox = await page.locator("[data-semec-slider]").boundingBox();
  await page.mouse.click(sliderBox.x + sliderBox.width * .75, sliderBox.y + sliderBox.height / 2);
  await page.waitForFunction(() => document.querySelector('[data-semec-slider] rect').getAttribute("width") === "75%");
  assert.equal(await page.getByRole("slider").getAttribute("aria-valuenow"), "75");
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("combobox", { name: "Escola" }).evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("Enter");
  results.nonces = await page.locator("style").evaluateAll((styles) => styles.map((style) => style.nonce));
  assert.ok(results.nonces.length >= 2 && results.nonces.every((nonce) => nonce === "semec-integracao"));
  await page.getByRole("option", { name: "Escola A" }).click();
  await page.getByRole("button", { name: "Notificar" }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  assert.equal(await page.getByText("Ação acionada").count(), 1);
  await page.getByRole("button", { name: "Fechar notificação" }).click();
  await page.getByText("Aviso de teste", { exact: true }).waitFor({ state: "hidden" });
  assert.deepEqual(errors, []);
  results.cspViolations = await page.evaluate(() => window.cspViolations);
  assert.ok(results.cspViolations.includes("style-src-attr"), "O CSP precisa estar bloqueando atributos do SSR");
  assert.ok(!results.cspViolations.includes("style-src-elem"), "Estilos com nonce não devem ser bloqueados");
  results.interactions = "clique sob ToastViewport; ação e fechamento do Toast; Checkbox; Switch; RadioGroup; teclado Slider; Select; nonce dos viewports: OK";
  await page.screenshot({ path: path.join(work, "csp.png"), fullPage: true });
  writeFileSync(path.join(work, "result.json"), JSON.stringify(results, null, 2) + "\n");
  console.log(`check-integracao-csp: OK (foco ${results.focus.contrast.toFixed(2)}:1; SSR/CSP; inputs auxiliares; Progress/Slider; clique sob Toast; nonce; teclado). Evidências: ${work}`);
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
