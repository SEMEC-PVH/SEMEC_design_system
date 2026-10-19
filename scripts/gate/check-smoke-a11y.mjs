import ReactDOMServer from "react-dom/server";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { getComponentElement } from "./smoke.fixtures.mjs";
import { dsComponents } from "../../packages/react/manifest.js";

// Reexportado: a suíte do kit (test/smoke.test.tsx) importa daqui.
export { getComponentElement };

export async function checkSmokeAndA11y() {
  console.log("▶ [4/5 e 5/5] Executando Smoke de Renderização e Varredura a11y (axe-core)...");

  const errors = [];
  let renderedCount = 0;
  let a11yScannedCount = 0;

  for (const comp of dsComponents) {
    const code = comp.code;
    let element = null;

    try {
      element = getComponentElement(code);
    } catch (err) {
      errors.push(`Falha ao instanciar elemento de '${code}': ${err.message}`);
      continue;
    }

    if (!element) {
      errors.push(`Componente '${code}' não possui elemento de teste configurado no smoke.`);
      continue;
    }

    let html = "";
    try {
      html = ReactDOMServer.renderToString(element);
      renderedCount++;
    } catch (err) {
      errors.push(`Falha ao renderizar componente '${code}': ${err.message}`);
      continue;
    }

    // Varredura de Acessibilidade com axe-core
    try {
      const dom = new JSDOM(`<!DOCTYPE html><html lang="pt-BR"><head><title>Smoke ${code}</title></head><body><main>${html}</main></body></html>`);
      const results = await axe.run(dom.window.document.body, {
        rules: {
          // Desabilita checagem de cor que depende de CSS/layout engine em JSDOM
          "color-contrast": { enabled: false },
        },
      });

      const severeViolations = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );

      if (severeViolations.length > 0) {
        for (const viol of severeViolations) {
          errors.push(`Violação a11y [${viol.impact}] no componente '${code}': ${viol.help} (${viol.id})`);
        }
      } else {
        a11yScannedCount++;
      }
    } catch (err) {
      errors.push(`Erro durante verificação axe-core em '${code}': ${err.message}`);
    }
  }

  console.log(`  ✓ ${renderedCount}/${dsComponents.length} componentes renderizados com sucesso no smoke.`);
  console.log(`  ✓ ${a11yScannedCount}/${dsComponents.length} componentes aprovados na varredura a11y (zero serious/critical).`);

  if (errors.length > 0) {
    console.error("✖ Falha no Smoke ou na Varredura a11y:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    throw new Error(`Smoke / A11y falhou com ${errors.length} erro(s).`);
  }
}
