# B2: integração do @semec/ds com outros frameworks e gerenciadores de pacote

- **Pacote testado:** `C:\dev\semec-int\semec-ds-4.2.0.tgz` (`npm pack` da branch `fix/pendencias-4.2`, futura 4.2.1), instalado sempre do `.tgz`.
- **Data:** 19/10/2026. **Ambiente:** Windows 11, Node 24.21.0, npm 11.19.0, pnpm 9.15.9 (`npx pnpm@9`), Yarn 4.18.1 (`corepack`), Playwright 1.56.1 com Chromium headless.
- **Pasta de trabalho:** `C:\dev\semec-int\b2-frameworks\` (um app por cenário). As evidências (prints, JSON com o console do navegador e logs) estão em `b2-frameworks\evidencias\`.
- **Tela padrão** (`b2-frameworks\shared\Tela.tsx`, a mesma em todos os apps): `Header` com `HeaderBrand`/`HeaderNav`, formulário com `FormField` + `Input` + `Select` + `Checkbox` + `ErrorSummary`, `Tooltip`, `Dialog`, `Toast` (`useToast` + `<Toaster />`) e `DataTable` ordenável. Providers no root: `TooltipProvider` + `Toaster`.
- **Roteiro automático** (`b2-frameworks\tools\check.mjs`): carrega a página, confere a fonte (Poppins 400–700 carregada), as cores e a altura do botão (classes do kit geradas) e guarda o console. Depois envia vazio (ErrorSummary e foco), envia preenchido (Toast), passa o mouse no Tooltip, abre o Select e escolhe uma opção, marca o Checkbox, ordena a DataTable e abre o Dialog. Em todos os cenários abaixo marcados como ✅, o roteiro passou inteiro **sem nenhum erro ou aviso no console** (nem de hidratação).

## Resumo

O kit roda com SSR e hidrata sem avisos no React Router v7 (framework mode), no TanStack Start e nas ilhas do Astro. Também funciona no Parcel 2 e no pnpm estrito. As dependências transitivas (Radix, cva, tailwind-merge, get-nonce) resolvem em todos os gerenciadores, inclusive no Yarn PnP. Os problemas estão em três frentes:

1. **CSP estrita com SSR** (❌): o HTML do servidor sai com atributos `style="…"` do Radix, e o `style-src` com nonce os bloqueia. Isso deixa a região do Toast por cima do cabeçalho, e os links do `HeaderNav` param de receber clique. Também deixa visível o `<input type="checkbox">` nativo duplicado ao lado do `Checkbox`. A seção de CSP do README não cobre esse caso.
2. **`@source` frágil** (❌ no Yarn PnP, ⚠️ em monorepo e Astro): o caminho `../node_modules/@semec/ds/dist/react` não existe no PnP. No monorepo e no Astro ele precisa de outro número de `../`. Em todos esses casos o build **passa em silêncio** e os componentes saem sem estilo (CSS de ~14 kB em vez de ~72 kB).
3. **Lacunas de README por framework** (⚠️): o Parcel 2 não resolve `@semec/ds/react` sem `packageExports: true`. O template do React Router v7 traz `@theme { --font-sans: Inter }` e um fundo `dark:` que vencem o kit.

### Matriz cenário × resultado

| # | Cenário | Resultado | Tempo até a 1ª tela* | Achados |
|---|---|---|---|---|
| 1 | React Router v7.18 (framework mode, SSR), dev e build de produção (`react-router-serve`) | ✅ SSR e hidratação sem avisos; Toast e Tooltip funcionam. ⚠️ O template padrão conflita com o kit | ~3 min | INT-B2-07 |
| 2 | Astro 7.4 com ilha React (`client:load`) e uma página só com tokens (dev e build) | ✅ CSS global, Poppins e tokens chegam nas duas páginas; ilha sem aviso de hidratação | ~3 min | INT-B2-05 (caminho do `@source`) |
| 3 | TanStack Start 1.169 (escolhido no lugar do Remix), dev e `vite preview` com SSR | ✅ Tudo funcionou de primeira | ~5 min | — |
| 4 | Parcel 2.16 + `@tailwindcss/postcss` (dev e build) | ⚠️ O build falha sem `packageExports`; com ele, Tailwind v4, `@source` e fontes funcionam | ~2 min | INT-B2-06 |
| 5a | pnpm 9, `node-linker=isolated`, `hoist=false`, `public-hoist-pattern[]=` vazio, `auto-install-peers=false` (Vite, dev e build) | ✅ Transitivas resolvem; o `@source` do README existe (é symlink) e o Tailwind o segue | ~2 min | — |
| 5b | Yarn 4.18 PnP (`nodeLinker: pnp`, Vite, dev e build) | ❌ O JS resolve todas as transitivas, mas o `@source` aponta para pasta inexistente: tela sem estilo, sem erro no build | ~4 min (com o contorno) | INT-B2-04 |
| 6 | Monorepo com workspaces npm (`apps/web`, `node_modules` hoistado na raiz) | ⚠️ O caminho literal do README falha em silêncio; com `../../../node_modules/...` funciona | ~2 min | INT-B2-05 |
| 7 | CSP estrita (`style-src 'self' 'nonce-…'`, `script-src` com nonce), cenário 1 em produção, com `SemecProvider nonce` | ❌ 4 violações `style-src-attr` na carga e 1 `style-src-elem` no Select; os links do cabeçalho deixam de receber clique; checkbox nativo duplicado | ~6 min | INT-B2-01, 02, 03, 08 |

\* Do scaffold até o primeiro print com a tela estilizada, contando instalação e diagnóstico. No RR7 desconto a primeira tentativa: o `create-react-router@latest` já gera a v8, então refiz com `create-react-router@7`.

### Contagem por severidade

| Severidade | Qtde | IDs |
|---|---|---|
| Alta | 2 | INT-B2-01, INT-B2-04 |
| Média | 4 | INT-B2-02, INT-B2-03, INT-B2-05, INT-B2-06 |
| Baixa | 2 | INT-B2-07, INT-B2-08 |

---

## Achados

### INT-B2-01: com CSP estrita e SSR, a região do Toast cobre o cabeçalho e bloqueia o clique nos links

- **Severidade:** Alta. Com CSP estrita, quem usa mouse ou toque não consegue clicar nos links do `HeaderNav` no desktop (Tab continua funcionando). O defeito persiste depois da hidratação.
- **Passos:**
  1. App React Router v7 em produção (`b2-frameworks\rr7`, `node server.mjs`, porta 5303), com `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-N'; style-src 'self' 'nonce-N'; …`. O nonce vai para `ServerRouter`, `renderToPipeableStream`, `<Scripts>`, `<ScrollRestoration>` e `<SemecProvider nonce>`, como manda a seção "Segurança (CSP)" do README.
  2. `<Toaster />` no root, como no passo 4 do README; cabeçalho com `HeaderNav` à direita.
  3. Clicar em "Tabela" no cabeçalho.
