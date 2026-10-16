# Regressão visual (ADR-009)

Capturas com Playwright de **todos os componentes do manifest** (`packages/react/manifest.js`), só tema claro,
em 1366×900 (`desktop-1366`) e 390×844 (`mobile-390`). Estados: padrão, foco por Tab, hover (desktop),
camadas abertas e disabled/invalid/variantes/texto longo.

- Fixtures reaproveitadas do gate: `getComponentElement` (scripts/gate/check-smoke-a11y.mjs) e
  `openStateCases` (scripts/gate/open-states.fixtures.mjs). Estados extras em `visual.fixtures.mjs`.
- A bancada (`build-harness.mjs`) compila o Tailwind v4 contra `packages/react/dist/react`, como um consumidor,
  e serve em `http://127.0.0.1:3101` (`VISUAL_PORT` muda a porta).
- Estabilidade: Poppins local com os 4 pesos carregados, `prefers-reduced-motion`, animações e cursor
  desligados no print, relógio fixo em 16/10/2026 (Calendar), diferença tolerada de **0 pixel**.

```bash
npm run build:ds              # o teste usa o dist/ (o que vai para o npm)
npm run test:visual           # compara com as baselines
npm run test:visual:update    # regrava as baselines (depois de revisar a mudança!)
npx playwright test -c playwright.visual.config.mjs -g "button"   # só um componente
```

**Atualizar baselines:** só quando a mudança visual for intencional. Rode `test:visual`, abra os
`*-diff.png` em `tests/visual/.results/` (ou o relatório HTML da CI), confirme que a diferença é a esperada,
rode `test:visual:update` e commite os PNGs de `tests/visual/__screenshots__/` junto com a mudança.
As baselines foram geradas no Chromium do Playwright 1.56.1 no Windows; renderização de fonte muda entre
sistemas operacionais, então a CI deve gerar e comparar no mesmo SO (ver proposta de job abaixo, que usa o
contêiner oficial do Playwright e precisa de uma rodada de `test:visual:update` nele na primeira vez).

Proposta de job (não aplicada em `.github/`):

```yaml
  visual:
    runs-on: ubuntu-latest
    container: mcr.microsoft.com/playwright:v1.56.1-noble
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build:ds
      - run: npm run test:visual
        env: { CI: "1", HOME: /root }
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: regressao-visual
          path: |
            tests/visual/.results
            tests/visual/.report
```
