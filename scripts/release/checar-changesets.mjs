#!/usr/bin/env node
/**
 * Checagem de changeset por pacote (CI, job "changeset").
 *
 * O `changeset status --since` só falha quando há pacote mudado e NENHUM
 * changeset no PR: um changeset do @semec/ds deixava passar uma mudança no
 * @semec/ds-tokens sem versão. Este script exige que cada pacote público
 * mudado apareça em algum changeset novo do PR.
 *
 * "Mudado" = arquivo dentro da pasta do pacote que casa com `changedFilePatterns`
 * (.changeset/config.json, relativo à pasta do pacote) OU arquivo de uma fonte
 * externa que o build do pacote lê (UPSTREAM abaixo: o @semec/ds-tokens gera
 * tudo a partir de packages/react/tokens.css e packages/react/fonts/; o
 * @semec/ds-css, das classes dos componentes React que ele espelha).
 *
 * Um changeset vazio (`npx changeset add --empty`) continua sendo a saída
 * explícita para "mudou, mas não precisa de versão".
 *
 * Uso: node scripts/release/checar-changesets.mjs --since=origin/main
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import picomatch from "picomatch";
import { readPublicPackages } from "./plano.mjs";

/**
 * Fontes fora da pasta do pacote que entram no build dele (caminhos da raiz).
 * - ds-tokens: packages/tokens/scripts/build.mjs lê o tokens.css e as fontes do kit
 *   e importa o parser (token-data.mjs) e o gerador de CSS (build-css.mjs) dele.
 * - ds-css: packages/css/scripts/build.mjs compila as classes dos componentes React
 *   (rules.mjs → component-recipes.mjs) com o tokens.css do kit; o semec-ds.css
 *   concatenado embute os tokens. A lista de componentes é a que rules.mjs lê:
 *   ao acrescentar um componente lá, acrescente o .tsx aqui.
 */
const KIT_COMPONENTS_IN_CSS = [
  "alert", "badge", "button", "card", "checkbox", "error-summary", "footer", "form-field",
  "header", "heading", "input", "label", "radio-group", "select", "skip-link", "table",
  "textarea", "toast",
];

export const UPSTREAM = {
  "@semec/ds-tokens": [
    "packages/react/tokens.css",
    "packages/react/fonts/**",
    "packages/react/scripts/token-data.mjs",
    "packages/react/scripts/build-css.mjs",
  ],
  "@semec/ds-css": [
    "packages/react/tokens.css",
    "packages/react/scripts/build-css.mjs",
    "packages/react/scripts/component-recipes.mjs",
    ...KIT_COMPONENTS_IN_CSS.map((name) => `packages/react/src/components/${name}.tsx`),
  ],
};

/** Lê o frontmatter de um changeset: { "@semec/ds": "patch", ... }. */
export function parseChangeset(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n?---/.exec(text);
  if (!match) return null;
  const releases = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = /^\s*["']?([^"':]+)["']?\s*:\s*(major|minor|patch|none)\s*$/.exec(line);
    if (m) releases[m[1].trim()] = m[2];
  }
  return releases;
}

const defaultMatch = (file, patterns) => picomatch(patterns, { dot: true })(file);

/**
 * @param {object} input
 * @param {string[]} input.changedFiles caminhos da raiz, com "/"
 * @param {Array<{ name: string, dir: string }>} input.packages pacotes públicos
 * @param {string[]} input.patterns changedFilePatterns
 * @param {Record<string, string[]>} [input.upstream]
 * @param {Array<Record<string, string>>} input.changesets frontmatters dos changesets novos
 * @param {(file: string, patterns: string[]) => boolean} [input.match]
 */
export function checkCoverage({ changedFiles, packages, patterns, upstream = UPSTREAM, changesets, match = defaultMatch }) {
  const changed = [];
  for (const pkg of packages) {
    const prefix = `${pkg.dir}/`;
    const own = changedFiles
      .filter((f) => f.startsWith(prefix))
      .map((f) => f.slice(prefix.length))
      .filter((rel) => match(rel, patterns));
    const external = changedFiles.filter((f) => upstream[pkg.name] && match(f, upstream[pkg.name]));
    if (own.length > 0 || external.length > 0) {
      changed.push({ name: pkg.name, files: [...own.map((f) => prefix + f), ...external] });
    }
  }
  const hasEmpty = changesets.some((c) => Object.keys(c).length === 0);
  const covered = new Set(changesets.flatMap((c) => Object.keys(c)));
  const missing = hasEmpty ? [] : changed.filter((c) => !covered.has(c.name));
  return { changed, missing, hasEmpty };
}

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

export function main(rootDir, since) {
  const config = JSON.parse(fs.readFileSync(path.join(rootDir, ".changeset", "config.json"), "utf8"));
  const patterns = config.changedFilePatterns ?? ["**"];
  const ignore = new Set(config.ignore ?? []);
  const packages = readPublicPackages(rootDir).filter((p) => !ignore.has(p.name));
  const changedFiles = git(["diff", "--name-only", `${since}...HEAD`], rootDir)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const changesetFiles = git(["diff", "--name-only", "--diff-filter=AM", `${since}...HEAD`, "--", ".changeset"], rootDir)
    .split("\n")
    .map((s) => s.trim())
    .filter((f) => /^\.changeset\/[^/]+\.md$/.test(f) && !f.endsWith("README.md"));
  const changesets = changesetFiles
    .filter((f) => fs.existsSync(path.join(rootDir, f)))
    .map((f) => parseChangeset(fs.readFileSync(path.join(rootDir, f), "utf8")) ?? {});

  const result = checkCoverage({ changedFiles, packages, patterns, changesets });
  for (const c of result.changed) {
    console.log(`mudou: ${c.name} (${c.files.slice(0, 5).join(", ")}${c.files.length > 5 ? ", …" : ""})`);
  }
  if (result.hasEmpty) console.log("changeset vazio presente: mudança declarada sem versão.");
  if (result.missing.length > 0) {
    const names = result.missing.map((m) => m.name).join(", ");
    console.log(
      `::error title=Changeset ausente::Este PR altera arquivos publicados de ${names} sem changeset para esse pacote. ` +
        "Rode 'npm run changeset', marque o pacote e commite o arquivo em .changeset/. " +
        "Se a mudança realmente não precisa de release, use 'npx changeset add --empty'.",
    );
    return 1;
  }
  console.log(`changesets cobrem ${result.changed.length} pacote(s) mudado(s).`);
  return 0;
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const arg = process.argv.find((a) => a.startsWith("--since="));
  process.exitCode = main(path.resolve(here, "..", ".."), arg ? arg.slice("--since=".length) : "origin/main");
}
