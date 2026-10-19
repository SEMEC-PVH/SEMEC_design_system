#!/usr/bin/env node
/**
 * build-artifacts.mjs — Pipeline único de artefatos de IA (SEM-699).
 *
 * Fonte única: packages/react/manifest.js
 * Skills canônicas: packages/react/skills/semec-ds/SKILL.md
 *                    packages/react/skills/semec-ds-lite/SKILL.md
 *
 * Contagem e lista de componentes nunca são escritas à mão (AUD-49): a SKILL usa
 * `{{ds:component-count}}` / `<!-- ds:component-list -->` e o README do pacote tem um
 * bloco `<!-- ds:component-list:start/end -->`, preenchidos a partir de dsComponents.
 *
 * Targets:
 *   dist          → packages/react/dist/skills/* + dist/lite/*  (npm); sincroniza a lista
 *                   de componentes do README do pacote e a versão de docs/objetivo.md
 *   docs-public   → apps/docs/public/{llms.txt,llms-full.txt,manifest.json,components/*,skills/*}
 *   agent-dirs    → .claude/skills/semec-ds/SKILL.md + .opencode/skills/semec-ds/SKILL.md
 *   all (default)
 *
 * Uso:
 *   node scripts/build-artifacts.mjs
 *   node scripts/build-artifacts.mjs --target=docs-public
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertNoConflictMarkers, listFilesRecursive } from "./conflict-markers.mjs";
import { pendingRelease, unreleasedNote } from "./release-status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(__dirname, "../../..");
const distDir = path.join(pkgRoot, "dist");
const skillsSrcDir = path.join(pkgRoot, "skills");

const argTarget = process.argv.find((a) => a.startsWith("--target="));
const targetArg = argTarget ? argTarget.split("=")[1] : "all";
const targets = new Set(
  targetArg === "all" ? ["dist", "docs-public", "agent-dirs"] : [targetArg]
);

const allowed = new Set(["dist", "docs-public", "agent-dirs", "all"]);
if (!allowed.has(targetArg)) {
  console.error(`Unknown --target=${targetArg}. Use: dist | docs-public | agent-dirs | all`);
  process.exit(1);
}

// --- helpers ---
function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function readFileSafe(rel) {
  try {
    return fs.readFileSync(path.join(repoRoot, rel), "utf8");
  } catch {
    return null;
  }
}

function readBase(rel) {
  return readFileSafe(rel) ?? "";
}

function readPkgRoot(rel) {
  try {
    return fs.readFileSync(path.join(pkgRoot, rel), "utf8");
  } catch {
    return null;
  }
}

function readPkgRootBase(rel) {
  return readPkgRoot(rel) ?? "";
}

// --- load manifest + version ---
const manifestSrc = path.join(pkgRoot, "manifest.js");
const manifestUrl = pathToFileURL(manifestSrc).href;
const { dsComponents, dsCategories, dsPrompt, dsExportName } = await import(manifestUrl);

const pkgJson = JSON.parse(readPkgRootBase("package.json") || '{"version":"0.0.0"}');
const version = pkgJson.version || "0.0.0";
const generatedAt = resolveGeneratedAt();

// TST-15 (#55): changesets pendentes = conteúdo que o npm ainda não tem. O site é
// publicado a cada push no main; sem esta marca, "Versão 4.0.1" descrevia código
// que não era o do npm 4.0.1.
const pending = pendingRelease({
  changesetDir: path.join(repoRoot, ".changeset"),
  pkgName: pkgJson.name || "@semec/ds",
  version,
});
const unreleased = unreleasedNote(pending, version, pkgJson.name || "@semec/ds");

/**
 * Carimbo determinístico: dois builds do mesmo commit geram arquivos idênticos.
 * Ordem: SOURCE_DATE_EPOCH (padrão reproducible-builds) → data do último commit que
 * mexeu em packages/react (fonte dos artefatos) → data atual (sem git, ex.: tarball).
 */
function resolveGeneratedAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    return new Date(Number(epoch) * 1000).toISOString();
  }
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", "."], {
      cwd: pkgRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const date = new Date(out);
    if (out && !Number.isNaN(date.getTime())) return date.toISOString();
  } catch {
    // sem git disponível: cai na data atual
  }
  return new Date().toISOString();
}

const fullSkillSrc = path.join(skillsSrcDir, "semec-ds", "SKILL.md");
const liteSkillSrc = path.join(skillsSrcDir, "semec-ds-lite", "SKILL.md");
if (!fs.existsSync(fullSkillSrc)) {
  console.error(`Missing skill: ${fullSkillSrc}`);
  process.exit(1);
}
if (!fs.existsSync(liteSkillSrc)) {
  console.error(`Missing skill: ${liteSkillSrc}`);
  process.exit(1);
}

