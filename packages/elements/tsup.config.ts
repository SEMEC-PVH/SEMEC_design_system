import { defineConfig } from "tsup";

/**
 * Duas saídas, ambas ESM (ADR-027):
 * - `dist/index.js` + `dist/auto.js` (com tipos), para bundler e `import`.
 *   Com `splitting`, as classes ficam num chunk compartilhado: importar `.` e
 *   `./auto` no mesmo app registra as mesmas classes.
 * - `dist/semec-elements.js`: um arquivo só, minificado, que registra tudo ao
 *   carregar. É o arquivo do CDN (`<script type="module">`).
 */
export default defineConfig([
  {
    entry: { index: "src/index.ts", auto: "src/auto.ts" },
    outDir: "dist",
    format: "esm",
    target: "es2022",
    platform: "browser",
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: false,
    treeshake: true,
  },
  {
    entry: { "semec-elements": "src/auto.ts" },
    outDir: "dist",
    format: "esm",
    target: "es2022",
    platform: "browser",
    dts: false,
    splitting: false,
    sourcemap: true,
    minify: true,
    clean: false,
  },
]);
