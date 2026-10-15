#!/usr/bin/env node
/**
 * Prova a fronteira RSC do `dist` (AUD-20): importar `@semec/ds/react` num
 * Server Component (ambiente `react-server`) não quebra.
 *
 * Como funciona, sem Next nem webpack:
 *
 * 1. O esbuild empacota `import * as DS from "@semec/ds/react"` (e alguns
 *    subpaths) com a condição `react-server`, como o bundler do Next faz na
 *    camada de servidor: `react` resolve para `react.react-server.js`, que não
 *    tem `createContext`, `useState`, `useEffect` etc.
 * 2. Todo módulo cujo prólogo tem a diretiva `"use client"` (do kit ou de uma
 *    dependência, como `lucide-react`) vira um stub de "client reference":
 *    o servidor não executa o módulo, só vê referências com os mesmos nomes
 *    exportados. É a semântica que o RSC dá à diretiva.
 * 3. O resultado é importado no Node. Se algum módulo sem `"use client"`
 *    chamar uma API só de cliente no topo (ex.: `createContext`), o import
 *    quebra aqui, como quebraria no `next build`.
 * 4. Renderização real: os componentes de servidor (incluindo `Button` com
 *    `loading`, `IconButton` com `loading` e `Button asChild loading`) são
 *    renderizados com o renderer RSC do Next (`react-server-dom-webpack`,
 *    em `next/dist/compiled`), com um manifest de cliente que aceita qualquer
 *    client reference. Função passada a elemento host ou a client reference
 *    ("Event handlers cannot be passed to Client Component props") falha aqui.
 * 5. Varredura estática: módulo do `dist` sem `"use client"` não pode usar
 *    hook/API só de cliente nem definir handler de evento (que quebrariam ao
 *    renderizar no servidor), e todo `"use client"` do `src` tem de chegar ao
 *    topo do arquivo correspondente no `dist` (o esbuild podia descartá-lo).
 *
 * Requer `npm run build:ds` antes. Sai com código 1 em qualquer falha.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(pkgRoot, "dist", "react");
const srcComponents = path.join(pkgRoot, "src", "components");

const errors = [];

if (!fs.existsSync(path.join(distDir, "index.js"))) {
  console.error("check-rsc: dist/react/index.js não existe. Rode `npm run build:ds` antes.");
  process.exit(1);
}

/** Diretivas do prólogo do módulo (ignora comentários e espaços iniciais). */
function directives(source) {
  const found = [];
  let rest = source.replace(/^﻿/, "");
  for (;;) {
    rest = rest.replace(/^(?:\s+|\/\/[^\n]*\n?|\/\*[\s\S]*?\*\/)+/, "");
    const m = rest.match(/^(["'])([^"'\n]*)\1\s*;?/);
    if (!m) return found;
    found.push(m[2]);
    rest = rest.slice(m[0].length);
  }
}

const hasUseClient = (source) => directives(source).includes("use client");

/** Nomes exportados por um módulo ESM, via metafile do esbuild (sem bundle). */
async function exportNames(file) {
  const result = await esbuild.build({
    entryPoints: [file],
    bundle: false,
    write: false,
    metafile: true,
    format: "esm",
    logLevel: "silent",
    outdir: "out",
  });
  const out = Object.values(result.metafile.outputs).find((o) => o.entryPoint);
  return out ? out.exports : [];
}

const clientModules = [];

/** Troca módulos `"use client"` por client references, como a camada RSC. */
const clientReferences = {
  name: "client-references",
  setup(build) {
    build.onLoad({ filter: /\.(?:m?js|cjs)$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, "utf8");
      if (!hasUseClient(source)) return undefined;
      clientModules.push(args.path);
      const id = pathToFileURL(args.path).href;
      const names = await exportNames(args.path);
      const lines = [
        `const ref = (name) => Object.defineProperties(function () {`,
        `  throw new Error("Client reference " + ${JSON.stringify(id)} + "#" + name + " chamada no servidor.");`,
        `}, { $$typeof: { value: Symbol.for("react.client.reference") }, $$id: { value: ${JSON.stringify(id)} + "#" + name } });`,
      ];
      for (const name of names) {
        lines.push(
          name === "default" ? `export default ref("default");` : `export const ${name} = ref(${JSON.stringify(name)});`,
        );
      }
      return { contents: lines.join("\n"), loader: "js" };
    });
  },
};

// 1–3: empacotar na camada react-server e importar.
const outfile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "semec-rsc-")), "server.mjs");
await esbuild.build({
  stdin: {
    contents: [
      `export * as root from "@semec/ds/react";`,
      `export * as button from "@semec/ds/react/button";`,
      `export * as heading from "@semec/ds/react/heading";`,
      `export * as dialog from "@semec/ds/react/dialog";`,
    ].join("\n"),
    resolveDir: pkgRoot,
    loader: "js",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  conditions: ["react-server"],
  mainFields: ["module", "main"],
  outfile,
  logLevel: "error",
  plugins: [clientReferences],
});

const CLIENT_REF = Symbol.for("react.client.reference");
let server;
try {
  server = await import(pathToFileURL(outfile).href);
} catch (err) {
  errors.push(`importar @semec/ds/react na camada react-server quebrou: ${err?.stack ?? err}`);
} finally {
  fs.rmSync(path.dirname(outfile), { recursive: true, force: true });
}

if (server) {
  const root = server.root;
  const names = Object.keys(root);
  if (names.length === 0) errors.push("@semec/ds/react não exporta nada na camada react-server.");
  for (const name of names) {
    if (root[name] === undefined) errors.push(`export "${name}" é undefined na camada react-server.`);
  }
  // Apresentacional roda no servidor; interativo vira client reference.
  if (root.Heading?.$$typeof === CLIENT_REF) errors.push("Heading virou client reference; devia renderizar no servidor.");
  if (root.Dialog?.$$typeof !== CLIENT_REF) errors.push("Dialog devia ser client reference (\"use client\").");
  if (server.button.Button !== root.Button) errors.push("@semec/ds/react/button não reexporta o mesmo Button da raiz.");
  if (typeof server.button.buttonVariants !== "function" || server.button.buttonVariants.$$typeof === CLIENT_REF) {
    errors.push("buttonVariants devia ser utilizável no servidor (Button sem \"use client\").");
  }
  console.log(
    `check-rsc: ${names.length} exports de @semec/ds/react importados na camada react-server ` +
      `(${clientModules.length} módulo(s) "use client" viraram client references).`,
  );
}

// 4: renderizar de verdade com o renderer RSC (react-server-dom-webpack do Next).
let rsdwPath = null;
try {
  rsdwPath = createRequire(path.join(pkgRoot, "package.json")).resolve(
    "next/dist/compiled/react-server-dom-webpack/server.node.js",
  );
} catch {
  errors.push("renderer RSC não encontrado (next/dist/compiled/react-server-dom-webpack). Rode `npm install` na raiz.");
}

if (rsdwPath) {
  const renderDir = fs.mkdtempSync(path.join(os.tmpdir(), "semec-rsc-render-"));
  const renderFile = path.join(renderDir, "render.mjs");
  const harness = `
import * as React from "react";
import { renderToPipeableStream } from "next/dist/compiled/react-server-dom-webpack/server.node.js";
import { Writable } from "node:stream";
import * as DS from "@semec/ds/react";
import { Button as SubpathButton } from "@semec/ds/react/button";

const h = React.createElement;
// Manifest de cliente que resolve qualquer client reference (só importa o servidor).
const clientManifest = new Proxy({}, {
  get: (_t, id) => (typeof id === "string" ? { id, chunks: [], name: "*", async: false } : undefined),
});

export const cases = [
  ["Button", () => h(DS.Button, null, "Enviar")],
  ["Button loading", () => h(DS.Button, { loading: true }, "Enviar")],
  ["Button loading + loadingText", () => h(DS.Button, { loading: true, loadingText: "Enviando…", type: "submit" }, "Enviar")],
  ["Button asChild", () => h(DS.Button, { asChild: true }, h("a", { href: "/x" }, "Ir"))],
  ["Button asChild loading", () => h(DS.Button, { asChild: true, loading: true }, h("a", { href: "/x" }, "Ir"))],
  ["@semec/ds/react/button loading", () => h(SubpathButton, { loading: true }, "Enviar")],
  ["IconButton", () => h(DS.IconButton, { label: "Baixar" }, h("svg", { "aria-hidden": "true" }))],
  ["IconButton loading", () => h(DS.IconButton, { label: "Baixar", loading: true }, h("svg", { "aria-hidden": "true" }))],
  ["Spinner", () => h(DS.Spinner, { label: "Carregando" })],
  ["Spinner decorative", () => h(DS.Spinner, { decorative: true })],
  ["Heading", () => h(DS.Heading, { level: 1 }, "Título")],
  ["Badge", () => h(DS.Badge, null, "Novo")],
  ["Link", () => h(DS.Link, { href: "/a" }, "Link")],
  ["Card", () => h(DS.Card, null, h(DS.CardHeader, null, h(DS.CardTitle, null, "Cartão")), h(DS.CardContent, null, "Corpo"))],
  ["Stepper (client reference)", () => h(DS.Stepper, { steps: [{ label: "A" }, { label: "B" }], currentStep: 0 })],
];

const firstLine = (err) => String(err?.message ?? err).split(String.fromCharCode(10))[0];

export function render(element) {
  return new Promise((resolve) => {
    const errs = [];
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(errs); } };
    try {
      const stream = renderToPipeableStream(element, clientManifest, {
        onError(err) { errs.push(firstLine(err)); },
      });
      stream.pipe(new Writable({ write(_c, _e, cb) { cb(); }, final(cb) { cb(); done(); } }));
    } catch (err) {
      errs.push(firstLine(err));
      done();
    }
  });
}
`;
  try {
    await esbuild.build({
      stdin: { contents: harness, resolveDir: pkgRoot, loader: "js" },
      bundle: true,
      platform: "node",
      format: "esm",
      conditions: ["react-server"],
      mainFields: ["module", "main"],
      outfile: renderFile,
      logLevel: "error",
      define: { "process.env.NODE_ENV": '"production"' },
      // CJS do renderer usa require() de módulos do Node.
      banner: { js: 'import { createRequire as __cr } from "node:module"; const require = __cr(import.meta.url);' },
      plugins: [clientReferences],
    });
    const harnessModule = await import(pathToFileURL(renderFile).href);
    let rendered = 0;
    for (const [label, make] of harnessModule.cases) {
      const errs = await harnessModule.render(make());
      if (errs.length > 0) errors.push(`renderizar <${label}> no servidor (RSC) falhou: ${errs.join(" | ")}`);
      else rendered++;
    }
    console.log(`check-rsc: ${rendered}/${harnessModule.cases.length} caso(s) renderizados com react-server-dom-webpack.`);
  } catch (err) {
    errors.push(`renderização RSC quebrou: ${err?.stack ?? err}`);
  } finally {
    fs.rmSync(renderDir, { recursive: true, force: true });
  }
}

// 5: varredura estática do dist.
const CLIENT_ONLY_API =
  /\b(useState|useEffect|useLayoutEffect|useInsertionEffect|useReducer|useRef|useContext|createContext|useImperativeHandle|useSyncExternalStore|useTransition|useDeferredValue|useOptimistic|useActionState|useFormStatus|startTransition)\b/;
const INLINE_HANDLER = /\bon[A-Z][A-Za-z]*\s*:\s*(?:\(|async\b|function\b|[A-Za-z_$][\w$]*\s*=>)/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "fonts" ? [] : walk(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

const kitModules = [path.join(distDir, "index.js"), ...walk(path.join(distDir, "components")), ...walk(path.join(distDir, "lib"))];
let serverModules = 0;
for (const file of kitModules) {
  const source = fs.readFileSync(file, "utf8");
  if (hasUseClient(source)) continue;
  serverModules++;
  const rel = path.relative(pkgRoot, file).replace(/\\/g, "/");
  const api = source.match(CLIENT_ONLY_API);
  if (api) errors.push(`${rel} não tem "use client" mas usa ${api[1]} (só existe no cliente).`);
  const handler = source.match(INLINE_HANDLER);
  if (handler) errors.push(`${rel} não tem "use client" mas define handler de evento (${handler[0].trim()}).`);
}

for (const entry of fs.readdirSync(srcComponents)) {
  if (!entry.endsWith(".tsx")) continue;
  const src = fs.readFileSync(path.join(srcComponents, entry), "utf8");
  if (!hasUseClient(src)) continue;
  const distFile = path.join(distDir, "components", entry.replace(/\.tsx$/, ".js"));
  if (!fs.existsSync(distFile)) {
    errors.push(`dist/react/components/${path.basename(distFile)} não existe (saída por módulo).`);
  } else if (!hasUseClient(fs.readFileSync(distFile, "utf8"))) {
    errors.push(`"use client" de src/components/${entry} não chegou ao topo de dist/react/components/${path.basename(distFile)}.`);
  }
}

if (errors.length > 0) {
  console.error("check-rsc: falhou:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`check-rsc: ok (${serverModules} módulo(s) do kit renderizáveis no servidor, sem API só de cliente).`);
