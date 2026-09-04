#!/usr/bin/env node
/**
 * generate-llms.mjs — Gera manifest + llms.txt + llms-full.txt + per-component .md
 * Fonte única: lib/base-manifest.js
 * Roda: node scripts/generate-llms.mjs
 * Saída: public/manifest.json, public/llms.txt, public/llms-full.txt, public/components/<slug>.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// dynamic import ESM manifest (lib/base-manifest.js é ESM puro)
const manifestUrl = path.join(root, "lib/base-manifest.js");
const { dsComponents, dsCategories, dsPrompt } = await import(manifestUrl);

const publicDir = path.join(root, "public");
const componentsOutDir = path.join(publicDir, "components");
fs.mkdirSync(componentsOutDir, { recursive: true });

// read helpers
function readFileSafe(rel) {
  try { return fs.readFileSync(path.join(root, rel), "utf8"); } catch { return null; }
}
function readBase(rel) { return readFileSafe(rel) ?? ""; }

const tokensCss = readBase("base/tokens.css");
const shadcnCss = readBase("base/shadcn.css");
const pvPreset = readBase("base/pv-preset.ts");
const baseReadme = readBase("base/README.md");
const baseIndex = readBase("base/index.ts");

// Build manifest.json
const manifest = {
  name: "SEMEC Design System",
  version: JSON.parse(readBase("package.json") || '{"version":"0.1.0"}').version,
  generatedAt: new Date().toISOString(),
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
    url: `/componentes/${c.slug}`,
    md: `/components/${c.slug}.md`,
  })),
  install: {
    tokens: "base/tokens.css",
    shadcn: "base/shadcn.css",
    preset: "base/pv-preset.ts",
    utils: "base/lib/utils.ts",
  },
  tokens: { files: ["base/tokens.css", "base/shadcn.css", "base/pv-preset.ts"] },
};

fs.writeFileSync(path.join(publicDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

// per-component .md
for (const c of dsComponents) {
  const source = readBase(c.file) ?? "";
  const variantsLine = c.variants.length ? c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ") : "—";
  const md = `---
title: "${c.label}"
code: "${c.code}"
slug: "${c.slug}"
file: "${c.file}"
category: "${c.category}"
variants: "${variantsLine.replace(/"/g, "'")}"
---

# ${c.label} — \`${c.code}\`

> ${c.desc}

**Arquivo:** \`${c.file}\` | **Categoria:** ${dsCategories.find((x) => x.key === c.category)?.label ?? c.category} | **Rota:** \`/componentes/${c.slug}\`

## Variantes

${c.variants.length ? c.variants.map((v) => `- **${v.prop}**: ${v.values}`).join("\n") : "_Sem variantes_"}

## Instalação (kit @semec/base)

\`\`\`bash
# 1. Copie base/ para seu projeto
# 2. Instale deps (ver base/README.md)
npm i class-variance-authority clsx tailwind-merge lucide-react \\
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \\
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \\
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \\
  @radix-ui/react-toast @radix-ui/react-tooltip
\`\`\`

\`\`\`css
/* globals.css */
@import "tailwindcss";
@import "./base/tokens.css";
@import "./base/shadcn.css";
/* ou @config "./base/pv-preset.ts" */
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

Tokens semânticos usados: \`--bg\`, \`--fg\`, \`--surface\`, \`--border\`, \`--focus-ring\`, \`--color-action-primary\` etc. Ver \`base/tokens.css\` e \`base/shadcn.css\` no dump completo (\`/llms-full.txt\`).

---
Gerado a partir de \`lib/base-manifest.js\` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
`;
  fs.writeFileSync(path.join(componentsOutDir, `${c.slug}.md`), md, "utf8");
}

