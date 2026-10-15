#!/usr/bin/env node
/**
 * Gera os `.d.ts` de `@semec/ds/skills` e `@semec/ds/lite/skills` (4.0.1).
 *
 * Os dois entries reexportam dados do `manifest.js` (JavaScript puro), fora do
 * `tsconfig.json` do kit. O `tsconfig.skills.json` compila só esses entries com
 * `allowJs` (o `tsc` confere os dados do manifesto contra os tipos de
 * `src/skills/types.ts`) e emite numa pasta temporária; daqui saem só os
 * `.d.ts` publicados, com a extensão `.js` nos imports relativos (nodenext):
 *
 *   src/skills/index.ts → dist/skills/index.d.ts
 *   src/skills/types.ts → dist/skills/types.d.ts
 *   src/lite/skills.ts  → dist/lite/skills.d.ts
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(pkgRoot, "dist", ".types-skills");
const tsc = createRequire(path.join(pkgRoot, "package.json")).resolve("typescript/bin/tsc");

const outputs = [
  ["src/skills/index.d.ts", "dist/skills/index.d.ts"],
  ["src/skills/types.d.ts", "dist/skills/types.d.ts"],
  ["src/lite/skills.d.ts", "dist/lite/skills.d.ts"],
];

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.\.?\/[^"']*)\2/g;

let status = 0;
try {
  fs.rmSync(tmp, { recursive: true, force: true });
  const result = spawnSync(process.execPath, [tsc, "-p", path.join(pkgRoot, "tsconfig.skills.json"), "--outDir", tmp], {
    cwd: pkgRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    console.error("build-skills-types: o tsc falhou em tsconfig.skills.json:");
    console.error((result.stdout || "") + (result.stderr || ""));
    status = 1;
  } else {
    const published = new Set(outputs.map(([, to]) => path.join(pkgRoot, to)));
    for (const [from, to] of outputs) {
      const target = path.join(pkgRoot, to);
      const src = fs.readFileSync(path.join(tmp, from), "utf8");
      const fixed = src.replace(SPECIFIER, (match, lead, quote, spec) => {
        const withExt = /\.js$/.test(spec) ? spec : `${spec}.js`;
        const dts = path.resolve(path.dirname(target), withExt.replace(/\.js$/, ".d.ts"));
        if (!published.has(dts)) {
          console.error(`build-skills-types: ${to} importa "${spec}", que não é um .d.ts publicado.`);
          status = 1;
        }
        return `${lead}${quote}${withExt}${quote}`;
      });
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, fixed);
    }
    if (status === 0) console.log(`build-skills-types: ${outputs.length} .d.ts gerados (skills, lite/skills).`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(status);
