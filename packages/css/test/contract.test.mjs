/**
 * Contrato do pacote (onda 2, #74 · ADR-028): package.json, exports, nomes
 * de classe, conteúdo dos três CSS, ausência de cor literal e tamanho.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import postcss from "postcss";
import { buildRules } from "../scripts/rules.mjs";
import { pkgRoot, cssDist, repoRoot } from "./support/harness.mjs";

const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
const read = (f) => fs.readFileSync(path.join(cssDist, f), "utf8");
const kitRoot = path.join(repoRoot, "packages/react");

/** Limites de tamanho (bytes). Subir exige justificar no PR. */
// Onda 3 (F1): +6 componentes interativos (Dialog/AlertDialog, Tabs, Combobox, menu,
// Accordion) levaram o components.css de ~53 KB para ~75 KB (gzip de ~6,1 KB para ~7,9 KB).
const LIMITS = { components: 88 * 1024, componentsGzip: 10 * 1024, single: 80 * 1024, singleGzip: 12 * 1024 };

/** Classes que o contrato da onda 2 fixa como API pública. */
const CONTRACT = [
  "semec-btn", "semec-btn--primary", "semec-btn--secondary", "semec-btn--ghost", "semec-btn--destructive", "semec-btn--link", "semec-btn--sm", "semec-btn--lg",
  "semec-field", "semec-label", "semec-label__required", "semec-hint", "semec-error", "semec-form-field", "semec-checkbox", "semec-radio", "semec-choice",
  "semec-card", "semec-card__header", "semec-card__title", "semec-card__description", "semec-card__content", "semec-card__footer",
  "semec-alert", "semec-alert--info", "semec-alert--success", "semec-alert--warning", "semec-alert--danger", "semec-alert__title", "semec-alert__description",
  "semec-header", "semec-header__brand", "semec-header__org", "semec-header__service", "semec-header__nav", "semec-header__link",
  "semec-footer", "semec-footer__link", "semec-skip-link",
  "semec-table", "semec-table__wrapper", "semec-table__caption",
  "semec-error-summary", "semec-error-summary__title", "semec-error-summary__list",
  "semec-badge", "semec-badge--secondary", "semec-badge--outline", "semec-badge--success", "semec-badge--warning", "semec-badge--danger", "semec-badge--info",
  "semec-toast", "semec-toast--success", "semec-toast--danger", "semec-toast--info", "semec-toast__title", "semec-toast__description",
  "semec-heading--1", "semec-heading--2", "semec-heading--3", "semec-heading--4",
  // Onda 3 (F1): interativos; os estados são os atributos do Radix (sem classe de estado).
  "semec-dialog", "semec-dialog--alert", "semec-dialog__header", "semec-dialog__title", "semec-dialog__description", "semec-dialog__footer", "semec-dialog__close",
  "semec-tabs", "semec-tabs__list", "semec-tabs__trigger", "semec-tabs__panel",
  "semec-combobox", "semec-combobox__input", "semec-combobox__listbox", "semec-combobox__option", "semec-combobox__empty", "semec-combobox__check",
  "semec-menu", "semec-menu__item", "semec-menu__separator", "semec-menu__label",
  "semec-accordion", "semec-accordion__item", "semec-accordion__header", "semec-accordion__trigger", "semec-accordion__panel", "semec-accordion__icon",
];

test("package.json segue o contrato", () => {
  assert.equal(pkg.name, "@semec/ds-css");
  // 0.0.0 até o primeiro release (o changeset major leva à 1.0.0); depois, semver comum.
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.type, "module");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.engines.node, ">=22.12");
  assert.equal(pkg.publishConfig.access, "public");
  assert.deepEqual(pkg.sideEffects, ["**/*.css"]);
  // A faixa acompanha a versão do ds-tokens no workspace: "^0.0.0" no fonte (com
  // "^1.0.0" o npm não liga o workspace 0.0.0 e vai ao registry: E404) e "^1.0.0"
  // depois do `changeset version`, que reescreve as duas juntas.
  const tokensPkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "..", "tokens", "package.json"), "utf8"));
  assert.deepEqual(pkg.dependencies, { "@semec/ds-tokens": `^${tokensPkg.version}` });
  assert.equal(pkg.peerDependencies, undefined);
  assert.ok(!JSON.stringify(pkg).includes('"react'), "nada de React no pacote CSS");
  for (const key of ["./components.css", "./index.css", "./dist/semec-ds.css"]) {
    assert.ok(pkg.exports[key]?.default, `export ${key} com condição default`);
    assert.ok(fs.existsSync(path.join(pkgRoot, pkg.exports[key].default)), `${key} gerado`);
  }
});