// --- marcadores de conflito (TST-02, #49) ---
// Um merge mal resolvido na SKILL chegou ao site e ao tarball sem que nada falhasse.
// As fontes são checadas antes de qualquer escrita (o artefato anterior fica intacto)
// e as saídas, depois de geradas.
function failOnConflictMarkers(files, context) {
  try {
    assertNoConflictMarkers(files, { root: repoRoot, context });
  } catch (err) {
    console.error(`build-artifacts: ${err.message}`);
    process.exit(1);
  }
}

failOnConflictMarkers(
  [
    ...listFilesRecursive(skillsSrcDir),
    manifestSrc,
    path.join(pkgRoot, "README.md"),
    path.join(pkgRoot, "tokens.css"),
    path.join(pkgRoot, "pv-preset.ts"),
    path.join(pkgRoot, "src", "index.ts"),
    ...dsComponents.map((c) => path.join(pkgRoot, c.file)),
  ],
  "fontes dos artefatos de IA"
);

const tokensCss = readBase("packages/react/tokens.css") ?? readPkgRootBase("tokens.css");
const pvPreset = readBase("packages/react/pv-preset.ts") ?? readPkgRootBase("pv-preset.ts");
const baseReadme = readBase("packages/react/README.md") ?? readPkgRootBase("README.md");
const baseIndex = readBase("packages/react/src/index.ts") ?? "";

const COMPONENT_SOURCE_PREFIX = "packages/react/";

function componentSource(c) {
  return readBase(`${COMPONENT_SOURCE_PREFIX}${c.file}`) ?? "";
}

// --- contagem e lista de componentes geradas do manifest (AUD-49) ---
// Nenhum documento cita número fixo: a SKILL usa placeholders e o README do pacote
// tem um bloco entre marcadores, os dois preenchidos a partir de dsComponents.
const componentCount = dsComponents.length;

/** Instalação do kit React: `lucide-react` é peer e só o npm 7+ o instala sozinho. */
const INSTALL_CMD = "npm install @semec/ds lucide-react";
/** Pacotes opcionais da receita de formulário (TST-20): não são peers do kit. */
const FORM_RECIPE_CMD = "npm install react-hook-form @hookform/resolvers@^5 zod@^4";
const PEERS_NOTE =
  "lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: " +
  FORM_RECIPE_CMD +
  ".";

/**
 * As 4 linhas do CSS global do app (TST-19): `fonts.css` antes do `tokens.css`,
 * e o `@source` relativo ao arquivo CSS. Vão no CSS, nunca num `import` em JS:
 * o `tokens.css` tem `@theme inline` e `@utility`, que só o Tailwind processa.
 */
const GLOBAL_CSS_LINES = [
  '@import "tailwindcss";',
  '@import "@semec/ds/react/fonts.css";',
  '@import "@semec/ds/react/tokens.css";',
  '@source "../node_modules/@semec/ds/dist/react";',
];
const GLOBAL_CSS = GLOBAL_CSS_LINES.join("\n");
const GLOBAL_CSS_NOTE =
  "No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).";
/** Preset JS opcional do Tailwind (no CSS global, depois dos imports). */
const PRESET_LINE = '@config "@semec/ds/react/pv-preset";';
const LITE_PRESET_LINE = '@config "@semec/ds/lite/pv-preset";';

const homepage = (pkgJson.homepage || "https://semec-pvh.github.io/SEMEC_design_system/").replace(/\/?$/, "/");

/**
 * URLs do site (TST-18, #55). Em produção o site tem `basePath`
 * (`/SEMEC_design_system`) e `trailingSlash`: links à raiz (`/componentes/x`)
 * davam 404. Os artefatos do site usam a URL completa a partir do `homepage` do
 * package.json, que já inclui o basePath e continua válida fora do site (agente
 * que lê o llms.txt solto, sem URL base).
 */
const siteUrl = (rel = "") => `${homepage}${rel.replace(/^\//, "")}`;
const componentPageUrl = (c) => siteUrl(`componentes/${c.slug}/`);
const componentMdUrl = (c) => siteUrl(`components/${c.slug}.md`);
// O caminho local continua no manifest-fonte para a leitura via fs do site.
// Nos artefatos distribuídos, src/ não existe: a referência aponta ao GitHub.
const componentSourceUrl = (c) => `https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/${c.file}`;

function componentsByCategory() {
  const known = new Set(dsCategories.map((cat) => cat.key));
  const groups = dsCategories
    .map((cat) => ({ cat, items: dsComponents.filter((c) => c.category === cat.key) }))
    .filter((g) => g.items.length > 0);
  const orphans = dsComponents.filter((c) => !known.has(c.category));
  if (orphans.length) {
    groups.push({
      cat: { key: "outros", label: "Outros", desc: "Sem categoria no manifest." },
      items: orphans,
    });
  }
  return groups;
}

/** Lista Markdown por categoria, para a SKILL (`<!-- ds:component-list -->`). */
function skillComponentList() {
  const out = [];
  for (const { cat, items } of componentsByCategory()) {
    out.push(`### ${cat.label} (${items.length})`, "");
    for (const c of items) {
      out.push(`- \`${dsExportName(c)}\` (\`${c.code}\`, \`components/${c.slug}.md\`) — ${c.desc}`);
    }
    out.push("");
  }
  return out.join("\n").trimEnd();
}

