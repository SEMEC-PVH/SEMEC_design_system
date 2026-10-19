/**
 * Navegador dos checks do gate que rodam no Playwright (estados abertos, envio
 * de formulário, layout real, foco do ErrorSummary).
 *
 * Padrão: Chromium (é o que o `npm run gate` e a CI exigem). `GATE_BROWSER`
 * escolhe outro motor (`webkit` ou `firefox`) para a cobertura multi-navegador
 * opcional (`npm run gate:browsers`, scripts/gate/browsers.mjs).
 */
export const GATE_BROWSERS = ["chromium", "webkit", "firefox"];

const NOMES = { chromium: "Chromium", webkit: "WebKit", firefox: "Firefox" };

export function gateBrowserName() {
  const name = (process.env.GATE_BROWSER || "chromium").toLowerCase();
  if (!GATE_BROWSERS.includes(name)) {
    throw new Error(`GATE_BROWSER inválido: '${name}'. Use ${GATE_BROWSERS.join(", ")}.`);
  }
  return name;
}

/** Rótulo para os logs, ex.: "WebKit headless". */
export function gateBrowserLabel() {
  return `${NOMES[gateBrowserName()]} headless`;
}

export async function launchGateBrowser() {
  const name = gateBrowserName();
  const playwright = await import("playwright");
  try {
    return await playwright[name].launch();
  } catch (err) {
    throw new Error(
      `Não foi possível abrir o ${NOMES[name]} do Playwright (${err.message.split("\n")[0]}). ` +
        `Rode 'npx playwright install --with-deps ${name}' (CI) ou defina PLAYWRIGHT_BROWSERS_PATH.`
    );
  }
}
