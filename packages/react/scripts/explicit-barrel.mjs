#!/usr/bin/env node
/**
 * Barrel com nomes explícitos (NEXT42-01).
 *
 * O `src/index.ts` usa `export * from "./components/..."`, e o tsup copia isso
 * para `dist/react/index.js`. Num Server Component do Next, `import { X } from
 * "@semec/ds/react"` então registra como client reference TODOS os módulos
 * `"use client"` do kit (o barrel importa todos), e o JS de cliente leva o kit
 * inteiro (~77-100 kB gzip a mais, com InputOTP, Calendar, PasswordInput...).
 * O `optimizePackageImports` do Next não resolve `export *` cujo alvo não é
 * outro barrel, então também não ajudava.
 *
 * Aqui cada `export * from "./x.js"` vira `export { A, B } from "./x.js"`, com
 * os nomes lidos do próprio módulo compilado (metafile do esbuild). Com nomes
 * explícitos, o `optimizePackageImports` do Next reescreve o import do barrel
 * para o módulo de cada componente. O `index.d.ts` (tsc) continua com
 * `export *`, que só carrega tipos.
 *
 *   node scripts/explicit-barrel.mjs [dist/react/index.js]
 *
 * Roda no `build` logo depois do tsup. Falha se um módulo reexportado não
 * exportar nada (o mais provável é o build ter mudado de formato).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Nomes exportados por um módulo ESM compilado (sem bundle). */
export async function exportNames(file) {
  const result = await esbuild.build({
    entryPoints: [file],
    bundle: false,
    write: false,
    metafile: true,
    format: "esm",
    logLevel: "silent",
    outdir: "out",
  });
  const out = Object.values(result.metafile.outputs).find((o) => o.entryPoint);
  return out ? out.exports : [];
}

const STAR_RE = /^export \* from (["'])(\.\/[^"']+)\1;?$/gm;

/** Devolve o barrel com cada `export *` relativo trocado por nomes explícitos. */
export async function explicitBarrel(source, dir) {
  const stars = [...source.matchAll(STAR_RE)];
  let output = source;
  for (const m of stars) {
    const spec = m[2];
    const names = await exportNames(path.join(dir, spec));
    if (names.length === 0) throw new Error(`explicit-barrel: "${spec}" não exporta nada.`);
    output = output.replace(m[0], `export { ${[...names].sort().join(", ")} } from "${spec}";`);
  }
  return { output, count: stars.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.resolve(process.argv[2] ?? path.join(pkgRoot, "dist/react/index.js"));
  const { output, count } = await explicitBarrel(fs.readFileSync(file, "utf8"), path.dirname(file));
  fs.writeFileSync(file, output);
  console.log(`explicit-barrel: ${count} export * trocado(s) por nomes explícitos em ${path.relative(process.cwd(), file)}.`);
}