/** Tabela por categoria, para o README do pacote (bloco entre marcadores). */
function readmeComponentBlock() {
  const rows = componentsByCategory().map(
    ({ cat, items }) =>
      `| **${cat.label}** (${items.length}) | ${items.map((c) => dsExportName(c)).join(", ")} |`
  );
  return [
    `**${componentCount} componentes** no manifest (\`manifest.js\`), pelo export principal de cada um. Lista e contagem geradas por \`scripts/build-artifacts.mjs\`; não edite à mão.`,
    "",
    "| Categoria | Componentes |",
    "|---|---|",
    ...rows,
  ].join("\n");
}

const MAINTAINER_BLOCK = /<!-- ds:maintainer:start -->[\s\S]*?<!-- ds:maintainer:end -->\n?/g;
const INTEGRATOR_NOTE = /[ \t]*<!-- INTEGRADOR:[\s\S]*?-->[ \t]*\n?/g;

/**
 * Renderiza uma SKILL canônica para um destino.
 * - `{{ds:component-count}}` e `<!-- ds:component-list -->` → gerados do manifest;
 * - `{{ds:homepage}}` → URL do site de documentação;
 * - `{{ds:version}}` → versão do package.json (nunca escrita à mão na SKILL);
 * - `<!-- ds:release-status -->` → aviso de "não publicado" quando há changesets
 *   pendentes (TST-15); some quando não há;
 * - blocos `<!-- ds:maintainer:start -->…<!-- ds:maintainer:end -->` (caminhos do
 *   monorepo, scripts de manutenção) só ficam na cópia do repositório
 *   (`.claude/`, `.opencode/`); saem da SKILL publicada no npm e no site (AUD-67);
 * - notas `<!-- INTEGRADOR: … -->` nunca vão para os artefatos.
 */
function renderSkill(src, { maintainer = false } = {}) {
  let out = fs.readFileSync(src, "utf8");
  out = out
    .replaceAll("{{ds:component-count}}", String(componentCount))
    .replaceAll("{{ds:homepage}}", homepage)
    .replaceAll("{{ds:version}}", version)
    .replace("<!-- ds:component-list -->", skillComponentList())
    .replace("<!-- ds:release-status -->", unreleased ? `> **${unreleased}**` : "");
  out = maintainer
    ? out.replace(/<!-- ds:maintainer:(start|end) -->\n?/g, "")
    : out.replace(MAINTAINER_BLOCK, "");
  out = out.replace(INTEGRATOR_NOTE, "").replace(/\n{3,}/g, "\n\n");
  const leftover = out.match(/\{\{ds:[^}]*\}\}|<!-- ds:[^>]*-->/);
  if (leftover) {
    console.error(`Placeholder não resolvido em ${path.relative(repoRoot, src)}: ${leftover[0]}`);
    process.exit(1);
  }
  return out;
}

function writeSkill(src, dest, opts) {
  mkdirp(path.dirname(dest));
  fs.writeFileSync(dest, renderSkill(src, opts), "utf8");
}

/**
 * Atualiza, no próprio README do pacote, o bloco entre
 * `<!-- ds:component-list:start -->` e `<!-- ds:component-list:end -->`.
 * Determinístico: só escreve se o conteúdo mudou.
 */
function syncPackageReadme() {
  const readmePath = path.join(pkgRoot, "README.md");
  if (!fs.existsSync(readmePath)) return;
  const current = fs.readFileSync(readmePath, "utf8");
  const re = /(<!-- ds:component-list:start -->\n)[\s\S]*?(\n<!-- ds:component-list:end -->)/;
  if (!re.test(current)) {
    console.warn("  README.md sem marcadores ds:component-list; lista não sincronizada");
    return;
  }
  const next = current.replace(re, `$1${readmeComponentBlock()}$2`);
  if (next !== current) {
    fs.writeFileSync(readmePath, next, "utf8");
    console.log("  synced README.md (lista e contagem de componentes)");
  }
}

/**
 * TST-35 (#55): a versão em `docs/objetivo.md` (documento canônico) é gerada do
 * package.json e dos changesets pendentes, entre
 * `<!-- ds:release:start -->` e `<!-- ds:release:end -->`. Antes era escrita à
 * mão e ficou duas versões atrás ("publicada 3.2.0" com o npm em 4.0.1).
 */
function releaseStatusBlock() {
  const name = pkgJson.name || "@semec/ds";
  const base = `Versão no repositório (\`packages/react/package.json\`): **${version}**.`;
  if (!pending) {
    return `${base} Sem changesets pendentes: o \`main\` corresponde ao \`${name}@${version}\` publicado no npm.`;
  }
  const plural = pending.count === 1 ? "changeset pendente" : "changesets pendentes";
  return `${base} Há ${pending.count} ${plural} (${pending.bump}): a próxima versão prevista é a **${pending.nextVersion}**, e até ela sair o npm tem só a ${version}. Os artefatos para IA (llms.txt, manifest.json, .md por componente e skills) marcam esse conteúdo como "não publicado".`;
}

