#!/usr/bin/env node
/**
 * Monta a bancada estática da regressão visual em tests/visual/.harness/:
 *   - harness.css  Tailwind v4 compilado contra packages/react/dist/react (como o consumidor);
 *   - fonts.css + fonts/  Poppins auto-hospedada do kit (dist/react);
 *   - harness.js   React + kit (dist) + fixtures do gate, empacotado com esbuild.
 * Pré-requisito: `npm run build:ds` (o dist/ é o que vai para o npm).
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const dist = path.join(root, "packages/react/dist/react");
const out = path.join(here, ".harness");

if (!existsSync(path.join(dist, "index.js"))) {
  console.error("packages/react/dist não existe: rode `npm run build:ds` antes.");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(path.join(here, "harness/index.html"), path.join(out, "index.html"));
cpSync(path.join(dist, "fonts.css"), path.join(out, "fonts.css"));
cpSync(path.join(dist, "fonts"), path.join(out, "fonts"), { recursive: true });

execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules/@tailwindcss/cli/dist/index.mjs"),
    "-i",
    path.join(here, "harness/harness.css"),
    "-o",
    path.join(out, "harness.css"),
  ],
  { stdio: ["ignore", "ignore", "inherit"], cwd: root }
);

// check-smoke-a11y.mjs importa jsdom (só usado no Node); no navegador vira stub.
const stubJsdom = {
  name: "stub-jsdom",
  setup(b) {
    b.onResolve({ filter: /^jsdom$/ }, () => ({ path: "jsdom", namespace: "stub" }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: "export class JSDOM {}", loader: "js" }));
  },
};

await build({
  entryPoints: [path.join(here, "harness/entry.mjs")],
  outfile: path.join(out, "harness.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  logLevel: "warning",
  // development como no gate: o act() do Testing Library só existe no build de dev do React.
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [stubJsdom],
});

console.log(`bancada visual pronta em ${path.relative(root, out)}`);
