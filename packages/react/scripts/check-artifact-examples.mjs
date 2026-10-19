#!/usr/bin/env node
// Compila os exemplos de Uso e as skills do tarball, como um consumidor TS strict.
// Os blocos Fonte são implementação interna, já coberta por typecheck/check-dts.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.resolve(pkgRoot, "../../build/artifact-examples");
fs.mkdirSync(buildDir, { recursive: true });
const consumer = process.argv[2] ? path.resolve(process.argv[2]) : fs.mkdtempSync(path.join(buildDir, "consumer-"));
const npm = process.env.npm_execpath || path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
function runNpm(args, cwd) {
  const result = spawnSync(process.execPath, [npm, ...args], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

if (!process.argv[2]) {
  const packed = JSON.parse(runNpm(["pack", "--ignore-scripts", "--json", "--pack-destination", consumer], pkgRoot));
  fs.writeFileSync(path.join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
  const manifest = JSON.parse(fs.readFileSync(path.join(pkgRoot, "dist/skills/manifest.json"), "utf8"));
  assert.equal(manifest.install.form, "npm install react-hook-form @hookform/resolvers@^5 zod@^4");
  const install = runNpm([
    "install", "--ignore-scripts", "--no-audit", "--no-fund",
    "--cache", path.join(buildDir, "npm-cache"),
    path.join(consumer, packed[0].filename),
    ...manifest.install.form.split(" ").slice(2), "@types/react@^19", "@types/react-dom@^19",
  ], consumer);
  fs.writeFileSync(path.join(consumer, "install.log"), install);
}

const artifactDir = path.join(consumer, "node_modules/@semec/ds/dist/skills");
const manifest = JSON.parse(fs.readFileSync(path.join(artifactDir, "manifest.json"), "utf8"));
const examples = [];
for (const component of manifest.components) {
  assert.match(component.file, /^https:\/\/github\.com\/SEMEC-PVH\/SEMEC_design_system\/blob\/main\/packages\/react\/src\//);
  assert.match(component.url, /^https:\/\/semec-pvh\.github\.io\/SEMEC_design_system\//);
  const markdown = fs.readFileSync(path.join(artifactDir, "components", `${component.slug}.md`), "utf8");
  const usage = markdown.split("## Uso\n")[1]?.split("## Prompt")[0];
  const code = usage?.match(/```tsx\n([\s\S]*?)```/)?.[1];
  assert.ok(code, `Uso ausente: ${component.slug}`);
  examples.push([component.slug, code]);
}
for (const skill of ["semec-ds", "semec-ds-lite"]) {
  const skillDir = skill === "semec-ds-lite" ? path.join(artifactDir, "../lite") : artifactDir;
  const markdown = fs.readFileSync(path.join(skillDir, skill, "SKILL.md"), "utf8");
  for (const [index, block] of [...markdown.matchAll(/```(?:tsx|jsx|ts)\n([\s\S]*?)```/g)].entries()) {
    examples.push([`${skill}-${index}`, block[1]]);
  }
}

const exampleDir = path.join(consumer, "examples");
fs.mkdirSync(exampleDir, { recursive: true });
const files = examples.map(([name, code]) => {
  const file = path.join(exampleDir, `${name}.tsx`);
  // Os snippets mostram alternativas JSX adjacentes, não uma única árvore.
  fs.writeFileSync(file, `export {};\n${code.replace(/^</gm, ";<")}`);
  return file;
});
// Contexto intencional dos snippets (estado, dados e callbacks do app).
// Lista explícita e tipada: não injete imports, any nem ignore diagnósticos.
const contextFile = path.join(exampleDir, "context.d.ts");
fs.writeFileSync(contextFile, `
declare const aberto: boolean, aceito: boolean, baixando: boolean, codigoErrado: boolean, sidebarOpen: boolean,
  emailInvalido: boolean, enviado: boolean, enviando: boolean;
declare const code: string, codigo: string, demanda: string, email: string,
  inicio: string, municipio: string, valor: string;
declare const erro: string | undefined, erroData: string | undefined, erroMunicipio: string | undefined;
declare const pagina: number, tentativa: number, totalPaginas: number;
declare const arquivos: File[];
declare const data: Date | undefined;
declare const municipios: { value: string; label: string }[], orgaos: { value: string; label: string }[];
declare const setAberto: (value: boolean) => void, setAceito: (value: boolean) => void, setSidebarOpen: (value: boolean) => void;
declare const setCode: (value: string) => void, setCodigo: (value: string) => void,
  setCpf: (value: string) => void, setDemanda: (value: string) => void,
  setEmail: (value: string) => void, setInicio: (value: string) => void,
  setMunicipio: (value: string) => void, setTipoPessoa: (value: string) => void,
  setValor: (value: string) => void;
declare const setPagina: (value: number) => void, setEtapa: (value: number) => void;
declare const setArquivos: (value: File[]) => void, setData: (value: Date | undefined) => void;
declare const atualizar: () => void, excluir: () => void, recarregarDados: () => void;
type ExampleRecord = { nome: string; numero: string; status: string };
declare const protocolos: ExampleRecord[], registros: ExampleRecord[];
declare const abrirProtocolo: (value: ExampleRecord) => void;
declare const sortField: string, sortDir: "asc" | "desc";
declare const handleSort: (key: string) => void;
`);
files.push(contextFile);
const compilerOptions = {
  noEmit: true, strict: true, skipLibCheck: false,
  jsx: "react-jsx", target: "ES2022",
  module: "ESNext", moduleResolution: "bundler",
  types: ["react", "react-dom"],
  typeRoots: [path.join(consumer, "node_modules/@types")],
};
const config = path.join(consumer, "tsconfig.examples.json");
fs.writeFileSync(config, JSON.stringify({ compilerOptions, files }, null, 2));
const tsc = fileURLToPath(import.meta.resolve("typescript/bin/tsc"));
const compiled = spawnSync(process.execPath, [tsc, "-p", config, "--pretty", "false"], { cwd: consumer, encoding: "utf8" });
fs.writeFileSync(path.join(consumer, "tsc.log"), `${compiled.stdout ?? ""}${compiled.stderr ?? ""}`);
if (compiled.status !== 0) {
  console.error(compiled.error ?? `${compiled.stdout}\n${compiled.stderr}`);
  process.exitCode = 1;
} else {
  console.log(`check-artifact-examples: ${examples.length} exemplos compilam (strict, tipos do tarball); instalação da receita OK.`);
}
console.log(`Consumidor e evidências: ${consumer}`);