function syncObjetivo() {
  const file = path.join(repoRoot, "docs", "objetivo.md");
  if (!fs.existsSync(file)) return;
  const current = fs.readFileSync(file, "utf8");
  const re = /(<!-- ds:release:start -->\n)[\s\S]*?(\n<!-- ds:release:end -->)/;
  if (!re.test(current)) {
    console.warn("  docs/objetivo.md sem marcadores ds:release; versão não sincronizada");
    return;
  }
  const next = current.replace(re, `$1${releaseStatusBlock()}$2`);
  if (next !== current) {
    fs.writeFileSync(file, next, "utf8");
    console.log("  synced docs/objetivo.md (versão e changesets pendentes)");
  }
}

function buildManifest() {
  return {
    name: "SEMEC Design System",
    version,
    generatedAt,
    componentCount,
    categories: dsCategories,
    components: dsComponents.map((c) => ({
      code: c.code,
      slug: c.slug,
      label: c.label,
      exportName: dsExportName(c),
      file: componentSourceUrl(c),
      category: c.category,
      desc: c.desc,
      variants: c.variants,
      usage: c.usage,
      prompt: dsPrompt(c),
      url: componentPageUrl(c),
      md: componentMdUrl(c),
    })),
    // TST-15: `null` quando o repositório não tem changesets pendentes.
    unreleased: pending
      ? {
          pendingChangesets: pending.count,
          bump: pending.bump,
          nextVersion: pending.nextVersion,
          note: unreleased,
        }
      : null,
    // TST-19: `css` são as 4 linhas do CSS global; `fonts`, `tokens` e `source`
    // são linhas desse mesmo CSS (antes, `tokens` era um import em JS e `preset`
    // era o `@source`). `preset` é o preset JS opcional (`@config`).
    install: {
      packages: INSTALL_CMD,
      peers: PEERS_NOTE,
      form: FORM_RECIPE_CMD,
      css: GLOBAL_CSS,
      cssNote: GLOBAL_CSS_NOTE,
      fonts: GLOBAL_CSS_LINES[1],
      tokens: GLOBAL_CSS_LINES[2],
      source: GLOBAL_CSS_LINES[3],
      preset: PRESET_LINE,
      presetNote:
        "Opcional, no CSS global depois dos imports. O tokens.css já gera os utilitários; o preset só serve a quem ainda configura o Tailwind por JS.",
      utils: 'import { cn } from "@semec/ds/react";',
    },
    tokens: { files: ["tokens.css", "fonts.css", "pv-preset.ts"] },
  };
}

function componentMd(c) {
  const source = componentSource(c);
  const variantsLine = c.variants?.length
    ? c.variants.map((v) => `${v.prop}: ${v.values}`).join(" · ")
    : "—";
  const catLabel = dsCategories.find((x) => x.key === c.category)?.label ?? c.category;
  const routeLine = `**Arquivo:** [fonte no GitHub](${componentSourceUrl(c)}) | **Categoria:** ${catLabel} | **Página:** ${componentPageUrl(c)}`;

  return `---
title: "${c.label}"
code: "${c.code}"
slug: "${c.slug}"
file: "${componentSourceUrl(c)}"
category: "${c.category}"
variants: "${variantsLine.replace(/"/g, "'")}"
---

# ${c.label} — \`${c.code}\`

> ${c.desc}

${routeLine}

## Variantes

${c.variants?.length ? c.variants.map((v) => `- **${v.prop}**: ${v.values}`).join("\n") : "_Sem variantes_"}

## Instalação (@semec/ds)

\`\`\`bash
${INSTALL_CMD}
\`\`\`

${PEERS_NOTE}

\`\`\`css
${GLOBAL_CSS}
\`\`\`

${GLOBAL_CSS_NOTE}
${unreleased ? `\n> ${unreleased}\n` : ""}
## Uso

\`\`\`tsx
${c.usage}
\`\`\`

## Prompt para IA

\`\`\`text
${dsPrompt(c)}
\`\`\`

## Fonte

\`\`\`tsx
${source}
\`\`\`

## Tokens relacionados

Tokens semânticos: \`--bg\`, \`--fg\`, \`--surface\`, \`--border\`, \`--focus-ring\`, \`--action-primary\` etc. Ver \`tokens.css\` no dump completo.

---
Gerado a partir de \`packages/react/manifest.js\` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
`;
}