// Só vale antes do primeiro release: o `changeset version` consome o changeset e
// leva o pacote à 1.0.0 (sem isto, o PR de versão quebraria a CI).
test("changeset major para o @semec/ds-css", { skip: pkg.version !== "0.0.0" && "já publicado (versão > 0.0.0)" }, () => {
  const dir = path.join(repoRoot, ".changeset");
  const found = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).some((t) => /^"@semec\/ds-css": major$/m.test(t));
  assert.ok(found);
});

test("index.css importa tokens e base do @semec/ds-tokens e depois os componentes", () => {
  assert.equal(read("index.css"), '@import "@semec/ds-tokens/tokens.css";\n@import "@semec/ds-tokens/base.css";\n@import "./components.css";\n');
});

test("components.css: só classes .semec-*, sem tokens, sem reset global, sem diretiva Tailwind e sem cor literal", () => {
  const css = read("components.css");
  const root = postcss.parse(css);
  const bad = [];
  root.walkAtRules((at) => { if (["apply", "theme", "utility", "tailwind", "source", "import", "custom-variant"].includes(at.name)) bad.push(`@${at.name}`); });
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && rule.parent.name === "keyframes") return;
    for (const s of rule.selectors) if (!s.includes("semec-")) bad.push(s);
  });
  root.walkDecls((d) => {
    if (d.prop.startsWith("--") && !d.prop.startsWith("--tw-")) bad.push(`declara ${d.prop}`);
    if (/#[0-9a-f]{3,8}\b/i.test(d.value) || /\brgba?\(/i.test(d.value)) bad.push(`cor literal em ${d.prop}: ${d.value}`);
  });
  assert.deepEqual(bad, []);
  assert.ok(!/(^|[^-])(nesting|&)/.test(css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/g, "").replace(/"[^"]*"/g, "")), "CSS achatado (sem nesting)");
});

test("todas as classes do contrato existem", () => {
  const { classes } = JSON.parse(read("classes.json"));
  const missing = CONTRACT.filter((c) => !classes.includes(c));
  assert.deepEqual(missing, []);
});

