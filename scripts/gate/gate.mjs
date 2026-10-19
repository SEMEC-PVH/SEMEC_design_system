#!/usr/bin/env node
import { checkExportsContract } from "./check-exports.mjs";
import { checkTokens } from "./check-tokens.mjs";
import { checkMinimalBuild } from "./check-build.mjs";
import { checkSmokeAndA11y } from "./check-smoke-a11y.mjs";
import { checkOpenStates } from "./check-open-states.mjs";
import { checkFormSubmit } from "./check-form-submit.mjs";
import { checkErrorSummaryFocus } from "./check-error-summary-focus.mjs";
import { checkConflictMarkers } from "./check-conflict-markers.mjs";
import { checkLayoutA11y } from "./check-layout-a11y.mjs";

console.log("=================================================");
console.log("🛡️  SEMEC DS — Portão de Regressão e Qualidade (gate)");
console.log("=================================================\n");

const startTime = Date.now();

try {
  await checkConflictMarkers();
  console.log("");

  await checkExportsContract();
  console.log("");

  await checkTokens();
  console.log("");

  await checkMinimalBuild();
  console.log("");

  await checkSmokeAndA11y();
  console.log("");

  await checkOpenStates();
  console.log("");

  await checkFormSubmit();
  console.log("");

  await checkLayoutA11y();
  console.log("");

  await checkErrorSummaryFocus();
  console.log("");

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("=================================================");
  console.log(`✅ Portão de regressão APROVADO em ${durationSec}s!`);
  console.log("=================================================");
  process.exit(0);
} catch (error) {
  console.error("\n=================================================");
  console.error("❌ FALHA NO PORTÃO DE REGRESSÃO:");
  console.error(error.message || error);
  console.error("=================================================");
  process.exit(1);
}
