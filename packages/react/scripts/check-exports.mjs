#!/usr/bin/env node
/**
 * Confere que o `exports` do pacote bloqueia import por caminho de arquivo
 * (AUD-20, 4.0): `@semec/ds/dist/...` não é contrato e não pode resolver, e os
 * subpaths públicos continuam resolvendo. Roda pelo self-reference do Node
 * (este arquivo está dentro do pacote). Requer `npm run build:ds` antes.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const blocked = [
  "@semec/ds/dist/react/index.js",
  "@semec/ds/dist/react/components/button.js",
  "@semec/ds/dist/react/lib/utils.js",
  "@semec/ds/react/button-loading",
  "@semec/ds/codemods/v4.mjs",
];
// Deriva a lista do contrato publicado, incluindo cada arquivo do wildcard.
const allowed = [];
for (const [subpath, entry] of Object.entries(pkg.exports)) {
  const target = typeof entry === "string" ? entry : entry?.import;
  if (!target?.endsWith(".js")) continue;
  assert.equal(typeof entry, "object", `${subpath}: declare as condições JS explicitamente`);
  assert.equal(Object.keys(entry).at(-1), "default", `${subpath}: default deve ser a última condição`);
  assert.equal(entry.default, entry.import, `${subpath}: default deve apontar para o mesmo ESM`);
  if (subpath.includes("*")) {
    const [prefix, suffix] = target.split("*");
    for (const file of readdirSync(new URL(`../${prefix}`, import.meta.url))) {
      if (!file.endsWith(suffix)) continue;
      const expanded = subpath.replace("*", file.slice(0, -suffix.length));
      if (pkg.exports[expanded] === null) continue;
      allowed.push(`@semec/ds${expanded.slice(1)}`);
    }
  } else {
    allowed.push(`@semec/ds${subpath.slice(1)}`);
  }
}

let failed = false;
for (const spec of blocked) {
  try {
    await import(spec);
    console.error(`check-exports: "${spec}" resolveu, mas deveria estar fechado pelo "exports".`);
    failed = true;
  } catch (err) {
    if (err?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      console.error(`check-exports: "${spec}" falhou com ${err?.code ?? err}, esperado ERR_PACKAGE_PATH_NOT_EXPORTED.`);
      failed = true;
    }
  }
}
for (const spec of allowed) {
  try {
    const esm = await import(spec);
    const cjs = require(spec);
    // Os dois caminhos devem compartilhar funções, contextos e estado.
    for (const key of Object.keys(esm)) assert.equal(cjs[key], esm[key], `${spec}: ${key}`);
  } catch (err) {
    console.error(`check-exports: "${spec}" deveria resolver: ${err?.code ?? err}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(
  `check-exports: ok (Node ${process.versions.node}; ${blocked.length} caminhos bloqueados; import() e require() dos ${allowed.length} subpaths JS compartilham os exports).`
);
