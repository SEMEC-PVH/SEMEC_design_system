# Regressão visual (ADR-009)

Capturas com Playwright de **todos os componentes do manifest** (`packages/react/manifest.js`), só tema claro,
em 1366×900 (`desktop-1366`) e 390×844 (`mobile-390`). Estados: padrão, foco por Tab, hover (desktop),
camadas abertas, Sidebar aberta no mobile e disabled/invalid/variantes/texto longo.

- Fixtures reaproveitadas do gate: `getComponentElement` (`scripts/gate/smoke.fixtures.mjs`, sem axe nem jsdom)
  e `openStateCases` (`scripts/gate/open-states.fixtures.mjs`). Estados extras em `visual.fixtures.mjs`.
- A bancada (`build-harness.mjs`) compila o Tailwind v4 contra `packages/react/dist/react`, como um consumidor,
  e serve em `http://127.0.0.1:3101` (`VISUAL_PORT` muda a porta). O build falha se a bancada voltar a
  importar `axe-core` ou `jsdom`.
- Estabilidade: Poppins local com os 4 pesos **carregados** (conferido pelas `FontFace`, não por
  `document.fonts.check`), `prefers-reduced-motion`, animações e cursor desligados no print, relógio fixo em
  16/10/2026 (Calendar), diferença tolerada de **0 pixel**.
- Sem skip silencioso: os componentes que não recebem foco (`SEM_FOCO`) ou não têm controle para hover
  (`SEM_HOVER`) estão listados em `visual.spec.mjs`, e o teste confere que continuam assim. Se um componente
  fora da lista perder a focabilidade, o teste falha. O único skip é por projeto: hover no mobile e a Sidebar
  aberta no desktop.
- O estado padrão de ScrollArea (transborda), Toast (aparece) e Sidebar (gatilho visível) é conferido antes do
  print.

## Onde roda: Linux, no contêiner do Playwright

As baselines (`__screenshots__/`) são geradas em **Linux**, na imagem oficial
`mcr.microsoft.com/playwright:v<versão>-noble`, com a mesma versão exata do `@playwright/test` do
`package.json` (hoje 1.56.1). A fonte renderiza diferente em cada sistema operacional, então Windows e macOS
**não** comparam no host: os scripts sobem o contêiner.

Pré-requisito no Windows/macOS: Docker Desktop ligado.

```bash
npm run test:visual           # build:ds no host + comparação no contêiner
npm run test:visual:update    # regrava as baselines no contêiner (depois de revisar a mudança!)
npm run test:visual -- -g "button"   # só um componente (argumentos vão para o playwright test)
```

O que acontece (`docker.mjs`):

1. `pretest:visual` roda `npm run build:ds` no host (o teste usa o `dist/`, o que vai para o npm).
2. `docker run` monta o repositório em `/work`. O `node_modules` do host (binários do Windows) fica escondido
   atrás de volumes nomeados `semec-visual-<id>-*`, onde o contêiner roda o próprio `npm ci`. Ele só reinstala
   quando o `package-lock.json` muda; a primeira vez leva alguns minutos.
3. Dentro do contêiner, `playwright test -c playwright.visual.config.mjs`. Resultados e diffs saem em
   `tests/visual/.results/`, no host.

Na CI o job `visual` já roda **dentro** da mesma imagem; o `docker.mjs` detecta isso (`/ms-playwright`) e
chama o Playwright direto.

O `playwright.visual.config.mjs` se recusa a rodar fora do Linux. Para depurar a bancada no host, use
`VISUAL_ALLOW_HOST=1 npx playwright test -c playwright.visual.config.mjs -g "<componente>"`: os prints vão
divergir das baselines (é esperado). Nunca rode `--update-snapshots` no host nem commite PNGs gerados fora do
contêiner.

Para limpar os volumes: `docker volume ls -q -f name=semec-visual | xargs docker volume rm`.

## Atualizar baselines

Só quando a mudança visual for intencional. Rode `npm run test:visual`, abra os `*-diff.png` em
`tests/visual/.results/` (ou o artifact `regressao-visual` da CI), confirme que a diferença é a esperada, rode
`npm run test:visual:update` e commite os PNGs de `tests/visual/__screenshots__/` junto com a mudança.

Ao subir a versão do `@playwright/test`, regrave todas as baselines: a imagem muda junto.

## Multi-navegador (opcional): WebKit e Firefox

O `npm run gate` e o `npm run test:visual` continuam só no Chromium. Para conferir o **comportamento** nos
outros motores do Playwright:

```bash
npm run gate:browsers          # estados abertos, FileUpload no <form>, layout real e foco do ErrorSummary
                               # em chromium, webkit e firefox (scripts/gate/browsers.mjs)
node scripts/gate/browsers.mjs webkit   # só um motor
npm run test:visual:browsers   # suíte visual nos projetos *-webkit e *-firefox, no contêiner, sem comparar pixel
```

- `GATE_BROWSER=webkit|firefox` troca o motor de qualquer check do gate que abre navegador
  (`scripts/gate/browser.mjs`); sem a variável, é Chromium.
- `VISUAL_BROWSERS=chromium,webkit,firefox` acrescenta projetos à suíte visual (`desktop-1366-webkit`,
  `mobile-390-firefox`…). Só o Chromium tem baselines; nos outros a suíte roda com `--ignore-snapshots` e
  falha por comportamento (foco por Tab, camada que não abre, overflow, fonte não carregada, erro de página),
  nunca por pixel: a fonte renderiza diferente em cada motor e isso não é achado.
- Navegadores: `npx playwright install --with-deps chromium webkit firefox` (a imagem do contêiner já traz os três).
- Limite: o WebKit do Playwright não é o Safari. No Safari com a configuração padrão do macOS, `Tab` não para em
  links nem em botões (só `Opção+Tab`, ou com "Navegação por teclado" ligada no sistema e "Pressionar Tab para
  destacar cada item" no Safari). Teste de teclado no Safari real precisa dessas opções ligadas.
