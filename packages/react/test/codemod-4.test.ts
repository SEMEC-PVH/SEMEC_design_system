import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

// @ts-expect-error módulo .mjs sem tipos (script publicado no pacote)
import { L0_TABLE, run, scanText, suggestUtility } from "../codemods/v4.mjs";

/**
 * Codemod da 4.0 (`npx @semec/ds codemod-4 <pasta>`): fixtures de entrada e
 * saída esperada em `test/fixtures/codemod-4/`.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const fixtures = path.join(here, "fixtures/codemod-4");
const tmpDirs: string[] = [];

function copyFixtures() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "semec-codemod-4-"));
  tmpDirs.push(dir);
  fs.cpSync(path.join(fixtures, "entrada"), dir, { recursive: true });
  return dir;
}

const read = (file: string) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("codemod-4", () => {
  it("--write troca onChange por onValueChange onde é seguro e deixa o resto byte a byte", async () => {
    const dir = copyFixtures();
    const lines: string[] = [];
    const summary = await run([dir], { write: true, ts, log: (l: string) => lines.push(l) });
    for (const file of ["formulario.tsx", "tela.jsx"]) {
      expect(read(path.join(dir, file))).toBe(read(path.join(fixtures, "esperado", file)));
    }
    // CSS só é relatado, nunca reescrito.
    expect(read(path.join(dir, "estilos.css"))).toBe(read(path.join(fixtures, "entrada", "estilos.css")));
    expect(summary).toMatchObject({ files: 3, rewritten: 7, written: 2, review: 2, imports: 1 });
  });

  it("simulação (padrão) não grava nada e relata cada caso", async () => {
    const dir = copyFixtures();
    const lines: string[] = [];
    const summary = await run([dir], { ts, log: (l: string) => lines.push(l) });
    expect(summary.written).toBe(0);
    for (const file of ["formulario.tsx", "tela.jsx", "estilos.css"]) {
      expect(read(path.join(dir, file))).toBe(read(path.join(fixtures, "entrada", file)));
    }
    const out = lines.join("\n");
    expect(out).toContain("simulação");
    expect(out).toMatch(/15:9 +reescrito +<Combobox onChange> → onValueChange/);
    expect(out).toMatch(/20:26 +revisar +<Data onChange=\{salvar\}>/);
    expect(out).toMatch(/28:33 +revisar +<DS\.Combobox> tem onChange e onValueChange/);
    // DatePicker com evento já nativo: nem reescrito nem relatado.
    expect(out).not.toMatch(/^ {2}19:/m);
    // Componente de outra biblioteca com o mesmo nome: ignorado.
    expect(out).not.toMatch(/<Outro/);
    expect(out).toContain("bg-pv-blue-600 → bg-primary");
    expect(out).toContain("bg-pv-blue-700 → bg-primary-hover");
    expect(out).toContain("ring-pv-blue-hero → ring-ring");
    expect(out).toContain("text-pv-blue-900 → text-text-brand");
    expect(out).toContain("text-pv-gray-600 → text-text-muted");
    expect(out).toContain("text-pv-white → text-text-on-brand");
    expect(out).toContain("bg-pv-black/50: sem semântico direto");
    expect(out).toContain("bg-pv-green-50 → bg-success-surface");
    expect(out).toContain("--color-pv-gray-400 não existe mais na 4.0");
    expect(out).toContain("@semec/ds/dist/react/index.js");
    expect(summary.utilities).toBe(12);
  });

  it("a tabela cobre todo primitivo de cor que tinha utilitário na 3.x", () => {
    const tokens = fs.readFileSync(path.join(pkgRoot, "tokens.css"), "utf8");
    const primitives = [...tokens.matchAll(/^\s*--pv-((?:blue|green|yellow|red|gray)-(?:\d+|hero)|white|black):\s*#/gm)].map(
      (m) => m[1]
    );
    // --pv-yellow-50 nasceu na 3.2.0 já sem utilitário.
    for (const name of primitives.filter((n) => n !== "yellow-50")) expect(L0_TABLE).toHaveProperty([name]);
    expect(suggestUtility("border-t", "gray-200").replacement).toBe("border-t-border");
    expect(suggestUtility("bg", "blue-600", "/10").replacement).toBe("bg-primary/10");
  });

  it("não confunde variável --pv-* nem classe parecida com utilitário L0", () => {
    expect(scanText("color: var(--pv-blue-600); .x-bg-pv-blue-600 {} --pv-gray-900-rgb")).toEqual([]);
  });

  it("o bin responde a `codemod-4` e o tarball inclui bin e codemods", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
    expect(pkg.bin).toEqual({ "semec-ds": "bin/semec-ds.mjs" });
    expect(pkg.files).toEqual(expect.arrayContaining(["bin", "codemods"]));
    const dir = copyFixtures();
    const res = spawnSync(process.execPath, [path.join(pkgRoot, "bin/semec-ds.mjs"), "codemod-4", dir], {
      cwd: pkgRoot,
      encoding: "utf8",
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Resumo: 3 arquivo(s) lido(s)");
    const help = spawnSync(process.execPath, [path.join(pkgRoot, "bin/semec-ds.mjs"), "codemod-4"], {
      encoding: "utf8",
    });
    expect(help.status).toBe(1);
    expect(help.stdout).toContain("Uso: npx @semec/ds codemod-4");
  });
});
