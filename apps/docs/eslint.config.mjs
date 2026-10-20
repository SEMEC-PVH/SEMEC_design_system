import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import jsxA11y from "eslint-plugin-jsx-a11y";

// `next lint` foi removido no Next.js 16 — a checagem roda pela CLI do ESLint
// (`eslint .`) usando flat config. Ver:
// node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md
const eslintConfig = defineConfig([
  ...nextVitals,

  // `eslint-config-next` já registra o plugin `jsx-a11y`, mas ativa apenas um
  // subconjunto de regras. Aqui subimos para o conjunto `recommended` completo
  // (só as regras: o plugin não é re-registrado para não conflitar).
  {
    name: "semec/jsx-a11y-recommended",
    files: ["**/*.{js,jsx,mjs}"],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },

  // APIs do kit depreciadas na 4.1 e removidas na 5.0 (TST-34b, ADR-013). O site
  // não pode depender delas: a raiz do pacote vem de `@/lib/ds-package-root` e
  // `digits(v)` vira `v.replace(/\D/g, "")`.
  {
    name: "semec/sem-api-depreciada-do-kit",
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...["@semec/ds/react/server", "semec-ds/react/server"].map((name) => ({
              name,
              message: "Depreciado na 4.1, sai na 5.0. Use dsPackageRoot de @/lib/ds-package-root.",
            })),
            ...[
              "@semec/ds/react",
              "semec-ds/react",
              "@semec/ds/react/validacao",
              "semec-ds/react/validacao",
            ].map((name) => ({
              name,
              importNames: ["digits"],
              message: "digits sai na 5.0. Use valor.replace(/\\D/g, \"\").",
            })),
          ],
        },
      ],
    },
  },

  // Sobrescreve os ignores padrão do eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "legacy/**",
    "packages/react/**",
  ]),
]);

export default eslintConfig;
