#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(pkgRoot, "bin/semec-ds.mjs");
const temporary = fs.mkdtempSync(path.join(pkgRoot, ".check-fonts-"));
const run = (...args) => spawnSync(process.execPath, [cli, "copiar-fontes", ...args], { cwd: temporary, encoding: "utf8" });
try {
  for (const args of [[], ["a", "b"], ["--desconhecido"], [""]]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Uso: semec-ds copiar-fontes/);
  }
  const destination = path.join(temporary, "pasta com espaços", "public");
  let result = run(path.relative(temporary, destination));
  assert.equal(result.status, 0, result.stderr);
  const source = path.join(pkgRoot, "dist/react");
  const fonts = fs.readdirSync(path.join(source, "fonts"));
  assert.equal(fonts.filter((file) => file.endsWith(".woff2")).length, 4);
  assert.ok(fonts.includes("OFL.txt"));
  for (const file of ["fonts.css", ...fonts.map((file) => `fonts/${file}`)]) {
    assert.deepEqual(fs.readFileSync(path.join(destination, file)), fs.readFileSync(path.join(source, file)));
  }
  const css = fs.readFileSync(path.join(destination, "fonts.css"), "utf8");
  for (const [, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    assert.ok(fs.existsSync(path.resolve(destination, url)), `Fonte não encontrada: ${url}`);
  }
  fs.writeFileSync(path.join(destination, "app.css"), "/* CSS do consumidor */");
  result = run(destination);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(destination, "app.css"), "utf8"), "/* CSS do consumidor */");
  fs.writeFileSync(path.join(temporary, "arquivo"), "destino inválido");
  result = run(path.join(temporary, "arquivo"));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Não foi possível copiar as fontes/);
  console.log("check-fonts: ok (argumentos, caminhos relativos/absolutos com espaços, 4 fontes + licença, repetição e erro de destino)");
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
