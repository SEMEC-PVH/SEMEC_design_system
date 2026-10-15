#!/usr/bin/env node
/**
 * Teste de poda (AUD-20): mede quanto custa `import { Button } from
 * "@semec/ds/react"` num bundle de consumidor (esbuild, minificado, com
 * tree-shaking e respeitando o `sideEffects` do package.json) e falha acima do
 * limite. Antes da saída por módulo, o bundle único arrastava o kit inteiro
 * (~340 kB com as dependências); com a poda funcionando fica em ~35 kB, quase
 * tudo `tailwind-merge`.
 *
 * Mede dois cenários, ambos com `react`/`react-dom` externos (são peers):
 * - "com dependências": Radix, cva, clsx, tailwind-merge entram no bundle;
 * - "só o kit": todas as dependências externas, isola o código do @semec/ds.
 *
 * Requer `npm run build:ds` antes. Sai com código 1 se algum limite estourar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));

if (!fs.existsSync(path.join(pkgRoot, "dist", "react", "index.js"))) {
  console.error("check-treeshake: dist/react/index.js não existe. Rode `npm run build:ds` antes.");
  process.exit(1);
}

const peers = ["react", "react-dom", "react/jsx-runtime", "react-dom/client"];
const allDeps = [...peers, ...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];

const KB = 1024;
const cases = [
  { name: "Button pela raiz, com dependências", entry: `import { Button } from "@semec/ds/react";`, external: peers, limit: 60 * KB },
  { name: "Button pelo subpath, com dependências", entry: `import { Button } from "@semec/ds/react/button";`, external: peers, limit: 60 * KB },
  { name: "Button pela raiz, só o kit", entry: `import { Button } from "@semec/ds/react";`, external: allDeps, limit: 8 * KB },
];

const errors = [];
for (const c of cases) {
  const result = await esbuild.build({
    stdin: { contents: `${c.entry}\nconsole.log(Button);`, resolveDir: pkgRoot, loader: "js" },
    bundle: true,
    minify: true,
    treeShaking: true,
    format: "esm",
    platform: "browser",
    write: false,
    external: c.external,
    logLevel: "error",
  });
  const size = result.outputFiles[0].contents.byteLength;
  const line = `${c.name}: ${(size / KB).toFixed(1)} kB (limite ${(c.limit / KB).toFixed(0)} kB)`;
  if (size > c.limit) errors.push(line);
  else console.log(`check-treeshake: ${line}`);
}

if (errors.length > 0) {
  console.error("check-treeshake: bundle acima do limite (a poda por módulo regrediu?):");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("check-treeshake: ok.");
