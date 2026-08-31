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

  // Sobrescreve os ignores padrão do eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "legacy/**",
    "base/**",
  ]),
]);

export default eslintConfig;
