import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  assertNoConflictMarkers,
  findConflictMarkers,
  listFilesRecursive,
} from "../scripts/conflict-markers.mjs";
import { checkConflictMarkers } from "../../../scripts/gate/check-conflict-markers.mjs";

/**
 * TST-02 (#49): um merge mal resolvido deixou `<<<<<<<` / `=======` / `>>>>>>>`
 * no exemplo canônico da SKILL, e build, gate, lint, test e typecheck passaram.
 * O build-artifacts.mjs e o gate agora falham com marcador; os marcadores deste
 * arquivo são montados em tempo de execução para o próprio gate não pegá-los.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "../..");

const OURS = `${"<".repeat(7)} HEAD`;
const SEP = "=".repeat(7);
const THEIRS = `${">".repeat(7)} outra-branch`;
const conflito = ["antes", OURS, "lado A", SEP, "lado B", THEIRS, "depois"].join("\n");

const tmpDirs: string[] = [];
function tmpDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "semec-markers-"));
  tmpDirs.push(d);
  return d;
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe("findConflictMarkers", () => {
  it("acha os três marcadores do git, com a linha", () => {
    expect(findConflictMarkers(conflito).map((h) => [h.line, h.marker])).toEqual([
      [2, "<".repeat(7)],
      [4, SEP],
      [6, ">".repeat(7)],
    ]);
  });

  it("acha marcador com CRLF e o separador sozinho", () => {
    expect(findConflictMarkers(`a\r\n${SEP}\r\nb`)).toHaveLength(1);
  });

  it("não confunde título setext, régua longa nem marcador no meio da linha", () => {
    const md = ["Título", "=".repeat(10), `texto ${OURS}`, `  ${SEP}`, `${"<".repeat(7)}x`].join("\n");
    expect(findConflictMarkers(md)).toEqual([]);
  });

  it("assertNoConflictMarkers aponta arquivo e linha", () => {
    const d = tmpDir();
    fs.writeFileSync(path.join(d, "a.md"), conflito);
    fs.writeFileSync(path.join(d, "b.md"), "limpo\n");
    expect(() =>
      assertNoConflictMarkers([path.join(d, "a.md"), path.join(d, "b.md")], { root: d })
    ).toThrow(/a\.md:2:/);
    expect(() => assertNoConflictMarkers([path.join(d, "b.md")], { root: d })).not.toThrow();
  });
});

/** Copia o mínimo que o build-artifacts.mjs lê para uma árvore temporária com o mesmo layout. */
function arvoreTemporaria() {
  const root = tmpDir();
  const pkg = path.join(root, "packages", "react");
  for (const rel of [
    "scripts/build-artifacts.mjs",
    "scripts/conflict-markers.mjs",
    "manifest.js",
    "package.json",
    "README.md",
  ]) {
    fs.mkdirSync(path.dirname(path.join(pkg, rel)), { recursive: true });
    fs.copyFileSync(path.join(pkgRoot, rel), path.join(pkg, rel));
  }
  fs.cpSync(path.join(pkgRoot, "skills"), path.join(pkg, "skills"), { recursive: true });
  return { root, pkg };
}

function rodarBuildArtifacts(pkg: string) {
  return spawnSync(process.execPath, [path.join(pkg, "scripts", "build-artifacts.mjs"), "--target=docs-public"], {
    cwd: pkg,
    encoding: "utf8",
    env: { ...process.env, SOURCE_DATE_EPOCH: "0" },
  });
}

describe("build-artifacts.mjs recusa fonte com marcador de conflito", () => {
  it("fontes limpas: gera os artefatos", () => {
    const { root, pkg } = arvoreTemporaria();
    const r = rodarBuildArtifacts(pkg);
    expect(r.status, r.stderr).toBe(0);
    expect(fs.existsSync(path.join(root, "apps/docs/public/skills/semec-ds/SKILL.md"))).toBe(true);
  }, 60_000);

  it.each([
    ["SKILL completa", "skills/semec-ds/SKILL.md"],
    ["SKILL lite", "skills/semec-ds-lite/SKILL.md"],
    ["manifest.js", "manifest.js"],
  ])("marcador na %s: sai com erro e não escreve nada", (_nome, rel) => {
    const { root, pkg } = arvoreTemporaria();
    const alvo = path.join(pkg, rel);
    fs.appendFileSync(alvo, `\n${rel.endsWith(".js") ? "/*\n" : ""}${conflito}\n${rel.endsWith(".js") ? "*/\n" : ""}`);
    const r = rodarBuildArtifacts(pkg);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/Marcadores de conflito/);
    expect(r.stderr).toContain(rel);
    expect(fs.existsSync(path.join(root, "apps/docs/public"))).toBe(false);
  }, 60_000);
});

describe("gate: checkConflictMarkers", () => {
  it("falha com arquivo que tem marcador", async () => {
    const d = tmpDir();
    fs.writeFileSync(path.join(d, "SKILL.md"), conflito);
    await expect(checkConflictMarkers({ root: d, files: ["SKILL.md"] })).rejects.toThrow(/SKILL\.md:2:/);
  });

  it("o repositório inteiro está sem marcadores (fontes, SKILLs e artefatos publicados)", async () => {
    await expect(checkConflictMarkers({ root: repoRoot })).resolves.toBeUndefined();
  }, 60_000);

  it("as fontes e os artefatos da SKILL estão sem marcadores", () => {
    const arquivos = [
      ...listFilesRecursive(path.join(pkgRoot, "skills")),
      path.join(pkgRoot, "manifest.js"),
      ...listFilesRecursive(path.join(repoRoot, "apps/docs/public/skills")),
      ...listFilesRecursive(path.join(repoRoot, ".claude/skills/semec-ds")),
      ...listFilesRecursive(path.join(repoRoot, ".opencode/skills/semec-ds")),
    ];
    expect(arquivos.length).toBeGreaterThan(3);
    expect(() => assertNoConflictMarkers(arquivos, { root: repoRoot })).not.toThrow();
  });
});
