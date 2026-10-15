/**
 * Codemod da 4.0 do @semec/ds (docs/migracao-4.0.md).
 *
 *   npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta>... [--write]
 *   (funciona com a 3.x ainda instalada; com a 4.0 e o TS 5 no projeto,
 *   basta `npx semec-ds codemod-4 <pasta>`)
 *   node node_modules/@semec/ds/codemods/v4.mjs <pasta>... [--write]
 *
 * Simulação por padrão (`--dry`): só relata. Com `--write`, grava.
 *
 * 1. AUD-35 — reescreve `onChange=` → `onValueChange=` no JSX de `Calendar`,
 *    `Combobox`, `InputOTP` e `FileUpload` importados de `@semec/ds/react`
 *    (ou do subpath do componente), inclusive com alias e namespace. No
 *    `DatePicker`, o `onChange` da 4.0 é o evento nativo: só reescreve quando a
 *    função inline claramente recebe o valor (string); se o handler é uma
 *    referência (`onChange={salvar}`), apenas relata a linha.
 * 2. AUD-55 — relata (nunca reescreve) cada utilitário `*-pv-*` e cada
 *    `--color-pv-*`, com a sugestão semântica da tabela do guia.
 * 3. AUD-20 — relata import por caminho de arquivo (`@semec/ds/dist/...`) em
 *    `import`/`require`/`import()`/`@import`; o `@source` do Tailwind fica de fora.
 * 4. Relata re-export por barrel local (`export { Combobox } from "@semec/ds/react"`).
 *
 * Análise do JSX pelo compilador TypeScript (AST, sem regex no código). Sem
 * dependência declarada: carrega o `typescript` do projeto ou o que veio no
 * `npx -p typescript@5`; precisa da API JS do compilador (TypeScript 4.7 a 5.x;
 * o 7 não a tem). A troca é só do nome do atributo; o resto do arquivo
 * fica byte a byte igual.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RENAME_ALWAYS = new Set(["Calendar", "Combobox", "InputOTP", "FileUpload"]);
const COMPONENTS = new Set([...RENAME_ALWAYS, "DatePicker"]);
const SUBPATHS = {
  "@semec/ds/react/calendar": "Calendar",
  "@semec/ds/react/combobox": "Combobox",
  "@semec/ds/react/input-otp": "InputOTP",
  "@semec/ds/react/file-upload": "FileUpload",
  "@semec/ds/react/date-picker": "DatePicker",
};
const ROOT_MODULES = new Set(["@semec/ds/react", ...Object.keys(SUBPATHS)]);

const CODE_EXT = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);
const TEXT_EXT = new Set([
  ...CODE_EXT,
  ".css", ".scss", ".sass", ".less", ".pcss", ".html", ".htm", ".md", ".mdx",
  ".vue", ".svelte", ".astro", ".json",
]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", "coverage", ".turbo", ".vercel"]);

/* ---------------------------------------------------------------------------
   Tabela L0 → semântico (AUD-55). Mesma do docs/migracao-4.0.md.
   `text`: utilitários de cor de texto (text-, placeholder-, caret-).
   `fill`: fundo (bg-, from-, via-, to-, fill-, accent-, shadow-).
   `line`: contorno (border-*, ring-*, outline-, divide-, decoration-, stroke-).
   `null` = sem semântico direto para esse uso; a `note` explica.
   ------------------------------------------------------------------------- */
