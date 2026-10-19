/** Paridade dos exports publicados, independente do parser usado no build. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { tokens, dsTokens as dataTokens } from "@semec/ds/tokens";
import { dsTokens } from "@semec/ds/lite/skills";
import dtcg from "@semec/ds/tokens.json" with { type: "json" };

const css = fs.readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
const root = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/:root\s*\{([^}]+)\}/)[1];
const declarations = Object.fromEntries([...root.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]));
const all = { ...dtcg.L0, ...dtcg.L1 };
assert.deepEqual(Object.keys(all).sort(), Object.keys(declarations).sort());
assert.deepEqual(Object.keys(tokens).sort(), Object.keys(declarations).sort());
assert.deepEqual(dsTokens, dataTokens);
const l1 = Object.keys(declarations).filter((key) => !key.startsWith("pv-") || /^pv-(text|leading|radius|duration)-/.test(key));
assert.deepEqual(dsTokens.semantic.slice().sort(), l1.map((key) => `--${key}`).sort());
assert.deepEqual(Object.keys(dtcg.L1).sort(), l1.sort());
assert.deepEqual(Object.keys(dsTokens.values).sort(), Object.keys(declarations).map((key) => `--${key}`).sort());

const resolveCss = (value) => value.replace(/var\(--([\w-]+)\)/g, (_, key) => resolveCss(declarations[key]));
const dimension = (value) => {
  assert.equal(typeof value.value, "number");
  assert.ok(["px", "rem"].includes(value.unit));
};
const color = (value) => {
  assert.equal(value.colorSpace, "srgb");
  assert.equal(value.components.length, 3);
  assert.ok(value.components.every((c) => c >= 0 && c <= 1));
  assert.ok(value.alpha >= 0 && value.alpha <= 1);
};
function resolveToken(token) {
  if (typeof token.$value !== "string") return token.$value;
  const [, group, name] = token.$value.match(/^\{(L[01])\.([^}]+)\}$/) ?? [];
  assert.ok(dtcg[group]?.[name], `Alias inválido: ${token.$value}`);
  assert.equal(token.$type, dtcg[group][name].$type);
  return resolveToken(dtcg[group][name]);
}
for (const [name, raw] of Object.entries(declarations)) {
  const token = all[name];
  const resolved = resolveCss(raw);
  assert.equal(tokens[name], resolved);
  assert.equal(dsTokens.values[`--${name}`], resolved);
  assert.equal(token.$extensions["br.gov.portovelho.semec"].resolved, resolved);
  assert.equal(token.$extensions["br.gov.portovelho.semec"].css, raw);
  const value = resolveToken(token);
  switch (token.$type) {
    case "color": color(value); break;
    case "dimension": dimension(value); break;
    case "duration": assert.ok(["ms", "s"].includes(value.unit)); assert.equal(typeof value.value, "number"); break;
    case "number": case "fontWeight": assert.equal(typeof value, "number"); break;
    case "fontFamily": assert.ok(value.every((family) => typeof family === "string")); break;
    case "cubicBezier": assert.equal(value.length, 4); assert.ok(value.every(Number.isFinite)); break;
    case "shadow": color(value.color); ["offsetX", "offsetY", "blur", "spread"].forEach((key) => dimension(value[key])); break;
    default: assert.fail(`Tipo inválido: ${name} (${token.$type})`);
  }
}
assert.equal(dtcg.L1["action-primary"].$value, "{L0.pv-blue-600}");
assert.equal(dtcg.L1["text-muted"].$type, "color");
assert.equal(dtcg.L1["space-0"].$type, "dimension");
assert.equal(dtcg.L1["elevation-2"].$value.blur.value, 12);
console.log(`check-tokens: ${Object.keys(all).length} tokens e ${l1.length} L1 com paridade CSS/JSON/JS/lite; tipos e referências DTCG válidos.`);
