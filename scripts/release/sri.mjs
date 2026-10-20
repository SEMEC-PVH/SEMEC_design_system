#!/usr/bin/env node
/**
 * SRI (Subresource Integrity) dos arquivos do CDN citados no site.
 *
 * As páginas `/usar-sem-react` e `/usar-sem-react/web-components` mostram o
 * `<link>`/`<script>` do jsDelivr com versão fixa e `integrity`. A versão fica
 * numa constante (`VERSAO_*`) e o hash em outra (`SRI_*`), no próprio page.jsx.
 * Este script baixa cada arquivo publicado daquela versão, calcula o sha384 e
 * reescreve a constante `SRI_*`.
 *
 * Uso (depois da release, com a versão nova já no npm):
 *   1. troque `VERSAO_*` no page.jsx;
 *   2. `npm run sri`          → baixa, calcula e grava os hashes;
 *      `npm run sri -- --check` → só confere (sai com 1 se algum estiver errado).
 *
 * Alvos `kind: "markdown"` (README de pacote): não há constante; a versão é a da
 * própria URL do jsDelivr no texto e o hash fica no atributo `integrity` da
 * mesma tag (todas as ocorrências da URL, que precisam ter a mesma versão).
 *
 * Alvo `optional`: versão que ainda pode não estar no npm (ex.: o
 * `@semec/ds-elements` 1.0.0 e o `@semec/ds-css` 1.1.0 antes da release). Se o
 * jsDelivr der 404, a constante fica com o marcador `SRI_PENDENTE` e o script só
 * avisa (o `--check` não falha por isso).
 *
 * A parte pura (`sriOf`, `readConst`, `setConst`, `cdnUrl`, `computeSri`) tem
 * teste em sri.test.mjs, sem rede (o `fetch` é injetado).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Valor da constante enquanto o arquivo ainda não foi publicado. */
export const SRI_PENDENTE = "sha384-CALCULE-NA-RELEASE";

const PAGE = "apps/docs/app/(docs)/usar-sem-react/page.jsx";
const PAGE_ELEMENTS = "apps/docs/app/(docs)/usar-sem-react/web-components/page.jsx";
const README_CSS = "packages/css/README.md";
const README_ELEMENTS = "packages/elements/README.md";

/** Arquivos do CDN citados no site (caminho físico do tarball, não o alias do "exports"). */
export const TARGETS = [
  { file: PAGE, pkg: "@semec/ds-tokens", versionConst: "VERSAO_TOKENS", path: "dist/fonts.css", sriConst: "SRI_FONTS" },
  { file: PAGE, pkg: "@semec/ds-css", versionConst: "VERSAO_CSS", path: "dist/semec-ds.css", sriConst: "SRI_CSS" },
  // Página Web Components: o bloco completo do CDN (fontes, CSS a partir da 1.1.0 e script).
  { file: PAGE_ELEMENTS, pkg: "@semec/ds-tokens", versionConst: "VERSAO_TOKENS", path: "dist/fonts.css", sriConst: "SRI_FONTS" },
  { file: PAGE_ELEMENTS, pkg: "@semec/ds-css", versionConst: "VERSAO_CSS", path: "dist/semec-ds.css", sriConst: "SRI_CSS", optional: true },
  { file: PAGE_ELEMENTS, pkg: "@semec/ds-elements", versionConst: "VERSAO_ELEMENTS", path: "dist/semec-elements.js", sriConst: "SRI_ELEMENTS", optional: true },
  // README do @semec/ds-css (CONS-08): versão fixa e integrity nos trechos de CDN.
  { file: README_CSS, kind: "markdown", pkg: "@semec/ds-tokens", path: "dist/fonts.css" },
  { file: README_CSS, kind: "markdown", pkg: "@semec/ds-css", path: "dist/semec-ds.css", optional: true },
  { file: README_CSS, kind: "markdown", pkg: "@semec/ds-elements", path: "dist/semec-elements.js", optional: true },
  // README do @semec/ds-elements: o mesmo bloco da página Web Components.
  { file: README_ELEMENTS, kind: "markdown", pkg: "@semec/ds-tokens", path: "dist/fonts.css" },
  { file: README_ELEMENTS, kind: "markdown", pkg: "@semec/ds-css", path: "dist/semec-ds.css", optional: true },
  { file: README_ELEMENTS, kind: "markdown", pkg: "@semec/ds-elements", path: "dist/semec-elements.js", optional: true },
];

/** `sha384-<base64>` do conteúdo, no formato do atributo `integrity`. */
export function sriOf(content) {
  return `sha384-${crypto.createHash("sha384").update(content).digest("base64")}`;
}

/** URL do jsDelivr para o arquivo de uma versão fixa. */
export function cdnUrl(pkg, version, file) {
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) throw new Error(`${pkg}: versão "${version}" não é fixa (x.y.z); SRI só vale para versão fixa`);
  return `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${file}`;
}

const constRe = (name) => new RegExp(`^(const ${name} = )"([^"\\n]*)";$`, "m");