- **Esperado:** o link navega (`#tabela`), como acontece sem CSP (porta 5302).
- **Obtido:** o clique não chega ao link. O Playwright desiste depois de 3 s e mostra o `<ol>` do Toast por cima. `document.elementFromPoint` nos dois links devolve `<ol tabindex="-1" class="fixed top-0 right-0 z-[100] flex max-h-screen w-full …">`.
- **Causa:** o Radix renderiza a região `<div role="region" aria-label="Notificações (F8)" style="pointer-events:none">` com estilo **inline**. No HTML do SSR, o `style-src` sem `'unsafe-inline'` bloqueia esse atributo (diretiva `style-src-attr`; nonce não vale para atributo). A hidratação do React não reaplica atributos, então o bloqueio continua depois dela. O `<ol>` do `ToastViewport` do kit é `fixed` com `z-[100]` e `w-full` (no desktop, `md:max-w-[420px]`) e não tem `pointer-events-none` próprio. Ele dependia do `pointer-events:none` herdado da região.
- **Evidência:** `evidencias\rr7-csp.json` (console: `Refused to apply inline style because it violates … "style-src 'self' 'nonce-…'"`); violação capturada por `securitypolicyviolation`: `style-src-attr` em `<div role="region" aria-label="Notificações (F8)" tabindex="-1" style="pointer-events:none">`; `tools\label.mjs` contra a porta 5303: `nav Tabela: FALHOU TimeoutError: locator.click`, e contra a 5302 (sem CSP): `nav Tabela: clicou`.
- **Correção sugerida (kit):** não depender do estilo inline do Radix. Em `toast.tsx`, pôr `pointer-events-none` no `ToastViewport` e `pointer-events-auto` no `Toast`, o mesmo padrão do Sonner/shadcn:
  ```tsx
  // ToastViewport
  "pointer-events-none fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 …"
  // toastVariants (base)
  "pointer-events-auto group relative flex …"
  ```
  Vale também um teste em Chromium com a CSP do README e SSR, que clique num link sob a área do viewport.

