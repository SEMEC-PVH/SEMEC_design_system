#!/usr/bin/env node
/**
 * Confere que o `exports` do pacote bloqueia import por caminho de arquivo
 * (AUD-20, 4.0): `@semec/ds/dist/...` não é contrato e não pode resolver, e os
 * subpaths públicos continuam resolvendo. Roda pelo self-reference do Node
 * (este arquivo está dentro do pacote). Requer `npm run build:ds` antes.
 */
const blocked = [
  "@semec/ds/dist/react/index.js",
  "@semec/ds/dist/react/components/button.js",
  "@semec/ds/dist/react/lib/utils.js",
  "@semec/ds/react/button-loading",
  "@semec/ds/codemods/v4.mjs",
];
const allowed = [
  "@semec/ds/react",
  "@semec/ds/react/button",
  "@semec/ds/react/validacao",
  "@semec/ds/react/pv-preset",
  "@semec/ds/skills",
  "@semec/ds/lite/skills",
];

let failed = false;
for (const spec of blocked) {
  try {
    await import(spec);
    console.error(`check-exports: "${spec}" resolveu, mas deveria estar fechado pelo "exports".`);
    failed = true;
  } catch (err) {
    if (err?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      console.error(`check-exports: "${spec}" falhou com ${err?.code ?? err}, esperado ERR_PACKAGE_PATH_NOT_EXPORTED.`);
      failed = true;
    }
  }
}
for (const spec of allowed) {
  try {
    await import(spec);
  } catch (err) {
    console.error(`check-exports: "${spec}" deveria resolver: ${err?.code ?? err}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(
  `check-exports: ok (${blocked.length} caminho(s) de arquivo bloqueados com ERR_PACKAGE_PATH_NOT_EXPORTED; ${allowed.length} subpath(s) públicos resolvem).`
);