test("estados obrigatórios estão no CSS", () => {
  const css = read("components.css");
  for (const needle of [
    ".semec-btn:focus-visible", ".semec-btn:disabled", '.semec-btn[aria-disabled="true"]',
    '.semec-field[aria-invalid="true"]', ".semec-field:disabled",
    '.semec-header__link:where([aria-current="page"])', ".semec-checkbox:checked", ".semec-radio:checked",
    // Interativos: os mesmos atributos que o Radix põe (e o @semec/ds-elements também).
    ".semec-dialog::backdrop", ".semec-dialog:not([open])", '.semec-dialog--alert[data-state="open"]', ".semec-dialog__close:focus-visible",
    '.semec-tabs__trigger[data-state="active"]', ".semec-tabs__trigger[data-disabled]", ".semec-tabs__panel:focus-visible",
    ".semec-combobox__option:where([data-highlighted])", '.semec-combobox__option:where([aria-selected="true"])', '.semec-combobox__input[aria-invalid="true"]',
    '.semec-combobox__listbox[data-side="top"]', '.semec-combobox__listbox[data-state="open"]',
    ".semec-menu__item[data-highlighted]", ".semec-menu__item[data-disabled]", '.semec-menu[data-side="top"]',
    '.semec-accordion__trigger[data-state="open"] > .semec-accordion__icon',
  ]) assert.ok(css.includes(needle), `falta ${needle}`);
  assert.match(css, /@media \(hover: hover\)\s*\{\s*:is\(\.semec-btn:where/);
});

test("semec-ds.css é o arquivo único: tokens + base + componentes", () => {
  const css = read("semec-ds.css");
  for (const needle of ["--action-primary:", "--focus-ring:", ":focus-visible", "prefers-reduced-motion", ".semec-btn", ".semec-table"]) assert.ok(css.includes(needle), `falta ${needle}`);
  assert.ok(!css.includes("@import"), "sem @import no arquivo único");
  assert.ok(!/@(apply|theme|utility|tailwind)\b/.test(css));
});

test("tamanho dentro do limite", () => {
  const comp = fs.readFileSync(path.join(cssDist, "components.css"));
  const single = fs.readFileSync(path.join(cssDist, "semec-ds.css"));
  const sizes = { components: comp.length, componentsGzip: zlib.gzipSync(comp).length, single: single.length, singleGzip: zlib.gzipSync(single).length };
  console.log(`tamanho: components.css ${(sizes.components / 1024).toFixed(1)} KB (gzip ${(sizes.componentsGzip / 1024).toFixed(1)} KB) · semec-ds.css ${(sizes.single / 1024).toFixed(1)} KB (gzip ${(sizes.singleGzip / 1024).toFixed(1)} KB)`);
  for (const [k, v] of Object.entries(sizes)) assert.ok(v <= LIMITS[k], `${k}: ${v} > ${LIMITS[k]}`);
});

test("se o cva mudar, a regra gerada muda junto (nada copiado à mão)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "semec-ds-css-cva-"));
  fs.cpSync(path.join(kitRoot, "src/components"), path.join(tmp, "src/components"), { recursive: true });
  const file = path.join(tmp, "src/components/button.tsx");
  const source = fs.readFileSync(file, "utf8");
  assert.ok(source.includes("rounded-full font-medium"));
  fs.writeFileSync(file, source.replace("rounded-full font-medium", "rounded-md font-medium").replace('"bg-destructive text-destructive-foreground', '"bg-warning text-destructive-foreground'));
  const original = buildRules(kitRoot);
  const changed = buildRules(tmp);
  const rule = (rules, selector) => rules.find((r) => r.selector === selector)?.classes ?? [];
  assert.ok(rule(original, ".semec-btn").includes("rounded-full"));
  assert.ok(rule(changed, ".semec-btn").includes("rounded-md"));
  assert.ok(rule(changed, ".semec-btn--destructive").includes("bg-warning"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("interativos: o mesmo cva/className do React (Dialog × AlertDialog, popup, item ativo)", () => {
  const rules = buildRules(kitRoot);
  // Um seletor pode ter mais de uma regra (painel, ::backdrop e ajuste do <dialog>).
  const rule = (selector) => rules.filter((r) => r.selector === selector).flatMap((r) => r.classes);
  // O AlertDialog só difere onde o TSX difere: o título do Dialog tem leading/tracking a mais.
  assert.ok(rule(".semec-dialog:where(:not(.semec-dialog--alert)) .semec-dialog__title").includes("tracking-tight"));
  assert.ok(!rule(".semec-dialog__title").includes("tracking-tight"));
  assert.ok(rule(".semec-dialog").includes("backdrop:bg-black/50"), "overlay vira ::backdrop");
  // O item ativo vale por foco ou por data-highlighted; o popup tem a largura mínima do TSX e a do wrapper.
  assert.ok(rule(".semec-menu__item").includes("data-highlighted:bg-tint"));
  assert.ok(rule(".semec-menu").includes("min-w-[max(8rem,100%)]"));
  assert.ok(rule(".semec-combobox__listbox").includes("min-w-[max(12rem,100%)]"));
  // Ganchos sem CSS (o Radix Root não tem classe) continuam na API.
  const { classes } = JSON.parse(read("classes.json"));
  for (const c of ["semec-tabs", "semec-accordion"]) assert.ok(classes.includes(c), c);
});

test("se o className de um interativo mudar, a regra muda junto", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "semec-ds-css-int-"));
  fs.cpSync(path.join(kitRoot, "src/components"), path.join(tmp, "src/components"), { recursive: true });
  const edit = (name, from, to) => {
    const file = path.join(tmp, "src/components", `${name}.tsx`);
    const source = fs.readFileSync(file, "utf8");
    assert.ok(source.includes(from), `${name}.tsx contém ${from}`);
    fs.writeFileSync(file, source.replace(from, to));
  };
  edit("dialog", "w-full max-w-lg overflow-y-auto", "w-full max-w-xl overflow-y-auto");
  edit("tabs", "data-[state=active]:after:bg-primary", "data-[state=active]:after:bg-success");
  edit("combobox", 'isActive && "bg-tint ring-2', 'isActive && "bg-muted ring-2');
  edit("accordion", '"border-b border-border"', '"border-b-2 border-border"');
  const changed = buildRules(tmp);
  const rule = (selector) => changed.filter((r) => r.selector === selector).flatMap((r) => r.classes);
  assert.ok(rule(".semec-dialog:where(:not(.semec-dialog--alert))").includes("max-w-xl"));
  assert.ok(rule(".semec-dialog--alert").includes("max-w-lg"), "o AlertDialog segue o próprio TSX");
  assert.ok(rule(".semec-tabs__trigger").includes("data-[state=active]:after:bg-success"));
  assert.ok(rule(".semec-combobox__option:where([data-highlighted])").includes("bg-muted"));
  assert.ok(rule(".semec-accordion__item").includes("border-b-2"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("o README documenta todas as classes publicadas", () => {
  const readme = fs.readFileSync(path.join(pkgRoot, "README.md"), "utf8");
  const { classes } = JSON.parse(read("classes.json"));
  assert.deepEqual(classes.filter((c) => !readme.includes(`\`${c}\``) && !readme.includes(`class="${c}`) && !readme.includes(` ${c}"`)), []);
});
