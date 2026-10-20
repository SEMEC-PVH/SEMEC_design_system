// Testes do cálculo de SRI das páginas do CDN (sem rede: o fetch é injetado).
// Rodar: npm run test:release (node --test).
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { SRI_PENDENTE, TARGETS, applySri, cdnUrl, computeSri, readConst, setConst, sriOf } from "./sri.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const fakeFetch = (files) => async (url) => {
  const body = files[url];
  return body === undefined
    ? { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) }
    : { ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(body).buffer };
};

describe("sriOf", () => {
  it("é o sha384 em base64 com o prefixo do atributo integrity", () => {
    // Vetor conhecido: sha384("abc").
    assert.equal(sriOf("abc"), "sha384-ywB1P0WjXou1oD1pmsZQBycsMqsO3tFjGotgWkP/W+2AhgcroefMI1i67KE0yCWn");
    assert.equal(sriOf(Buffer.from("abc")), sriOf("abc"));
  });
});

describe("cdnUrl", () => {
  it("monta o caminho físico do jsDelivr com versão fixa", () => {
    assert.equal(cdnUrl("@semec/ds-css", "1.0.0", "dist/semec-ds.css"), "https://cdn.jsdelivr.net/npm/@semec/ds-css@1.0.0/dist/semec-ds.css");
  });
  it("recusa faixa de versão (o SRI quebraria na próxima release)", () => {
    assert.throws(() => cdnUrl("@semec/ds-css", "1", "dist/semec-ds.css"), /não é fixa/);
    assert.throws(() => cdnUrl("@semec/ds-css", "^1.0.0", "dist/semec-ds.css"), /não é fixa/);
  });
});

describe("readConst / setConst", () => {
  const src = 'const VERSAO_CSS = "1.0.0";\nconst SRI_CSS = "sha384-velho";\nconst OUTRA = "x";\n';
  it("lê e troca só a constante pedida", () => {
    assert.equal(readConst(src, "SRI_CSS"), "sha384-velho");
    const out = setConst(src, "SRI_CSS", "sha384-novo");
    assert.equal(readConst(out, "SRI_CSS"), "sha384-novo");
    assert.equal(readConst(out, "VERSAO_CSS"), "1.0.0");
    assert.equal(readConst(out, "OUTRA"), "x");
  });
  it("erro se a constante não existe (nada é escrito às cegas)", () => {
    assert.throws(() => readConst(src, "SRI_FONTS"), /SRI_FONTS não encontrada/);
    assert.throws(() => setConst(src, "SRI_FONTS", "x"), /SRI_FONTS não encontrada/);
  });
});

describe("computeSri + applySri", () => {
  const pages = {
    "a.jsx": 'const VERSAO_T = "1.2.3";\nconst SRI_T = "sha384-velho";\nconst VERSAO_C = "2.0.0";\nconst SRI_C = "sha384-velho";\n',
    "b.jsx": `const VERSAO_E = "1.0.0";\nconst SRI_E = "${SRI_PENDENTE}";\n`,
  };
  const targets = [
    { file: "a.jsx", pkg: "@x/t", versionConst: "VERSAO_T", path: "dist/f.css", sriConst: "SRI_T" },
    { file: "a.jsx", pkg: "@x/c", versionConst: "VERSAO_C", path: "dist/c.css", sriConst: "SRI_C" },
    { file: "b.jsx", pkg: "@x/e", versionConst: "VERSAO_E", path: "dist/e.js", sriConst: "SRI_E", optional: true },
  ];
  const readFile = (f) => pages[f];

  it("baixa a versão da constante, calcula e grava; 404 opcional fica pendente", async () => {
    const fetch = fakeFetch({
      "https://cdn.jsdelivr.net/npm/@x/t@1.2.3/dist/f.css": "fontes",
      "https://cdn.jsdelivr.net/npm/@x/c@2.0.0/dist/c.css": "css",
    });
    const results = await computeSri({ targets, readFile, fetch });
    assert.deepEqual(results.map((r) => r.value), [sriOf("fontes"), sriOf("css"), null]);
    const files = applySri(results, readFile);
    assert.equal(readConst(files.get("a.jsx"), "SRI_T"), sriOf("fontes"));
    assert.equal(readConst(files.get("a.jsx"), "SRI_C"), sriOf("css"));
    assert.equal(readConst(files.get("b.jsx"), "SRI_E"), SRI_PENDENTE);
  });

  it("404 num alvo obrigatório (ou outro erro HTTP) aborta", async () => {
    await assert.rejects(computeSri({ targets: targets.slice(0, 1), readFile, fetch: fakeFetch({}) }), /HTTP 404/);
  });
});

describe("páginas do site", () => {
  it("cada alvo existe, com versão fixa e hash no formato sha384", () => {
    for (const t of TARGETS) {
      const src = fs.readFileSync(path.join(root, t.file), "utf8");
      cdnUrl(t.pkg, readConst(src, t.versionConst), t.path);
      const value = readConst(src, t.sriConst);
      if (!t.optional) assert.notEqual(value, SRI_PENDENTE, `${t.sriConst} ainda é o marcador: rode npm run sri`);
      if (value !== SRI_PENDENTE) {
        assert.match(value, /^sha384-[A-Za-z0-9+/]{64}$/, `${t.sriConst} não é um sha384 válido`);
        assert.equal(Buffer.from(value.slice(7), "base64").length, crypto.createHash("sha384").digest().length);
      }
    }
  });
});
