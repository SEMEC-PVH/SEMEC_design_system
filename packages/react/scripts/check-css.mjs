#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import postcss from "postcss";

const require = createRequire(import.meta.url);
const read = (name) => readFileSync(require.resolve(`@semec/ds/react/${name}.css`), "utf8");
const original = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
assert.equal(read("tokens"), original, "O agregador tokens.css deve continuar intacto");
const tokens = postcss.parse(original);
const variables = postcss.parse(read("variables"));
assert.equal(variables.nodes.length, 1, "variables.css deve conter somente :root");
assert.equal(variables.first.type, "rule");
assert.equal(variables.first.selector, ":root");
variables.walkAtRules((rule) => assert.fail(`variables.css não pode conter @${rule.name}`));
variables.first.each((node) => {
  assert.ok(node.type === "comment" || (node.type === "decl" && node.prop.startsWith("--")));
});
const root = tokens.nodes.find((node) => node.selector === ":root");
const declarations = (rule) => rule.nodes.filter((node) => node.type === "decl").map((node) => [node.prop, node.value]);
assert.deepEqual(declarations(variables.first), declarations(root).filter(([property]) => property.startsWith("--")));

const base = postcss.parse(read("base"));
assert.equal(base.nodes.length, 2);
for (const node of base.nodes) {
  const source = tokens.nodes.find((candidate) => candidate.type === node.type && candidate.name === node.name && candidate.params === node.params);
  if (node.name === "layer") {
    assert.equal(node.first.selector, ":root");
    assert.deepEqual(declarations(node.first), declarations(root).filter(([property]) => !property.startsWith("--")));
    node.first.remove();
  }
  assert.equal(node.toString(), source?.toString(), "base.css deve preservar as regras originais");
}
assert.match(read("base"), /:focus-visible/);
assert.match(read("base"), /prefers-reduced-motion/);
assert.match(read("base"), /a:not\(\[class\]\)/);
assert.doesNotMatch(read("base"), /@(theme|utility|property)\b/);

assert.equal(read("source"), '@source "./components/**/*.js";\n');
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
assert.equal(pkg.preferUnplugged, true, "Yarn PnP precisa extrair os arquivos para o scanner");
for (const name of ["variables", "base", "source"]) {
  assert.equal(require.resolve(`@semec/ds/lite/${name}.css`), require.resolve(`@semec/ds/react/${name}.css`));
}
console.log("check-css: ok (variáveis isoladas, base preservada, source relativo, aliases lite e preferUnplugged)");
