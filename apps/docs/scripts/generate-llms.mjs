#!/usr/bin/env node
/**
 * generate-llms.mjs — Gera manifest + llms.txt + llms-full.txt + per-component .md
 * Fonte única: packages/react/manifest.js
 * Roda: node scripts/generate-llms.mjs
 * Saída: public/manifest.json, public/llms.txt, public/llms-full.txt, public/components/<slug>.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, ".."); // apps/docs
const root = path.resolve(__dirname, "../../.."); // raiz do monorepo

// dynamic import ESM manifest (packages/react/manifest.js é ESM puro)
const manifestUrl = path.join(root, "packages/react/manifest.js");
const { dsComponents, dsCategories, dsPrompt } = await import(manifestUrl);

const publicDir = path.join(siteRoot, "public");
const componentsOutDir = path.join(publicDir, "components");
fs.mkdirSync(componentsOutDir, { recursive: true });

// read helpers
function readFileSafe(rel) {
  try { return fs.readFileSync(path.join(root, rel), "utf8"); } catch { return null; }
}
function readBase(rel) { return readFileSafe(rel) ?? ""; }

const tokensCss = readBase("packages/react/tokens.css");
const shadcnCss = readBase("packages/react/shadcn.css");
const pvPreset = readBase("packages/react/pv-preset.ts");
const baseReadme = readBase("packages/react/README.md");
const baseIndex = readBase("packages/react/src/index.ts");

// Build manifest.json
const manifest = {
  name: "SEMEC Design System",
  version: JSON.parse(readBase("packages/react/package.json") || '{"version":"0.1.0"}').version,
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
    tokens: "packages/react/tokens.css",
    shadcn: "packages/react/shadcn.css",
    preset: "packages/react/pv-preset.ts",
    utils: "packages/react/src/lib/utils.ts",
  },
  tokens: { files: ["packages/react/tokens.css", "packages/react/shadcn.css", "packages/react/pv-preset.ts"] },
};

fs.writeFileSync(path.join(publicDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

// per-component .md
for (const c of dsComponents) {
  const source = readBase(`packages/react/${c.file}`) ?? "";
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

## Instalação (@semec/ds/react)

\`\`\`bash
# 1. Copie packages/react/ para seu projeto (ou instale @semec/ds/react pelo registry)
# 2. Instale deps (ver packages/react/README.md)
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

Tokens semânticos usados: \`--bg\`, \`--fg\`, \`--surface\`, \`--border\`, \`--focus-ring\`, \`--color-action-primary\` etc. Ver \`packages/react/tokens.css\` e \`packages/react/shadcn.css\` no dump completo (\`/llms-full.txt\`).

---
Gerado a partir de \`packages/react/manifest.js\` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
`;
  fs.writeFileSync(path.join(componentsOutDir, `${c.slug}.md`), md, "utf8");
}

// llms.txt — índice leve
const siteUrl = "https://semec-pvh.github.io/SEMEC_design_system"; // fallback, sem url exata conhecida
let llms = `# SEMEC Design System — SEMEC Digital (Porto Velho)

> Kit @semec/ds/react (React + Tailwind v4 + shadcn + Radix + CVA). Conteúdo PT-BR, código EN (ADR-016). Tema via [data-theme="dark"] (ADR-012).

## Instalar

Ver \`packages/react/README.md\` e \`/llms-full.txt#instalacao\`. Copie \`packages/react/\`, importe \`packages/react/tokens.css\` + \`packages/react/shadcn.css\`.

## Categorias

`;
for (const cat of dsCategories) {
  llms += `- **${cat.label}** (\`${cat.slug}\`) — ${cat.desc}\n`;
}
llms += `\n## Componentes (${dsComponents.length})\n\n`;
for (const c of dsComponents) {
  llms += `- [${c.label} (\`${c.code}\`) — ${c.desc}](/componentes/${c.slug}) — \`${c.file}\` — md: \`/components/${c.slug}.md\`\n`;
  llms += `  Uso: \`${c.usage.split("\n")[0].trim()}\`\n`;
}
llms += `\n## Padrões

Padrões em \`/padroes/*\` (navegação, formulários, dados-relatórios, feedback, acessibilidade). Exemplos interativos em \`/components/demos/examples/*\` e \`/components/demos/patterns/*\`.

## Tokens

- \`packages/react/tokens.css\` — primitivos pv-* + semânticos + @theme inline + [data-theme="dark"]
- \`packages/react/shadcn.css\` — mapeamento HSL shadcn
- \`packages/react/pv-preset.ts\` — preset Tailwind @config

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

> Gerado em ${new Date().toISOString()} a partir de packages/react/manifest.js. Site: ${siteUrl}
`;

fs.writeFileSync(path.join(publicDir, "llms.txt"), llms, "utf8");

// llms-full.txt — dump completo
let full = `# SEMEC Design System — Dump completo para IA

> Gerado ${new Date().toISOString()} — packages/react/manifest.js + packages/react/*

## Instalação — packages/react/README.md

\`\`\`md
${baseReadme}
\`\`\`

## packages/react/src/index.ts — barrel

\`\`\`ts
${baseIndex}
\`\`\`

## packages/react/tokens.css

\`\`\`css
${tokensCss}
\`\`\`

## packages/react/shadcn.css

\`\`\`css
${shadcnCss}
\`\`\`

## packages/react/pv-preset.ts

\`\`\`ts
${pvPreset}
\`\`\`

## Manifest — categorias

\`\`\`json
${JSON.stringify(dsCategories, null, 2)}
\`\`\`

## Componentes — todos (${dsComponents.length})

`;

for (const c of dsComponents) {
  const src = readBase(`packages/react/${c.file}`) ?? "";
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
