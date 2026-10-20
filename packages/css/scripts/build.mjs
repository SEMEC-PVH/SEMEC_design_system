#!/usr/bin/env node
/**
 * Build do @semec/ds-css (ADR-028).
 *
 *   dist/components.css  só as classes `.semec-*` (var(--…) dos tokens; sem tokens nem reset global)
 *   dist/index.css       @import dos tokens + base do @semec/ds-tokens + components.css
 *   dist/semec-ds.css    arquivo único (tokens + base + components), minificado, para <link>/CDN
 *
 * As classes vêm do TSX/CVA do kit (scripts/rules.mjs) e são compiladas pelo
 * Tailwind v4 com os tokens do kit como referência: o CSS final é CSS padrão,
 * achatado (sem nesting) para os alvos do Tailwind (Chrome 111, Safari 16.4, Firefox 128).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { compile, optimize } from "@tailwindcss/node";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Icons from "lucide-react";
import { buildRules, semecClasses, kitRootFrom, ICON_MASKS } from "./rules.mjs";
import { buildCss as buildKitCss } from "../../react/scripts/build-css.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const kitRoot = kitRootFrom(here);
const require = createRequire(import.meta.url);
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
const outDir = path.join(pkgRoot, "dist");
const slash = (p) => p.replaceAll("\\", "/");
/** Elementos que usam alguma classe do pacote (especificidade zero). */
const SCOPE = ':where([class*="semec-"])';

/** Ícone do kit (lucide) como máscara: a cor vem de currentColor, nunca de um valor fixo. */
function maskUrl(Icon, props = {}) {
  const svg = renderToStaticMarkup(createElement(Icon, { xmlns: "http://www.w3.org/2000/svg", ...props }));
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replaceAll("'", "%27").replaceAll("(", "%28").replaceAll(")", "%29")}")`;
}

/**
 * Preflight do Tailwind (o mesmo que o React recebe em styles.css), mas só
 * para elementos com classe `.semec-*` e com especificidade zero (:where).
 * Assim um <button class="semec-btn"> herda a fonte como no React, sem
 * resetar o restante da página do consumidor. Regras de html/:host saem.
 */
function scopedPreflight() {
  const scope = SCOPE;
  const root = postcss.parse(fs.readFileSync(require.resolve("tailwindcss/preflight.css"), "utf8"));
  root.walkComments((c) => c.remove());
  root.walkRules((rule) => {
    const selectors = rule.selectors.filter((s) => !/^(html|:host)\b/.test(s.trim())).map((s) => {
      const trimmed = s.trim();
      const pseudo = trimmed.match(/(::[\w-]+(\([^)]*\))?)$/);
      const compound = pseudo ? trimmed.slice(0, -pseudo[0].length) : trimmed;
      const head = compound === "*" || compound === "" ? scope : `${compound}${scope}`;
      return `${head}${pseudo ? pseudo[0] : ""}`;
    });
    if (!selectors.length) rule.remove();
    else rule.selectors = selectors;
  });
  return root.toString();
}

/** Tokens/base: o @semec/ds-tokens quando existe; senão, derivados do tokens.css do kit (mesma função do build do kit). */
function resolveTokens() {
  try {
    return { source: "@semec/ds-tokens", tokens: require.resolve("@semec/ds-tokens/tokens.css"), base: require.resolve("@semec/ds-tokens/base.css") };
  } catch {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "semec-ds-css-"));
    buildKitCss(kitRoot, tmp);
    return { source: "packages/react/tokens.css (variables.css/base.css do kit)", tokens: path.join(tmp, "variables.css"), base: path.join(tmp, "base.css") };
  }
}

