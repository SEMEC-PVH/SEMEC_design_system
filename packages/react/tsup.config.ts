import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      "react/index": "src/index.ts",
    },
    outDir: "dist",
    format: "esm",
    dts: false,
    sourcemap: true,
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
      "get-nce",
    ],
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
