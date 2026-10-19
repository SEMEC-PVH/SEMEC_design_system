import path from "node:path";
import { fileURLToPath } from "node:url";

import { gateBrowserLabel, launchGateBrowser } from "./browser.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gate de foco do ErrorSummary com digitação real (TST-01, #48).
 *
 * Depois de um envio inválido, a validação ao vivo recalcula os erros a cada
 * tecla. O resumo que some (tudo corrigido) e volta (a pessoa apaga um campo)
 * com o mesmo `focusKey` não pode puxar o foco: as teclas seguintes iriam para
 * o alerta e o valor redigitado se perderia (WCAG 3.2.2). O jsdom não reproduz
 * o teclado de verdade; aqui o Playwright digita num Chromium headless, nos
 * dois modos de uso (renderização condicional da SKILL e resumo sempre montado).
 */
export async function checkErrorSummaryFocus() {
  console.log(`▶ Foco do ErrorSummary com digitação real (${gateBrowserLabel()})...`);

  const { build } = await import("esbuild");
  const bundle = await build({
    entryPoints: [path.join(here, "error-summary-focus.browser.mjs")],
    bundle: true,
    format: "iife",
    platform: "browser",
    write: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"development"' },
  });
  const script = bundle.outputFiles[0].text;

  const browser = await launchGateBrowser();

  const errors = [];
  const expect = (label, actual, expected) => {
    if (JSON.stringify(actual) === JSON.stringify(expected)) console.log(`  ✓ ${label}`);
    else errors.push(`${label}: esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`);
  };

  try {
    for (const modo of ["receita", "sempre"]) {
      const page = await browser.newPage();
      await page.setContent(
        '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gate: foco do ErrorSummary</title></head><body></body></html>'
      );
      await page.addScriptTag({ content: script });
      await page.evaluate((m) => window.__semecErrorSummaryFocus.mount(m), modo);
      const form = page.locator(`#form-${modo}`);
      await form.waitFor();
      const foco = () =>
        page.evaluate(() => {
          const el = document.activeElement;
          return el?.getAttribute("role") === "alert" ? "alert" : el?.id || el?.tagName;
        });

      await form.getByRole("button", { name: "Enviar" }).click();
      expect(`${modo}: o envio inválido foca o resumo`, await foco(), "alert");

      await page.locator(`#${modo}-nome`).click();
      await page.keyboard.type("Maria Souza");
      await page.locator(`#${modo}-email`).click();
      await page.keyboard.type("maria@semec.gov.br");
      expect(`${modo}: tudo corrigido, o resumo some`, await form.getByRole("alert").count(), 0);

      // Apaga o e-mail (0 → 1 erro) e redigita sem pausa.
      await page.keyboard.press("ControlOrMeta+A");
      await page.keyboard.press("Backspace");
      await page.keyboard.type("jose@semec.gov.br");
      expect(
        `${modo}: apagar e redigitar mantém o foco e o valor no campo`,
        { foco: await foco(), email: await page.locator(`#${modo}-email`).inputValue() },
        { foco: `${modo}-email`, email: "jose@semec.gov.br" }
      );

      // Um envio inválido novo (focusKey novo) volta a focar o resumo.
      await page.locator(`#${modo}-nome`).fill("");
      await form.getByRole("button", { name: "Enviar" }).click();
      expect(`${modo}: o 2º envio inválido foca o resumo`, await foco(), "alert");
      await page.close();
    }
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    console.error("✖ Falha no foco do ErrorSummary:");
    for (const e of errors) console.error(`  - ${e}`);
    throw new Error(`Foco do ErrorSummary falhou com ${errors.length} erro(s).`);
  }
}

// Execução direta: `node scripts/gate/check-error-summary-focus.mjs` (exige build:ds).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkErrorSummaryFocus().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
