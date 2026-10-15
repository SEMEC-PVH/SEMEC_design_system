#!/usr/bin/env node
/**
 * CLI do @semec/ds. Hoje só tem o codemod da 4.0:
 *
 *   npx @semec/ds codemod-4 <pasta>... [--write]
 */
const [command, ...rest] = process.argv.slice(2);

if (command === "codemod-4") {
  const { main } = await import("../codemods/v4.mjs");
  process.exitCode = await main(rest);
} else {
  console.log(`@semec/ds — comandos:

  codemod-4 <pasta>... [--write]   migra da 3.x para a 4.0 (docs/migracao-4.0.md)`);
  process.exitCode = command && command !== "--help" && command !== "-h" ? 1 : 0;
}
