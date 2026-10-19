#!/usr/bin/env node
/**
 * CLI do @semec/ds:
 *
 *   npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta>... [--write]
 *   npx semec-ds copiar-fontes <destino>
 */
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [command, ...rest] = process.argv.slice(2);

if (command === "codemod-4") {
  const { main } = await import("../codemods/v4.mjs");
  process.exitCode = await main(rest);
} else if (command === "copiar-fontes") {
  if (rest.length !== 1 || !rest[0].trim() || rest[0].startsWith("-")) {
    console.error("Uso: semec-ds copiar-fontes <destino>");
    process.exitCode = 1;
  } else {
    try {
      const destination = path.resolve(rest[0]);
      const source = fileURLToPath(new URL("../dist/react/", import.meta.url));
      mkdirSync(destination, { recursive: true });
      cpSync(path.join(source, "fonts.css"), path.join(destination, "fonts.css"));
      cpSync(path.join(source, "fonts"), path.join(destination, "fonts"), { recursive: true });
      console.log(`Poppins copiada para ${destination} (fonts.css + fonts/, incluindo a licença).`);
    } catch (error) {
      console.error(`Não foi possível copiar as fontes: ${error.message}`);
      process.exitCode = 1;
    }
  }
} else {
  console.log(`@semec/ds — comandos:

  codemod-4 <pasta>... [--write]   migra da 3.x para a 4.0 (docs/migracao-4.0.md)
  copiar-fontes <destino>        copia fonts.css + fonts/ para a pasta estática`);
  process.exitCode = command && command !== "--help" && command !== "-h" ? 1 : 0;
}
