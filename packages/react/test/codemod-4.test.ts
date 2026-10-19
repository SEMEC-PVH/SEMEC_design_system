import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

// @ts-expect-error módulo .mjs sem tipos (script publicado no pacote)
import { L0_TABLE, loadTypeScript, run, scanText, suggestUtility } from "../codemods/v4.mjs";

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
    expect(read(path.join(dir, "barrel.ts"))).toBe(read(path.join(fixtures, "entrada", "barrel.ts")));
    expect(summary).toMatchObject({ files: 4, rewritten: 7, written: 2, review: 4, imports: 1 });
  });

  it("simulação (padrão) não grava nada e relata cada caso", async () => {
    const dir = copyFixtures();
    const lines: string[] = [];
    const summary = await run([dir], { ts, log: (l: string) => lines.push(l) });
    expect(summary.written).toBe(0);
    for (const file of ["formulario.tsx", "tela.jsx", "estilos.css", "barrel.ts"]) {
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
    // Barrel local: re-export dos componentes (com alias e export *) é relatado.
    expect(out).toContain("re-export de @semec/ds/react (Combobox, DatePicker as CampoData)");
    expect(out).toContain("re-export de @semec/ds/react/calendar (*)");
    expect(out).toMatch(/\n {2}2:1 +revisar +re-export de @semec\/ds\/react \(/);
    expect(out).toMatch(/\n {2}3:1 +revisar +re-export de @semec\/ds\/react\/calendar/);
    // O @source documentado do Tailwind não vira relato: o único import de
    // dist/ relatado é o do tela.jsx.
    const importLines = lines.filter((l) => / import {5}/.test(l));
    expect(importLines).toHaveLength(1);
    expect(importLines[0]).toMatch(/^ {2}2:25 +import/);
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

  it("relata só especificador de módulo em dist/, nunca o @source do Tailwind", () => {
    const ok = [
      '@source "../node_modules/@semec/ds/dist/react";',
      "@source '../../node_modules/@semec/ds/dist/react';",
      '@import "tailwindcss" source("../node_modules/@semec/ds/dist/react");',
      '@import "../node_modules/@semec/ds/dist/react/tokens.css";',
      "// veja @semec/ds/dist/react no tarball",
    ];
    for (const line of ok) expect(scanText(line)).toEqual([]);
    const bad = [
      'import { Button } from "@semec/ds/dist/react/index.js";',
      'import "@semec/ds/dist/react/tokens.css";',
      'const m = await import("@semec/ds/dist/react/components/button.js");',
      "const ds = require('@semec/ds/dist/react/index.js');",
      '@import "@semec/ds/dist/react/tokens.css";',
      '@import url("@semec/ds/dist/react/tokens.css");',
      'export { Button } from "@semec/ds/dist/react/index.js";',
    ];
    for (const line of bad) {
      const found = scanText(line);
      expect(found, line).toHaveLength(1);
      expect(found[0].kind).toBe("import");
      expect(line.slice(found[0].index)).toMatch(/^@semec\/ds\/dist\//);
    }
  });

  it("recusa TypeScript sem a API do compilador (ex.: 7.x) com mensagem pedindo o 5", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "semec-codemod-ts7-"));
    tmpDirs.push(dir);
    const tsDir = path.join(dir, "node_modules/typescript");
    fs.mkdirSync(tsDir, { recursive: true });
    fs.writeFileSync(path.join(tsDir, "package.json"), JSON.stringify({ name: "typescript", version: "7.0.2", main: "index.js" }));
    fs.writeFileSync(path.join(tsDir, "index.js"), 'module.exports = { version: "7.0.2" };');
    fs.writeFileSync(path.join(dir, "package.json"), "{}");
    const only7 = await loadTypeScript([path.join(dir, "package.json")]);
    expect(only7.ts).toBeUndefined();
    expect(only7.error).toContain("7.0.2");
    expect(only7.error).toContain("TypeScript 5");
    expect(only7.error).toContain("npm i -D typescript@5");
    expect(only7.error).toContain("npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4");
    // Com o 7 no projeto e o 5 ao lado do pacote (npx -p), usa o 5.
    const both = await loadTypeScript([path.join(dir, "package.json"), path.join(pkgRoot, "package.json")]);
    expect(typeof both.ts?.createSourceFile).toBe("function");
    const none = await loadTypeScript([path.join(os.tmpdir(), "nada", "package.json")]);
    expect(none.error).toContain("precisa do pacote typescript");
  });

  it("não relata o pv-* que o próprio app declara no @theme nem o que está em comentário (DIG-02, DIG-03, DIG-07)", async () => {
    // Caso do semec-digital: o app declara --color-pv-blue-900 no @theme e usa
    // text-pv-blue-900 em 295 lugares; isso continua gerando CSS na 4.0. Só o
    // bg-pv-blue-hero (que vinha do kit 3.x) quebra.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "semec-codemod-4-theme-"));
    tmpDirs.push(dir);
    fs.writeFileSync(
      path.join(dir, "globals.css"),
      [
        '@import "tailwindcss";',
        "@theme inline {",
        "  --color-pv-blue-900: #1e3a5f;",
        "  --color-pv-gray-50 : #ffffff;",
        "  /* Degraus 500–200: classes como text-pv-blue-200 não geram CSS */",
        "}",
        ".topo { background: var(--color-pv-blue-hero); }",
        "",
      ].join("\n")
    );
    fs.writeFileSync(
      path.join(dir, "pagina.tsx"),
      'export const P = () => <div className="text-pv-blue-900/50 bg-pv-gray-50 bg-pv-blue-hero">x</div>;\n'
    );
    const lines: string[] = [];
    const summary = await run([dir], { ts, log: (l: string) => lines.push(l) });
    const out = lines.join("\n");
    expect(out).toContain("bg-pv-blue-hero → bg-brand-hero");
    expect(out).toContain("--color-pv-blue-hero não existe mais na 4.0");
    expect(out).not.toContain("text-pv-blue-900");
    expect(out).not.toContain("bg-pv-gray-50 →");
    expect(out).not.toContain("--color-pv-blue-900 não existe");
    expect(out).not.toContain("--color-pv-gray-50 não existe");
    expect(out).not.toContain("text-pv-blue-200");
    expect(summary.utilities).toBe(2);
    expect(summary.declared).toBe(2);
    expect(out).toMatch(/2 utilitário\(s\) pv-\* com cor declarada pelo próprio app/);
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
    expect(res.stdout).toContain("Resumo: 4 arquivo(s) lido(s)");
    const help = spawnSync(process.execPath, [path.join(pkgRoot, "bin/semec-ds.mjs"), "codemod-4"], {
      encoding: "utf8",
    });
    expect(help.status).toBe(1);
    expect(help.stdout).toContain("Uso: npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4");
  });
});
