#!/usr/bin/env node
/**
 * Plano de release com vários pacotes (usado por .github/workflows/release.yml).
 *
 * Decide, para o commit atual, um de três modos:
 *   - pending: há changesets em .changeset/ → nada é publicado;
 *   - publish: nenhum changeset pendente e ao menos um pacote público com a
 *              versão do package.json ainda fora do npm → `changeset publish`;
 *   - noop:    nenhum changeset pendente e tudo já publicado.
 *
 * Salvaguardas:
 *   - consulta o registry pacote a pacote; E404 = não publicado, qualquer outro
 *     erro aborta (nunca decide publicar às cegas);
 *   - versão 0.0.0 nunca é publicada: é o marcador de pacote novo que ainda não
 *     passou pelo PR de versão (o changeset major leva a 1.0.0).
 *
 * A lógica de decisão (`planRelease`, `interpretNpmView`) é pura e tem teste em
 * plano.test.mjs. O resto só lê o disco, chama `npm view` e escreve as saídas.
 *
 * Saídas (GITHUB_OUTPUT): mode, count, publish (linhas "<nome> <versão> <dir>").
 * Uso local: `node scripts/release/plano.mjs` (imprime o plano em JSON).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Versão que marca pacote novo, ainda não versionado pelo Changesets. */
export const UNVERSIONED = "0.0.0";

/**
 * Interpreta o resultado de `npm view <nome>@<versão> version`.
 * @param {{ ok: boolean, stdout?: string, stderr?: string }} result
 * @param {string} version
 * @returns {"published" | "unpublished" | "error"}
 */
export function interpretNpmView(result, version) {
  if (result.ok) {
    // Pacote existe; saída vazia = essa versão não existe.
    return String(result.stdout ?? "").trim() === version ? "published" : "unpublished";
  }
  return /\bE404\b/.test(String(result.stderr ?? "")) ? "unpublished" : "error";
}

/**
 * Decide o modo do release.
 * @param {object} input
 * @param {Array<{ name: string, version: string, dir: string }>} input.packages pacotes públicos
 * @param {number} input.pendingChangesets arquivos .md em .changeset/ (sem README)
 * @param {Record<string, "published" | "unpublished" | "error">} input.registry por `nome@versão`
 */
export function planRelease({ packages, pendingChangesets, registry }) {
  const errors = [];
  const warnings = [];
  const unpublished = [];
  const published = [];
  const unversioned = [];

  for (const pkg of packages) {
    if (pkg.version === UNVERSIONED) {
      unversioned.push(pkg);
      continue;
    }
    const spec = `${pkg.name}@${pkg.version}`;
    const state = registry[spec];
    if (state === "published") published.push(pkg);
    else if (state === "unpublished") unpublished.push(pkg);
    else errors.push(`Não foi possível consultar ${spec} no npm.`);
  }

  if (errors.length > 0) {
    return { mode: "error", publish: [], published, unpublished, unversioned, errors, warnings };
  }

  if (pendingChangesets > 0) {
    for (const pkg of unpublished) {
      warnings.push(
        `${pkg.name}@${pkg.version} ainda não está no npm, mas há changesets pendentes; nada foi publicado. ` +
          `Versione no PR de versão (a próxima versão inclui estas mudanças) ou publique ${pkg.version} pelo fallback local do CONTRIBUTING.md.`,
      );
    }
    return { mode: "pending", publish: [], published, unpublished, unversioned, errors, warnings };
  }

  for (const pkg of unversioned) {
    warnings.push(
      `${pkg.name} está em ${UNVERSIONED} e não há changeset pendente: o pacote novo precisa de um changeset (major para a 1.0.0) e do PR de versão antes de publicar.`,
    );
  }

  if (unpublished.length === 0) {
    return { mode: "noop", publish: [], published, unpublished, unversioned, errors, warnings };
  }
  return { mode: "publish", publish: unpublished, published, unpublished, unversioned, errors, warnings };
}

/* ------------------------------------------------------------------------- */
/* Leitura do repositório e do registry (efeitos colaterais)                 */
/* ------------------------------------------------------------------------- */

