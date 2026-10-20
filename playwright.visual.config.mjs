// Regressão visual do @semec/ds (ADR-009). Ver tests/visual/README.md.
import { defineConfig } from "@playwright/test";

const port = Number(process.env.VISUAL_PORT ?? 3101);

// TST-B1: as baselines são do Linux (contêiner mcr.microsoft.com/playwright na versão
// do @playwright/test). Fora dele a fonte renderiza diferente e tudo falharia, então
// barramos cedo: use `npm run test:visual`, que sobe o contêiner (tests/visual/docker.mjs).
// VISUAL_ALLOW_HOST=1 libera a execução no host só para depurar a bancada.
if (process.platform !== "linux" && !process.env.VISUAL_ALLOW_HOST) {
  throw new Error(
    "Regressão visual roda em Linux, no contêiner do Playwright: use `npm run test:visual` " +
      "(ou `npm run test:visual:update`). Ver tests/visual/README.md."
  );
}

// Cobertura multi-navegador opcional: VISUAL_BROWSERS=chromium,webkit,firefox.
// Chromium é o padrão e o único com baselines; os projetos WebKit/Firefox
// ("desktop-1366-webkit"...) conferem o COMPORTAMENTO (foco por Tab, camadas que
// abrem, overflow, fontes) e rodam com --ignore-snapshots: pixel de fonte muda
// por motor e não é achado. Ver tests/visual/README.md.
const BROWSERS = (process.env.VISUAL_BROWSERS ?? "chromium")
  .split(",")
  .map((b) => b.trim().toLowerCase())
  .filter(Boolean);
for (const b of BROWSERS) {
  if (!["chromium", "webkit", "firefox"].includes(b)) throw new Error(`VISUAL_BROWSERS: navegador desconhecido '${b}'.`);
}
const VIEWPORTS = [
  { name: "desktop-1366", viewport: { width: 1366, height: 900 } },
  { name: "mobile-390", viewport: { width: 390, height: 844 } },
];

export default defineConfig({
  testDir: "tests/visual",
  testMatch: "*.spec.mjs",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  outputDir: "tests/visual/.results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 nova tentativa na CI: a diferença tolerada é 0 pixel e a máquina compartilhada pode atrasar
  // um hover; o relatório marca o caso como "flaky" para investigação.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "tests/visual/.report" }]] : "list",
  expect: {
    toHaveScreenshot: {
      // Diferença zero de pixel: a bancada é determinística (fonte local, animação e relógio fixos).
      maxDiffPixels: 0,
      threshold: 0.1,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "pt-BR",
    timezoneId: "America/Porto_Velho",
    deviceScaleFactor: 1,
  },
  projects: BROWSERS.flatMap((browserName) =>
    VIEWPORTS.map(({ name, viewport }) => ({
      name: browserName === "chromium" ? name : `${name}-${browserName}`,
      use: { browserName, viewport },
    }))
  ),
  webServer: {
    command: "node tests/visual/build-harness.mjs && node tests/visual/serve.mjs",
    url: `http://127.0.0.1:${port}/index.html`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
  },
});