export const L0_TABLE = {
  "blue-50": { fill: "tint", text: null, line: null, note: "fundo suave; em aviso informativo, bg-info-surface" },
  "blue-600": { fill: "primary", text: "primary", line: "primary", note: "ação primária; em informação, *-info" },
  "blue-700": { fill: "primary-hover", text: "primary-hover", line: "primary-hover", note: "hover da ação primária" },
  "blue-800": { fill: "primary-active", text: "primary-active", line: "primary-active", note: "ação primária pressionada" },
  "blue-hero": { fill: "brand-hero", text: "brand-hero", line: "ring", note: "marca (faixa de herói); anel de foco: ring-ring" },
  "blue-900": { fill: null, text: "text-brand", line: null, note: "texto institucional escuro (novo na 4.0); sobre o verde do Toast success, text-success-emphasis-foreground" },
  "green-50": { fill: "success-surface", text: null, line: null, note: "fundo de sucesso" },
  "green-500": { fill: "success-emphasis", text: null, line: null, note: "verde cheio (novo na 4.0); não use como texto nem contorno (2,13:1)" },
  "green-800": { fill: "success", text: "success", line: "success", note: "sucesso" },
  "yellow-800": { fill: "warning", text: "warning", line: "warning", note: "atenção" },
  "red-50": { fill: "destructive-surface", text: null, line: null, note: "fundo de erro" },
  "red-700": { fill: "destructive", text: "destructive", line: "destructive", note: "erro / ação destrutiva" },
  "gray-50": { fill: "background", text: null, line: null, note: "fundo da página" },
  "gray-100": { fill: "surface-alt", text: null, line: null, note: "superfície alternativa (também bg-muted)" },
  "gray-200": { fill: "border", text: null, line: "border", note: "borda e divisor" },
  "gray-300": { fill: "surface-sunken", text: null, line: null, note: "superfície rebaixada; contorno com 3:1 é border-border-strong" },
  "gray-400": { fill: "border-strong", text: null, line: "border-strong", note: "contorno de controle; para texto, text-text-muted (gray-400 tem 3,77:1)" },
  "gray-600": { fill: null, text: "text-muted", line: null, note: "texto de apoio (também text-muted-foreground)" },
  "gray-700": { fill: null, text: "text-secondary", line: null, note: "texto secundário" },
  "gray-900": { fill: "foreground", text: "foreground", line: null, note: "texto principal (também text-text-strong)" },
  white: { fill: "surface", text: "text-on-brand", line: "ring-inverse", note: "superfície branca; texto sobre a marca: text-text-on-brand" },
  black: { fill: null, text: null, line: null, note: "sem semântico; texto: text-foreground; véu de modal: bg-black/50 (Tailwind)" },
};

const KIND = {
  text: "text", placeholder: "text", caret: "text",
  bg: "fill", from: "fill", via: "fill", to: "fill", fill: "fill", accent: "fill", shadow: "fill",
};
const kindOf = (prefix) => KIND[prefix] ?? "line";

const UTIL_RE =
  /(?<![\w-])(bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|fill|stroke|from|via|to|divide|decoration|placeholder|caret|accent|shadow)-pv-((?:blue|green|yellow|red|gray)-(?:\d+|hero)|white|black)(\/[\w.%[\]-]+)?(?![\w-])/g;