### INT-B2-02: com CSP estrita e SSR, o checkbox nativo do Radix aparece duplicado ao lado do `Checkbox`

- **Severidade:** Média (visual e de leitura: aparecem dois controles, e o nativo, `aria-hidden`, recebe o clique do mouse).
- **Passos:** o mesmo app do INT-B2-01, com `<Checkbox id="aceite" /> <Label htmlFor="aceite">`. Abrir a página.
- **Esperado:** só o checkbox do kit (`button[role=checkbox]`). O `<input type="checkbox" aria-hidden>` de apoio do Radix fica invisível (`position:absolute; opacity:0; pointer-events:none`).
- **Obtido:** o `<input>` nativo aparece entre o checkbox do kit e o rótulo, com `opacity: 1`, `position: static` e 20×20 px. O mesmo vale para o `<span style="pointer-events:none">` do `SelectValue` (atributo bloqueado, sem efeito visível nesta tela).
- **Evidência:** `evidencias\rr7-csp-1-inicial.png` e `evidencias\rr7-csp-checkbox-zoom.png` (dois quadrados); `tools\csp2.mjs`: `checkboxNativo: { opacity: "1", position: "static" }` com CSP × `{ opacity: "0", position: "absolute" }` sem CSP (`evidencias\rr7-semcsp-checkbox-zoom.png`). Violação: `style-src-attr` em `<input type="checkbox" aria-hidden="true" tabindex="-1" style="position:absolute;pointer-events:none;opacity:0;margin:0;transform:translateX(-100%)">`.
- **Correção sugerida (kit):** no `tokens.css` (`@layer base`), uma regra estática que esconda os inputs de apoio do Radix sem depender de estilo inline. É o mesmo recurso que o README já cita para a scrollbar:
  ```css
  button[role="checkbox"] + input[type="checkbox"][aria-hidden="true"],
  button[role="switch"] + input[type="checkbox"][aria-hidden="true"],
  button[role="radio"] + input[type="radio"][aria-hidden="true"] {
    position: absolute; pointer-events: none; opacity: 0; margin: 0;
  }
  ```
  Conferir também `Switch`, `RadioGroup`, `Slider` e `Progress` (o `Progress` usa `style={{ transform }}` próprio, que no SSR com CSP fica sem efeito). Esses não estavam na tela e não foram medidos.

### INT-B2-03: a seção "Segurança (CSP)" do README não cobre SSR nem `style-src-attr`

- **Severidade:** Média (documentação: quem segue o README à risca cai nos INT-B2-01 e 02 sem aviso).
- **Passos:** seguir a seção "Segurança (CSP)" num app com SSR (RR7) e `style-src 'self' 'nonce-…'`.
- **Esperado:** o README lista o que quebra e o que fazer, como na lista "medido na prova".
- **Obtido:** o README só fala de `<style>` injetado (scroll lock, scrollbar). Com `SemecProvider nonce` montado, o `<style>` do scroll lock do Dialog sai **com** nonce (`bodyStyleLock: [{ nonce: "nQ2G…" }]`, correto). Mesmo assim, a carga gera 4 violações `style-src-attr` que o README não menciona: região do Toast, `SelectValue`, `<select>` de apoio do Select e `<input>` de apoio do Checkbox. A lista medida (SEM-752/SEM-780) também não traz Toast nem Checkbox. O exemplo do README também não mostra como levar o nonce do servidor ao `SemecProvider` num framework com SSR (no RR7, foi preciso `getLoadContext` + `loader` no root + `useRouteLoaderData`).
- **Evidência:** `evidencias\rr7-csp.json` (5 erros `Refused to apply inline style`); a saída de `tools\csp.mjs` lista cada violação com a fase (`load` ×4 `style-src-attr`, `select` ×1 `style-src-elem`).
- **Correção sugerida (README):** acrescentar à seção:
  - que atributos `style` vindos do HTML do servidor caem em `style-src-attr` e que o nonce não os cobre;
  - a lista atualizada (Toast, Checkbox, Select/`SelectValue`), com o que o kit faz (depois dos INT-B2-01 e 02) ou a alternativa `style-src-attr 'unsafe-inline'` (CSP nível 3), que libera só atributos, não `<style>`;
  - um exemplo de nonce ponta a ponta para um framework com SSR (React Router/Remix ou TanStack Start), além do Next.