/** Pacotes públicos do workspace (campos "workspaces" da raiz, padrões "dir/*" ou "dir"). */
export function readPublicPackages(rootDir) {
  const root = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const dirs = [];
  for (const pattern of root.workspaces ?? []) {
    if (pattern.endsWith("/*")) {
      const base = pattern.slice(0, -2);
      const abs = path.join(rootDir, base);
      if (!fs.existsSync(abs)) continue;
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        if (entry.isDirectory()) dirs.push(`${base}/${entry.name}`);
      }
    } else {
      dirs.push(pattern);
    }
  }
  const packages = [];
  for (const dir of dirs.sort()) {
    const file = path.join(rootDir, dir, "package.json");
    if (!fs.existsSync(file)) continue;
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    if (pkg.private || !pkg.name || !pkg.version) continue;
    packages.push({ name: pkg.name, version: pkg.version, dir });
  }
  return packages;
}

export function countPendingChangesets(rootDir) {
  const dir = path.join(rootDir, ".changeset");
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").length;
}

function npmView(spec) {
  try {
    const stdout = execFileSync("npm", ["view", spec, "version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    return { ok: true, stdout };
  } catch (err) {
    return { ok: false, stderr: `${err.stderr ?? ""}${err.message ?? ""}` };
  }
}

function writeGithubOutput(plan) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  const lines = plan.publish.map((p) => `${p.name} ${p.version} ${p.dir}`).join("\n");
  fs.appendFileSync(
    out,
    `mode=${plan.mode}\ncount=${plan.publish.length}\npublish<<__SEMEC_PLANO__\n${lines}\n__SEMEC_PLANO__\n`,
  );
}

function writeSummary(plan, packages, pendingChangesets, registry) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  const rows = packages.map((p) => {
    const spec = `${p.name}@${p.version}`;
    const state = p.version === UNVERSIONED ? "novo (0.0.0)" : registry[spec] === "published" ? "sim" : "não";
    return `| \`${p.name}\` | \`${p.version}\` | ${state} |`;
  });
  const text = [
    "## Plano de release",
    "",
    `- commit: \`${process.env.HEAD_SHA ?? "local"}\``,
    `- changesets pendentes: \`${pendingChangesets}\``,
    `- modo: \`${plan.mode}\``,
    "",
    "| Pacote | Versão no package.json | Já no npm |",
    "|---|---|---|",
    ...rows,
    "",
    plan.mode === "publish"
      ? `Publicando: ${plan.publish.map((p) => `\`${p.name}@${p.version}\``).join(", ")}.`
      : plan.mode === "noop"
        ? "Tudo já está no npm e não há changesets pendentes: nada a fazer."
        : plan.mode === "pending"
          ? "Nada é publicado enquanto houver changesets em `.changeset/`. Para lançar, um mantenedor roda `npm run version-packages` numa branch `changeset-release/<versão>` e abre o PR de versão (ver CONTRIBUTING.md)."
          : "Consulta ao npm falhou: release abortado.",
    "",
  ].join("\n");
  if (file) fs.appendFileSync(file, text);
  else process.stderr.write(`${text}\n`);
}

export function main(rootDir = process.cwd()) {
  const packages = readPublicPackages(rootDir);
  const pendingChangesets = countPendingChangesets(rootDir);
  const registry = {};
  for (const p of packages) {
    if (p.version === UNVERSIONED) continue;
    const spec = `${p.name}@${p.version}`;
    registry[spec] = interpretNpmView(npmView(spec), p.version);
  }
  const plan = planRelease({ packages, pendingChangesets, registry });
  writeSummary(plan, packages, pendingChangesets, registry);
  for (const w of plan.warnings) console.log(`::warning::${w}`);
  for (const e of plan.errors) console.log(`::error::${e}`);
  if (plan.mode === "error") return 1;
  writeGithubOutput(plan);
  console.log(JSON.stringify({ mode: plan.mode, publish: plan.publish }, null, 2));
  return 0;
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  process.exitCode = main(path.resolve(here, "..", ".."));
}