const COLOR_VAR_RE = /--color-pv-((?:blue|green|yellow|red|gray)-(?:\d+|hero)|white|black)\b/g;
// Só especificadores de módulo: `from "…"`, `import "…"`, `import("…")`,
// `require("…")` e `@import "…"` / `@import url("…")` em CSS. O `@source
// "../node_modules/@semec/ds/dist/react"` do Tailwind é documentado e fica de
// fora (não é import, e caminho com node_modules/ não casa).
const DIST_RE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+|@import\s+(?:url\(\s*)?)(["'])(@semec\/ds\/dist\/[^"'\s]*)\1/g;

/** Sugestão semântica para um utilitário `prefixo-pv-nome[/opacidade]`. */
export function suggestUtility(prefix, name, opacity = "") {
  const row = L0_TABLE[name];
  if (!row) return { replacement: null, note: "primitivo sem semântico no kit" };
  const root = row[kindOf(prefix)];
  return { replacement: root ? `${prefix}-${root}${opacity}` : null, note: row.note };
}

/* ------------------------------------------------------------------------ */

/** O codemod usa a API JS do compilador (TypeScript 4.7 a 5.x; a 7 não a expõe). */
const hasCompilerApi = (ts) =>
  !!ts && typeof ts.createSourceFile === "function" && !!ts.ScriptTarget && !!ts.ScriptKind;

export const TS_INSTALL_HINT =
  "Instale o TypeScript 5 no projeto (npm i -D typescript@5) ou rode sem instalar: npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta>";

/**
 * Carrega o `typescript` do projeto (cwd) ou, no `npx -p`, o que veio ao lado
 * do pacote. Sem dependência declarada: nada é instalado junto com o kit.
 * Devolve `{ ts }` ou `{ error }` com a explicação para o usuário.
 */
export async function loadTypeScript(bases = [path.join(process.cwd(), "package.json"), fileURLToPath(import.meta.url)]) {
  const incompatible = [];
  for (const base of bases) {
    let resolved;
    try {
      resolved = createRequire(base).resolve("typescript");
    } catch {
      continue;
    }
    try {
      const mod = await import(pathToFileURL(resolved).href);
      const ts = mod.default ?? mod;
      if (hasCompilerApi(ts)) return { ts };
      incompatible.push(`${ts?.version ?? "versão desconhecida"} em ${resolved}`);
    } catch (err) {
      incompatible.push(`${resolved} (${err?.message ?? err})`);
    }
  }
  if (incompatible.length) {
    return {
      error: `o typescript encontrado não expõe a API JS do compilador (${[...new Set(incompatible)].join("; ")}). O codemod precisa do TypeScript 5 (o 7 não tem essa API). ${TS_INSTALL_HINT}`,
    };
  }
  return { error: `o codemod precisa do pacote typescript para ler o JSX. ${TS_INSTALL_HINT}` };
}

function scriptKind(ts, file) {
  const ext = path.extname(file);
  if (ext === ".tsx") return ts.ScriptKind.TSX;
  if (ext === ".ts" || ext === ".mts" || ext === ".cts") return ts.ScriptKind.TS;
  return ts.ScriptKind.JSX;
}

/** Nomes locais → componente, a partir dos imports de `@semec/ds/react*`. */
function collectImports(ts, sf) {
  const named = new Map();
  const namespaces = new Set();
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    if (!ROOT_MODULES.has(spec)) continue;
    const clause = stmt.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) {
      namespaces.add(bindings.name.text);
    } else if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        if (el.isTypeOnly) continue;
        const imported = (el.propertyName ?? el.name).text;
        if (COMPONENTS.has(imported)) named.set(el.name.text, imported);
      }
    }
  }
  return { named, namespaces };
}

function componentOf(ts, tagName, imports) {
  if (ts.isIdentifier(tagName)) return imports.named.get(tagName.text) ?? null;
  if (
    ts.isPropertyAccessExpression(tagName) &&
    ts.isIdentifier(tagName.expression) &&
    imports.namespaces.has(tagName.expression.text) &&
    COMPONENTS.has(tagName.name.text)
  ) {
    return tagName.name.text;
  }
  return null;
}

const EVENT_MEMBERS = new Set([
  "target", "currentTarget", "nativeEvent", "preventDefault", "stopPropagation", "persist", "isDefaultPrevented", "type",
]);

/**
 * DatePicker: o handler inline recebe valor (string, 3.x) ou evento (4.0)?
 * Devolve "value", "event" ou "unknown".
 */
