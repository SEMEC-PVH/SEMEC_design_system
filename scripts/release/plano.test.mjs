// Testes do plano de release e da checagem de changeset por pacote.
// Rodar: npm run test:release (node --test).
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { interpretNpmView, planRelease, readPublicPackages, countPendingChangesets } from "./plano.mjs";
import { checkCoverage, parseChangeset } from "./checar-changesets.mjs";

const ds = { name: "@semec/ds", version: "4.4.0", dir: "packages/react" };
const tokens = { name: "@semec/ds-tokens", version: "1.0.0", dir: "packages/tokens" };
const css = { name: "@semec/ds-css", version: "1.0.0", dir: "packages/css" };

const reg = (entries) => Object.fromEntries(entries.map(([p, s]) => [`${p.name}@${p.version}`, s]));

describe("planRelease", () => {
  it("0 pacotes a publicar: tudo no npm → noop", () => {
    const plan = planRelease({
      packages: [ds, tokens, css],
      pendingChangesets: 0,
      registry: reg([[ds, "published"], [tokens, "published"], [css, "published"]]),
    });
    assert.equal(plan.mode, "noop");
    assert.deepEqual(plan.publish, []);
    assert.deepEqual(plan.warnings, []);
  });

  it("1 pacote a publicar: só o que falta no npm entra no plano", () => {
    const plan = planRelease({
      packages: [ds, tokens, css],
      pendingChangesets: 0,
      registry: reg([[ds, "published"], [tokens, "unpublished"], [css, "published"]]),
    });
    assert.equal(plan.mode, "publish");
    assert.deepEqual(plan.publish.map((p) => p.name), ["@semec/ds-tokens"]);
  });

  it("2 pacotes a publicar (primeira release de tokens + css)", () => {
    const plan = planRelease({
      packages: [ds, tokens, css],
      pendingChangesets: 0,
      registry: reg([[ds, "published"], [tokens, "unpublished"], [css, "unpublished"]]),
    });
    assert.equal(plan.mode, "publish");
    assert.deepEqual(plan.publish.map((p) => `${p.name}@${p.version}`), [
      "@semec/ds-tokens@1.0.0",
      "@semec/ds-css@1.0.0",
    ]);
  });

  it("pacote já publicado não volta ao plano", () => {
    const plan = planRelease({
      packages: [ds],
      pendingChangesets: 0,
      registry: reg([[ds, "published"]]),
    });
    assert.equal(plan.mode, "noop");
    assert.deepEqual(plan.published.map((p) => p.name), ["@semec/ds"]);
  });

  it("changesets pendentes: nada publica e avisa os pacotes fora do npm", () => {
    const plan = planRelease({
      packages: [ds, tokens],
      pendingChangesets: 2,
      registry: reg([[ds, "published"], [tokens, "unpublished"]]),
    });
    assert.equal(plan.mode, "pending");
    assert.deepEqual(plan.publish, []);
    assert.equal(plan.warnings.length, 1);
    assert.match(plan.warnings[0], /@semec\/ds-tokens@1\.0\.0/);
  });

  it("erro do registry (não E404) aborta, mesmo com outros pacotes publicáveis", () => {
    const plan = planRelease({
      packages: [ds, tokens],
      pendingChangesets: 0,
      registry: reg([[ds, "unpublished"], [tokens, "error"]]),
    });
    assert.equal(plan.mode, "error");
    assert.deepEqual(plan.publish, []);
    assert.equal(plan.errors.length, 1);
  });

  it("pacote em 0.0.0 nunca é publicado (falta o PR de versão)", () => {
    const novo = { ...tokens, version: "0.0.0" };
    const plan = planRelease({
      packages: [ds, novo],
      pendingChangesets: 0,
      registry: reg([[ds, "published"]]),
    });
    assert.equal(plan.mode, "noop");
    assert.match(plan.warnings[0], /0\.0\.0/);
  });

  it("pacote em 0.0.0 com changeset pendente não gera aviso de pacote novo", () => {
    const novo = { ...tokens, version: "0.0.0" };
    const plan = planRelease({ packages: [ds, novo], pendingChangesets: 1, registry: reg([[ds, "published"]]) });
    assert.equal(plan.mode, "pending");
    assert.deepEqual(plan.warnings, []);
  });
});

