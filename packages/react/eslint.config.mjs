import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

/**
 * Lint do kit (TST-34a): o eslint do site (apps/docs) ignora packages/react,
 * então os componentes publicados rodavam sem jsx-a11y. Aqui só o conjunto
 * `recommended` do jsx-a11y sobre src/ (TS/TSX, parser do typescript-eslint,
 * sem regras de estilo nem type-aware).
 */
export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**"]),
  {
    name: "semec-ds/jsx-a11y-recommended",
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },

  // Exceções revisadas uma a uma (16/10/2026). Cada uma é falso positivo ou
  // padrão intencional com teste; não abra exceção nova sem justificar aqui.
  {
    name: "semec-ds/jsx-a11y-excecoes-anchor",
    // <a ref={ref} {...props} />: o conteúdo chega por `children` dentro de
    // `props`, que a regra não enxerga. Nome acessível coberto em navegacao.test.
    files: ["src/components/footer.tsx", "src/components/header.tsx", "src/components/link.tsx"],
    rules: { "jsx-a11y/anchor-has-content": "off" },
  },
  {
    name: "semec-ds/jsx-a11y-excecoes-combobox",
    // <li role="option"> com onClick: padrão APG de combobox com
    // aria-activedescendant; o teclado fica no campo de busca (padroes-apg.test).
    files: ["src/components/combobox.tsx"],
    rules: { "jsx-a11y/click-events-have-key-events": "off" },
  },
  {
    name: "semec-ds/jsx-a11y-excecoes-file-upload",
    // Zona de soltar (div com onClick/onDrop): atalho de mouse e arrastar; o
    // caminho de teclado é o <input type="file"> nativo dentro dela, com anel
    // de foco via has-[:focus-visible] (gate check-form-submit).
    files: ["src/components/file-upload.tsx"],
    rules: {
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
    },
  },
]);
