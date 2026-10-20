import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import {
  allTokens, camel, colorNames, dimensionNames, dist, dtcg, expectedHex, expectedPx, pkgRoot, read, snake,
} from "./esperado.mjs";

const reactRoot = path.join(pkgRoot, "..", "react");
const require = createRequire(import.meta.url);
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));

/** Gera os artefatos do @semec/ds/tokens com o próprio script do kit, se o dist dele faltar. */
function reactTokensDir() {
  const dir = path.join(reactRoot, "dist", "tokens");
  if (!fs.existsSync(path.join(dir, "tokens.json"))) {
    execFileSync(process.execPath, [path.join(reactRoot, "scripts", "build-tokens.mjs")], { stdio: "inherit" });
  }
  return dir;
}

function androidResources(file, kind) {
  const xml = read(`android/${file}`);
  const entries = [...xml.matchAll(new RegExp(`<${kind} name="([a-z0-9_]+)">([^<]+)</${kind}>`, "g"))];
  const map = new Map(entries.map(([, name, value]) => [name, value]));
  assert.equal(map.size, entries.length, `${file}: nomes duplicados`);
  const resolve = (value, trail = []) => {
    const ref = value.match(new RegExp(`^@${kind}/([a-z0-9_]+)$`));
    if (!ref) return value;
    assert.ok(map.has(ref[1]), `${file}: referência ausente ${value}`);
    assert.ok(!trail.includes(ref[1]), `${file}: referência circular ${value}`);
    return resolve(map.get(ref[1]), [...trail, ref[1]]);
  };
  return new Map([...map].map(([name, value]) => [name, resolve(value)]));
}

test("package.json segue o contrato (sem dependências, exports com default)", () => {
  assert.equal(pkg.name, "@semec/ds-tokens");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.engines.node, ">=22.12");
  assert.equal(pkg.publishConfig.access, "public");
  assert.deepEqual(pkg.sideEffects, ["**/*.css"]);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.peerDependencies, undefined);
  for (const key of ["./tokens.css", "./base.css", "./fonts.css", "./fonts/*", "./tokens.json", "./tokens",
    "./android/colors.xml", "./android/dimens.xml", "./ios/SemecTokens.swift", "./figma/tokens-studio.json"]) {
    assert.ok(pkg.exports[key]?.default, `export ${key} sem condição default`);
  }
  assert.ok(pkg.exports["./tokens"].types, "export ./tokens sem types");
});

test("tokens.json, tokens.js e tokens.d.ts são iguais byte a byte aos do @semec/ds", () => {
  const reactDir = reactTokensDir();
  for (const file of ["tokens.json", "tokens.js", "tokens.d.ts"]) {
    assert.ok(fs.readFileSync(path.join(dist, file)).equals(fs.readFileSync(path.join(reactDir, file))), `${file} diverge do @semec/ds`);
  }
});

test("tokens.css só tem o :root com todos os L0 e L1", () => {
  const css = read("tokens.css");
  const root = postcss.parse(css);
  root.walkAtRules((rule) => assert.fail(`tokens.css não pode conter @${rule.name}`));
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ""), /@theme|@utility|@property|@layer|@import/);
  const rules = root.nodes.filter((node) => node.type !== "comment");
  assert.equal(rules.length, 1);
  assert.equal(rules[0].selector, ":root");
  const declared = new Set();
  rules[0].walkDecls((decl) => {
    assert.ok(decl.prop.startsWith("--"), `tokens.css com declaração que não é variável: ${decl.prop}`);
    declared.add(decl.prop.slice(2));
  });
  assert.equal(Object.keys(dtcg.L0).length > 0 && Object.keys(dtcg.L1).length > 0, true);
  for (const name of Object.keys(allTokens)) assert.ok(declared.has(name), `tokens.css sem --${name}`);
  assert.equal(declared.size, Object.keys(allTokens).length);
  const variables = path.join(reactRoot, "dist", "react", "variables.css");
  if (fs.existsSync(variables)) assert.equal(css, fs.readFileSync(variables, "utf8"), "tokens.css ≠ @semec/ds/react/variables.css");
});

