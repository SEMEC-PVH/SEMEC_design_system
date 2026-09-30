#!/usr/bin/env node
/**
 * build-artifacts.mjs — Pipeline único de artefatos de IA (SEM-699).
 *
 * Fonte única: packages/react/manifest.js
 * Skills canônicas: packages/react/skills/semec-ds/SKILL.md
 *                    packages/react/skills/semec-ds-lite/SKILL.md
 *
 * Targets:
 *   dist          → packages/react/dist/skills/* + dist/lite/*  (npm)
 *   docs-public   → apps/docs/public/{llms.txt,llms-full.txt,manifest.json,components/*,skills/*}
 *   agent-dirs    → .claude/skills/semec-ds/SKILL.md + .opencode/skills/semec-ds/SKILL.md
 *   all (default)
 *
 * Uso:
 *   node scripts/build-artifacts.mjs
 *   node scripts/build-artifacts.mjs --target=docs-public
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const { dsComponents, dsCategories, dsPrompt } = await import(manifestUrl);

const pkgJson = JSON.parse(readPkgRootBase("package.json") || '{"version":"0.0.0"}');
const version = pkgJson.version || "0.0.0";
const generatedAt = new Date().toISOString();

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

const tokensCss = readBase("packages/react/tokens.css") ?? readPkgRootBase("tokens.css");
const pvPreset = readBase("packages/react/pv-preset.ts") ?? readPkgRootBase("pv-preset.ts");
const baseReadme = readBase("packages/react/README.md") ?? readPkgRootBase("README.md");
const baseIndex = readBase("packages/react/src/index.ts") ?? "";

const COMPONENT_SOURCE_PREFIX = "packages/react/";

function componentSource(c) {
  return readBase(`${COMPONENT_SOURCE_PREFIX}${c.file}`) ?? "";
}

function buildManifest({ site = false } = {}) {
  return {
    name: "SEMEC Design System",
    version,
    generatedAt,
    categories: dsCategories,
    components: dsComponents.map((c) => ({
      code: c.code,
      slug: c.slug,
      label: c.label,
      file: c.file,
      category: c.category,
      desc: c.desc,
      variants: c.variants,
      usage: c.usage,
      prompt: dsPrompt(c),
      ...(site
        ? { url: `/componentes/${c.slug}`, md: `/components/${c.slug}.md` }
        : {}),
    })),
    install: {
      tokens: 'import "@semec/ds/react/tokens.css";',
      preset: '@config "@semec/ds/react/pv-preset";',
      utils: 'import { cn } from "@semec/ds/react";',
    },
    tokens: { files: ["tokens.css", "pv-preset.ts"] },
  };
}

function componentMd(c, { site = false } = {}) {
  const source = componentSource(c);
  const variantsLine = c.variants?.length
    ? c.variants.map((v) => `${v.prop}: ${v.values}`).join(" · ")
    : "—";
  const catLabel = dsCategories.find((x) => x.key === c.category)?.label ?? c.category;
  const routeLine = site
    ? `**Arquivo:** \`${c.file}\` | **Categoria:** ${catLabel} | **Rota:** \`/componentes/${c.slug}\``
    : `**Arquivo:** \`${c.file}\` | **Categoria:** ${catLabel}`;

  return `---
title: "${c.label}"
code: "${c.code}"
slug: "${c.slug}"
file: "${c.file}"
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
npm install @semec/ds
\`\`\`

\`\`\`css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@config "@semec/ds/react/pv-preset";
\`\`\`

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
        "- `/skills/semec-ds/SKILL.md` — skill full (React + tokens + a11y + responsive)",
        "- `/skills/semec-ds-lite/SKILL.md` — skill lite (tokens + a11y + responsive, sem React)",
        "- No repositório: `.claude/skills/semec-ds/SKILL.md` e `.opencode/skills/semec-ds/SKILL.md`",
      ]
    : [
        "- `semec-ds/SKILL.md` — skill full (`@semec/ds/skills/semec-ds`)",
        "- `semec-ds-lite/SKILL.md` — skill lite (`@semec/ds/lite/skills/semec-ds-lite`)",
      ];

  const artifactPaths = lite
    ? site
      ? [
          "- `/manifest.json` — JSON com categorias e tokens",
          "- `/skills/semec-ds-lite/SKILL.md` — skill lite",
        ]
      : [
          "- `llms.txt` — este índice",
          "- `manifest.json` — JSON com categorias e tokens",
          "- `semec-ds-lite/SKILL.md` — skill lite",
        ]
    : site
      ? [
          "- `/manifest.json` — JSON com todos componentes + prompts",
          "- `/llms-full.txt` — dump concatenado (tokens + todos componentes + prompts)",
          "- `/components/<slug>.md` — 1 md por componente (chunk RAG)",
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
      "```css",
      '@import "tailwindcss";',
      '@import "@semec/ds/react/tokens.css";',
      '@config "@semec/ds/react/pv-preset";',
      "```",
      "",
      "## Inclui",
      "",
      "- Tokens de identidade visual (L0 + L1)",
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
      "## Crédito obrigatório",
      "",
      "Incluir no README.md do projeto:",
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
    "## Instalar",
    "",
    "```bash",
    "npm install @semec/ds",
    "```",
    "",
    "```css",
    '@import "tailwindcss";',
    '@import "@semec/ds/react/tokens.css";',
    '@config "@semec/ds/react/pv-preset";',
    "```",
    "",
    "## Categorias",
    "",
  ];

  for (const cat of dsCategories) {
    lines.push(`- **${cat.label}** (\`${cat.slug}\`) — ${cat.desc}`);
  }

  lines.push("", `## Componentes (${dsComponents.length})`, "");

  for (const c of dsComponents) {
    const importName =
      c.code.charAt(0).toUpperCase() + c.code.slice(1).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    if (site) {
      lines.push(
        `- [${c.label} (\`${c.code}\`) — ${c.desc}](/componentes/${c.slug}) — \`${c.file}\` — md: \`/components/${c.slug}.md\``
      );
    } else {
      lines.push(
        `- [${c.label} (\`${c.code}\`) — ${c.desc}](components/${c.slug}.md) — \`${c.file}\``
      );
    }
    lines.push(`  Uso: \`import { ${importName} } from "@semec/ds/react";\``);
  }

  lines.push(
    "",
    "## Padrões",
    "",
    site
      ? "Padrões em `/padroes/*` (navegação, formulários, dados-relatórios, feedback, acessibilidade). Exemplos interativos em `/components/demos/examples/*` e `/components/demos/patterns/*`."
      : "Padrões documentados no site de documentação; skills em `semec-ds/` e `semec-ds-lite/`.",
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
      ? "3. Copie snippet de `/components/<slug>.md#uso` ou `/manifest.json`"
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
  full += `## Instalação\n\n\`\`\`bash\nnpm install @semec/ds\n\`\`\`\n\n`;
  full += `## packages/react/src/index.ts — barrel\n\n\`\`\`ts\n${baseIndex}\n\`\`\`\n\n`;
  full += `## packages/react/tokens.css\n\n\`\`\`css\n${tokensCss}\n\`\`\`\n\n`;
  full += `## packages/react/pv-preset.ts\n\n\`\`\`ts\n${pvPreset}\n\`\`\`\n\n`;
  full += `## Manifest — categorias\n\n\`\`\`json\n${JSON.stringify(dsCategories, null, 2)}\n\`\`\`\n\n`;
  full += `## Manifest — package.json\n\n\`\`\`json\n${JSON.stringify({ name: pkgJson.name, version }, null, 2)}\n\`\`\`\n\n`;
  full += `## Componentes — todos (${dsComponents.length})\n`;

  for (const c of dsComponents) {
    const src = componentSource(c);
    full += `\n### ${c.label} (\`${c.code}\`) — \`${c.file}\` — slug: ${c.slug}\n\n`;
    full += `Desc: ${c.desc}\n\n`;
    if (c.variants?.length) {
      full += `Variantes: ${c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ")}\n\n`;
    }
    full += `Uso:\n\`\`\`tsx\n${c.usage}\n\`\`\`\n\nPrompt:\n\`\`\`text\n${dsPrompt(c)}\n\`\`\`\n\nFonte:\n\`\`\`tsx\n${src}\n\`\`\`\n\n---\n`;
  }

  if (baseReadme) {
    full += `\n## packages/react/README.md\n\n\`\`\`md\n${baseReadme}\n\`\`\`\n`;
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

  copyFile(fullSkillSrc, path.join(skillsDir, "semec-ds", "SKILL.md"));
  console.log("  copied skills/semec-ds/SKILL.md");

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
        install: {
          tokens: 'import "@semec/ds/react/tokens.css";',
          preset: '@config "@semec/ds/react/pv-preset";',
        },
        tokens: {
          files: ["tokens.css", "pv-preset.ts"],
          primitives: "pv-* prefixed (L0)",
          semantic: "L1 — --bg, --fg, --surface, --action-primary, --feedback-*, etc.",
        },
        accessibility: {
          standard: "WCAG 2.1 AA (ADR-014)",
          contrast: "4.5:1 texto normal, 3:1 texto grande/UI",
          focus: ":focus-visible com --focus-ring (2px solid, 2px offset)",
          keyboard: "Tab, Enter, Escape, setas",
          touchTargets: "44px mínimo",
        },
        responsive: {
          breakpoints: "sm:640 md:768 lg:1024 xl:1280 2xl:1536",
          sidebar: "drawer off-canvas + inert em mobile",
          density: "data-density='compact' para admin",
        },
        credit: {
          required: true,
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

  copyFile(liteSkillSrc, path.join(liteDir, "semec-ds-lite", "SKILL.md"));
  console.log("  copied dist/lite/semec-ds-lite/SKILL.md");
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

  copyFile(fullSkillSrc, path.join(publicDir, "skills", "semec-ds", "SKILL.md"));
  copyFile(liteSkillSrc, path.join(publicDir, "skills", "semec-ds-lite", "SKILL.md"));
  console.log("  copied public/skills/semec-ds + semec-ds-lite");
}

// --- agent-dirs ---
function buildAgentDirs() {
  console.log("→ agent-dirs (.claude / .opencode)");
  const claudeDest = path.join(repoRoot, ".claude", "skills", "semec-ds", "SKILL.md");
  const opencodeDest = path.join(repoRoot, ".opencode", "skills", "semec-ds", "SKILL.md");
  copyFile(fullSkillSrc, claudeDest);
  copyFile(fullSkillSrc, opencodeDest);
  console.log("  copied .claude/skills/semec-ds/SKILL.md");
  console.log("  copied .opencode/skills/semec-ds/SKILL.md");
}

// --- run ---
if (targets.has("dist")) buildDist();
if (targets.has("docs-public")) buildDocsPublic();
if (targets.has("agent-dirs")) buildAgentDirs();

console.log(`\nbuild-artifacts: done (version ${version}, target ${targetArg}).`);
