import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Options } from "tsup";

type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];

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

/**
 * Mantém cada import relativo (`./button`, `../lib/utils`) como import
 * externo para o módulo irmão já compilado, com a extensão `.js` que o ESM
 * puro (Node, `moduleResolution: nodenext`) exige. O código-fonte continua
 * importando sem extensão (`moduleResolution: bundler`).
 *
 * Falha o build se o alvo não existir ou não for também um entry, para que um
 * import relativo não vire, em silêncio, um caminho quebrado no `dist`.
 */
const relativeImportsAsModules: EsbuildPlugin = {
  name: "semec-relative-imports-as-modules",
  setup(build) {
    const entryRoots = ["src/index.ts", "src/components", "src/lib"].map((p) => path.resolve(p));
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (args.kind === "entry-point") return undefined;
      const base = path.resolve(args.resolveDir, args.path);
      const candidates = [".ts", ".tsx"].map((ext) => base + ext);
      const target = candidates.find((file) => existsSync(file));
      if (!target) {
        return { errors: [{ text: `Import relativo sem arquivo .ts/.tsx correspondente: "${args.path}" em ${args.importer}` }] };
      }
      const isEntry = entryRoots.some((root) => target === root || path.dirname(target) === root);
      if (!isEntry) {
        return { errors: [{ text: `"${args.path}" (em ${args.importer}) não é um entry da saída por módulo; ajuste o glob em tsup.config.ts.` }] };
      }
      return { path: `${args.path}.js`, external: true };
    });
  },
};

export default defineConfig([
  {
    // Saída por módulo (AUD-20): um arquivo em `dist/react/` por arquivo de
    // `src/` (glob, para que componentes novos entrem sem editar esta lista).
    // `dist/react/index.js` só reexporta; com `sideEffects` restrito ao CSS,
    // o bundler do consumidor descarta os módulos que ele não importa, e cada
    // `"use client"` fica no topo do seu próprio arquivo (fronteira RSC).
    entry: ["src/index.ts", "src/components/*.tsx", "src/lib/*.ts"],
    outDir: "dist/react",
    format: "esm",
    dts: false,
    sourcemap: true,
    splitting: false,
    esbuildPlugins: [relativeImportsAsModules],
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
