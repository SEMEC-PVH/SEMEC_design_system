/**
 * Contrato do pacote (sem navegador): exports, ESM, sem dependências de
 * runtime, bundle do CDN autossuficiente, importação segura no servidor e
 * regras do repositório no código-fonte (sem cor literal nem style inline).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pkgRoot, dist } from "./support/harness.mjs";

const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));

test("package.json segue o contrato (nome, ESM, engines, público, exports, sideEffects)", () => {
  assert.equal(pkg.name, "@semec/ds-elements");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.engines.node, ">=22.12");
  assert.equal(pkg.publishConfig.access, "public");
  assert.equal(pkg.private, false);
  assert.deepEqual(Object.keys(pkg.exports).sort(), [".", "./auto", "./dist/semec-elements.js", "./package.json"].sort());
  for (const key of [".", "./auto"]) {
    assert.ok(pkg.exports[key].types && pkg.exports[key].import, `${key} com tipos e import`);
    assert.equal(pkg.exports[key].require, undefined, "sem CommonJS (ADR-027)");
  }
  assert.deepEqual(pkg.sideEffects, ["./dist/auto.js", "./dist/semec-elements.js"]);
  assert.equal(pkg.dependencies, undefined, "sem dependências de runtime");
  assert.deepEqual(pkg.files.sort(), ["LICENSE", "README.md", "dist"]);
});

test("dist: arquivos de cada export existem; o bundle do CDN não importa nada", () => {
  for (const file of ["index.js", "index.d.ts", "auto.js", "auto.d.ts", "semec-elements.js"]) {
    assert.ok(fs.existsSync(path.join(dist, file)), `dist/${file}`);
  }
  const bundle = fs.readFileSync(path.join(dist, "semec-elements.js"), "utf8");
  assert.doesNotMatch(bundle, /\bimport\s*[\w{*("']/, "um arquivo só, sem import");
  for (const tag of ["semec-dialog", "semec-tabs", "semec-combobox", "semec-menu", "semec-accordion"]) assert.match(bundle, new RegExp(tag));
  const size = Buffer.byteLength(bundle);
  assert.ok(size < 40_000, `bundle do CDN com ${size} bytes (limite 40 kB sem gzip)`);
});

test("importar no servidor (Node, sem DOM) não quebra e não registra nada", async () => {
  const mod = await import("@semec/ds-elements");
  assert.deepEqual(Object.keys(mod.semecElements), ["semec-dialog", "semec-tabs", "semec-combobox", "semec-menu", "semec-accordion"]);
  assert.doesNotThrow(() => mod.defineSemecElements());
  await import("@semec/ds-elements/auto");
});

test("código-fonte: sem cor literal, sem style inline e sem dependência externa", () => {
  const src = path.join(pkgRoot, "src");
  for (const file of fs.readdirSync(src)) {
    const text = fs.readFileSync(path.join(src, file), "utf8");
    assert.doesNotMatch(text, /#[0-9a-fA-F]{3,8}\b(?![\w-])/, `${file}: cor hex`);
    assert.doesNotMatch(text, /\brgba?\(|\bhsla?\(/, `${file}: rgba/hsl`);
    assert.doesNotMatch(text, /\.style\b|setAttribute\(\s*["']style/, `${file}: style inline`);
    for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) assert.match(m[1], /^\.\//, `${file}: import externo ${m[1]}`);
  }
});
