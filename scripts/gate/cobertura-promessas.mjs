#!/usr/bin/env node
/**
 * Cobertura POR PROMESSA do manifest (TST-37, 2ª metade).
 *
 * A cobertura de linhas não diz se o que o kit PROMETE na documentação (o que o
 * `packages/react/manifest.js` escreve em `desc`, `variants` e `usage`, e que vira
 * llms.txt, manifest.json, .md por componente e skills) tem um teste que o exercita.
 * Este script extrai as promessas de cada componente e procura, nos testes, um
 * bloco que fale do componente E da promessa. É heurística de texto, não análise
 * de execução: serve para achar buracos óbvios, não para provar cobertura.
 *
 * Promessas extraídas (de `desc` + `variants[].prop/values` + `usage`):
 *   - a11y:    todo `aria-*` citado (ex.: aria-current, aria-sort) e todo `role="x"`.
 *   - prop:    atributos JSX das tags do próprio componente no `usage` (ex.: rowLabel,
 *              onRowClick) + identificadores camelCase entre crases no texto
 *              (ex.: `onValueChange`, `asChild`) + o nome do grupo em `variants`
 *              quando ele é um identificador (variant, size, loading…).
 *              Fora: className, key, id, style, href, children, type, htmlFor.
 *   - teclado: teclas citadas no texto (Esc, Enter, Espaço, setas, Home/End,
 *              PageUp/PageDown, Tab).
 *
 * Onde se procura: `packages/react/test/**\/*.test.{ts,tsx}` e os scripts do gate
 * (`scripts/gate/*.mjs`, que montam fixtures no navegador). Cada arquivo de teste é
 * cortado em blocos `it(`/`test(`; o contexto do bloco é o título do `describe` mais
 * próximo acima + o corpo do `it`. Arquivos sem `it(` (gate) contam como um bloco só.
 *
 * Uma promessa conta como coberta quando algum bloco cita um nome "próprio" do
 * componente (export do `usage` que começa com o nome principal: DataTable,
 * DialogContent…) e casa o padrão da promessa:
 *   - aria-x  → o texto "aria-x" (aria-label/aria-labelledby também por `name:`
 *               de getByRole, que é como os testes conferem o nome acessível);
 *   - role x  → "x" entre aspas num bloco com ByRole/role;
 *   - prop    → a palavra exata;
 *   - teclado → a tecla no formato do user-event/fireEvent ({Escape}, "Enter", ArrowDown…).
 *
 * Limitações conhecidas: um teste que só cita a palavra conta (falso positivo);
 * um teste que exercita sem citar (ex.: helper genérico) não conta (falso negativo).
 *
 * Uso:
 *   node scripts/gate/cobertura-promessas.mjs            # relatório
 *   node scripts/gate/cobertura-promessas.mjs --detalhe  # + promessas descobertas
 *   node scripts/gate/cobertura-promessas.mjs --json     # saída em JSON
 *   node scripts/gate/cobertura-promessas.mjs --min=80   # sai 1 se o total < 80%
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Piso do gate, em %. Medido em 16/10/2026: 224/266 (84,2%). O piso fica abaixo
 * para não deixar o gate vermelho hoje e pegar regressão grande (teste apagado,
 * promessa nova sem teste em vários componentes). Suba quando a cobertura subir.
 */
export const PISO_GATE = 80;

const ESTE = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(ESTE), "..", "..");
const PROP_FORA = new Set(["className", "key", "id", "style", "href", "children", "type", "htmlFor", "ref"]);