test("base.css tem reset, foco, links e reduced motion, sem tokens", () => {
  const css = read("base.css");
  assert.match(css, /@layer base/);
  assert.match(css, /box-sizing: border-box/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /a:not\(\[class\]\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  postcss.parse(css).walkDecls((decl) => {
    if (decl.prop.startsWith("--")) assert.match(decl.prop, /^--(focus-ring|radix-slider-thumb-transform)$/, `base.css redefine ${decl.prop}`);
  });
  const reactBase = path.join(reactRoot, "dist", "react", "base.css");
  if (fs.existsSync(reactBase)) assert.equal(css, fs.readFileSync(reactBase, "utf8"));
});

test("fonts.css aponta para os quatro woff2 ao lado dele", () => {
  const css = read("fonts.css");
  const urls = [...css.matchAll(/url\("\.\/fonts\/(Poppins-(\d00)\.woff2)"\)/g)];
  assert.deepEqual(urls.map((m) => m[2]), ["400", "500", "600", "700"]);
  for (const [, file] of urls) {
    assert.ok(fs.readFileSync(path.join(dist, "fonts", file)).equals(fs.readFileSync(path.join(reactRoot, "fonts", file))));
  }
  assert.ok(fs.existsSync(path.join(dist, "fonts", "OFL.txt")));
  assert.doesNotMatch(css, /@semec\/ds\/react/);
});

test("Android: mesmas cores e dimensões do JSON, com valores resolvidos", () => {
  const colors = androidResources("colors.xml", "color");
  assert.equal(colors.size, colorNames.length);
  for (const name of colorNames) assert.equal(colors.get(snake(name)), expectedHex(name), `cor ${name}`);
  const dimens = androidResources("dimens.xml", "dimen");
  assert.equal(dimens.size, dimensionNames.length);
  for (const name of dimensionNames) {
    const unit = /^(pv-)?text-/.test(name) ? "sp" : "dp";
    assert.equal(dimens.get(snake(name)), `${expectedPx(name)}${unit}`, `dimensão ${name}`);
  }
  assert.match(read("android/colors.xml"), /<color name="semec_bg">@color\/semec_pv_gray_50<\/color>/);
});

test("iOS: mesmas cores e dimensões do JSON, com valores resolvidos", () => {
  const swift = read("ios/SemecTokens.swift");
  const rgba = [...swift.matchAll(/public static let (\w+) = RGBA\(red: (\d+) \/ 255, green: (\d+) \/ 255, blue: (\d+) \/ 255, alpha: ([\d.]+)\)/g)];
  const colors = new Map(rgba.map(([, name, r, g, b, a]) => [name, { hex: `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, "0")).join("").toUpperCase()}`, alpha: Number(a) }]));
  assert.equal(colors.size, colorNames.length);
  for (const name of colorNames) {
    assert.deepEqual(colors.get(camel(name)), { hex: expectedHex(name), alpha: 1 }, `cor ${name}`);
  }
  for (const group of ["Colors", "UIColors"]) {
    const block = swift.slice(swift.indexOf(`public enum ${group} {`));
    const count = [...block.slice(0, block.indexOf("\n  }\n")).matchAll(/public static var (\w+):/g)].length;
    assert.equal(count, colorNames.length, `${group} incompleto`);
  }
  const dims = new Map([...swift.matchAll(/public static let (\w+): CGFloat = ([\d.]+)/g)].map(([, name, value]) => [name, Number(value)]));
  assert.equal(dims.size, dimensionNames.length);
  for (const name of dimensionNames) assert.equal(dims.get(camel(name)), expectedPx(name), `dimensão ${name}`);
  // Estrutura mínima para compilar: chaves balanceadas e blocos #if fechados.
  assert.equal((swift.match(/\{/g) ?? []).length, (swift.match(/\}/g) ?? []).length);
  assert.equal((swift.match(/^#if /gm) ?? []).length, (swift.match(/^#endif/gm) ?? []).length);
});

test("Android e iOS: mesma contagem e mesmos valores de cor (amostra cruzada)", () => {
  const android = androidResources("colors.xml", "color");
  const swift = read("ios/SemecTokens.swift");
  assert.ok(colorNames.length >= 10);
  for (const name of colorNames) {
    const match = swift.match(new RegExp(`public static let ${camel(name)} = RGBA\\(red: (\\d+) / 255, green: (\\d+) / 255, blue: (\\d+) / 255`));
    const hex = `#${match.slice(1, 4).map((c) => Number(c).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    assert.equal(hex, android.get(snake(name)), `Android ≠ iOS em ${name}`);
  }
});

test("Tokens Studio: L0 e L1 com referências preservadas", () => {
  const studio = JSON.parse(read("figma/tokens-studio.json"));
  assert.deepEqual(studio.$metadata.tokenSetOrder, ["L0", "L1"]);
  assert.equal(Object.keys(studio.L0).length + Object.keys(studio.L1).length, Object.keys(allTokens).length);
  let refs = 0;
  for (const layer of ["L0", "L1"]) {
    for (const [name, token] of Object.entries(dtcg[layer])) {
      const entry = studio[layer][name];
      assert.ok(entry?.type, `Tokens Studio sem ${layer}.${name}`);
      if (typeof token.$value === "string" && token.$value.startsWith("{")) {
        refs++;
        const target = token.$value.slice(1, -1).split(".");
        assert.equal(entry.value, `{${target[1]}}`, `referência perdida em ${name}`);
        assert.ok(studio[target[0]][target[1]], `referência sem alvo: ${entry.value}`);
      } else if (token.$type === "color") {
        assert.equal(entry.value, expectedHex(name));
      }
    }
  }
  assert.ok(refs > 0);
  assert.equal(studio.L1.bg.value, "{pv-gray-50}");
});

test("exports resolvem com import e require", async () => {
  const subpaths = Object.keys(pkg.exports).map((key) => key === "./fonts/*" ? "./fonts/Poppins-400.woff2" : key);
  for (const subpath of subpaths) {
    const specifier = `@semec/ds-tokens${subpath.slice(1)}`;
    const imported = fileURLToPath(import.meta.resolve(specifier));
    const required = require.resolve(specifier);
    assert.equal(imported, required, specifier);
    assert.ok(fs.existsSync(required), `${specifier} → ${required} não existe`);
  }
  const esm = await import("@semec/ds-tokens/tokens");
  const cjs = require("@semec/ds-tokens/tokens");
  assert.deepEqual(cjs.tokens, esm.tokens);
  assert.equal(esm.tokens.bg, "#f4f6f9");
  assert.equal(esm.dsTokens.values["--bg"], "#f4f6f9");
  const json = (await import("@semec/ds-tokens/tokens.json", { with: { type: "json" } })).default;
  assert.deepEqual(require("@semec/ds-tokens/tokens.json"), json);
  assert.throws(() => require.resolve("@semec/ds-tokens/scripts/build.mjs"), /ERR_PACKAGE_PATH_NOT_EXPORTED|not defined by "exports"/);
});

test("npm pack só leva dist, README, LICENSE e package.json", () => {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: pkgRoot, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(result.status, 0, result.stderr);
  const [info] = JSON.parse(result.stdout);
  const files = info.files.map((file) => file.path).sort();
  for (const file of files) {
    assert.match(file, /^(package\.json|README\.md|LICENSE|dist\/.+)$/, `arquivo inesperado no pacote: ${file}`);
  }
  for (const file of ["package.json", "README.md", "LICENSE", "dist/tokens.css", "dist/base.css", "dist/fonts.css",
    "dist/fonts/Poppins-400.woff2", "dist/fonts/OFL.txt", "dist/tokens.json", "dist/tokens.js", "dist/tokens.d.ts",
    "dist/android/colors.xml", "dist/android/dimens.xml", "dist/ios/SemecTokens.swift", "dist/figma/tokens-studio.json"]) {
    assert.ok(files.includes(file), `pacote sem ${file}`);
  }
  assert.ok(info.unpackedSize < 400_000, `pacote grande demais: ${info.unpackedSize} bytes`);
});
