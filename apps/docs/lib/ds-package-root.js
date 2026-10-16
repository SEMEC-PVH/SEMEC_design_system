import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Raiz do kit (`packages/react/`) a partir do cwd (raiz do repo ou apps/docs),
 * para ler o código-fonte dos componentes no build do site.
 *
 * Substitui o `dsPackageRootResolve` de `@semec/ds/react/server`, depreciado
 * na 4.1 e removido na 5.0 (TST-34b, ADR-013): o subpath era uso interno do
 * monorepo e o site resolve o caminho por conta própria.
 */
export function dsPackageRoot(cwd = process.cwd()) {
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
