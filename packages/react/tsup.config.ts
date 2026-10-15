import { cpSync, mkdirSync } from "node:fs";
import { defineConfig } from "tsup";

/**
 * Poppins auto-hospedada (AUD-26): `fonts.css` + `fonts/*.woff2` + OFL vão
 * para `dist/react/`, onde `@semec/ds/react/fonts.css` resolve as URLs
 * relativas `./fonts/Poppins-*.woff2`.
 */
async function copyFonts() {
  mkdirSync("dist/react", { recursive: true });
  cpSync("fonts.css", "dist/react/fonts.css");
  cpSync("fonts", "dist/react/fonts", { recursive: true });
}

export default defineConfig([
  {
    entry: {
      "react/index": "src/index.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
    sourcemap: true,
    splitting: true,
    external: [
      /^@radix-ui/,
      "react",
      "react-dom",
      "react/jsx-runtime",
      "lucide-react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "zod",
      "get-nonce",
    ],
  },
  {
    entry: {
      "react/validacao": "src/validacao.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
    sourcemap: true,
    external: ["zod"],
  },
  {
    entry: {
      "react/server": "src/server.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
    platform: "node",
    external: [/^node:/],
  },
  {
    entry: {
      "react/pv-preset": "src/pv-preset.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
    external: ["tailwindcss"],
    onSuccess: copyFonts,
  },
  {
    entry: {
      "skills/index": "src/skills/index.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
  },
  {
    entry: {
      "lite/index": "src/lite/index.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
  },
  {
    entry: {
      "lite/skills": "src/lite/skills.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
  },
]);