// llms.txt — índice leve
const siteUrl = "https://semec-pvh.github.io/SEMEC_design_system"; // fallback, sem url exata conhecida
let llms = `# SEMEC Design System — SEMEC Digital (Porto Velho)

> Kit @semec/base (React + Tailwind v4 + shadcn + Radix + CVA). Conteúdo PT-BR, código EN (ADR-016). Tema via [data-theme="dark"] (ADR-012).

## Instalar

Ver \`base/README.md\` e \`/llms-full.txt#instalacao\`. Copie \`base/\`, importe \`base/tokens.css\` + \`base/shadcn.css\`.

## Categorias

`;
for (const cat of dsCategories) {
  llms += `- **${cat.label}** (\`${cat.slug}\`) — ${cat.desc}\n`;
}
llms += `\n## Componentes (26)\n\n`;
for (const c of dsComponents) {
  llms += `- [${c.label} (\`${c.code}\`) — ${c.desc}](/componentes/${c.slug}) — \`${c.file}\` — md: \`/components/${c.slug}.md\`\n`;
  llms += `  Uso: \`${c.usage.split("\n")[0].trim()}\`\n`;
}
llms += `\n## Padrões

Padrões em \`/padroes/*\` (navegação, formulários, dados-relatórios, feedback, acessibilidade). Exemplos interativos em \`/components/demos/examples/*\` e \`/components/demos/patterns/*\`.

## Tokens

- \`base/tokens.css\` — primitivos pv-* + semânticos + @theme inline + [data-theme="dark"]
- \`base/shadcn.css\` — mapeamento HSL shadcn
- \`base/pv-preset.ts\` — preset Tailwind @config

## Arquivos para IA

- \`/manifest.json\` — JSON com todos componentes + prompts
- \`/llms-full.txt\` — dump concatenado (tokens + todos componentes + prompts)
- \`/components/<slug>.md\` — 1 md por componente (chunk RAG)
- \`.claude/skills/semec-ds/SKILL.md\` e \`.opencode/skills/semec-ds/skill.md\`

## Uso IA

1. Leia \`/llms.txt\` (este arquivo)
2. Escolha componente por slug/code
3. Copie snippet de \`/components/<slug>.md#uso\` ou \`/manifest.json\`
4. Aplique tokens L1 (\`--color-action-primary\` etc.), nunca hex solto

> Gerado em ${new Date().toISOString()} a partir de lib/base-manifest.js. Site: ${siteUrl}
`;

fs.writeFileSync(path.join(publicDir, "llms.txt"), llms, "utf8");

// llms-full.txt — dump completo
let full = `# SEMEC Design System — Dump completo para IA

> Gerado ${new Date().toISOString()} — lib/base-manifest.js + base/*

## Instalação — base/README.md

\`\`\`md
${baseReadme}
\`\`\`

## base/index.ts — barrel

\`\`\`ts
${baseIndex}
\`\`\`

## base/tokens.css

\`\`\`css
${tokensCss}
\`\`\`

## base/shadcn.css

\`\`\`css
${shadcnCss}
\`\`\`

## base/pv-preset.ts

\`\`\`ts
${pvPreset}
\`\`\`

## Manifest — categorias

\`\`\`json
${JSON.stringify(dsCategories, null, 2)}
\`\`\`

## Componentes — todos (26)

`;

for (const c of dsComponents) {
  const src = readBase(c.file) ?? "";
  full += `\n### ${c.label} (\`${c.code}\`) — \`${c.file}\` — slug: ${c.slug}\n\n`;
  full += `Desc: ${c.desc}\n\n`;
  if (c.variants.length) full += `Variantes: ${c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ")}\n\n`;
  full += `Uso:\n\`\`\`tsx\n${c.usage}\n\`\`\`\n\nPrompt:\n\`\`\`text\n${dsPrompt(c)}\n\`\`\`\n\nFonte:\n\`\`\`tsx\n${src}\n\`\`\`\n\n---\n`;
}

fs.writeFileSync(path.join(publicDir, "llms-full.txt"), full, "utf8");

console.log(`✓ manifest.json (${manifest.components.length} components)`);
console.log(`✓ llms.txt`);
console.log(`✓ llms-full.txt (${(full.length/1024).toFixed(1)} KB)`);
console.log(`✓ ${dsComponents.length} × public/components/<slug>.md`);