describe("interpretNpmView", () => {
  it("versão igual → published", () => {
    assert.equal(interpretNpmView({ ok: true, stdout: "4.4.0\n" }, "4.4.0"), "published");
  });
  it("pacote existe, versão não (saída vazia) → unpublished", () => {
    assert.equal(interpretNpmView({ ok: true, stdout: "" }, "4.5.0"), "unpublished");
  });
  it("E404 (pacote novo) → unpublished", () => {
    assert.equal(interpretNpmView({ ok: false, stderr: "npm error code E404\n" }, "1.0.0"), "unpublished");
  });
  it("outro erro (rede, auth) → error", () => {
    assert.equal(interpretNpmView({ ok: false, stderr: "npm error code ETIMEDOUT" }, "1.0.0"), "error");
  });
});

describe("leitura do workspace", () => {
  it("lista só pacotes públicos e conta changesets sem o README", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plano-"));
    const write = (rel, data) => {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), typeof data === "string" ? data : JSON.stringify(data));
    };
    write("package.json", { private: true, workspaces: ["apps/*", "packages/*"] });
    write("apps/docs/package.json", { name: "@semec/docs", version: "0.1.0", private: true });
    write("packages/react/package.json", { name: "@semec/ds", version: "4.4.0" });
    write("packages/tokens/package.json", { name: "@semec/ds-tokens", version: "0.0.0" });
    write(".changeset/README.md", "x");
    write(".changeset/config.json", "{}");
    write(".changeset/azul-gato.md", "---\n'@semec/ds-tokens': major\n---\n\nx\n");
    try {
      assert.deepEqual(readPublicPackages(root).map((p) => p.name), ["@semec/ds", "@semec/ds-tokens"]);
      assert.equal(countPendingChangesets(root), 1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("checkCoverage (changeset por pacote)", () => {
  const packages = [ds, tokens, css];
  const patterns = ["src/**", "scripts/**", "package.json", "tokens.css"];

  it("mudança no ds-tokens com changeset só do @semec/ds falha", () => {
    const r = checkCoverage({
      changedFiles: ["packages/tokens/scripts/build.mjs", "packages/react/src/button.tsx"],
      packages,
      patterns,
      changesets: [{ "@semec/ds": "patch" }],
    });
    assert.deepEqual(r.missing.map((m) => m.name), ["@semec/ds-tokens"]);
  });

  it("tokens.css do kit muda: exige changeset do @semec/ds e do @semec/ds-tokens", () => {
    const r = checkCoverage({
      changedFiles: ["packages/react/tokens.css"],
      packages,
      patterns,
      changesets: [{ "@semec/ds": "minor" }],
    });
    assert.deepEqual(r.changed.map((c) => c.name).sort(), ["@semec/ds", "@semec/ds-tokens"]);
    assert.deepEqual(r.missing.map((m) => m.name), ["@semec/ds-tokens"]);
  });

  it("cada pacote mudado com seu changeset passa", () => {
    const r = checkCoverage({
      changedFiles: ["packages/css/src/button.css", "packages/tokens/package.json"],
      packages,
      patterns,
      changesets: [{ "@semec/ds-css": "major", "@semec/ds-tokens": "major" }],
    });
    assert.deepEqual(r.missing, []);
  });

  it("mudança fora dos padrões (README, site) não exige changeset", () => {
    const r = checkCoverage({
      changedFiles: ["packages/react/README.md", "apps/docs/app/page.jsx"],
      packages,
      patterns,
      changesets: [],
    });
    assert.deepEqual(r.changed, []);
  });

  it("changeset vazio é a saída explícita", () => {
    const r = checkCoverage({
      changedFiles: ["packages/css/src/x.css"],
      packages,
      patterns,
      changesets: [{}],
    });
    assert.deepEqual(r.missing, []);
  });

  it("parseChangeset lê aspas simples, duplas e changeset vazio", () => {
    assert.deepEqual(parseChangeset("---\n'@semec/ds-tokens': major\n\"@semec/ds\": patch\n---\n\ntexto\n"), {
      "@semec/ds-tokens": "major",
      "@semec/ds": "patch",
    });
    assert.deepEqual(parseChangeset("---\n---\n"), {});
  });
});