### INT-B2-04: no Yarn 4 PnP o `@source` do README aponta para uma pasta que não existe, e a tela sai sem estilo sem nenhum erro

- **Severidade:** Alta (instalação limpa seguindo o README dá tela quebrada, e o build não avisa).
- **Passos:**
  1. App Vite (`b2-frameworks\vite-yarn`), `.yarnrc.yml` com `nodeLinker: pnp`.
  2. `yarn add @semec/ds@file:…/semec-ds-4.2.0.tgz lucide-react` e `yarn add -D tailwindcss @tailwindcss/vite`.
  3. `src/index.css` com as linhas do README (`@source "../node_modules/@semec/ds/dist/react";`); `yarn vite build`.
- **Esperado:** CSS de ~72 kB com as classes do kit (como em npm e pnpm).
- **Obtido:** o build passa sem aviso e gera `index-*.css` com **14,32 kB**, sem `bg-card` nem `shadow-elevation-2`. A tela sai crua: botão com fundo transparente e 24 px de altura, sem bordas, tabela sem estilo, e o Checkbox fica com 0 px (o Playwright não consegue clicar nele). No PnP não há `node_modules`: o pacote fica no zip `.yarn/cache/*.zip`, que o scanner nativo do Tailwind não lê. O JS, por outro lado, resolve todas as dependências transitivas (Radix, cva, tailwind-merge, get-nonce): Select, Dialog, Toast e Tooltip funcionam.
- **Evidência:** `evidencias\yarnpnp-semsource-1-inicial.png` (tela sem estilo); `evidencias\yarnpnp-semsource.json` (`btnBg: rgba(0, 0, 0, 0)`, `btnHeight: 24`, timeout no clique do `#aceite`).
- **Contorno verificado:** `yarn unplug @semec/ds` extrai o pacote para `.yarn/unplugged/@semec-ds-virtual-<hash>/node_modules/@semec/ds`. Com `@source "../.yarn/unplugged";` o CSS volta a 82 kB e o roteiro passa inteiro, em dev e em build (`evidencias\yarnpnp-unplug-*.png`, `yarnpnp-dev-*.png`). Globs com `*` (`../.yarn/unplugged/*/node_modules/@semec/ds/dist/react`, `../.yarn/unplugged/@semec-ds-*/…`) **não** funcionaram (14 kB). O caminho exato com o hash funciona, mas o hash muda.
- **Correção sugerida:**
  - **kit:** pôr `"preferUnplugged": true` no `package.json` do `@semec/ds`. O Yarn passa a extrair o pacote sozinho, sem `yarn unplug`. Combinar com a correção do INT-B2-05 (`@source` dentro do pacote), que dispensa o caminho com hash;
  - **README:** linha "Yarn PnP" na tabela do `@source` com `yarn unplug @semec/ds` (ou `nodeLinker: node-modules`) e `@source "../.yarn/unplugged";`. Avisar que o sintoma é CSS de ~14 kB sem erro.

### INT-B2-05: o caminho do `@source` falha em silêncio quando o CSS ou o `node_modules` não estão onde o exemplo supõe (monorepo, Astro)

- **Severidade:** Média (o README tem a regra e a linha "monorepo… suba até a pasta", mas o erro é silencioso e fácil de cometer).
- **Passos:**
  1. **Monorepo:** `b2-frameworks\mono` com workspaces npm (`apps/*`) e o app Vite em `apps/web`. `npm install <tgz> lucide-react -w web` hoista tudo em `mono/node_modules`; `apps/web/node_modules` nem existe. CSS em `apps/web/src/index.css` com o `@source "../node_modules/@semec/ds/dist/react"` do README.
  2. **Astro:** `astro add tailwind` cria o CSS em `src/styles/global.css` (dois níveis abaixo da raiz). Com o `@source` literal do README, mesmo efeito.
