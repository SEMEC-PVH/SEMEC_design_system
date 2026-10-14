import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gate de a11y nos ESTADOS ABERTOS das camadas (issue #34, AUD-45).
 *
 * O smoke (check-smoke-a11y) só vê a tela inicial renderizada no servidor; as
 * camadas portaladas (Dialog, Select...) nem aparecem no SSR. Aqui cada camada
 * é renderizada fechada num Chromium headless (Playwright), aberta pelo caminho
 * do usuário (clique, teclado ou foco) e auditada com o axe. Qualquer
 * serious/critical reprova.
 *
 * Por que Chromium e não jsdom: o jsdom não reproduz `aria-hidden-focus`
 * (nem no Select, onde a EXC-01 foi medida, nem no NavigationMenu); o gate
 * ficaria cego justamente para a regra que motivou a issue.
 *
 * Única exceção aceita: EXC-01 (`aria-hidden-focus` só em Select e
 * DropdownMenu abertos, docs/excecoes-acessibilidade.md), declarada em
 * open-states.fixtures.mjs. `color-contrast` fica desligado porque a página de
 * teste não carrega o CSS compilado do Tailwind.
 *
 * Requer o Chromium do Playwright: local, `PLAYWRIGHT_BROWSERS_PATH` apontando
 * para os navegadores instalados; na CI, `npx playwright install --with-deps chromium`.
 */
export async function checkOpenStates() {
  console.log("▶ [6/6] Varredura a11y (axe-core) nas camadas abertas (Chromium headless)...");

  const { build } = await import("esbuild");
  const bundle = await build({
    entryPoints: [path.join(here, "open-states.browser.mjs")],
    bundle: true,
    format: "iife",
    platform: "browser",
    write: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"development"' },
  });
  const script = bundle.outputFiles[0].text;

  const { chromium } = await import("playwright");
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new Error(
      `Não foi possível abrir o Chromium do Playwright (${err.message.split("\n")[0]}). ` +
        "Rode 'npx playwright install --with-deps chromium' (CI) ou defina PLAYWRIGHT_BROWSERS_PATH."
    );
  }

  let results;
  try {
    const page = await browser.newPage();
    await page.setContent(
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gate: estados abertos</title></head><body></body></html>'
    );
    await page.addScriptTag({ content: script });
    results = await page.evaluate(() => window.__semecOpenStates());
  } finally {
    await browser.close();
  }

  const errors = [];
  for (const r of results) {
    if (r.error) {
      errors.push(`'${r.code}': erro ao abrir/auditar: ${r.error}`);
      continue;
    }
    if (!r.opened) {
      errors.push(`'${r.code}': a camada não abriu pelo caminho do usuário.`);
    }
    for (const v of r.violations) {
      errors.push(`Violação a11y [${v.impact}] em '${r.code}' aberto: ${v.help} (${v.id}) em ${v.nodes.join(", ")}`);
    }
    if (r.opened && r.violations.length === 0) {
      const exc = r.disabledRules.length ? ` (EXC-01: ${r.disabledRules.join(", ")} desligada)` : "";
      console.log(`  ✓ ${r.code} aberto: zero serious/critical${exc}.`);
    }
  }

  if (errors.length > 0) {
    console.error("✖ Falha na varredura a11y dos estados abertos:");
    for (const e of errors) console.error(`  - ${e}`);
    throw new Error(`Estados abertos falharam com ${errors.length} erro(s).`);
  }

  console.log(`  ✓ ${results.length}/${results.length} camadas abertas aprovadas.`);
}
