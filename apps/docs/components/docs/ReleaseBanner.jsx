/**
 * Aviso "Não publicado" no topo das páginas do site (TST-15, #55).
 *
 * O site sai a cada push no main, mas o npm só recebe versão nova quando os
 * changesets são consumidos. Enquanto houver changesets pendentes, as páginas
 * podem documentar API que o npm ainda não tem (ex.: `errorRole` no FormField).
 *
 * Componente de servidor: lê `public/manifest.json` (gerado no prebuild pelo
 * build-artifacts.mjs, campo `unreleased`) no build estático. Sem changesets
 * pendentes, `unreleased` é `null` e nada é renderizado.
 */
import fs from "node:fs";
import path from "node:path";
import { TriangleAlert } from "lucide-react";

function lerUnreleased() {
  try {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public", "manifest.json"), "utf8")
    );
    return manifest.unreleased ?? null;
  } catch {
    return null;
  }
}

// O `note` usa crases para código (`npm ls @semec/ds`); vira <code>.
function comCodigo(texto) {
  return texto
    .split("`")
    .map((parte, i) => (i % 2 === 1 ? <code key={i}>{parte}</code> : parte));
}

export default function ReleaseBanner() {
  const unreleased = lerUnreleased();
  if (!unreleased?.note) return null;
  return (
    <aside className="release-banner" aria-label="Aviso de versão">
      <TriangleAlert className="release-banner__icon" aria-hidden="true" />
      <p className="release-banner__text">{comCodigo(unreleased.note)}</p>
    </aside>
  );
}
