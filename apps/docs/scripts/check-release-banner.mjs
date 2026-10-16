#!/usr/bin/env node
/**
 * Confere o aviso "Não publicado" nas páginas do site exportado (TST-15, #55).
 *
 * Roda depois do `next build` (export estático em `out/`). Regra:
 * - `manifest.json` com `unreleased` (changesets pendentes): TODA página de
 *   documentação traz o `.release-banner` com o texto do `unreleased.note`;
 * - `unreleased: null`: nenhuma página traz o aviso.
 *
 * Fora da regra: 404/_not-found, os protótipos (`out/proto`), que não usam o
 * layout de documentação, e as páginas que só redirecionam (ex.: a raiz → /introducao).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "..", process.argv[2] ?? "out");

if (!fs.existsSync(path.join(out, "manifest.json"))) {
  console.error(`✖ ${out}/manifest.json não existe: rode 'npm run build --workspace @semec/docs' antes.`);
  process.exit(1);
}
const { unreleased } = JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8"));

const IGNORAR = new Set(["proto", "_not-found", "404", "_next"]);
function paginas(dir, rel = "") {
  const lista = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (!rel && IGNORAR.has(ent.name)) continue;
      lista.push(...paginas(path.join(dir, ent.name), relPath));
    } else if (ent.name.endsWith(".html") && relPath !== "404.html") {
      lista.push(relPath);
    }
  }
  return lista;
}

// O texto do aviso sai no HTML com entidades e <code>; compara o começo da frase.
const MARCA = 'class="release-banner"';
const TEXTO = "Não publicado:";

const todas = paginas(out).filter(
  (p) => !fs.readFileSync(path.join(out, p), "utf8").includes("NEXT_REDIRECT;")
);
const com = todas.filter((p) => {
  const html = fs.readFileSync(path.join(out, p), "utf8");
  return html.includes(MARCA) && html.includes(TEXTO);
});

if (unreleased) {
  const sem = todas.filter((p) => !com.includes(p));
  if (sem.length > 0 || todas.length === 0) {
    console.error(
      `✖ Há ${unreleased.pendingChangesets} changeset(s) pendente(s) (próxima versão ${unreleased.nextVersion}), ` +
        `mas ${sem.length} de ${todas.length} página(s) não mostram o aviso "Não publicado":`
    );
    for (const p of sem.slice(0, 20)) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`✓ ${com.length}/${todas.length} páginas mostram o aviso "Não publicado" (próxima versão ${unreleased.nextVersion}).`);
} else {
  if (com.length > 0) {
    console.error(`✖ Sem changesets pendentes, mas ${com.length} página(s) ainda mostram o aviso "Não publicado".`);
    process.exit(1);
  }
  console.log(`✓ Sem changesets pendentes: nenhuma das ${todas.length} páginas mostra o aviso.`);
}