export async function build() {
  const rules = buildRules(kitRoot);
  const classes = semecClasses(rules);
  const applied = rules.filter(({ classes: list }) => list.length).map(({ selector, classes: list }) => `${selector} {\n  @apply ${list.join(" ")};\n}`).join("\n");
  // Indicadores dos controles nativos: o desenho é o ícone lucide que o React usa.
  const indicators = `
.semec-checkbox::before, .semec-radio::before {
  content: "";
  background-color: currentColor;
  visibility: hidden;
}
.semec-checkbox::before { mask: ${maskUrl(Icons.Check)} center / contain no-repeat; }
.semec-radio::before { mask: ${maskUrl(Icons.Circle, { fill: "currentColor" })} center / contain no-repeat; }
.semec-checkbox:checked::before, .semec-radio:checked::before { visibility: visible; }
@media (forced-colors: active) {
  .semec-checkbox::before, .semec-radio::before { background-color: CanvasText; }
}`;
  // Ícones das partes interativas (X do fechar, chevron do accordion, check da opção):
  // o mesmo lucide do React, como máscara pintada com currentColor.
  const iconMasks = ICON_MASKS.map(({ selector, icon, pseudo }) => `
${selector} {${pseudo ? '\n  content: "";' : ""}
  background-color: currentColor;
  mask: ${maskUrl(Icons[icon])} center / contain no-repeat;
}`).join("") + `
@media (forced-colors: active) {
  ${ICON_MASKS.map(({ selector }) => selector).join(", ")} { background-color: CanvasText; }
}`;
  const input = [
    '@import "tailwindcss/theme.css" theme(inline);',
    '@import "tailwindcss/utilities.css";',
    `@import "${slash(path.join(kitRoot, "tokens.css"))}" reference;`,
    `@layer base {\n${scopedPreflight()}\n}`,
    applied,
    indicators,
    iconMasks,
  ].join("\n");
  const compiler = await compile(input, { base: kitRoot, onDependency() {} });
  let css = compiler.build([]);
  css = optimize(css, { minify: false }).code;
  // O fallback de @property do Tailwind (Safari/Firefox antigos) também fica escopado.
  const scope = SCOPE;
  const scoped = postcss.parse(css);
  // Variáveis de tema que o Tailwind não inline (ex.: `--spacing` dos @utility
  // slide-in-from-* do tokens.css): o valor compilado entra no lugar do var()
  // e o `:root, :host` sai (o contrato não declara tokens).
  const themeVars = new Map();
  scoped.walkRules((rule) => {
    if (rule.parent?.type !== "root" || !rule.selectors.every((s) => s === ":root" || s === ":host")) return;
    rule.walkDecls((d) => { if (d.prop.startsWith("--") && !d.prop.startsWith("--tw-")) themeVars.set(d.prop, d.value); });
    if (rule.nodes.every((n) => n.type === "decl" && themeVars.has(n.prop))) rule.remove();
  });
  if (themeVars.size) scoped.walkDecls((d) => {
    d.value = d.value.replace(/var\((--[\w-]+)\)/g, (m, name) => themeVars.get(name) ?? m);
  });
  scoped.walkRules((rule) => {
    if (rule.selectors.every((s) => /^(\*|::?(before|after|backdrop))$/.test(s))) {
      rule.selectors = rule.selectors.map((s) => (s === "*" ? scope : `${scope}${s}`));
    }
  });
  // Padrões internos do Tailwind sem cor literal: transparente e o branco do token
  // (no initial-value do @property não cabe var(): lá fica a palavra-chave).
  scoped.walkDecls((d) => {
    const inProperty = d.parent?.type === "atrule" && d.parent.name === "property";
    d.value = d.value.replace(/#0000(?![0-9a-f])/gi, "transparent").replace(/#fff(?![0-9a-f])/gi, inProperty ? "white" : "var(--pv-white)");
  });
  // @keyframes usados pelas animações (enter/exit do Dialog, do menu e do popup):
  // o tokens.css do kit entra como `reference`, então vêm de lá, copiados pelo nome.
  const kitKeyframes = new Map();
  postcss.parse(fs.readFileSync(path.join(kitRoot, "tokens.css"), "utf8")).walkAtRules("keyframes", (at) => { kitKeyframes.set(at.params, at); });
  const usedAnimations = new Set();
  scoped.walkDecls(/^animation(-name)?$/, (d) => { const name = d.value.trim().split(/\s+/)[0]; if (kitKeyframes.has(name)) usedAnimations.add(name); });
  for (const name of [...usedAnimations].sort()) scoped.append(kitKeyframes.get(name).clone());
  css = scoped.toString();

  // Sanidade do contrato: só .semec-*, nada de token, @theme/@apply ou :root.
  const parsed = postcss.parse(css);
  const problems = [];
  parsed.walkAtRules((at) => {
    if (["apply", "theme", "utility", "tailwind", "source", "import"].includes(at.name)) problems.push(`@${at.name}`);
  });
  parsed.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && rule.parent.name === "keyframes") return;
    for (const s of rule.selectors) if (!s.includes("semec-")) problems.push(s);
  });
  parsed.walkDecls((d) => {
    if (d.prop.startsWith("--") && !d.prop.startsWith("--tw-")) problems.push(`${d.prop} (token declarado)`);
  });
  if (problems.length) throw new Error(`components.css fora do contrato:\n  ${[...new Set(problems)].join("\n  ")}`);

  const banner = `/*! ${pkg.name} v${pkg.version} | MIT | gerado de packages/react/src/components (não edite) */\n`;
  const components = banner + css.replace(/^\/\*![^*]*\*\/\n?/, "");
  const tokens = resolveTokens();
  const single = [fs.readFileSync(tokens.tokens, "utf8"), fs.readFileSync(tokens.base, "utf8"), components].join("\n");
  const bundled = banner + optimize(single, { minify: true }).code.replace(/^\/\*![^*]*\*\//, "");

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "components.css"), components);
  fs.writeFileSync(path.join(outDir, "index.css"), '@import "@semec/ds-tokens/tokens.css";\n@import "@semec/ds-tokens/base.css";\n@import "./components.css";\n');
  fs.writeFileSync(path.join(outDir, "semec-ds.css"), bundled);
  fs.writeFileSync(path.join(outDir, "classes.json"), `${JSON.stringify({ classes, rules: rules.map(({ selector, classes: list, source }) => ({ selector, source, classes: list.join(" ") })) }, null, 2)}\n`);
  return { rules, classes, tokensSource: tokens.source, sizes: { components: Buffer.byteLength(components), single: Buffer.byteLength(bundled) } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`@semec/ds-css: ${result.rules.length} regras, ${result.classes.length} classes; tokens de ${result.tokensSource}.`);
  console.log(`  components.css ${(result.sizes.components / 1024).toFixed(1)} KB · semec-ds.css ${(result.sizes.single / 1024).toFixed(1)} KB (minificado)`);
}
