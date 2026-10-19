#!/usr/bin/env node
/**
 * Cobertura multi-navegador do gate (opcional): roda os checks que usam
 * navegador real (estados abertos, envio de formulário com FileUpload, a11y com
 * layout real e foco do ErrorSummary) em Chromium, WebKit e Firefox.
 *
 * Uso: `npm run gate:browsers` (todos) ou
 *      `node scripts/gate/browsers.mjs webkit firefox` (só os indicados).
 * Requer `npm run build:ds` e `npx playwright install --with-deps chromium webkit firefox`.
 *
 * O `npm run gate` continua só no Chromium; este script não o substitui.
 */
import { GATE_BROWSERS } from "./browser.mjs";
import { checkOpenStates } from "./check-open-states.mjs";
import { checkFormSubmit } from "./check-form-submit.mjs";
import { checkLayoutA11y } from "./check-layout-a11y.mjs";
import { checkErrorSummaryFocus } from "./check-error-summary-focus.mjs";

const pedidos = process.argv.slice(2).map((a) => a.toLowerCase());
const alvos = pedidos.length ? pedidos : GATE_BROWSERS;
const invalidos = alvos.filter((b) => !GATE_BROWSERS.includes(b));
if (invalidos.length) {
  console.error(`Navegador desconhecido: ${invalidos.join(", ")}. Use ${GATE_BROWSERS.join(", ")}.`);
  process.exit(2);
}

const checks = [checkOpenStates, checkFormSubmit, checkLayoutA11y, checkErrorSummaryFocus];
const falhas = [];

for (const nome of alvos) {
  process.env.GATE_BROWSER = nome;
  console.log("=================================================");
  console.log(`🌐 Gate multi-navegador: ${nome}`);
  console.log("=================================================\n");
  for (const check of checks) {
    try {
      await check();
    } catch (err) {
      falhas.push(`${nome}: ${err.message || err}`);
    }
    console.log("");
  }
}

if (falhas.length) {
  console.error("=================================================");
  console.error("❌ Gate multi-navegador REPROVADO:");
  for (const f of falhas) console.error(`  - ${f}`);
  console.error("=================================================");
  process.exit(1);
}
console.log(`✅ Gate multi-navegador APROVADO em ${alvos.join(", ")}.`);