const TECLAS = [
  { nome: "Escape", texto: /\bEsc(ape)?\b/, teste: /\{Escape\}|["'`]Escape["'`]|key:\s*["'`]Escape/ },
  { nome: "Enter", texto: /\bEnter\b/, teste: /\{Enter\}|["'`]Enter["'`]/ },
  { nome: "Espaço", texto: /\bEspaço\b|\bSpace\b/, teste: /\{ \}|\[Space\]|keyboard\(["'`] ["'`]\)|key:\s*["'`] ["'`]|["'`]Space["'`]/ },
  { nome: "Setas", texto: /\bsetas?\b|[↑↓←→]|\bArrow(Up|Down|Left|Right)\b/i, teste: /Arrow(Up|Down|Left|Right)/ },
  { nome: "Home/End", texto: /\bHome\b|\bEnd\b/, teste: /\{(Home|End)\}|["'`](Home|End)["'`]/ },
  { nome: "PageUp/PageDown", texto: /\bPage(Up|Down)\b/, teste: /Page(Up|Down)/ },
  { nome: "Tab", texto: /\bTab\b/, teste: /\{Tab\}|\.tab\(|["'`]Tab["'`]/ },
];

const NAO_PROP = new Set(["matchMedia", "localStorage", "setTimeout", "preventDefault", "stopPropagation"]);

/**
 * Nomes de atributo das tags JSX `<Nome ...>` do usage, para os nomes dados. Lê o
 * trecho até o `>` de fechamento fora de aspas/chaves (arrow functions dentro de
 * `{...}` não cortam a tag) e descarta valores entre aspas e chaves.
 */
function atributosJsx(usage, nomes) {
  const out = new Set();
  const abre = new RegExp(`<(${nomes.map(escapeRe).join("|")})(?=[\\s/>])`, "g");
  for (const m of usage.matchAll(abre)) {
    let i = m.index + m[0].length;
    let prof = 0;
    let aspas = null;
    let atributos = "";
    for (; i < usage.length; i++) {
      const ch = usage[i];
      if (aspas) {
        if (ch === aspas) aspas = null;
        continue;
      }
      if (prof === 0 && (ch === '"' || ch === "'")) {
        aspas = ch;
        atributos += " ";
        continue;
      }
      if (ch === "{") prof++;
      else if (ch === "}") prof--;
      else if (prof === 0 && ch === ">") break;
      if (prof === 0 && ch !== "}") atributos += ch;
    }
    for (const a of atributos.matchAll(/(?:^|\s)([a-zA-Z][A-Za-z0-9-]*)(?==|\s|\/|$)/g)) out.add(a[1]);
  }
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Promessas de um componente do manifest. */
export function extrairPromessas(c, importNames, exportName) {
  const texto = [c.desc, ...c.variants.flatMap((v) => [v.prop, v.values])].join("\n");
  const tudo = `${texto}\n${c.usage ?? ""}`;
  const proprios = importNames.filter((n) => n.startsWith(exportName));
  if (!proprios.includes(exportName)) proprios.unshift(exportName);
  const promessas = new Map();
  const add = (tipo, nome) => promessas.set(`${tipo}:${nome}`, { tipo, nome });

  for (const m of tudo.matchAll(/\baria-[a-z]+\b/g)) add("a11y", m[0]);
  for (const m of tudo.matchAll(/role=\\?["'`]?([a-z]+)/g)) add("a11y", `role=${m[1]}`);

  for (const nome of atributosJsx(c.usage ?? "", proprios)) {
    if (!PROP_FORA.has(nome) && !nome.startsWith("aria") && !nome.startsWith("data")) add("prop", nome);
  }
  for (const m of texto.matchAll(/`([a-z]+[A-Z][A-Za-z0-9]*)`/g)) {
    // Hooks (`useId`) e APIs do navegador (`matchMedia`) não são props.
    if (!/^use[A-Z]/.test(m[1]) && !NAO_PROP.has(m[1]) && !PROP_FORA.has(m[1])) add("prop", m[1]);
  }
  for (const v of c.variants) {
    if (/^[a-z][A-Za-z0-9]*$/.test(v.prop) && (tudo.includes(`${v.prop}=`) || tudo.includes(`\`${v.prop}\``))) {
      add("prop", v.prop);
    }
  }

  for (const t of TECLAS) if (t.texto.test(texto)) add("teclado", t.nome);
  return { proprios, promessas: [...promessas.values()] };
}

function padraoNoTeste(p) {
  if (p.tipo === "teclado") return TECLAS.find((t) => t.nome === p.nome).teste;
  if (p.tipo === "prop") return new RegExp(`\\b${escapeRe(p.nome)}\\b`);
  if (p.nome.startsWith("role=")) {
    const r = escapeRe(p.nome.slice(5));
    return { test: (b) => /ByRole|role/.test(b) && new RegExp(`["'\`]${r}["'\`]`).test(b) };
  }
  if (p.nome === "aria-label" || p.nome === "aria-labelledby") {
    return { test: (b) => b.includes(p.nome) || /ByRole\([^)]*name:/.test(b) };
  }
  return new RegExp(escapeRe(p.nome));
}

function listarTestes() {
  const out = [];
  const walk = (dir, filtro) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, filtro);
      else if (filtro(e.name)) out.push(p);
    }
  };
  walk(path.join(ROOT, "packages/react/test"), (n) => /\.test\.tsx?$/.test(n));
  walk(path.join(ROOT, "scripts/gate"), (n) => n.endsWith(".mjs") && n !== "cobertura-promessas.mjs");
  return out;
}

/** Corta um arquivo de teste em blocos it/test, cada um com o título do describe acima. */
function blocos(arquivo) {
  const src = fs.readFileSync(arquivo, "utf8");
  const rel = path.relative(ROOT, arquivo).replaceAll("\\", "/");
  const inicios = [...src.matchAll(/^\s*(?:it|test)(?:\.each\([^)]*\))?\(/gm)].map((m) => m.index);
  if (inicios.length === 0) return [{ arquivo: rel, texto: src, fonte: src }];
  const out = [];
  for (let i = 0; i < inicios.length; i++) {
    const corpo = src.slice(inicios[i], inicios[i + 1] ?? src.length);
    const antes = src.slice(0, inicios[i]);
    const describes = [...antes.matchAll(/describe\(\s*(["'`])(.*?)\1/g)];
    const titulo = describes.length ? describes[describes.length - 1][2] : "";
    out.push({ arquivo: rel, texto: `${titulo}\n${corpo}`, fonte: src });
  }
  return out;
}

export async function medirCobertura() {
  const manifest = await import(pathToFileURL(path.join(ROOT, "packages/react/manifest.js")).href);
  const todosBlocos = listarTestes().flatMap(blocos);
  const componentes = [];
  for (const c of manifest.dsComponents) {
    const { proprios, promessas } = extrairPromessas(c, manifest.dsImportNames(c), manifest.dsExportName(c));
    const nomeRe = new RegExp(`\\b(${proprios.map(escapeRe).join("|")})\\b`);
    // O arquivo precisa MONTAR o componente (JSX `<Nome`), não só citá-lo em texto
    // (ex.: testes que leem os artefatos .md/llms.txt); o bloco precisa citá-lo.
    const jsxRe = new RegExp(`<(${proprios.map(escapeRe).join("|")})[\\s/>]`);
    const relevantes = todosBlocos.filter((b) => jsxRe.test(b.fonte) && nomeRe.test(b.texto));
    const itens = promessas.map((p) => {
      const padrao = padraoNoTeste(p);
      const onde = relevantes.find((b) => padrao.test(b.texto));
      return { ...p, coberta: Boolean(onde), arquivo: onde?.arquivo ?? null };
    });
    const cobertas = itens.filter((i) => i.coberta).length;
    componentes.push({
      code: c.code,
      exportName: manifest.dsExportName(c),
      blocosDeTeste: relevantes.length,
      total: itens.length,
      cobertas,
      pct: itens.length ? Math.round((cobertas / itens.length) * 1000) / 10 : 100,
      promessas: itens,
    });
  }
  const total = componentes.reduce((s, c) => s + c.total, 0);
  const cobertas = componentes.reduce((s, c) => s + c.cobertas, 0);
  const porTipo = {};
  for (const c of componentes) {
    for (const p of c.promessas) {
      porTipo[p.tipo] ??= { total: 0, cobertas: 0 };
      porTipo[p.tipo].total++;
      if (p.coberta) porTipo[p.tipo].cobertas++;
    }
  }
  return {
    total,
    cobertas,
    pct: total ? Math.round((cobertas / total) * 1000) / 10 : 100,
    porTipo,
    semTeste: componentes.filter((c) => c.blocosDeTeste === 0).map((c) => c.code),
    componentes,
  };
}

function imprimir(r, detalhe) {
  const pad = (s, n) => String(s).padEnd(n);
  console.log("Cobertura por promessa do manifest (heurística; ver cabeçalho de scripts/gate/cobertura-promessas.mjs)\n");
  console.log(`${pad("componente", 18)} ${pad("export", 22)} ${pad("blocos", 7)} ${pad("cobertas", 9)} %`);
  for (const c of [...r.componentes].sort((a, b) => a.pct - b.pct || a.code.localeCompare(b.code))) {
    console.log(`${pad(c.code, 18)} ${pad(c.exportName, 22)} ${pad(c.blocosDeTeste, 7)} ${pad(`${c.cobertas}/${c.total}`, 9)} ${c.pct}`);
    if (detalhe) {
      const faltam = c.promessas.filter((p) => !p.coberta).map((p) => `${p.tipo}:${p.nome}`);
      if (faltam.length) console.log(`    sem teste: ${faltam.join(", ")}`);
    }
  }
  console.log("");
  for (const [tipo, v] of Object.entries(r.porTipo)) {
    console.log(`  ${pad(tipo, 8)} ${v.cobertas}/${v.total} (${Math.round((v.cobertas / v.total) * 1000) / 10}%)`);
  }
  if (r.semTeste.length) console.log(`\n  Sem nenhum bloco de teste citando o componente: ${r.semTeste.join(", ")}`);
  console.log(`\nTOTAL: ${r.cobertas}/${r.total} promessas com teste (${r.pct}%)`);
}

/** Passo do gate: falha só se o total cair abaixo do piso. */
export async function checkCoberturaPromessas(min = PISO_GATE) {
  console.log(`▶ Cobertura por promessa do manifest (piso ${min}%)...`);
  const r = await medirCobertura();
  console.log(`  ${r.cobertas}/${r.total} promessas com teste (${r.pct}%); a11y ${r.porTipo.a11y?.cobertas}/${r.porTipo.a11y?.total}, prop ${r.porTipo.prop?.cobertas}/${r.porTipo.prop?.total}, teclado ${r.porTipo.teclado?.cobertas}/${r.porTipo.teclado?.total}`);
  if (r.pct < min) {
    throw new Error(`Cobertura por promessa ${r.pct}% abaixo do piso ${min}%. Rode "npm run cobertura:promessas -- --detalhe" para ver o que ficou sem teste.`);
  }
  console.log("  ✓ acima do piso");
}

const executadoDireto = process.argv[1] && path.resolve(process.argv[1]) === ESTE;
if (executadoDireto) {
  const args = process.argv.slice(2);
  const r = await medirCobertura();
  if (args.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else imprimir(r, args.includes("--detalhe"));
  const min = args.find((a) => a.startsWith("--min="));
  if (min && r.pct < Number(min.slice(6))) {
    console.error(`\nAbaixo do mínimo: ${r.pct}% < ${min.slice(6)}%`);
    process.exit(1);
  }
}
