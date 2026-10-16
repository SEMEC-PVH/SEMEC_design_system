/**
 * conflict-markers.mjs — detecta marcadores de conflito de merge (TST-02, #49).
 *
 * Usado pelo build-artifacts.mjs (fontes e saídas dos artefatos de IA) e pelo
 * gate (scripts/gate/check-conflict-markers.mjs, repositório inteiro). Um merge
 * mal resolvido na SKILL chegou ao site sem que build, gate, lint, test ou
 * typecheck falhassem; esta checagem fecha esse buraco.
 *
 * Marcador = linha que começa com 7 `<`, 7 `=` ou 7 `>` seguidos de espaço ou
 * fim de linha (o formato que o git escreve). Uma régua mais longa (`========`)
 * não conta, para não pegar títulos setext do Markdown.
 */
import fs from "node:fs";
import path from "node:path";

export const CONFLICT_MARKER_RE = /^(<{7}|={7}|>{7})(?=[ \t]|\r?$)/;

/**
 * Procura marcadores num texto.
 * @param {string} text
 * @returns {{ line: number, marker: string, text: string }[]}
 */
export function findConflictMarkers(text) {
  const hits = [];
  const lines = String(text).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = CONFLICT_MARKER_RE.exec(lines[i]);
    if (m) hits.push({ line: i + 1, marker: m[1], text: lines[i].replace(/\r$/, "").slice(0, 120) });
  }
  return hits;
}

/**
 * Procura marcadores numa lista de arquivos (caminhos absolutos ou relativos a `root`).
 * Arquivos ausentes são ignorados.
 * @param {string[]} files
 * @param {{ root?: string }} [opts]
 * @returns {{ file: string, line: number, marker: string, text: string }[]}
 */
export function scanFilesForConflictMarkers(files, { root = process.cwd() } = {}) {
  const hits = [];
  for (const f of files) {
    const abs = path.isAbsolute(f) ? f : path.join(root, f);
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    for (const h of findConflictMarkers(text)) {
      hits.push({ file: path.relative(root, abs).split(path.sep).join("/"), ...h });
    }
  }
  return hits;
}

/** Lista recursiva de arquivos de um diretório (vazio se não existir). */
export function listFilesRecursive(dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFilesRecursive(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

/** Mensagem de erro legível para uma lista de ocorrências. */
export function formatConflictMarkers(hits) {
  return hits.map((h) => `  ${h.file}:${h.line}: ${h.text}`).join("\n");
}

/**
 * Lança erro se algum arquivo tiver marcador de conflito.
 * @param {string[]} files
 * @param {{ root?: string, context?: string }} [opts]
 */
export function assertNoConflictMarkers(files, { root = process.cwd(), context = "arquivos" } = {}) {
  const hits = scanFilesForConflictMarkers(files, { root });
  if (hits.length) {
    throw new Error(
      `Marcadores de conflito de merge em ${context} (${hits.length}). Resolva o merge antes de gerar/publicar:\n${formatConflictMarkers(hits)}`
    );
  }
}