- **Esperado:** classes do kit no CSS, ou um aviso de que o caminho não existe.
- **Obtido:** build sem aviso e CSS sem as classes do kit: monorepo 14,27 kB (`evidencias\mono-readme-1-inicial.png`, `btnBg: rgba(0,0,0,0)`, botão de 24 px); Astro 14,9 kB. Com o caminho certo (`../../../node_modules/…` no monorepo, `../../node_modules/…` no Astro), 71–72 kB e roteiro completo sem erros (`mono-fix-*.png`, `astro-ilha-*.png`, `astro-tokens-1-inicial.png`).
- **Correção sugerida:**
  - **kit (resolve também o INT-B2-04 com unplug):** publicar um CSS com o `@source` **relativo ao próprio pacote**, para o consumidor não calcular caminho. Por exemplo, `dist/react/source.css` contendo `@source "./components";`, exportado como `"./react/source.css"`, e o README trocando a linha do `@source` por `@import "@semec/ds/react/source.css";`. Prova de conceito no monorepo (arquivo criado à mão no `node_modules`): `@import "../../../node_modules/@semec/ds/dist/react/source-teste.css"` gerou 81,98 kB com todas as classes. O tamanho maior vem de varrer também `.map` e `.d.ts`; usar `@source "./components/**/*.js"` evita isso. Outra opção é pôr o `@source` direto no `tokens.css`;
  - **README:** na tabela, linhas prontas para `apps/web/src/index.css` com `node_modules` na raiz (`"../../../node_modules/…"`) e para Astro (`src/styles/global.css` → `"../../node_modules/…"`). Também uma dica de verificação: "se o CSS gerado tiver ~14 kB em vez de ~70 kB, o `@source` não achou o pacote".

### INT-B2-06: o Parcel 2 não resolve `@semec/ds/react` com a configuração padrão

- **Severidade:** Média (quebra o build no "zero-config"; a correção é de uma linha, mas não está documentada).
- **Passos:** `b2-frameworks\parcel` com Parcel 2.16.4, `.postcssrc` com `@tailwindcss/postcss` e `import { … } from "@semec/ds/react"`; `npx parcel build`.
- **Esperado:** build ok.
- **Obtido:**
  ```
  @parcel/core: Failed to resolve '@semec/ds/react' from './src/main.tsx'
  @parcel/resolver-default: Cannot load file './react' from module '@semec/ds'
  ```
  O Parcel 2 só lê o campo `exports` com `packageExports: true`, e o pacote não tem fallback (não há `main`/`module` nem pasta `react/`). Com `"@parcel/resolver-default": { "packageExports": true }` no `package.json` do app, o build passa. Tailwind v4, o `@source` para `node_modules` e as fontes funcionam (CSS 70,9 kB, as quatro Poppins copiadas para `dist`), e o roteiro passa em dev e em build, sem erros no console.
- **Evidência:** `evidencias\parcel-build-sem-packageExports.log`; `evidencias\parcel-prod-*.png`, `parcel-dev-*.png`.
- **Correção sugerida (README):** no passo 2, uma linha para o Parcel: `.postcssrc` com `{"plugins":{"@tailwindcss/postcss":{}}}` e, no `package.json` do app, `"@parcel/resolver-default": { "packageExports": true }`. Dá para registrar também que o `@source` padrão funciona sem ajuste.

### INT-B2-07: o template do React Router v7 vence o kit (fonte do Toast e fundo no modo escuro), e o README não tem passo para ele

- **Severidade:** Baixa (README; o efeito é grave no modo escuro, mas a correção é a mesma do Vite e do Next: apagar o CSS do template).
- **Passos:** `create-react-router@7` e acrescentar as linhas do kit ao `app/app.css` gerado, mantendo o resto (`@theme { --font-sans: "Inter", … }` e `html, body { @apply bg-white dark:bg-gray-950 }`). O `root.tsx` continua com os `<link>` do Google Fonts (Inter).
- **Esperado:** a aparência do kit.
- **Obtido:**
  - o `--font-sans` do template, declarado depois do `tokens.css`, vence o do kit. O `Toast`, único componente com `font-sans` no `dist`, sai em Inter, e o resto da tela em Poppins (`evidencias\rr7-dev-template-3-toast.png`);
  - com o sistema em modo escuro, o `body` fica `oklch(0.13 …)` (gray-950) e o texto do kit continua `rgb(20, 35, 58)`: título, rótulos e tabela ficam ilegíveis (`evidencias\rr7-template-dark.png`);
  - a página baixa a Inter do Google Fonts, o que o README pede para evitar.

  Trocando o `app.css` inteiro pelas linhas do kit e removendo os `links` do Google Fonts, tudo fica correto (`evidencias\rr7-dev-*.png`, `rr7-dark.png`, `rr7-prod-*.png`): SSR e hidratação sem avisos em dev e em produção, Toast e Tooltip funcionando.
