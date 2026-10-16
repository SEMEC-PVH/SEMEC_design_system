import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gate de a11y com LAYOUT REAL (TST-36).
 *
 * O smoke (check-smoke-a11y) audita HTML do servidor no jsdom, que não calcula
 * layout: uma ScrollArea que transborda é igual a uma que não transborda, e a
 * regra `scrollable-region-focusable` (TST-05) nunca dispara. Aqui os fixtures
 * do smoke que dependem de layout são renderizados num Chromium headless e
 * auditados com o axe. Qualquer serious/critical reprova.
 *
 * A página carrega só o CSS mínimo que o caso precisa (o `h-full` da viewport
 * da ScrollArea), não o Tailwind inteiro; `color-contrast` fica desligado.
 *
 * FALHAS_CONHECIDAS funciona como o `it.fails` da suíte: a violação listada é
 * esperada e não reprova; se ela SUMIR, o gate reprova pedindo para tirar a
 * entrada (o defeito foi corrigido e o caso passa a proteger contra regressão).
 */
const CASOS = ["scroll-area"];

// Vazio: a falha do TST-05 (ScrollArea só com texto sem foco) foi corrigida em
// fix/b1-comp-a, e o caso "scroll-area" agora protege contra regressão.
/** @type {Record<string, { rules: string[]; achado: string }>} */
const FALHAS_CONHECIDAS = {};

// O CSS do kit vem do Tailwind do consumidor; aqui só o necessário para haver overflow.
const CSS_MINIMO = "[data-radix-scroll-area-viewport]{height:100%;width:100%}";

export async function checkLayoutA11y() {
  console.log("▶ [8/8] Varredura a11y (axe-core) com layout real (Chromium headless)...");

  const { build } = await import("esbuild");
  const bundle = await build({
    entryPoints: [path.join(here, "layout-a11y.browser.mjs")],
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
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.setContent(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gate: a11y com layout</title><style>${CSS_MINIMO}</style></head><body></body></html>`
    );
    await page.addScriptTag({ content: script });
    results = await page.evaluate((codes) => window.__semecLayoutA11y(codes), CASOS);
  } finally {
    await browser.close();
  }

  const errors = [];
  for (const r of results) {
    if (r.error) {
      errors.push(`'${r.code}': erro ao renderizar/auditar: ${r.error}`);
      continue;
    }
    if (r.precondition) {
      errors.push(`'${r.code}': o fixture não reproduz o caso de layout (${r.precondition}).`);
      continue;
    }
    const conhecida = FALHAS_CONHECIDAS[r.code];
    const esperadas = r.violations.filter((v) => conhecida?.rules.includes(v.id));
    const outras = r.violations.filter((v) => !conhecida?.rules.includes(v.id));

    for (const v of outras) {
      errors.push(`Violação a11y [${v.impact}] em '${r.code}' (layout real): ${v.help} (${v.id}) em ${v.nodes.join(", ")}`);
    }
    if (conhecida && esperadas.length === 0) {
      errors.push(
        `'${r.code}': a falha conhecida ${conhecida.achado} (${conhecida.rules.join(", ")}) não aparece mais. ` +
          `Tire '${r.code}' de FALHAS_CONHECIDAS em scripts/gate/check-layout-a11y.mjs.`
      );
    }
    if (outras.length === 0 && esperadas.length > 0) {
      console.log(`  ⚠ ${r.code}: falha conhecida ${conhecida.achado} (${esperadas.map((v) => v.id).join(", ")}), aceita até a correção.`);
    } else if (outras.length === 0 && !conhecida) {
      console.log(`  ✓ ${r.code}: zero serious/critical com layout real.`);
    }
  }

  if (errors.length > 0) {
    console.error("✖ Falha na varredura a11y com layout real:");
    for (const e of errors) console.error(`  - ${e}`);
    throw new Error(`A11y com layout real falhou com ${errors.length} erro(s).`);
  }

  console.log(`  ✓ ${results.length}/${results.length} casos de layout verificados.`);
}

// Execução direta: `node scripts/gate/check-layout-a11y.mjs` (exige build:ds).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkLayoutA11y().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
