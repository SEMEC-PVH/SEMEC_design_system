import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { describe, expect, it } from "vitest";

import preset from "../src/pv-preset";
import rootPreset from "../pv-preset";

/**
 * 4.0 (AUD-55): os primitivos L0 saíram do `@theme`. Compila o `tokens.css`
 * com o Tailwind do pacote (mesmo caminho do consumidor: `@import "tailwindcss"`
 * + `tokens.css`) e confere que nenhum `--color-pv-*` nem utilitário `*-pv-*`
 * sobra no CSS gerado, mesmo quando o código ainda pede `bg-pv-*`.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const require = createRequire(path.join(pkgRoot, "package.json"));

async function loadStylesheet(id: string, base: string) {
  const file =
    id === "tailwindcss"
      ? require.resolve("tailwindcss/index.css")
      : id.startsWith(".")
        ? path.resolve(base, id)
        : require.resolve(id);
  return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
}

async function build(candidates: string[]) {
  const input = `@import "tailwindcss";\n@import "./tokens.css";\n`;
  const compiler = await compile(input, { base: pkgRoot, loadStylesheet });
  return compiler.build(candidates);
}

/** Classes usadas pelos componentes do kit (varredura simples de `src/components`). */
function kitCandidates() {
  const dir = path.join(pkgRoot, "src/components");
  const out = new Set<string>();
  for (const file of fs.readdirSync(dir)) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    for (const token of text.split(/[\s"'`{}()]+/)) if (token) out.add(token);
  }
  return [...out];
}

const OLD_L0 = [
  "bg-pv-blue-600",
  "text-pv-blue-900",
  "border-pv-gray-200",
  "bg-pv-green-500",
  "text-pv-gray-900",
  "ring-pv-blue-hero",
  "hover:bg-pv-blue-700",
  "bg-pv-blue-900/10",
];

describe("tokens.css sem primitivos no @theme (AUD-55, 4.0)", () => {
  it("o CSS compilado não tem --color-pv-* nem utilitário *-pv-*", async () => {
    const css = await build([...kitCandidates(), ...OLD_L0]);
    expect(css).not.toMatch(/--color-pv-/);
    expect(css).not.toMatch(/\.(?:[a-z-]+\\:)*(?:bg|text|border|ring|fill|stroke|outline)-pv-/);
    // As variáveis --pv-* continuam no :root.
    expect(css).toMatch(/--pv-blue-600:\s*#3a6ca6/);
    expect(css).toMatch(/--pv-green-500:\s*#82C353/i);
  });

  it("os semânticos criados na 4.0 geram utilitário e apontam para o primitivo", async () => {
    const css = await build(["text-text-brand", "bg-success-emphasis", "text-success-emphasis-foreground"]);
    expect(css).toContain(".text-text-brand");
    expect(css).toContain(".bg-success-emphasis");
    expect(css).toContain(".text-success-emphasis-foreground");
    const tokens = fs.readFileSync(path.join(pkgRoot, "tokens.css"), "utf8");
    expect(tokens).not.toMatch(/--color-pv-/);
    expect(tokens).toMatch(/--text-brand:\s*var\(--pv-blue-900\)/);
    expect(tokens).toMatch(/--feedback-success-emphasis:\s*var\(--pv-green-500\)/);
    expect(tokens).toMatch(/--text-on-success-emphasis:\s*var\(--pv-blue-900\)/);
  });

  it("os dois pv-preset não têm cores pv-*", () => {
    for (const p of [preset, rootPreset]) {
      const colors = (p.theme?.extend?.colors ?? {}) as Record<string, unknown>;
      expect(Object.keys(colors).filter((k) => k.startsWith("pv"))).toEqual([]);
      expect(JSON.stringify(colors)).not.toMatch(/var\(--pv-/);
    }
  });
});