function classifyDatePickerHandler(ts, expr) {
  while (expr && ts.isParenthesizedExpression(expr)) expr = expr.expression;
  if (!expr || !(ts.isArrowFunction(expr) || ts.isFunctionExpression(expr))) return "unknown";
  const param = expr.parameters[0];
  if (!param) return "value"; // () => … funciona igual com onValueChange
  if (param.type) {
    const t = param.type.getText();
    if (/^string$/.test(t.trim())) return "value";
    if (/Event/.test(t)) return "event";
    return "unknown";
  }
  if (!ts.isIdentifier(param.name)) return "event"; // ({ target }) => …
  const name = param.name.text;
  let usesEvent = false;
  const visit = (node) => {
    if (usesEvent) return;
    if (
      (ts.isPropertyAccessExpression(node) || ts.isPropertyAccessChain?.(node)) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name &&
      EVENT_MEMBERS.has(node.name.text)
    ) {
      usesEvent = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(expr.body);
  return usesEvent ? "event" : "value";
}

function lineCol(text, index) {
  let line = 1;
  let last = -1;
  for (let i = text.indexOf("\n"); i !== -1 && i < index; i = text.indexOf("\n", i + 1)) {
    line++;
    last = i;
  }
  return { line, col: index - last };
}

/** Analisa um arquivo de código. Devolve { output, findings }. */
export function transformSource(ts, file, text) {
  const findings = [];
  const edits = [];
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind(ts, file));
  const imports = collectImports(ts, sf);
  // Re-export por barrel local: quem importa do barrel não é visto aqui.
  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt) || !stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (!ROOT_MODULES.has(stmt.moduleSpecifier.text) || stmt.isTypeOnly) continue;
    const clause = stmt.exportClause;
    let reexported = [];
    if (!clause) {
      reexported = ["*"];
    } else if (ts.isNamedExports(clause)) {
      reexported = clause.elements
        .filter((el) => !el.isTypeOnly && COMPONENTS.has((el.propertyName ?? el.name).text))
        .map((el) => (el.propertyName ? `${el.propertyName.text} as ${el.name.text}` : el.name.text));
    } else {
      reexported = [`* as ${clause.name.text}`];
    }
    if (reexported.length) {
      findings.push({
        index: stmt.getStart(sf), kind: "revisar",
        message: `re-export de ${stmt.moduleSpecifier.text} (${reexported.join(", ")}): os arquivos que importam deste barrel não são reescritos; confira o onChange deles à mão ou pelo typecheck.`,
      });
    }
  }
  if (imports.named.size || imports.namespaces.size) {
    const visit = (node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const component = componentOf(ts, node.tagName, imports);
        if (component) {
          const attrs = node.attributes.properties.filter((p) => ts.isJsxAttribute(p));
          const nameOf = (a) => a.name.getText(sf);
          const onChange = attrs.find((a) => nameOf(a) === "onChange");
          const hasValueChange = attrs.some((a) => nameOf(a) === "onValueChange");
          if (onChange) {
            const at = onChange.name.getStart(sf);
            const tag = node.tagName.getText(sf);
            const expr = onChange.initializer && ts.isJsxExpression(onChange.initializer)
              ? onChange.initializer.expression
              : undefined;
            if (hasValueChange) {
              findings.push({
                index: at, kind: "revisar",
                message: `<${tag}> tem onChange e onValueChange: remova o onChange (${
                  component === "DatePicker" ? "na 4.0 ele recebe o evento nativo" : "na 4.0 ele não é mais chamado"
                }).`,
              });
            } else if (RENAME_ALWAYS.has(component)) {
              edits.push({ start: at, end: onChange.name.end, text: "onValueChange" });
              findings.push({ index: at, kind: "reescrito", message: `<${tag} onChange> → onValueChange` });
            } else {
              const kind = classifyDatePickerHandler(ts, expr);
              if (kind === "value") {
                edits.push({ start: at, end: onChange.name.end, text: "onValueChange" });
                findings.push({ index: at, kind: "reescrito", message: `<${tag} onChange> → onValueChange (o handler recebe a data em string)` });
              } else if (kind === "unknown") {
                findings.push({
                  index: at, kind: "revisar",
                  message: `<${tag} onChange={${expr ? expr.getText(sf).slice(0, 40) : "…"}}>: não dá para saber se o handler recebe a data (string, 3.x) ou o evento (4.0). Se recebe a string, troque por onValueChange.`,
                });
              }
              // "event": já é o evento nativo da 4.0; nada a fazer.
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  let output = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, e.start) + e.text + output.slice(e.end);
  }
  return { output, findings, changed: edits.length > 0 };
}

/** Relata utilitários L0, `--color-pv-*` e imports de `dist/` (nunca reescreve). */
export function scanText(text) {
  const findings = [];
  for (const m of text.matchAll(UTIL_RE)) {
    const [whole, prefix, name, opacity = ""] = m;
    const { replacement, note } = suggestUtility(prefix, name, opacity);
    findings.push({
      index: m.index, kind: "utilitário",
      message: replacement ? `${whole} → ${replacement} (${note})` : `${whole}: sem semântico direto (${note})`,
    });
  }
  for (const m of text.matchAll(COLOR_VAR_RE)) {
    findings.push({
      index: m.index, kind: "utilitário",
      message: `${m[0]} não existe mais na 4.0: use var(--pv-${m[1]}) só para criar um semântico, ou o --color-* semântico (${L0_TABLE[m[1]]?.note ?? "ver guia"})`,
    });
  }
  for (const m of text.matchAll(DIST_RE)) {
    findings.push({
      index: m.index + m[0].indexOf(m[2]), kind: "import",
      message: `${m[2]}: caminho de arquivo em dist/ não é contrato e o "exports" já bloqueia; use @semec/ds/react ou @semec/ds/react/<componente>`,
    });
  }
  return findings;
}

function* walk(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    yield target;
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      yield* walk(path.join(target, entry.name));
    } else if (entry.isFile() && TEXT_EXT.has(path.extname(entry.name))) {
      yield path.join(target, entry.name);
    }
  }
}

