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
 * 4. Varredura estática: módulo do `dist` sem `"use client"` não pode usar
 *    hook/API só de cliente nem definir handler de evento (que quebrariam ao
 *    renderizar no servidor), e todo `"use client"` do `src` tem de chegar ao
 *    topo do arquivo correspondente no `dist` (o esbuild podia descartá-lo).
 *
 * Requer `npm run build:ds` antes. Sai com código 1 em qualquer falha.
 */
import fs from "node:fs";
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

// 4: varredura estática do dist.
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
