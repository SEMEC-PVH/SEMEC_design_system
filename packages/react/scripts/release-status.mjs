/**
 * release-status.mjs — o que o repositório tem e o npm ainda não (TST-15, #55).
 *
 * O site é publicado a cada push no main, mas o npm só recebe uma versão nova
 * quando o PR "Version Packages" consome os changesets. Nesse intervalo o site e
 * os artefatos diziam "4.0.1" descrevendo um código que não era o do npm 4.0.1.
 *
 * Fonte: os changesets pendentes em `.changeset/*.md` (o mesmo critério do
 * workflow Release, que fica em modo "pending" enquanto eles existem). Sem
 * pasta `.changeset` (ex.: build a partir do tarball) não há o que marcar.
 *
 * Determinístico: só depende dos arquivos do commit.
 */
import fs from "node:fs";
import path from "node:path";

const BUMPS = ["patch", "minor", "major"];

/**
 * Lê o tipo de bump que um changeset pede para o pacote, ou `null`.
 * @param {string} text conteúdo do changeset
 * @param {string} pkgName ex.: "@semec/ds"
 */
export function changesetBump(text, pkgName) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
  if (!front) return null;
  for (const line of front.split(/\r?\n/)) {
    const m = /^\s*["']?([^"':]+)["']?\s*:\s*(patch|minor|major)\s*$/.exec(line);
    if (m && m[1].trim() === pkgName) return m[2];
  }
  return null;
}

/** Próxima versão semver a partir da atual e do maior bump. */
export function bumpVersion(version, bump) {
  const [major, minor, patch] = String(version)
    .split("-")[0]
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * @param {{ changesetDir: string, pkgName: string, version: string }} opts
 * @returns {null | { count: number, bump: "patch"|"minor"|"major", nextVersion: string, files: string[] }}
 */
export function pendingRelease({ changesetDir, pkgName, version }) {
  let names;
  try {
    names = fs.readdirSync(changesetDir);
  } catch {
    return null;
  }
  const files = [];
  let highest = -1;
  for (const name of names.sort()) {
    if (!name.endsWith(".md") || name.toLowerCase() === "readme.md") continue;
    const bump = changesetBump(fs.readFileSync(path.join(changesetDir, name), "utf8"), pkgName);
    if (!bump) continue;
    files.push(name);
    highest = Math.max(highest, BUMPS.indexOf(bump));
  }
  if (!files.length) return null;
  const bump = BUMPS[highest];
  return { count: files.length, bump, nextVersion: bumpVersion(version, bump), files };
}

/**
 * Frase PT-BR para os artefatos. `null` quando não há nada pendente.
 * @param {ReturnType<typeof pendingRelease>} pending
 * @param {string} version versão do package.json
 * @param {string} pkgName
 */
export function unreleasedNote(pending, version, pkgName) {
  if (!pending) return null;
  const plural = pending.count === 1 ? "changeset pendente" : "changesets pendentes";
  return `Não publicado: este conteúdo vem do repositório e inclui ${pending.count} ${plural} (${pending.bump}) que ainda não estão no npm. O ${pkgName}@${version} do npm pode não ter o que está descrito aqui; a próxima versão prevista é a ${pending.nextVersion}. Confira a versão instalada com \`npm ls ${pkgName}\`.`;
}