function llmsIndex({ site = false, lite = false } = {}) {
  const skillPaths = site
    ? [
        `- [skills/semec-ds/SKILL.md](${siteUrl("skills/semec-ds/SKILL.md")}) — skill full (React + tokens + a11y + responsive)`,
        `- [skills/semec-ds-lite/SKILL.md](${siteUrl("skills/semec-ds-lite/SKILL.md")}) — skill lite (tokens + a11y + responsive, sem React)`,
        "- No repositório: `.claude/skills/semec-ds/SKILL.md` e `.opencode/skills/semec-ds/SKILL.md`",
      ]
    : lite
      ? [
          // Em dist/lite só existe a skill lite (listada acima); a full fica em dist/skills.
          "- Skill full, com os componentes React: `@semec/ds/skills/semec-ds` (fora desta pasta)",
        ]
      : [
          "- `semec-ds/SKILL.md` — skill full (`@semec/ds/skills/semec-ds`)",
          "- `semec-ds-lite/SKILL.md` — skill lite (`@semec/ds/lite/skills/semec-ds-lite`)",
        ];

  const artifactPaths = lite
    ? site
      ? [
          `- [manifest.json](${siteUrl("manifest.json")}) — JSON com categorias e tokens`,
          `- [skills/semec-ds-lite/SKILL.md](${siteUrl("skills/semec-ds-lite/SKILL.md")}) — skill lite`,
        ]
      : [
          "- `llms.txt` — este índice",
          "- `manifest.json` — JSON com categorias e tokens",
          "- `semec-ds-lite/SKILL.md` — skill lite (`@semec/ds/lite/skills/semec-ds-lite`)",
        ]
    : site
      ? [
          `- [manifest.json](${siteUrl("manifest.json")}) — JSON com todos componentes + prompts`,
          `- [llms-full.txt](${siteUrl("llms-full.txt")}) — dump concatenado (tokens + todos componentes + prompts)`,
          `- \`${siteUrl("components/<slug>.md")}\` — 1 md por componente (chunk RAG)`,
        ]
      : [
          "- `llms.txt` — este índice",
          "- `llms-full.txt` — dump completo",
          "- `manifest.json` — JSON para consumo por máquinas",
          "- `components/<slug>.md` — chunk RAG por componente",
        ];

  if (lite) {
    return [
      "# SEMEC Design System — Lite (tokens + padrões visuais)",
      "",
      "Versão sem componentes React. Fornece tokens CSS, regras de acessibilidade",
      "e padrões responsive para aplicações com a identidade visual da Prefeitura de Porto Velho.",
      "",
      "## Instalação",
      "",
      "```bash",
      "npm install @semec/ds",
      "```",
      "",
      "Com Tailwind v4 (no CSS global, `fonts.css` antes do `tokens.css`):",
      "",
      "```css",
      '@import "tailwindcss";',
      '@import "@semec/ds/lite/fonts.css";',
      '@import "@semec/ds/lite/tokens.css";',
      "```",
      "",
      "Sem `@source` para `dist/react`: a variante lite não usa os componentes React, então o Tailwind só precisa varrer o código do próprio app.",
      "",
      `Preset JS opcional (TST-33), no CSS global depois dos imports: \`${LITE_PRESET_LINE}\`. O \`tokens.css\` já gera os utilitários; o preset só serve a quem ainda configura o Tailwind por JS.`,
      "",
      "Sem Tailwind: as variáveis `--*` e a camada base funcionam em CSS puro. Os subpaths `@semec/ds/lite/*.css` só resolvem num bundler (`import` no JS ou `@import` processado por Vite/Next); num `<link>`, use os arquivos reais:",
      "",
      "```html",
      '<link rel="stylesheet" href="/node_modules/@semec/ds/dist/react/fonts.css" />',
      '<link rel="stylesheet" href="/node_modules/@semec/ds/dist/react/tokens.css" />',
      "```",
      "",
      "Sem `node_modules` publicado, copie `dist/react/tokens.css`, `dist/react/fonts.css` e `dist/react/fonts/` para a pasta estática (`fonts/` ao lado do `fonts.css`).",
      "",
      "## Inclui",
      "",
      "- Tokens de identidade visual L0 + L1 (`tokens.css`)",
      "- Fonte Poppins 400–700 auto-hospedada, SIL OFL 1.1 (`fonts.css`)",
      "- Padrões de acessibilidade (WCAG 2.1 AA)",
      "- Padrões responsive / mobile",
      "- Padrões visuais (formulários, navegação, feedback, dados)",
      "",
      "## Arquivos para IA",
      "",
      ...artifactPaths,
      "",
      ...skillPaths,
      "",
      "## Licença e crédito",
      "",
      "Licença MIT. Crédito recomendado, não obrigatório (AMB-09); texto sugerido para o README.md do projeto:",
      "",
      "## Créditos",
      "",
      "Identidade visual e tokens fornecidos pelo",
      "[SEMEC Design System](https://github.com/SEMEC-PVH/SEMEC_design_system),",
      "desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de",
      "Economia de Porto Velho (DevSemec).",
      "",
      `> Gerado ${generatedAt} a partir de packages/react/manifest.js. Versão ${version}.`,
    ].join("\n");
  }

  const lines = [
    "# SEMEC Design System — SEMEC Digital (Porto Velho)",
    "",
    "> Kit `@semec/ds` (React + Tailwind v4 + Radix + CVA). Conteúdo PT-BR, código EN (ADR-016).",
    "",
    ...(site ? [`Site: ${homepage}`, ""] : []),
    ...(unreleased ? [`> **${unreleased}**`, ""] : []),
    "## Instalar",
    "",
    "```bash",
    INSTALL_CMD,
    "```",
    "",
    PEERS_NOTE,
    "",
    "```css",
    ...GLOBAL_CSS_LINES,
    "```",
    "",
    GLOBAL_CSS_NOTE,
    "",
    "## Categorias",
    "",
  ];

  for (const cat of dsCategories) {
    lines.push(`- **${cat.label}** (\`${cat.slug}\`) — ${cat.desc}`);
  }

  lines.push("", `## Componentes (${dsComponents.length})`, "");

  for (const c of dsComponents) {
    const importName = dsExportName(c);
    if (site) {
      lines.push(
        `- [${c.label} (\`${c.code}\`) — ${c.desc}](${componentPageUrl(c)}) — [fonte](${componentSourceUrl(c)}) — md: ${componentMdUrl(c)}`
      );
    } else {
      lines.push(
        `- [${c.label} (\`${c.code}\`) — ${c.desc}](components/${c.slug}.md) — [fonte](${componentSourceUrl(c)})`
      );
    }
    lines.push(`  Uso: \`import { ${importName} } from "@semec/ds/react";\``);
  }

  lines.push(
    "",
    "## Padrões",
    "",
    site
      ? `Padrões de tela (navegação, formulários, dados e relatórios, feedback, acessibilidade) em ${siteUrl("padroes/")}; exemplos interativos na página de cada componente.`
      : `Padrões de tela (esqueleto de página, landmarks, formulários, tabelas, feedback) em ${homepage}padroes/ e resumidos na skill \`semec-ds/SKILL.md\` (seção "Padrões de tela").`,
    "",
    "## Tokens",
    "",
    site
      ? "- `packages/react/tokens.css` — primitivos pv-* + semânticos + @theme inline (Tailwind v4)\n- `packages/react/pv-preset.ts` — preset Tailwind @config"
      : "- `tokens.css` — primitivos pv-* + semânticos + @theme inline (Tailwind v4)\n- `pv-preset.ts` — preset Tailwind @config",
    "",
    "## Arquivos para IA",
    "",
    ...artifactPaths,
    "",
    ...skillPaths,
    "",
    "## Uso IA",
    "",
    "1. Leia este índice (`llms.txt`)",
    "2. Escolha componente por slug/code",
    site
      ? `3. Copie o snippet da seção "Uso" de \`${siteUrl("components/<slug>.md")}\` ou do \`manifest.json\``
      : "3. Copie snippet de `components/<slug>.md` ou `manifest.json`",
    "4. Aplique tokens L1 (`--action-primary` etc.), nunca hex solto",
    "",
    `> Gerado ${generatedAt} a partir de packages/react/manifest.js. Versão ${version}.`,
  );

  return lines.join("\n");
}

