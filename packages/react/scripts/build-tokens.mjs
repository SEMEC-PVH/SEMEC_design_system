import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { tokenData } from "./token-data.mjs";

export function buildTokens() {
  const root = new URL("../", import.meta.url);
  const data = tokenData(fs.readFileSync(new URL("tokens.css", root), "utf8"));
  const out = new URL("dist/tokens/", root);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(new URL("tokens.json", out), JSON.stringify(data.dtcg, null, 2) + "\n");
  fs.writeFileSync(new URL("tokens.js", out),
    "// Gerado de tokens.css; não edite.\n" +
    `export const tokens = ${JSON.stringify(data.tokens, null, 2)};\n` +
    `export const dsTokens = ${JSON.stringify(data.dsTokens, null, 2)};\n`);
  const keys = Object.keys(data.tokens).map((key) => JSON.stringify(key)).join(" | ");
  const categories = Object.keys(data.dsTokens).filter((key) => key !== "values");
  fs.writeFileSync(new URL("tokens.d.ts", out),
    "// Gerado de tokens.css; valores CSS resolvidos.\n" +
    `export type TokenName = ${keys};\n` +
    "export declare const tokens: Record<TokenName, string>;\n" +
    "export declare const dsTokens: {\n" +
    categories.map((key) => `  ${key}: string[];\n`).join("") +
    "  values: Record<`--${TokenName}`, string>;\n};\n");
  console.log(`build-tokens: ${Object.keys(data.tokens).length} tokens (${Object.keys(data.dtcg.L0).length} L0, ${Object.keys(data.dtcg.L1).length} L1).`);
  return data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildTokens();