/** Valor de `const NOME = "...";` (uma linha, no início da linha). */
export function readConst(source, name) {
  const m = source.match(constRe(name));
  if (!m) throw new Error(`constante ${name} não encontrada`);
  return m[2];
}

/** Troca o valor de `const NOME = "...";`; erro se a constante não existir. */
export function setConst(source, name, value) {
  readConst(source, name);
  return source.replace(constRe(name), (_, head) => `${head}"${value}";`);
}

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const mdTagRe = (pkg, file) => new RegExp(`(https://cdn\\.jsdelivr\\.net/npm/${escapeRe(pkg)}@([^/"\\s]+)/${escapeRe(file)}"[^>]*?integrity=")([^"]*)(")`, "g");

/**
 * Num markdown, a versão e o integrity de cada tag com a URL do arquivo. Erro se
 * a URL não aparece, se alguma ocorrência não tem integrity ou se as versões
 * diferem (um hash só por arquivo).
 */
export function readMarkdownSri(source, pkg, file) {
  const url = new RegExp(`cdn\\.jsdelivr\\.net/npm/${escapeRe(pkg)}@[^/"\\s]+/${escapeRe(file)}`, "g");
  const total = (source.match(url) ?? []).length;
  const tags = [...source.matchAll(mdTagRe(pkg, file))].map((m) => ({ version: m[2], value: m[3] }));
  if (!total) throw new Error(`${pkg}/${file}: URL do CDN não encontrada`);
  if (tags.length !== total) throw new Error(`${pkg}/${file}: ${total - tags.length} tag(s) sem integrity`);
  const versions = [...new Set(tags.map((t) => t.version))];
  if (versions.length !== 1) throw new Error(`${pkg}/${file}: versões diferentes (${versions.join(", ")})`);
  const values = [...new Set(tags.map((t) => t.value))];
  return { version: versions[0], value: values.length === 1 ? values[0] : null };
}

/** Troca o integrity de todas as tags com a URL do arquivo. */
export function setMarkdownSri(source, pkg, file, value) {
  readMarkdownSri(source, pkg, file);
  return source.replace(mdTagRe(pkg, file), (_, head, version, old, tail) => `${head}${value}${tail}`);
}

const current = (target, source) => (target.kind === "markdown" ? readMarkdownSri(source, target.pkg, target.path) : { version: readConst(source, target.versionConst), value: readConst(source, target.sriConst) });

/** Nome do alvo nas mensagens. */
export const targetLabel = (t) => (t.kind === "markdown" ? `${t.file} (${t.pkg})` : t.sriConst);

/**
 * Calcula o SRI de cada alvo. Não grava nada.
 * @param {{ targets?: typeof TARGETS, readFile: (file: string) => string,
 *           fetch: (url: string) => Promise<{ ok: boolean, status: number, arrayBuffer: () => Promise<ArrayBuffer> }> }} deps
 * @returns {Promise<Array<{ target: object, url: string, current: string, value: string | null, status: number }>>}
 */
export async function computeSri({ targets = TARGETS, readFile, fetch }) {
  const results = [];
  for (const target of targets) {
    const source = readFile(target.file);
    const { version, value: atual } = current(target, source);
    const url = cdnUrl(target.pkg, version, target.path);
    const res = await fetch(url);
    if (res.ok) {
      results.push({ target, url, current: atual, value: sriOf(Buffer.from(await res.arrayBuffer())), status: res.status });
    } else if (res.status === 404 && target.optional) {
      results.push({ target, url, current: atual, value: null, status: 404 });
    } else {
      throw new Error(`${url}: HTTP ${res.status}`);
    }
  }
  return results;
}

/** Aplica os resultados aos arquivos (em memória). 404 opcional → marcador pendente. */
export function applySri(results, readFile) {
  const files = new Map();
  for (const r of results) {
    const source = files.get(r.target.file) ?? readFile(r.target.file);
    const value = r.value ?? SRI_PENDENTE;
    files.set(r.target.file, r.target.kind === "markdown" ? setMarkdownSri(source, r.target.pkg, r.target.path, value) : setConst(source, r.target.sriConst, value));
  }
  return files;
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const readFile = (file) => fs.readFileSync(path.join(root, file), "utf8");
  const check = process.argv.includes("--check");
  const results = await computeSri({ readFile, fetch: globalThis.fetch });
  let wrong = 0;
  for (const r of results) {
    if (r.value === null) {
      console.warn(`AVISO ${r.url}: ainda não publicado (404); ${targetLabel(r.target)} fica "${SRI_PENDENTE}".`);
      if (r.current !== SRI_PENDENTE) wrong++;
      continue;
    }
    const same = r.current === r.value;
    if (!same) wrong++;
    console.log(`${same ? "ok  " : "novo"} ${targetLabel(r.target)} ${r.value}  ${r.url}`);
  }
  if (check) {
    if (wrong) {
      console.error(`${wrong} hash(es) desatualizado(s): rode npm run sri.`);
      process.exit(1);
    }
  } else {
    for (const [file, source] of applySri(results, readFile)) fs.writeFileSync(path.join(root, file), source);
    console.log(wrong ? `${wrong} constante(s) atualizada(s).` : "Nada a mudar.");
  }
}