function llmsFullDump() {
  let full = `# SEMEC Design System — Dump completo para IA\n\n`;
  full += `> Gerado ${generatedAt} — packages/react/manifest.js + packages/react/* — versão ${version}\n\n`;
  if (unreleased) full += `> **${unreleased}**\n\n`;
  full += `## Instalação\n\n\`\`\`bash\n${INSTALL_CMD}\n\`\`\`\n\n${PEERS_NOTE}\n\n`;
  full += `\`\`\`css\n${GLOBAL_CSS}\n\`\`\`\n\n${GLOBAL_CSS_NOTE}\n\n`;
  full += `## packages/react/src/index.ts — barrel\n\n\`\`\`ts\n${baseIndex}\n\`\`\`\n\n`;
  full += `## packages/react/tokens.css\n\n\`\`\`css\n${tokensCss}\n\`\`\`\n\n`;
  full += `## packages/react/pv-preset.ts\n\n\`\`\`ts\n${pvPreset}\n\`\`\`\n\n`;
  full += `## Manifest — categorias\n\n\`\`\`json\n${JSON.stringify(dsCategories, null, 2)}\n\`\`\`\n\n`;
  full += `## Manifest — package.json\n\n\`\`\`json\n${JSON.stringify({ name: pkgJson.name, version }, null, 2)}\n\`\`\`\n\n`;
  full += `## Componentes — todos (${dsComponents.length})\n`;

  for (const c of dsComponents) {
    const src = componentSource(c);
    full += `\n### ${c.label} (\`${c.code}\`) — [fonte](${componentSourceUrl(c)}) — slug: ${c.slug}\n\n`;
    full += `Desc: ${c.desc}\n\n`;
    if (c.variants?.length) {
      full += `Variantes: ${c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ")}\n\n`;
    }
    full += `Uso:\n\`\`\`tsx\n${c.usage}\n\`\`\`\n\nPrompt:\n\`\`\`text\n${dsPrompt(c)}\n\`\`\`\n\nFonte:\n\`\`\`tsx\n${src}\n\`\`\`\n\n---\n`;
  }

  const readmeNow = readPkgRoot("README.md") ?? baseReadme;
  if (readmeNow) {
    full += `\n## packages/react/README.md\n\n\`\`\`md\n${readmeNow}\n\`\`\`\n`;
  }

  return full;
}

