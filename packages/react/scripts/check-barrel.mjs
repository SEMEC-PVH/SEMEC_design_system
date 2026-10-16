#!/usr/bin/env node
/**
 * Barrel com nomes explícitos (NEXT42-01): `dist/react/index.js` não pode ter
 * `export * from`, e precisa reexportar exatamente os nomes dos módulos que
 * cita (nada some, nada sobra).
 *
 * Por quê: num Server Component do Next (Turbopack), `import { Heading,
 * NavigationMenu } from "@semec/ds/react"` com `export *` no barrel levava
 * todos os módulos `"use client"` do kit para o JS de cliente (+77 kB gzip na
 * medição da 4.2.0). Com nomes explícitos, o JS fica igual ao do subpath.
 *
 * Requer `npm run build:ds` antes. Sai com código 1 em qualquer falha.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { exportNames } from "./explicit-barrel.mjs";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = path.join(pkgRoot, "dist", "react", "index.js");

if (!fs.existsSync(index)) {
  console.error("check-barrel: dist/react/index.js não existe. Rode `npm run build:ds` antes.");
  process.exit(1);
}

const source = fs.readFileSync(index, "utf8");
const errors = [];

const stars = [...source.matchAll(/^export \*.*$/gm)].map((m) => m[0]);
if (stars.length) {
  errors.push(
    `${stars.length} \`export *\` no barrel (ex.: ${stars[0]}). Num Server Component do Next isso leva o kit inteiro ao cliente; ` +
      "o build precisa rodar scripts/explicit-barrel.mjs depois do tsup."
  );
}

// Cada `export { ... } from "./x.js"` tem de listar exatamente o que o módulo exporta.
for (const m of source.matchAll(/^export \{([^}]*)\} from (["'])(\.\/[^"']+)\2;?$/gm)) {
  const listed = m[1]
    .split(",")
    .map((s) => s.trim().split(/\s+as\s+/).pop())
    .filter(Boolean)
    .sort();
  const actual = [...(await exportNames(path.join(path.dirname(index), m[3])))].sort();
  // `export { cn } from "./lib/utils.js"` é uma escolha (o resto de utils é interno).
  if (m[3] === "./lib/utils.js") continue;
  const missing = actual.filter((n) => !listed.includes(n));
  const extra = listed.filter((n) => !actual.includes(n));
  if (missing.length) errors.push(`${m[3]}: o barrel não reexporta ${missing.join(", ")}.`);
  if (extra.length) errors.push(`${m[3]}: o barrel cita ${extra.join(", ")}, que o módulo não exporta.`);
}

if (errors.length) {
  console.error("check-barrel: falhou:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("check-barrel: ok (barrel com nomes explícitos, igual aos módulos).");
