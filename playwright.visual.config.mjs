// Regressão visual do @semec/ds (ADR-009). Ver tests/visual/README.md.
import { defineConfig } from "@playwright/test";

const port = Number(process.env.VISUAL_PORT ?? 3101);

export default defineConfig({
  testDir: "tests/visual",
  testMatch: "*.spec.mjs",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  outputDir: "tests/visual/.results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
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
    browserName: "chromium",
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "pt-BR",
    timezoneId: "America/Porto_Velho",
    deviceScaleFactor: 1,
  },
  projects: [
    { name: "desktop-1366", use: { viewport: { width: 1366, height: 900 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "node tests/visual/build-harness.mjs && node tests/visual/serve.mjs",
    url: `http://127.0.0.1:${port}/index.html`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
  },
});