function writeLlmsFullForTarget(outDir, { lite = false } = {}) {
  if (lite) {
    // lite não publica llms-full — índice + manifest já cobrem o caso de uso
    return;
  }
  fs.writeFileSync(path.join(outDir, "llms-full.txt"), llmsFullDump(), "utf8");
  console.log(`  generated ${path.relative(repoRoot, path.join(outDir, "llms-full.txt"))}`);
}

// --- dist (npm) ---
function buildDist() {
  console.log("→ dist (npm)");
  syncPackageReadme();
  syncObjetivo();

  // CSS + preset em dist/react
  const cssFiles = ["tokens.css"];
  for (const file of cssFiles) {
    const src = path.join(pkgRoot, file);
    if (fs.existsSync(src)) {
      copyFile(src, path.join(distDir, "react", file));
      console.log(`  copied ${file}`);
    }
  }
  const pvSrc = path.join(pkgRoot, "pv-preset.ts");
  if (fs.existsSync(pvSrc)) {
    copyFile(pvSrc, path.join(distDir, "react", "pv-preset.ts"));
    console.log("  copied pv-preset.ts");
  }

  // manifest.js
  if (fs.existsSync(manifestSrc)) {
    copyFile(manifestSrc, path.join(distDir, "skills", "manifest.js"));
    console.log("  copied manifest.js");
  }

  // full skills surface
  const skillsDir = path.join(distDir, "skills");
  const componentsDir = path.join(skillsDir, "components");
  mkdirp(componentsDir);
  mkdirp(path.join(skillsDir, "semec-ds"));

  fs.writeFileSync(path.join(skillsDir, "llms.txt"), llmsIndex({ site: false }), "utf8");
  console.log("  generated dist/skills/llms.txt");
  writeLlmsFullForTarget(skillsDir);

  fs.writeFileSync(
    path.join(skillsDir, "manifest.json"),
    JSON.stringify(buildManifest({ site: false }), null, 2),
    "utf8"
  );
  console.log("  generated dist/skills/manifest.json");

  for (const c of dsComponents) {
    fs.writeFileSync(
      path.join(componentsDir, `${c.slug}.md`),
      componentMd(c, { site: false }),
      "utf8"
    );
  }
  console.log(`  generated ${dsComponents.length} dist/skills/components/*.md`);

  writeSkill(fullSkillSrc, path.join(skillsDir, "semec-ds", "SKILL.md"));
  console.log("  rendered skills/semec-ds/SKILL.md");

  // lite surface
  const liteDir = path.join(distDir, "lite");
  mkdirp(path.join(liteDir, "semec-ds-lite"));

  fs.writeFileSync(path.join(liteDir, "llms.txt"), llmsIndex({ site: false, lite: true }), "utf8");
  console.log("  generated dist/lite/llms.txt");

  fs.writeFileSync(
    path.join(liteDir, "manifest.json"),
    JSON.stringify(
      {
        name: "SEMEC Design System — Lite",
        version,
        generatedAt,
        description:
          "Tokens, acessibilidade, responsive e padrões visuais. Sem componentes React.",
        categories: dsCategories,
        unreleased: pending
          ? {
              pendingChangesets: pending.count,
              bump: pending.bump,
              nextVersion: pending.nextVersion,
              note: unreleased,
            }
          : null,
        install: {
          css: '@import "tailwindcss"; @import "@semec/ds/lite/fonts.css"; @import "@semec/ds/lite/tokens.css";',
          note: "Sem @source para dist/react: a variante lite não usa componentes React.",
          preset: LITE_PRESET_LINE,
          presetNote:
            "Opcional, no CSS global depois dos imports. O tokens.css já gera os utilitários; o preset só serve a quem ainda configura o Tailwind por JS.",
          withoutTailwind:
            "Os subpaths @semec/ds/lite/*.css só resolvem num bundler. Num <link>, use node_modules/@semec/ds/dist/react/fonts.css e node_modules/@semec/ds/dist/react/tokens.css (ou copie esses arquivos e a pasta fonts/ para a pasta estática).",
        },
        tokens: {
          files: ["tokens.css", "fonts.css", "pv-preset.ts"],
          primitives: "pv-* prefixed (L0)",
          semantic: "L1 — --bg, --fg, --surface, --action-primary, --feedback-*, etc.",
        },
        accessibility: {
          standard: "WCAG 2.1 AA (ADR-014)",
          contrast:
            "4.5:1 texto normal; 3:1 texto grande (≥ 24px regular ou ≥ 18,66px bold) e componentes de interface",
          focus: ":focus-visible com --focus-ring (2px solid, 2px offset)",
          keyboard: "Tab, Enter, Escape, setas",
          touchTargets:
            "44×44px é regra do DS (decisão do projeto), acima do WCAG 2.1 AA; o critério WCAG de 44px (2.5.5) é AAA",
        },
        responsive: {
          breakpoints: "sm:640 md:768 lg:1024 xl:1280 2xl:1536",
          container: "mx-auto w-full max-w-[75rem] px-4",
          sidebar: "drawer off-canvas + inert em mobile",
        },
        // AMB-09 (15/10/2026): MIT não exige crédito; é recomendado.
        credit: {
          required: false,
          recommended: true,
          license: "MIT",
          text: "Identidade visual e tokens fornecidos pelo SEMEC Design System (https://github.com/SEMEC-PVH/SEMEC_design_system), desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de Economia de Porto Velho (DevSemec).",
          location: "README.md do projeto consumidor",
        },
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("  generated dist/lite/manifest.json");

  writeSkill(liteSkillSrc, path.join(liteDir, "semec-ds-lite", "SKILL.md"));
  console.log("  rendered dist/lite/semec-ds-lite/SKILL.md");
}

// --- docs-public ---
function buildDocsPublic() {
  console.log("→ docs-public (apps/docs/public)");
  const publicDir = path.join(repoRoot, "apps", "docs", "public");
  const componentsOutDir = path.join(publicDir, "components");
  mkdirp(componentsOutDir);
  mkdirp(path.join(publicDir, "skills", "semec-ds"));
  mkdirp(path.join(publicDir, "skills", "semec-ds-lite"));

  fs.writeFileSync(path.join(publicDir, "llms.txt"), llmsIndex({ site: true }), "utf8");
  console.log("  generated public/llms.txt");
  writeLlmsFullForTarget(publicDir);

  fs.writeFileSync(
    path.join(publicDir, "manifest.json"),
    JSON.stringify(buildManifest({ site: true }), null, 2),
    "utf8"
  );
  console.log("  generated public/manifest.json");

  for (const c of dsComponents) {
    fs.writeFileSync(
      path.join(componentsOutDir, `${c.slug}.md`),
      componentMd(c, { site: true }),
      "utf8"
    );
  }
  console.log(`  generated ${dsComponents.length} public/components/*.md`);

  writeSkill(fullSkillSrc, path.join(publicDir, "skills", "semec-ds", "SKILL.md"));
  writeSkill(liteSkillSrc, path.join(publicDir, "skills", "semec-ds-lite", "SKILL.md"));
  console.log("  rendered public/skills/semec-ds + semec-ds-lite");
}

// --- agent-dirs ---
function buildAgentDirs() {
  console.log("→ agent-dirs (.claude / .opencode)");
  const claudeDest = path.join(repoRoot, ".claude", "skills", "semec-ds", "SKILL.md");
  const opencodeDest = path.join(repoRoot, ".opencode", "skills", "semec-ds", "SKILL.md");
  // Cópia do repositório: mantém as seções de mantenedor (caminhos do monorepo).
  writeSkill(fullSkillSrc, claudeDest, { maintainer: true });
  writeSkill(fullSkillSrc, opencodeDest, { maintainer: true });
  console.log("  rendered .claude/skills/semec-ds/SKILL.md (com seções de mantenedor)");
  console.log("  rendered .opencode/skills/semec-ds/SKILL.md (com seções de mantenedor)");
}

// --- run ---
if (targets.has("dist")) buildDist();
if (targets.has("docs-public")) buildDocsPublic();
if (targets.has("agent-dirs")) buildAgentDirs();

{
  const outputs = [];
  if (targets.has("dist")) {
    outputs.push(
      ...listFilesRecursive(path.join(distDir, "skills")),
      ...listFilesRecursive(path.join(distDir, "lite")),
      path.join(pkgRoot, "README.md"),
      ...(fs.existsSync(path.join(repoRoot, "docs", "objetivo.md"))
        ? [path.join(repoRoot, "docs", "objetivo.md")]
        : [])
    );
  }
  if (targets.has("docs-public")) {
    const publicDir = path.join(repoRoot, "apps", "docs", "public");
    outputs.push(
      path.join(publicDir, "llms.txt"),
      path.join(publicDir, "llms-full.txt"),
      path.join(publicDir, "manifest.json"),
      ...listFilesRecursive(path.join(publicDir, "components")),
      ...listFilesRecursive(path.join(publicDir, "skills"))
    );
  }
  if (targets.has("agent-dirs")) {
    outputs.push(
      ...listFilesRecursive(path.join(repoRoot, ".claude", "skills", "semec-ds")),
      ...listFilesRecursive(path.join(repoRoot, ".opencode", "skills", "semec-ds"))
    );
  }
  failOnConflictMarkers(outputs, "artefatos gerados");
}

console.log(`\nbuild-artifacts: done (version ${version}, target ${targetArg}).`);
