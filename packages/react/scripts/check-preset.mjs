#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import preset from "../dist/react/pv-preset.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
assert.equal(read("../pv-preset.ts"), read("../src/pv-preset.ts"), "Os dois presets TS devem ser idênticos");
const css = read("../tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
const theme = css.match(/@theme inline\s*\{([^}]+)\}/)?.[1];
assert.ok(theme, "@theme inline não encontrado");
const declarations = (text) => Object.fromEntries(
  [...text.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim().replace(/\s+/g, " ")]),
);
const values = declarations(theme);
const flatten = (object, prefix = "") => Object.fromEntries(Object.entries(object).flatMap(([key, value]) => {
  const name = key === "DEFAULT" ? prefix : [prefix, key].filter(Boolean).join("-");
  return typeof value === "object" ? Object.entries(flatten(value, name)) : [[name, value]];
}));
const keys = (object) => Object.keys(object).sort();
const fromTheme = (prefix) => Object.fromEntries(Object.entries(values)
  .filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value]));
// `initial` anula o nome no @theme (INT-A-14): não vira cor no preset.
const colors = Object.fromEntries(Object.entries(fromTheme("--color-")).filter(([, value]) => value !== "initial"));
const backgrounds = fromTheme("--semec-background-");
const animations = fromTheme("--animate-");
assert.deepEqual(flatten(preset.theme.extend.colors), colors, "Cores: paridade de chaves e valores com @theme");
assert.deepEqual(preset.theme.extend.backgroundColor, backgrounds, "Fundos: paridade com os utilitários bg-* próprios do @theme");
for (const name of Object.keys(backgrounds)) {
  assert.ok(!(name in preset.theme.extend.colors), `"${name}" só pode existir como fundo, não como cor de texto`);
}
assert.deepEqual(preset.theme.extend.animation, animations, "Animações: paridade de chaves e valores com @theme");

// Os corpos também precisam coincidir: uma chave presente com movimento
// diferente ainda seria uma regressão. Os keyframes do kit não têm aninhamento.
const frames = Object.fromEntries([...css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)]
  .map(([, name, body]) => [name, Object.fromEntries([...body.matchAll(/([\w%, -]+)\{([^{}]*)\}/g)]
    .map(([, step, rules]) => [step.trim(), declarations(rules)]))]));
assert.deepEqual(preset.theme.extend.keyframes, frames, "Keyframes: paridade com tokens.css");
assert.deepEqual(keys(frames), [...new Set(Object.values(animations).map((value) => value.split(" ")[0]))].sort());
console.log(`check-preset: ok (${keys(colors).length} cores, ${keys(backgrounds).length} fundos, ${keys(animations).length} animações e ${keys(frames).length} keyframes; fontes sincronizadas).`);