/** Roda o codemod. Devolve o resumo (usado nos testes). */
export async function run(targets, { write = false, log = console.log, ts: tsArg } = {}) {
  let ts = tsArg;
  if (!ts) {
    const loaded = await loadTypeScript();
    if (loaded.error) throw new Error(loaded.error);
    ts = loaded.ts;
  }
  const summary = { files: 0, rewritten: 0, written: 0, review: 0, utilities: 0, imports: 0 };
  const header = write
    ? "@semec/ds codemod-4 (--write: as reescritas foram gravadas)"
    : "@semec/ds codemod-4 (simulação: nada foi gravado; use --write para aplicar as reescritas)";
  log(header);
  for (const target of targets) {
    for (const file of walk(target)) {
      summary.files++;
      const text = fs.readFileSync(file, "utf8");
      let findings = [];
      let output = text;
      let changed = false;
      if (CODE_EXT.has(path.extname(file)) && text.includes("@semec/ds")) {
        ({ output, findings, changed } = transformSource(ts, file, text));
      }
      findings = findings.concat(scanText(text)).sort((a, b) => a.index - b.index);
      if (!findings.length) continue;
      const rel = path.relative(process.cwd(), file);
      log(`\n${!rel || rel.startsWith("..") || path.isAbsolute(rel) ? file : rel}`);
      for (const f of findings) {
        const { line, col } = lineCol(text, f.index);
        log(`  ${line}:${col}  ${f.kind.padEnd(10)} ${f.message}`);
        if (f.kind === "reescrito") summary.rewritten++;
        else if (f.kind === "revisar") summary.review++;
        else if (f.kind === "utilitário") summary.utilities++;
        else if (f.kind === "import") summary.imports++;
      }
      if (changed && write) {
        fs.writeFileSync(file, output);
        summary.written++;
      }
    }
  }
  log(
    `\nResumo: ${summary.files} arquivo(s) lido(s) · ${summary.rewritten} onChange → onValueChange (${
      write ? `${summary.written} arquivo(s) gravado(s)` : "não gravado"
    }) · ${summary.review} para revisar · ${summary.utilities} utilitário(s) L0 · ${summary.imports} import(s) de dist/.`
  );
  if (summary.utilities) log("Utilitários L0 não são reescritos: confira o papel de cada um (tabela em docs/migracao-4.0.md).");
  return summary;
}

export const USAGE = `Uso: npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta ou arquivo>... [--write]
     (com a 4.0 e o TypeScript 5 já instalados: npx semec-ds codemod-4 <pasta>)

  --dry    só relata (padrão)
  --write  grava as trocas onChange → onValueChange
  Guia: https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md`;

export async function main(argv) {
  const write = argv.includes("--write");
  const targets = argv.filter((a) => !a.startsWith("--"));
  if (argv.includes("--help") || argv.includes("-h") || !targets.length) {
    console.log(USAGE);
    return targets.length || argv.includes("--help") || argv.includes("-h") ? 0 : 1;
  }
  for (const t of targets) {
    if (!fs.existsSync(t)) {
      console.error(`codemod-4: caminho não encontrado: ${t}`);
      return 1;
    }
  }
  try {
    await run(targets, { write });
    return 0;
  } catch (err) {
    console.error(`codemod-4: ${err.message}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
