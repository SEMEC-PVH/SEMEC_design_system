/**
 * Helpers de Node do pacote semec-ds — apenas para uso em
 * Server Components / scripts. NÃO importar em Client Components.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Resolve a raiz do pacote (`packages/react/`) a partir de um cwd arbitrário
 * (raiz do repo ou apps/docs), para resolver `file` sem depender de
 * import.meta.url (que o Turbopack não aceita como argumento de new URL).
 */
export function dsPackageRootResolve(cwd = process.cwd()) {
  let dir = cwd;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "packages", "react");
    if (existsSync(join(candidate, "manifest.js"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("packages/react não encontrado a partir do cwd");
}