- **Correção sugerida (README):** no passo 2, um bloco "React Router v7 / Remix" igual ao do Next: em `app/app.css`, apagar o `@theme`, o `html, body` e o `@media (prefers-color-scheme: dark)` e deixar só as linhas do kit (`@source "../node_modules/…"`, porque o CSS fica em `app/`); em `app/root.tsx`, apagar os `links` do Google Fonts e trocar `lang="en"` por `lang="pt-BR"`; providers do passo 4 no `App` do root.

### INT-B2-08: o `<style>` do Select sai sem nonce mesmo com `SemecProvider`, ao contrário do que diz o JSDoc

- **Severidade:** Baixa (o README já avisa "Select: 1 violação mesmo com nonce"; o problema é a promessa do código e a falta de saída).
- **Passos:** o app do INT-B2-01 com `<SemecProvider nonce={nonce}>`; abrir o Select "Município".
- **Esperado:** pelo JSDoc do `SemecProvider` ("distribui o valor para… componentes que aceitam `nonce` diretamente: Select e ScrollArea"), o `<style>` do viewport do Select deveria sair com nonce.
- **Obtido:** violação `style-src-elem` em `<style>[data-radix-select-viewport]{scrollbar-width:none;…}</style>`, sem nonce. O `SemecProvider` só chama `setNonce` do `get-nonce`; o `SelectContent` do kit não repassa `nonce` ao `SelectPrimitive.Viewport` (que aceita `nonce?: string`, ver `@radix-ui/react-select/dist/index.d.mts`), e as props do `SelectContent` vão para o `Content`, não para o `Viewport`. Quem consome não tem como corrigir. O Select continua funcionando, porque a scrollbar já é escondida pelo CSS estático.
- **Evidência:** saída de `tools\csp.mjs` (fase `select`); `evidencias\rr7-csp.json` (5º erro).
- **Correção sugerida (kit):** o `SemecProvider` guardar o nonce num contexto (`SemecNonceContext`), e o `SelectContent`/`ScrollArea` lerem esse contexto e passarem `nonce` ao `Viewport` do Radix. Também aceitar uma prop `nonce` explícita no `SelectContent`. Ou então corrigir o JSDoc para não prometer o que o provider não faz.

---

## O que funcionou sem ressalvas (sem achado)

- **SSR e hidratação:** RR7 (dev e `react-router-serve`), TanStack Start (dev e `vite preview`) e Astro (`client:load`, dev e build) sem nenhum aviso de hidratação no console. `useId` do `FormField`, `ErrorSummary` com `focusKey`, `Select` com `defaultValue` e `DataTable` hidrataram sem diferenças.
- **Providers:** `TooltipProvider` e `Toaster` no root/shell de cada framework funcionaram: Tooltip abriu no hover, Toast apareceu ao enviar e o `ErrorSummary` recebeu o foco.
- **`SemecProvider nonce`** levou o nonce ao `<style>` de scroll lock do Dialog (`react-remove-scroll`) no RR7 com CSP.
- **pnpm estrito** (`isolated`, sem hoist, sem auto-install de peers): todas as transitivas resolvem pelo `.pnpm` do próprio `@semec/ds`, e o `@source "../node_modules/@semec/ds/dist/react"` existe (symlink), com o Tailwind seguindo o link (CSS 72,24 kB). O aviso de peer `tailwindcss` só aparece porque ele foi instalado depois, como o README manda.
- **Yarn PnP, parte JS:** todas as transitivas resolvem em dev e em build; o problema é só o `@source` (INT-B2-04).
- **Fontes:** em todos os bundlers (Vite/RR7, Astro, TanStack Start, Parcel) a URL relativa do `fonts.css` foi reescrita e os quatro `.woff2` foram copiados para o build.

## Não testado / limitações

- O subpath `@semec/ds/react/server` não foi exercitado: é depreciado e de uso interno, segundo o README.
- Na CSP, só os componentes da tela padrão foram medidos. `Switch`, `RadioGroup`, `Slider`, `Progress`, `ScrollArea` e `Sidebar` podem ter o mesmo problema de `style` no SSR, mas não foram verificados.
- O RR7 com CSP foi medido só em build de produção. O dev do Vite injeta CSS por `<style>` e não serve para CSP estrita.
