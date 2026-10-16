import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Suíte do @semec/ds (AUD-45). Testes em `test/` (pasta separada, para não
 * tocar os arquivos de componente) e rodando contra `src/`, sem build.
 *
 * Os fixtures do gate (`scripts/gate/*.mjs`) importam o bundle de `dist/`;
 * aqui esse import é redirecionado para `src/index.ts`, para que suíte e gate
 * usem os mesmos fixtures sem exigir `build:ds` antes de `npm test`.
 */
const distToSrc = {
  find: /^.*\/packages\/react\/dist\/react\/index\.js$/,
  replacement: path.join(here, "src/index.ts"),
};

/**
 * As demos do site importam o kit por `semec-ds/react`, que aponta para o
 * `dist/` (inexistente no job `test` da CI, que não roda `build:ds`). Nos
 * testes que renderizam essas demos, o alias aponta para `src/index.ts`.
 */
const demoAlias = {
  find: /^semec-ds\/react$/,
  replacement: path.join(here, "src/index.ts"),
};

export default defineConfig({
  resolve: { alias: [distToSrc, demoAlias] },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "kit",
          environment: "jsdom",
          include: ["test/**/*.test.{ts,tsx}"],
          setupFiles: ["test/setup.ts"],
          env: { ZOD_MAJOR: "4" },
        },
      },
      {
        // Mesmos testes de validação com zod 3 (peer aceita ^3.23.0 || ^4.0.0).
        // `zod3` é um alias npm (`npm:zod@^3.25`) nas devDependencies.
        extends: true,
        resolve: { alias: [distToSrc, demoAlias, { find: /^zod$/, replacement: "zod3" }] },
        test: {
          name: "zod3",
          environment: "node",
          include: ["test/validacao.test.ts"],
          env: { ZOD_MAJOR: "3" },
        },
      },
    ],
  },
});
