import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatConflictMarkers,
  scanFilesForConflictMarkers,
} from "../../packages/react/scripts/conflict-markers.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Binários e mídias: não têm linhas de texto (e um .glb pode conter qualquer byte).
const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".bmp",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".glb", ".gltf", ".bin", ".blend", ".fbx", ".obj",
  ".mp3", ".mp4", ".webm", ".wav", ".ogg",
  ".pdf", ".zip", ".gz", ".tgz", ".7z",
]);

/**
 * Arquivos versionados ou prestes a ser (rastreados + novos não ignorados) em `root`.
 * @param {string} root
 */
export function listRepoTextFiles(root = repoRoot) {
  const out = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  return out
    .split("\0")
    .filter(Boolean)
    .filter((f) => !BINARY_EXT.has(path.extname(f).toLowerCase()));
}

/**
 * Gate: nenhum arquivo do repositório pode ter marcador de conflito de merge
 * (TST-02, #49). Fixtures que precisem do texto devem montá-lo em tempo de
 * execução (ex.: "<".repeat(7)), nunca no início de uma linha do arquivo.
 * @param {{ root?: string, files?: string[] }} [opts]
 */
export async function checkConflictMarkers({ root = repoRoot, files } = {}) {
  console.log("▶ [marcadores] Verificando marcadores de conflito de merge no repositório...");
  const list = files ?? listRepoTextFiles(root);
  const hits = scanFilesForConflictMarkers(list, { root });
  if (hits.length) {
    throw new Error(
      `Marcadores de conflito de merge em ${hits.length} linha(s):\n${formatConflictMarkers(hits)}`
    );
  }
  console.log(`  ✓ ${list.length} arquivos de texto sem marcadores de conflito.`);
}
