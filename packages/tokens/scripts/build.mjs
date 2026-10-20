#!/usr/bin/env node
/**
 * Build do @semec/ds-tokens.
 *
 * Fonte de verdade: packages/react/tokens.css e packages/react/fonts/ (ADR-026).
 * Reaproveita o parser e a extração de CSS do @semec/ds sem alterá-los:
 *   - token-data.mjs  → DTCG, mapa JS e categorias (mesmo código do @semec/ds/tokens.json);
 *   - build-css.mjs   → variables.css (vira tokens.css aqui) e base.css.
 * As saídas de plataforma (Android, iOS, Figma) saem do tokens.json pelo Style Dictionary 5.
 * Nada em dist/ é editado à mão.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tokenData } from "../../react/scripts/token-data.mjs";
import { buildCss } from "../../react/scripts/build-css.mjs";
import { buildPlatforms } from "./platforms.mjs";

const pkgRoot = fileURLToPath(new URL("../", import.meta.url));
const reactRoot = path.join(pkgRoot, "..", "react");
const dist = path.join(pkgRoot, "dist");

const FONTS_HEADER = `/* =========================================================================
   @semec/ds-tokens — Poppins auto-hospedada (pesos 400, 500, 600 e 700)
   =========================================================================

   Gerado de packages/react/fonts.css; não edite.

   Uso, antes de tokens.css:
     @import "@semec/ds-tokens/fonts.css";
     @import "@semec/ds-tokens/tokens.css";
     @import "@semec/ds-tokens/base.css";

   Os woff2 ficam em ./fonts/ ao lado deste arquivo; mantenha a pasta junto
   ao copiar para um diretório estático ou CDN.

   Licença: SIL Open Font License 1.1 — ./fonts/OFL.txt
   Copyright 2020 The Poppins Project Authors.
   ========================================================================= */
`;

/** Mesmo formato do packages/react/scripts/build-tokens.mjs (paridade testada). */
function writeTokenModules(data) {
  fs.writeFileSync(path.join(dist, "tokens.json"), JSON.stringify(data.dtcg, null, 2) + "\n");
  fs.writeFileSync(path.join(dist, "tokens.js"),
    "// Gerado de tokens.css; não edite.\n" +
    `export const tokens = ${JSON.stringify(data.tokens, null, 2)};\n` +
    `export const dsTokens = ${JSON.stringify(data.dsTokens, null, 2)};\n`);
  const keys = Object.keys(data.tokens).map((key) => JSON.stringify(key)).join(" | ");
  const categories = Object.keys(data.dsTokens).filter((key) => key !== "values");
  fs.writeFileSync(path.join(dist, "tokens.d.ts"),
    "// Gerado de tokens.css; valores CSS resolvidos.\n" +
    `export type TokenName = ${keys};\n` +
    "export declare const tokens: Record<TokenName, string>;\n" +
    "export declare const dsTokens: {\n" +
    categories.map((key) => `  ${key}: string[];\n`).join("") +
    "  values: Record<`--${TokenName}`, string>;\n};\n");
}

function writeCss() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "semec-ds-tokens-"));
  try {
    buildCss(reactRoot, temporary);
    fs.copyFileSync(path.join(temporary, "variables.css"), path.join(dist, "tokens.css"));
    fs.copyFileSync(path.join(temporary, "base.css"), path.join(dist, "base.css"));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function writeFonts() {
  const source = fs.readFileSync(path.join(reactRoot, "fonts.css"), "utf8");
  const start = source.indexOf("@font-face");
  if (start < 0) throw new Error("fonts.css sem @font-face.");
  fs.writeFileSync(path.join(dist, "fonts.css"), `${FONTS_HEADER}\n${source.slice(start)}`);
  const fontsOut = path.join(dist, "fonts");
  fs.mkdirSync(fontsOut, { recursive: true });
  for (const file of fs.readdirSync(path.join(reactRoot, "fonts"))) {
    fs.copyFileSync(path.join(reactRoot, "fonts", file), path.join(fontsOut, file));
  }
  for (const [, url] of source.slice(start).matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (!fs.existsSync(path.resolve(dist, url))) throw new Error(`Fonte ausente: ${url}`);
  }
}

export async function build() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
  const data = tokenData(fs.readFileSync(path.join(reactRoot, "tokens.css"), "utf8"));
  writeTokenModules(data);
  writeCss();
  writeFonts();
  const counts = await buildPlatforms(data.dtcg, dist);
  console.log(
    `@semec/ds-tokens: ${Object.keys(data.tokens).length} tokens ` +
    `(${Object.keys(data.dtcg.L0).length} L0, ${Object.keys(data.dtcg.L1).length} L1); ` +
    `Android ${counts.colors} cores e ${counts.dimens} dimensões; iOS ${counts.colors} cores; ` +
    `Tokens Studio ${counts.figma} tokens.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
