#!/usr/bin/env node
/**
 * Reescreve os especificadores relativos dos `.d.ts` emitidos pelo `tsc`
 * (`dist/react/**`) para incluir a extensão `.js` (AUD-40).
 *
 * O código-fonte usa `moduleResolution: "bundler"` e importa sem extensão
 * (`export * from "./components/button"`). O `tsc` copia esses especificadores
 * para os `.d.ts`; um consumidor com `moduleResolution: "node16"`/`"nodenext"`
 * (pacote `"type": "module"`) não resolve import relativo sem extensão e perde
 * todos os tipos (TS2305). Com `.js` (ou `/index.js`), os tipos funcionam em
 * `bundler`, `node16` e `nodenext`.
 *
 * Falha o build se algum especificador relativo não corresponder a um `.d.ts`
 * emitido, para que uma regressão não passe em silêncio.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const typesDir = path.join(pkgRoot, "dist", "react");

// from "./x" | import("./x") | import "./x" | export ... from "./x"
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.\.?\/[^"']*)\2/g;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function resolveSpecifier(fromFile, spec) {
  if (/\.(js|mjs|cjs|json|css)$/.test(spec)) return spec;
  const base = path.resolve(path.dirname(fromFile), spec);
  if (fs.existsSync(`${base}.d.ts`)) return `${spec}.js`;
  if (fs.existsSync(path.join(base, "index.d.ts"))) return `${spec.replace(/\/$/, "")}/index.js`;
  return null;
}

if (!fs.existsSync(typesDir)) {
  console.error(`fix-dts-extensions: ${typesDir} não existe. Rode o tsc antes.`);
  process.exit(1);
}

const unresolved = [];
let rewritten = 0;
const files = walk(typesDir);

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const next = src.replace(SPECIFIER, (match, lead, quote, spec) => {
    const fixed = resolveSpecifier(file, spec);
    if (fixed === null) {
      unresolved.push(`${path.relative(pkgRoot, file)}: "${spec}"`);
      return match;
    }
    if (fixed !== spec) rewritten++;
    return `${lead}${quote}${fixed}${quote}`;
  });
  if (next !== src) fs.writeFileSync(file, next);
}

if (unresolved.length > 0) {
  console.error("fix-dts-extensions: especificadores relativos sem .d.ts correspondente:");
  for (const u of unresolved) console.error(`  - ${u}`);
  process.exit(1);
}

console.log(`fix-dts-extensions: ${rewritten} especificador(es) reescrito(s) em ${files.length} arquivo(s) .d.ts.`);
