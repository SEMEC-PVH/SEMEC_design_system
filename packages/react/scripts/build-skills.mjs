#!/usr/bin/env node
/**
 * build-skills.mjs — Copia artefatos estáticos e gera artefatos LLM para dist/.
 * Roda após tsup: node scripts/build-skills.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(__dirname, "../../..");
const distDir = path.join(pkgRoot, "dist");

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

// --- 1. Copiar CSS para dist/react/ ---
const cssFiles = ["tokens.css", "shadcn.css"];
for (const file of cssFiles) {
  const src = path.join(pkgRoot, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(distDir, "react", file));
    console.log(`  copied ${file}`);
  }
}

// --- 2. Copiar pv-preset.ts original para dist/react/ ---
const pvSrc = path.join(pkgRoot, "pv-preset.ts");
if (fs.existsSync(pvSrc)) {
  copyFile(pvSrc, path.join(distDir, "react", "pv-preset.ts"));
  console.log("  copied pv-preset.ts");
}

// --- 3. Copiar manifest.js para dist/skills/ ---
const manifestSrc = path.join(pkgRoot, "manifest.js");
if (fs.existsSync(manifestSrc)) {
  copyFile(manifestSrc, path.join(distDir, "skills", "manifest.js"));
  console.log("  copied manifest.js");
}

// --- 4. Gerar artefatos LLM ---
const manifestUrl = pathToFileURL(manifestSrc).href;
const { dsComponents, dsCategories, dsPrompt } = await import(manifestUrl);

const skillsDir = path.join(distDir, "skills");
const componentsDir = path.join(skillsDir, "components");
mkdirp(componentsDir);

const tokensCss = readFileSafe("packages/react/tokens.css") ?? "";
const shadcnCss = readFileSafe("packages/react/shadcn.css") ?? "";
const barrel = readFileSafe("packages/react/src/index.ts") ?? "";

// --- llms.txt ---
const llmsLines = [
  "# SEMEC Design System — Arquivos para IA",
  "",
  "Kit `@semec/ds` (React + Tailwind v4 + shadcn + Radix + CVA). Conteúdo PT-BR, código EN.",
  "",
  "## Categorias",
  "",
  ...dsCategories.map(
    (c) => `- **${c.label}** (\`${c.key}\`): ${c.desc}  \n  slug: ${c.slug}`
  ),
  "",
  "## Componentes",
  "",
  ...dsComponents.map(
    (c) =>
      `- [${c.label}](components/${c.slug}.md) — \`${c.code}\` (${c.file})  \n  \`\`\`tsx\nimport { ${c.code.charAt(0).toUpperCase() + c.code.slice(1).replace(/-([a-z])/g, (_, l) => l.toUpperCase())} } from "@semec/ds/react";\n\`\`\``
  ),
  "",
  "## Tokens",
  "",
  "- `tokens.css` — primitives L0 + semânticos L1 + dark theme",
  "- `shadcn.css` — variáveis HSL shadcn",
  "- `pv-preset.ts` — preset Tailwind v4 (JS config)",
  "",
  "## Arquivos para IA",
  "",
  "- `llms.txt` — este índice",
  "- `llms-full.txt` — dump completo",
  "- `manifest.json` — JSON para consumo por máquinas",
  "- `components/<slug>.md` — chunk RAG por componente",
];
fs.writeFileSync(path.join(skillsDir, "llms.txt"), llmsLines.join("\n"), "utf8");
console.log("  generated llms.txt");

// --- llms-full.txt ---
const baseIndex = readFileSafe("packages/react/src/index.ts") ?? "";
const pvPreset = readFileSafe("packages/react/pv-preset.ts") ?? "";

let full = `# SEMEC Design System — Dump completo para IA\n\n`;
full += `> Gerado ${new Date().toISOString()} — packages/react/manifest.js + packages/react/*\n\n`;
full += `## packages/react/src/index.ts — barrel\n\n\`\`\`ts\n${baseIndex}\n\`\`\`\n\n`;
full += `## packages/react/tokens.css\n\n\`\`\`css\n${tokensCss}\n\`\`\`\n\n`;
full += `## packages/react/shadcn.css\n\n\`\`\`css\n${shadcnCss}\n\`\`\`\n\n`;
full += `## packages/react/pv-preset.ts\n\n\`\`\`ts\n${pvPreset}\n\`\`\`\n\n`;
full += `## Manifest — categorias\n\n\`\`\`json\n${JSON.stringify(dsCategories, null, 2)}\n\`\`\`\n\n`;
full += `## Componentes — todos (${dsComponents.length})\n`;

for (const c of dsComponents) {
  const src = readFileSafe(`packages/react/${c.file}` ?? "") ?? "";
  full += `\n### ${c.label} (\`${c.code}\`) — \`${c.file}\` — slug: ${c.slug}\n\n`;
  full += `Desc: ${c.desc}\n\n`;
  if (c.variants.length) full += `Variantes: ${c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ")}\n\n`;
  full += `Uso:\n\`\`\`tsx\n${c.usage}\n\`\`\`\n\nPrompt:\n\`\`\`text\n${dsPrompt(c)}\n\`\`\`\n\nFonte:\n\`\`\`tsx\n${src}\n\`\`\`\n\n---\n`;
}

fs.writeFileSync(path.join(skillsDir, "llms-full.txt"), full, "utf8");
console.log(`  generated llms-full.txt (${(full.length / 1024).toFixed(1)} KB)`);

// --- manifest.json ---
const manifestJson = {
  name: "SEMEC Design System",
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  categories: dsCategories,
  components: dsComponents.map((c) => ({
    ...c,
    prompt: dsPrompt(c),
  })),
  install: {
    tokens: 'import "@semec/ds/react/tokens.css";',
    shadcn: 'import "@semec/ds/react/shadcn.css";',
    preset: '@config "../pv-preset.ts";',
    utils: 'import { cn } from "@semec/ds/react";',
  },
  tokens: {
    files: ["tokens.css", "shadcn.css", "pv-preset.ts"],
  },
};
fs.writeFileSync(
  path.join(skillsDir, "manifest.json"),
  JSON.stringify(manifestJson, null, 2),
  "utf8"
);
console.log("  generated manifest.json");

// --- per-component .md ---
for (const c of dsComponents) {
  const source = readFileSafe(c.file) ?? "";
  const usage = c.usage ?? "";
  const variants = c.variants ?? [];
  const variantLines = variants
    .map((v) => `- **${v.prop}**: ${v.values}`)
    .join("\n");
  const prompt = dsPrompt(c);

  const md = [
    `---`,
    `title: "${c.label}"`,
    `code: "${c.code}"`,
    `slug: "${c.slug}"`,
    `file: "${c.file}"`,
    `category: "${c.category}"`,
    `variants: "${variants.map((v) => `${v.prop}: ${v.values}`).join(" · ")}"`,
    `---`,
    ``,
    `# ${c.label} — \`${c.code}\``,
    `> ${c.desc}`,
    ``,
    `**Arquivo:** \`${c.file}\` | **Categoria:** \`${c.category}\``,
    ``,
    `## Variantes`,
    variantLines || "_Sem variantes._",
    ``,
    `## Instalação (@semec/ds)`,
    "```bash",
    'npm install @semec/ds',
    "```",
    "```css",
    '@import "@semec/ds/react/tokens.css";',
    '@import "@semec/ds/react/shadcn.css";',
    "```",
    ``,
    `## Uso`,
    "```tsx",
    usage,
    "```",
    ``,
    `## Prompt para IA`,
    "```",
    prompt,
    "```",
    ``,
    `## Fonte`,
    "```tsx",
    source,
    "```",
    ``,
    `---`,
    `Gerado a partir de packages/react/manifest.js — não edite manualmente.`,
  ].join("\n");

  fs.writeFileSync(path.join(componentsDir, `${c.slug}.md`), md, "utf8");
}
console.log(`  generated ${dsComponents.length} component .md files`);

// --- 5. Copiar skill genérico ---
const skillSrc = path.join(pkgRoot, "SKILL.md");
if (fs.existsSync(skillSrc)) {
  copyFile(skillSrc, path.join(skillsDir, "ds-semec-skill.md"));
  console.log("  copied ds-semec-skill.md");
}

console.log("\nbuild-skills: done.");
