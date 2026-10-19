# B1: integração do @semec/ds em projetos React fora do padrão

- **Pacote testado:** `C:\dev\semec-int\semec-ds-4.2.0.tgz` (`npm pack` da branch `fix/pendencias-4.2`, futura 4.2.1), instalado sempre do .tgz.
- **Ambiente:** Windows 11, Node 24.21.0, npm 11.19.0, Playwright 1.56.1 (Chromium 141 headless).
- **Data:** 19/10/2026.
- **Área de trabalho:** `C:\dev\semec-int\b1-react-legado\` (um projeto por cenário, `prints\` com as capturas e os JSON dos testes, `logs\` com a saída de install, build, jest e tsc).
- **Tela de teste** (`_shared/App.jsx`), igual em todos os cenários: `Button` (com `ref`), `Input` dentro de `FormField` com erro, `Select`, `Dialog`, `Toast` (`useToast` + `Toaster`) e `DataTable` com ordenação. O script `_tools/check.cjs` abre a tela, mede o estilo computado, abre o Select e escolhe uma opção, abre o Dialog e fecha com Esc, dispara o toast, ordena a tabela e confere `aria-invalid` e `aria-describedby` do campo.
- **Catálogo** (`_shared/Catalogo.jsx` + `_tools/catalogo.cjs`): os 47 componentes do manifest e mais a `Sidebar`, cada um dentro de um error boundary. São 23 interações automatizadas (abrir, selecionar, digitar, teclado) e um teste de foco na Sidebar recolhida.
- **Controle:** `s0-controle-react19` é o mesmo app no padrão oficial (React 19 + Vite + Tailwind v4). Todas as comparações partem dele: todas as interações passaram, sem erro de render e sem aviso além do `HeaderBrand sem logo`, que é esperado.

## Resumo

O kit funciona em runtime fora do padrão oficial com mais frequência do que o `package.json` e o README deixam supor. O que trava é empacotamento, peers e CSS:

- **React 18.3:** o `npm install` falha sem `--legacy-peer-deps` (peer `react ^19`). Com o flag, os 47 componentes e a Sidebar renderizam, e todas as interações passam. A única quebra de comportamento é a `Sidebar` recolhida: o `inert` booleano não chega ao DOM no React 18, e o foco do teclado entra num menu invisível. O `ref` funciona em todos os componentes, porque o kit usa `forwardRef` e não usa `use()` nem `useActionState`.
- **Tailwind v3:** não há caminho documentado, e o install falha sem o flag (peer `tailwindcss ^4`). Com `pv-preset` + `tokens.css`, a tela funciona, mas 89 das 659 classes do kit (13,5%) não são geradas. O preset não tem `card`, `popover`, `accent`, `secondary` nem `sidebar`, nem animações, então Dialog, Select e outros painéis saem com **fundo transparente**.
- **Sem Tailwind:** o pacote não traz CSS pré-compilado. Os componentes funcionam, mas sem estilo (o Dialog aparece no fim da página, sem sobreposição). Um protótipo de CSS pré-compilado (69,8 kB, 12,3 kB com gzip) gerado com a CLI do Tailwind resolve o problema sem Tailwind no app.
- **CommonJS:** o `require()` falha com `ERR_PACKAGE_PATH_NOT_EXPORTED` em todos os subpaths, até no Node 24, que já carrega ESM via `require`. Basta acrescentar a condição `default` ao `exports` para funcionar (testado num protótipo). O Jest 29 falha com a config padrão. Ele passa com `moduleNameMapper` + `transformIgnorePatterns`, ou com ESM experimental. O README não fala de Jest nem de CJS.
- **Webpack 5 puro:** funciona sem ajuste. A poda (tree-shaking) funciona: o `Button` acrescenta cerca de 38 kB minificados, tanto pela raiz quanto pelo subpath.
- **TypeScript:** `bundler`, `nodenext` e `node16` (com `"type": "module"`) passam com `skipLibCheck: false`. Já `node10` dá TS2307 em todos os subpaths. Um `typesVersions` sozinho não basta: os `.d.ts` referenciam `class-variance-authority/types`, e as props de variante viram `any` sem nenhum erro.

### Matriz cenário × resultado

| # | Cenário | Instala sem flag | Build | Runtime (6 componentes da tela) | Estilo | Caminho documentado | Resultado |
|---|---|---|---|---|---|---|---|
| 0 | Controle: React 19 + Vite 8 + Tailwind v4 | ✅ | ✅ | ✅ (catálogo 48/48, 23/23 interações) | ✅ | ✅ | ✅ |
| 1 | React 18.3 + Vite 8 + Tailwind v4 | ❌ ERESOLVE | ✅ (com `--legacy-peer-deps`) | ✅ (catálogo 48/48; 22/23 interações, só o foco da Sidebar falha) | ✅ | ❌ | ⚠️ |
| 2 | Tailwind v3.4 + React 19 + Vite | ❌ ERESOLVE | ⚠️ (29 avisos `Unknown at rule`) | ✅ (23/23 interações) | ❌ painéis transparentes, 89 classes faltando | ❌ | ⚠️ |
| 3 | Sem Tailwind (Vite + React 19) | ✅ (o npm instala `tailwindcss` sozinho como peer) | ✅ | ✅ | ❌ sem estilo | ⚠️ implícito | ❌ |
| 4a | `require('@semec/ds/react')` no Node 24 | ✅ | — | ❌ `ERR_PACKAGE_PATH_NOT_EXPORTED` | — | ❌ | ❌ |
| 4b | Jest 29 + babel-jest + jsdom (CRA-like) | ✅ | — | ❌ na config padrão; ✅ com mapeamento ou ESM experimental | — | ❌ | ⚠️ |
| 5 | Webpack 5 + babel-loader + `@tailwindcss/postcss` | ✅ | ✅ | ✅ (catálogo 48/48, 23/23 interações) | ✅ | ⚠️ (o README cita só Vite e Next) | ✅ |
| 6a | TS `moduleResolution: "bundler"` | ✅ | — | ✅ tipos ok (raiz, `button`, `validacao`) | — | ✅ | ✅ |
| 6b | TS `"nodenext"` (projeto CJS ou ESM) | ✅ | — | ✅ | — | ✅ (CHANGELOG) | ✅ |
| 6c | TS `"node16"` | ✅ | — | ✅ com `"type": "module"`; ❌ TS1479 em projeto CJS | — | ⚠️ | ⚠️ |
| 6d | TS `"node"` (node10) | ✅ | — | ❌ TS2307 nos 3 imports | — | ❌ | ❌ |

### Contagem por severidade

| Severidade | Qtde | Achados |
|---|---|---|
| Bloqueante | 0 | — |
| Alto | 4 | INT-B1-01, INT-B1-04, INT-B1-06, INT-B1-07 |
| Médio | 4 | INT-B1-02, INT-B1-05, INT-B1-08, INT-B1-09 |
| Baixo | 3 | INT-B1-03, INT-B1-10, INT-B1-11 |
| **Total** | **11** | |

Nenhum achado é Bloqueante para o padrão oficial: todos aparecem só fora dele.

---

## Cenário 1: React 18.3 + Vite + Tailwind v4

Projeto: `b1-react-legado\s1-react18` (react/react-dom 18.3.1, Vite 8.3, Tailwind 4.3, `@tailwindcss/vite`, CSS global idêntico ao do README).

- **Install sem flag:** falha (`logs\s1-install-sem-flag.log`): `Could not resolve dependency: peer react@"^19.0.0" from @semec/ds@4.2.0`.
- **Install com `--legacy-peer-deps`:** passa, mas o `npm ls` marca `react@18.3.1 deduped invalid: "^19.0.0"` em todo o grafo do kit. Depois disso, **qualquer** `npm i <pacote>` ou `npm ci` sem o flag também falha com ERESOLVE (testado com `npm i dayjs` e com `npm ci`).
- **Build:** ok (`vite build`; JS da tela 302 kB, 98 kB com gzip; CSS 70,6 kB).
- **Runtime (dev e produção):** a tela completa passou: Select, Dialog, Toast, DataTable, FormField e `ref` em `Button` e `Input` (`refs: BUTTON, INPUT`). Prints: `prints\s1-react18-*.png` e `s1-react18-dev-*.png`.
- **Catálogo:** 48/48 seções renderizam sem erro, e 22/23 interações passam. Falha só `Sidebar-tab-fechada` (INT-B1-02). Prints: `prints\s1-react18-prod-catalogo*.png`; JSON: `s1-react18-prod-catalogo.json`.
- **Leitura estática do `dist`:** 54 dos 57 módulos usam `React.forwardRef`. Os três restantes (`badge`, `button-loading`, `semec-provider`) não recebem `ref`. Não há `use()`, `useActionState`, `useOptimistic`, `useFormStatus` nem `<Context value>` sem `.Provider`. O único recurso específico do React 19 encontrado foi o atributo `inert` booleano, em `sidebar.js`.
- **Tipos:** com `@types/react@18` e `moduleResolution: "bundler"`, `tsc` passa sem erro (`b1-react-legado\s6b-ts-react18`).

**Funcionam no React 18.3**, confirmado por render e, quando indicado, por interação:

- **Com interação testada:** Accordion, AlertDialog, Button, Calendar, Checkbox, Combobox, DataTable (ordenação), Dialog, Drawer, DropdownMenu, FormField + Input (aria), InputMask (CPF digitado), InputOTP, NavigationMenu (abre e fecha), Pagination, PasswordInput, Popover, RadioGroup, Select, Sheet, SidebarToggleButton, Slider (teclado), Switch, Tabs, Toast/Toaster, Toggle, Tooltip.
- **Só render:** Alert, Avatar, Badge, Breadcrumb, Card, DatePicker, EmptyState, ErrorState, ErrorSummary, FileUpload, Footer, Header, Heading, IconButton, Label, Link, Progress, ScrollArea, SemecProvider (sem nonce), Separator, Skeleton, SkipLink, Spinner, Stepper, Table, Textarea, Timeline.

**Não funciona corretamente:** a `Sidebar` com `collapsible="offcanvas"` recolhida (INT-B1-02). Ela abre e fecha, mas não fica `inert`.

**Aviso só em dev:** o `NavigationMenu` mostra `Function components cannot be given refs` (INT-B1-03), sem efeito funcional.

## Cenário 2: Tailwind v3 + React 19 (Vite)

Projeto: `b1-react-legado\s2-tailwind3` (tailwindcss 3.4.19 + postcss + autoprefixer). `tailwind.config.js` com `presets: [pvPreset]` (`@semec/ds/react/pv-preset`) e `content` apontando para `node_modules/@semec/ds/dist/react/**/*.js`. O `index.css` importa `fonts.css` e `tokens.css` e depois as três diretivas `@tailwind`.

- **Install sem flag:** falha com `peer tailwindcss@"^4.0.0" from @semec/ds@4.2.0` (`logs\s2-install-sem-flag.log`).
- **Build:** passa com 29 avisos do lightningcss: `Unknown at rule: @utility` (28) e `@theme` (1), porque o `tokens.css` usa sintaxe exclusiva da v4 (`logs\s2-vite-build-tw3.log`).
- **O que serve:** as variáveis `:root` do `tokens.css` (cores, fonte, raio) e o `@layer base` funcionam. O preset gera os utilitários de cor, tipografia, espaçamento, raio e sombra que tem. Botão primário, Input com erro e tabela ficam iguais ao controle (estilo computado idêntico: `rgb(58,108,166)`, raio 9999px, 44px, Poppins).
- **O que falta:** foram medidas 659 classes geradas pelo Tailwind v4 e usadas pelo kit. **89 delas (13,5%) não existem** no CSS da v3 (`prints\s2-tw3-classes-faltando.json`):
  - **27 de cor e borda:** `bg-card`, `bg-popover`, `bg-accent`, `bg-secondary`, `bg-sidebar`, `hover:bg-accent`, `bg-muted/50`, `border-destructive/30` etc.;
  - **12 de texto:** `text-card-foreground`, `text-popover-foreground`, `text-accent-foreground`, `text-sidebar-foreground` etc.;
  - **41 de animação:** `animate-in`, `fade-in`, `zoom-out-95`, `slide-in-from-top-2`, `animate-accordion-up` etc. São os `@utility` do `tokens.css`, que a v3 ignora;
  - **3 de anel:** `ring-sidebar-ring`, `ring-foreground/5`, `focus-visible:ring-success/30`;
  - **4 de `inset-ring`** (`Toggle`) e mais algumas sem grupo.
- **Efeito visual:** os painéis do Select e do Dialog saem **transparentes**, com o conteúdo de trás aparecendo por baixo, e o botão `secondary` fica sem fundo. Compare `prints\s2-tw3-2-select.png` com `s0-react19-dev-2-select.png`, e `s2-tw3-3-dialog.png` com `s0-react19-dev-3-dialog.png`.
- **Funcional:** todas as 23 interações do catálogo passaram (`prints\s2-tw3-catalogo.json`).
- **Config CJS da v3** (`module.exports = { presets: [require("@semec/ds/react/pv-preset")] }`): funciona, porque a v3 carrega a config pelo `jiti`, que ignora o `exports`.
- **Documentação:** o README chama o `pv-preset` de "Preset Tailwind v4" e não menciona a v3.

## Cenário 3: projeto sem Tailwind

Projeto: `b1-react-legado\s3-sem-tailwind` (Vite 8 + React 19, sem nenhum plugin Tailwind).

- **O pacote não tem CSS pré-compilado:** os únicos `.css` são `dist/react/tokens.css`, `dist/react/fonts.css` e o `tokens.css` da raiz.
- **Instalação:** o npm 11 instalou `tailwindcss@4.3.3` sozinho, como peer, mesmo sem uso no app.
- **Variante A** (só os componentes, sem CSS do kit): todas as interações funcionam, mas tudo sai com o estilo padrão do navegador (Times New Roman, botões cinza). Prints: `prints\s3-sem-tw-a-*.png`.
- **Variante B** (`fonts.css` + `tokens.css` importados como CSS comum): sai um CSS de 15,9 kB com `@theme` e `@utility` crus (os mesmos 29 avisos). O `body` ganha Poppins e a cor de fundo, mas os componentes continuam sem estilo. O Dialog aparece **no fim da página**, sem sobreposição nem cartão (`prints\s3-sem-tw-b-3-dialog.png`).
- **Variante C, protótipo de CSS pré-compilado:** gerei um CSS com `@tailwindcss/cli` a partir de `@import "tailwindcss" source(none)` + `tokens.css` + `@source` no `dist` (`_tools\precompilado\semec-ds.css`: 69.840 bytes, 12.314 com gzip). Importado num app sem Tailwind, deixa os componentes do kit idênticos ao controle e com todas as etapas ok (`prints\s3-sem-tw-c-precompilado-*.png`). As classes de layout do próprio app (`max-w-2xl`, `gap-6`) continuam por conta do app.
- **Documentação:** o README diz que pular um dos 5 passos deixa os componentes sem estilo, e o `tailwindcss` ^4 é peer obrigatório. Ou seja, a dependência é **implícita**. Não há frase dizendo "sem Tailwind não há caminho" nem alternativa.

## Cenário 4: CommonJS e Jest 29

**4a. Node 24, `require()`** (`b1-react-legado\s4-commonjs`, `logs\s4-require-node24.log`):

```
FALHA @semec/ds/react ERR_PACKAGE_PATH_NOT_EXPORTED - Package subpath './react' is not defined by "exports" in ...\node_modules\@semec\ds\package.json
FALHA @semec/ds/react/button ERR_PACKAGE_PATH_NOT_EXPORTED - ...
FALHA @semec/ds/react/validacao ERR_PACKAGE_PATH_NOT_EXPORTED - ...
FALHA @semec/ds/react/pv-preset ERR_PACKAGE_PATH_NOT_EXPORTED - ...
FALHA @semec/ds/skills ERR_PACKAGE_PATH_NOT_EXPORTED - ...
```

O `import()` dinâmico num arquivo CJS funciona. Fiz um protótipo numa cópia local do `package.json` (`s4-commonjs\_patch`), com `"default"` igual a `"import"` em cada entrada do `exports`. Com ele, o `require()` funciona no Node 24 para `react`, `react/button`, `pv-preset` e `skills`, e o `renderToString(<Button>)` via `require` gera o HTML esperado (`logs\s4-require-prototipo-default.log`). O `validacao` só falha porque o `zod` não estava instalado, o que é esperado.

**4b. Jest 29.7 + babel-jest + jest-environment-jsdom** (`b1-react-legado\s4-jest29`). O teste renderiza um componente do app com `FormField` + `Input` + `Dialog`, confere `aria-invalid` e a descrição acessível, e abre o Dialog com `userEvent`.

| Config | Resultado | Log |
|---|---|---|
| A: padrão CRA-like (`testEnvironment: "jsdom"`) | ❌ `Cannot find module '@semec/ds/react' from 'src/Formulario.jsx'` | `logs\s4-jest-jest.config.js.log` |
| B: `customExportConditions: ["browser","import","default"]` + `transformIgnorePatterns` | ❌ `SyntaxError: Unexpected token 'export'` em `dedent.mjs`: a condição global afeta outras dependências | `...config.b.js.log` |
| **C: `moduleNameMapper`** (3 regras: raiz, `validacao`, `react/*` → `dist/react/components/$1.js`) **+ `transformIgnorePatterns: ["/node_modules/(?!@semec/ds/)"]`** | ✅ PASS | `...config.c.js.log` |
| **D: ESM experimental** (`NODE_OPTIONS=--experimental-vm-modules`, `extensionsToTreatAsEsm: [".jsx"]`) | ✅ PASS (com o aviso `ExperimentalWarning`) | `...config.d.js.log` |
| E: só `transformIgnorePatterns` | ❌ `Cannot find module` | `...config.e.js.log` |
| A com o protótipo `default` | ❌ `SyntaxError: Unexpected token 'export'` (resolve, mas não transforma) | (console) |
| E com o protótipo `default` | ✅ PASS | (console) |

O README não orienta: não fala de Jest, CJS ou `require`. A única menção é a `jest-axe`, na seção de axe. Além disso, `docs/arquitetura.md` (linha 167) descreve o build como "tsup ... ESM+CJS", e o pacote só publica ESM.

## Cenário 5: Webpack 5 puro

Projeto: `b1-react-legado\s5-webpack5`. Webpack 5.112, babel-loader com `@babel/preset-env` e `@babel/preset-react` (automatic), `css-loader` + `postcss-loader` com `@tailwindcss/postcss`, `mini-css-extract-plugin` e `html-webpack-plugin`. O CSS global é igual ao do README; o `@source` e as URLs da Poppins funcionaram (4 `.woff2` emitidos).

- **Build de produção:** ok, sem avisos do kit (os avisos de `"use client"` são do Vite e não aparecem aqui).
- **Runtime:** a tela passa inteira, e o catálogo também (48/48, 23/23). Prints: `prints\s5-webpack5-*.png`.
- **Tamanhos (minificado / gzip -9):**

| Artefato | Bytes | gzip |
|---|---|---|
| `main.js`, a tela dos 6 componentes (React + ReactDOM + kit + Radix) | 384.611 | 119.903 |
| `catalogo.js` (48 componentes) | 541.938 | 162.414 |
| CSS (Tailwind + tokens + kit; **sem minificação**, porque o webpack não minifica CSS sem `css-minimizer-webpack-plugin`) | 86.015 | 13.350 |
| Base: só `react-dom` renderizando um `<button>` | 218.836 | 68.270 |
| Só `Button`, importado de `@semec/ds/react` | 257.125 (+38.289) | 79.901 (+11.631) |
| Só `Button`, importado de `@semec/ds/react/button` | 257.133 (+38.297) | 79.915 |

A poda funciona no webpack 5: raiz e subpath custam o mesmo, em linha com os "~35 kB" do README. Nenhum achado neste cenário.

## Cenário 6: TypeScript (5.9.3, `skipLibCheck: false`, `strict`)

Projeto: `b1-react-legado\s6-typescript`. O arquivo `src/uso.tsx` importa `Button`, `FormField`, `Input`, `DataTable` e `ButtonProps` de `@semec/ds/react`, `Button` de `@semec/ds/react/button` e `cpfSchema` de `@semec/ds/react/validacao`. Ele tem também um `// @ts-expect-error` em `<Button variant="inexistente">`, para provar que os tipos não viraram `any`.

| moduleResolution | projeto CJS (sem `type`) | projeto `"type": "module"` |
|---|---|---|
| `bundler` (module esnext) | ✅ | ✅ |
| `nodenext` | ✅ | ✅ |
| `node16` | ❌ TS1479 nos 3 imports | ✅ |
| `node` (node10, module commonjs) | ❌ TS2307 nos 3 imports | ❌ TS2307 |

Mensagens exatas (`logs\s6-tsc-*.log`):

```
src/uso.tsx(1,71): error TS2307: Cannot find module '@semec/ds/react' or its corresponding type declarations.
  There are types at '.../node_modules/@semec/ds/dist/react/index.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.
src/uso.tsx(2,37): error TS2307: Cannot find module '@semec/ds/react/button' or its corresponding type declarations.
  There are types at '.../dist/react/components/button.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. ...
src/uso.tsx(3,27): error TS2307: Cannot find module '@semec/ds/react/validacao' or its corresponding type declarations.
  There are types at '.../dist/react/validacao.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. ...
```

```
src/uso.tsx(1,71): error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("@semec/ds/react")' call instead.
  To convert this file to an ECMAScript module, add the field `"type": "module"` to '.../s6-typescript/package.json'.
```

Protótipo com `typesVersions` (cópia local, restaurada depois) e `node10`: os 3 imports resolvem, mas aparecem 12 erros `TS2307: Cannot find module 'class-variance-authority/types'`, vindos de 11 `.d.ts` do kit. O tipo inferido das variantes CVA sai como `import("class-variance-authority/types").ClassProp`, e esse subpath do CVA só existe no `exports`. Com `skipLibCheck: true` os 12 erros somem, mas o `@ts-expect-error` passa a acusar `TS2578: Unused '@ts-expect-error' directive`: **`variant` vira `any` sem nenhum erro.**

---

## Achados

### INT-B1-01: peer `react ^19` impede instalar em React 18, e o `--legacy-peer-deps` contamina o projeto

- **Severidade:** Alto
- **Passos:** num projeto com `react@18.3.1`, rodar `npm i semec-ds-4.2.0.tgz`. Depois, `npm i --legacy-peer-deps`. Depois, `npm i dayjs` ou `npm ci`.
- **Esperado:** instalar, ou uma mensagem que oriente o caminho.
- **Obtido:** `ERESOLVE ... peer react@"^19.0.0" from @semec/ds@4.2.0`. Com o flag instala, e o kit funciona em runtime (48/48 renderizam; 22/23 interações passam, só falha o foco da Sidebar, INT-B1-02). Mas a árvore fica `invalid` e todo install seguinte sem o flag falha com ERESOLVE.
- **Evidência:** `logs\s1-install-sem-flag.log`, `prints\s1-react18-prod-catalogo.json`, `prints\s1-react18-*.png`.
- **Sugestões:**
  1. Corrigir o INT-B1-02, pôr React 18.3 na matriz da CI (vitest + gate Chromium) e ampliar o peer para `"react": "^18.3.0 || ^19.0.0"` e `"react-dom": "^18.3.0 || ^19.0.0"`. **Não é quebra de contrato** (minor): ampliar o intervalo de peer não afeta quem já está no 19.
  2. Se o React 18 não for suportado: escrever isso no README (seção Dependências), com a mensagem de ERESOLVE e a orientação de atualizar para o 19, e **não** recomendar `--legacy-peer-deps`. Não é quebra (documentação).

### INT-B1-02: `Sidebar` recolhida (offcanvas) não fica `inert` no React 18, e o foco entra no menu invisível

- **Severidade:** Médio. Só acontece com React 18, que hoje está fora do peer. Vira falha de WCAG 2.4.3/2.4.7 (bloqueante pela ADR-014) se o peer passar a aceitar o 18.
- **Passos:** React 18.3 + `<SidebarProvider defaultOpen={false}><Sidebar collapsible="offcanvas">…` em viewport de desktop (1280px). Focar o `SidebarTrigger` e dar `Shift+Tab`.
- **Esperado:** a `<nav>` recolhida com o atributo `inert` e o foco pulando para o elemento anterior visível. É o que acontece no React 19: `navInert: true`, e o foco vai para `t-tooltip`.
- **Obtido:** o React 18 não grava `inert={true}`. No console: `Warning: Received \`true\` for a non-boolean attribute \`inert\``. A `<nav>` fica sem `inert`, e o foco vai para o item "Painel" na posição `x = -256`, fora da tela: `{"foco":"sb-item","x":-256,"visivelNaViewport":false,"navInert":false}`.
- **Evidência:** `prints\s1-react18-sidebar-foco.png` × `prints\s0-react19-sidebar-foco.png`, `prints\s1-react18-prod-catalogo.json` (`Sidebar-tab-fechada: FALHA`). Origem: `dist/react/components/sidebar.js`, linhas 192, 223, 255 e 341 (`inert: inertProp ?? (hiddenOffcanvas || void 0)`).
- **Sugestão:** aplicar o `inert` pela propriedade do DOM, num efeito com `ref` (`node.inert = Boolean(...)`), que funciona no 18 e no 19. Outra opção é passar `inert` como `""` / `undefined` conforme `React.version`. Também testar a Sidebar recolhida com React 18 na CI, caso o peer seja ampliado. **Não é quebra de contrato** (patch).

### INT-B1-03: `NavigationMenu` mostra o aviso "Function components cannot be given refs" no React 18 (dev)

- **Severidade:** Baixo
- **Passos:** React 18.3 em modo dev, renderizar o `NavigationMenu` do kit.
- **Esperado:** console limpo, como no React 19.
- **Obtido:** `Warning: Function components cannot be given refs ... Check the render method of \`Presence\`. at NavigationMenuViewportItem`. O aviso vem do `@radix-ui/react-navigation-menu@1.4.1`, que passa `ref` a um componente de função, padrão que só o React 19 aceita. Abrir e fechar funciona (2 ciclos testados: o conteúdo desmonta e `aria-expanded` volta a `false`).
- **Evidência:** `prints\s1-react18-catalogo.json` (catálogo em dev, campo `logs`) e o teste `_tools\navmenu.cjs`.
- **Sugestão:** se o React 18 passar a ser suportado, registrar o aviso como limitação conhecida do Radix no README, ou acompanhar a correção upstream. **Não é quebra** (documentação).

### INT-B1-04: Tailwind v3 sem caminho; o preset e o `tokens.css` deixam painéis transparentes e sem animação

- **Severidade:** Alto
- **Passos:** Vite + React 19 + `tailwindcss@3.4`, `presets: [pvPreset]`, `content` com o `dist` do kit, `@import` de `fonts.css` e `tokens.css` + `@tailwind base/components/utilities`. Instalar com `--legacy-peer-deps`, porque sem ele dá ERESOLVE no peer `tailwindcss ^4`.
- **Esperado:** caminho documentado, ou a declaração explícita de que só a v4 é suportada. Se o preset for usado, os componentes estilizados.
- **Obtido:**
  - o build passa com 29 avisos `Unknown at rule` (`@utility` e `@theme`);
  - 89 de 659 classes do kit não são geradas;
  - Select, Dialog, Popover, DropdownMenu, Sheet e Drawer saem com fundo **transparente** (sem `bg-popover` / `bg-card`) e sem animação de entrada e saída;
  - o `Button variant="secondary"` fica sem fundo, e a `Sidebar` fica sem `bg-sidebar`;
  - o funcional fica intacto (23/23).
- **Evidência:** `prints\s2-tw3-2-select.png`, `prints\s2-tw3-3-dialog.png` (comparar com `s0-react19-dev-*.png`), `prints\s2-tw3-classes-faltando.json`, `logs\s2-vite-build-tw3.log`, `logs\s2-install-sem-flag.log`.
- **Sugestões:**
  1. Seção "Tailwind v3" no README, dizendo explicitamente que **não é suportado** e apontando o CSS pré-compilado (INT-B1-06) como alternativa. Não é quebra.
  2. Se quiserem suporte parcial: completar o `pv-preset` (ver INT-B1-05) e documentar o plugin `tailwindcss-animate` para as animações. Não é quebra (minor).

### INT-B1-05: o `pv-preset` não gera "os mesmos nomes" do `@theme`: faltam 11 cores e as animações

- **Severidade:** Médio
- **Passos:** comparar as `--color-*` do `@theme inline` do `tokens.css` com `theme.extend.colors` do `dist/react/pv-preset.js`.
- **Esperado:** o README (seção Tokens) diz: "O `@theme inline` expõe os tokens como utilitários (o preset JS gera os mesmos nomes)".
- **Obtido:**
  - o `@theme` tem 45 cores e o preset tem 34;
  - faltam `card`, `card-foreground`, `popover`, `popover-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-foreground`, `sidebar`, `sidebar-foreground` e `sidebar-ring`;
  - o preset também não tem `animation`/`keyframes` (`--animate-*` do `@theme`);
  - na v4 com `@config`, o `@theme` cobre a lacuna, e por isso só aparece fora da v4.
- **Evidência:** a comparação está descrita no cenário 2; o efeito visual está no INT-B1-04.
- **Sugestão:** acrescentar as 11 cores e `keyframes`/`animation` ao `src/pv-preset.ts`, e um teste no `test:dist` que compare as chaves do preset com as do `@theme`. Ou corrigir a frase do README ("o preset cobre só tokens base; componentes exigem `tokens.css` na v4"). **Não é quebra** (minor, só acrescenta chaves).

### INT-B1-06: não há CSS pré-compilado, e sem Tailwind os componentes ficam sem estilo

- **Severidade:** Alto
- **Passos:** app Vite + React 19 sem Tailwind. Importar componentes de `@semec/ds/react`, com e sem `fonts.css` e `tokens.css` importados como CSS comum.
- **Esperado:** um CSS pronto (ex.: `@semec/ds/react/styles.css`), ou um aviso explícito de que o kit exige Tailwind v4 no build do app.
- **Obtido:**
  - o pacote só publica `tokens.css` e `fonts.css`;
  - sem eles, os componentes saem com o estilo nativo do navegador;
  - com eles, sai um CSS de 15,9 kB com `@theme`/`@utility` crus (29 avisos), só `body` e variáveis são aplicados, e o Dialog aparece no fim da página, sem sobreposição;
  - o funcional segue ok;
  - o npm instala `tailwindcss@4` como peer mesmo sem uso;
  - o README trata o Tailwind como passo obrigatório, mas não diz que sem ele não há caminho.
- **Evidência:** `prints\s3-sem-tw-a-*.png`, `prints\s3-sem-tw-b-3-dialog.png`, `logs\s3-build-tokens-sem-tw.log`.
- **Sugestão:** publicar um `dist/react/semec-ds.css` gerado no build. O protótipo usa `@tailwindcss/cli` com `@import "tailwindcss" source(none)` + `tokens.css` + `@source` no `dist`, e tem 69.840 bytes (12.314 com gzip). Ele foi validado com todos os 6 componentes estilizados e funcionando, num app sem Tailwind (`prints\s3-sem-tw-c-precompilado-*.png`). Exportar como `"./react/styles.css"`, com uma seção "Sem Tailwind" no README dizendo que as classes do app ficam por conta do app. Depois disso, avaliar marcar `tailwindcss` como peer opcional em `peerDependenciesMeta`. **Não é quebra de contrato** (minor: novo export; tornar o peer opcional também não quebra).

### INT-B1-07: `require()` falha em todos os subpaths; o `exports` só tem a condição `import`

- **Severidade:** Alto
- **Passos:** `node -e "require('@semec/ds/react')"` no Node 24 (que já carrega ESM via `require`). O mesmo para `/react/button`, `/react/validacao`, `/react/pv-preset` e `/skills`.
- **Esperado:** funcionar no Node ≥ 22.12, que é a faixa do `engines` e tem `require(esm)` sem flag, ou um erro documentado.
- **Obtido:** `ERR_PACKAGE_PATH_NOT_EXPORTED - Package subpath './react' is not defined by "exports"` em todos, e `require.resolve` também falha. O que barra é a ausência da condição `default`/`require`, e não o formato ESM: no protótipo com `"default"` igual a `"import"`, `require` e `renderToString` funcionam.
- **Evidência:** `logs\s4-require-node24.log`, `logs\s4-require-prototipo-default.log`.
- **Sugestões:**
  1. Acrescentar `"default": "./dist/.../*.js"` como **última** condição em cada entrada JS do `exports` (`react`, `react/*`, `react/validacao`, `react/pv-preset`, `react/server`, `skills`, `lite/*`). Validar no `check-exports` com `require()` no Node 22 e 24. **Não é quebra de contrato** (minor: só abre um caminho que hoje dá erro).
  2. Opcional: build CJS de verdade (`tsup --format esm,cjs` + condição `"require"`), para Node < 22.12, Jest sem transformação e TS `node16` em projeto CJS. Não é quebra se o ESM continuar como `import`, mas exige cuidado com o risco de pacote duplo (contexto do `FormField`, `useToast`), então pede uma ADR.
  3. Seção "CommonJS / Node" no README. Não é quebra.

### INT-B1-08: Jest 29 (CRA-like) não resolve o kit na config padrão, e o README não orienta

- **Severidade:** Médio. Há solução de configuração, mas ela não está documentada e não é óbvia: a condição global `import` quebra outras dependências.
- **Passos:** Jest 29.7 + babel-jest + jest-environment-jsdom, teste de um componente do app que usa `FormField`, `Input` e `Dialog` do kit.
- **Esperado:** passar, ou ter receita no README.
- **Obtido:**
  - config padrão: `Cannot find module '@semec/ds/react' from 'src/Formulario.jsx'`;
  - `customExportConditions` com `import`: `SyntaxError: Unexpected token 'export'` em `dedent.mjs`, de outra dependência;
  - **passa** com `moduleNameMapper` (3 regras) + `transformIgnorePatterns: ["/node_modules/(?!@semec/ds/)"]`, ou com `--experimental-vm-modules` + `extensionsToTreatAsEsm: [".jsx"]`;
  - com a condição `default` do INT-B1-07, basta o `transformIgnorePatterns`.
- **Evidência:** `logs\s4-jest-*.log`, projeto `b1-react-legado\s4-jest29` (configs `jest.config.c.js` e `jest.config.d.js`).
- **Sugestão:** seção "Testes com Jest" no README, com a config C pronta para copiar. Com o INT-B1-07 aplicado, reduzir para só `transformIgnorePatterns`. **Não é quebra** (documentação; a condição `default` é minor).

### INT-B1-09: TypeScript `moduleResolution: "node"` (node10) não acha os tipos; `typesVersions` sozinho faz as variantes virarem `any`

- **Severidade:** Médio
- **Passos:** `tsc` com `module: commonjs`, `moduleResolution: node`, `skipLibCheck: false`, importando `@semec/ds/react`, `@semec/ds/react/button` e `@semec/ds/react/validacao`.
- **Esperado:** tipos resolvidos, ou orientação no README.
- **Obtido:** `TS2307: Cannot find module '@semec/ds/react' or its corresponding type declarations. There are types at '.../dist/react/index.d.ts', but this result could not be resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'.` O mesmo acontece para `/react/button` e `/react/validacao`.
  - Com `typesVersions` (protótipo), aparecem 12 erros `TS2307: Cannot find module 'class-variance-authority/types'` em 11 `.d.ts` (alert, badge, button…).
  - Com `skipLibCheck: true`, os erros somem, mas `<Button variant="inexistente">` passa sem erro (`TS2578: Unused '@ts-expect-error'`): as props de variante viram `any`.
- **Evidência:** `logs\s6-tsc-node10-cjs.log`, cenário 6. O trecho do `button.d.ts` é `} & import("class-variance-authority/types").ClassProp) | undefined) => string;`.
- **Sugestões:**
  1. Documentar no README que `node10` não é suportado e indicar `bundler` (Vite/webpack) ou `nodenext`. Não é quebra.
  2. Se quiserem suportar: `typesVersions` para os subpaths **e** anotar explicitamente o tipo das funções `xxxVariants` exportadas, para o `.d.ts` não referenciar `class-variance-authority/types`. Ex.: usar `VariantProps` e `ClassProp` importados da raiz do CVA, ou declarar `(props?: {...} & { class?: ClassValue; className?: ClassValue }) => string`. Não é quebra (minor), mas o `typesVersions` precisa cobrir todos os subpaths para não esconder nenhum.

### INT-B1-10: TS `node16` em projeto CJS dá TS1479; o pacote é só ESM e isso não está escrito

- **Severidade:** Baixo
- **Passos:** `module`/`moduleResolution` `node16`, sem `"type": "module"` no `package.json` do app.
- **Esperado:** uma orientação do pacote.
- **Obtido:** `TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'.` Com `"type": "module"` ou com `nodenext` (TS 5.9, que aceita `require(esm)`), passa.
- **Evidência:** `logs\s6-tsc-node16-cjs.log`.
- **Sugestão:** no README (Dependências), deixar claro que o pacote é **somente ESM** e listar as resoluções do TS suportadas (`bundler`, `nodenext`, `node16` com `"type": "module"`). Só um build CJS (INT-B1-07, sugestão 2) eliminaria o TS1479 em `node16` + CJS. **Não é quebra** (documentação).

### INT-B1-11: `docs/arquitetura.md` diz que o build é "ESM+CJS", e o pacote só publica ESM

- **Severidade:** Baixo
- **Passos:** ler `docs/arquitetura.md:167` (`| Build | tsup (libs) / Vite (docs) | Rápido, ESM+CJS, .d.ts |`) e comparar com o `exports` (só `import`) e o `dist` (só `.js` ESM).
- **Esperado:** a documentação de arquitetura bater com o pacote.
- **Obtido:** a documentação promete CJS, que não existe, e induz o integrador a tentar `require()` (INT-B1-07).
- **Evidência:** `C:\dev\semec-wt\v42-manut\docs\arquitetura.md` linha 167; `packages/react/package.json` (`exports`).
- **Sugestão:** trocar para "ESM (somente)", ou atualizar se o build CJS for adotado. **Não é quebra** (documentação).

---

## Sugestões e impacto no contrato

| Sugestão | Achados | Quebra de contrato? |
|---|---|---|
| Peer `react`/`react-dom` `^18.3.0 \|\| ^19.0.0` + React 18 na CI | 01 | Não (minor) |
| `inert` aplicado pela propriedade do DOM na `Sidebar` | 02 | Não (patch) |
| Documentar React 18 como não suportado (sem recomendar `--legacy-peer-deps`) | 01, 03 | Não |
| Completar o `pv-preset` (11 cores + animações) e testar a paridade com o `@theme` | 04, 05 | Não (minor) |
| Seção "Tailwind v3" (não suportado, alternativa) | 04 | Não |
| CSS pré-compilado `@semec/ds/react/styles.css` + seção "Sem Tailwind" | 04, 06 | Não (minor, novo export) |
| `tailwindcss` como peer opcional (depois do CSS pré-compilado) | 06 | Não |
| Condição `"default"` em cada entrada JS do `exports` | 07, 08 | Não (minor) |
| Build CJS real + condição `"require"` | 07, 08, 10 | Não, se o ESM continuar em `import`; pede ADR por causa do risco de pacote duplo |
| Seções "CommonJS / Node" e "Testes com Jest" no README | 07, 08 | Não |
| `typesVersions` + anotação explícita dos tipos `xxxVariants` (sem `class-variance-authority/types` nos `.d.ts`) | 09 | Não (minor) |
| Documentar as resoluções do TS suportadas e "somente ESM" | 09, 10 | Não |
| Corrigir `docs/arquitetura.md` | 11 | Não |

Nenhuma das sugestões exige major. A única que exige cuidado de projeto é o build CJS duplo, por causa do risco de duas cópias do módulo (contexto do `FormField` e store do `useToast`).

## Observações de execução

- Não alterei o repositório nem `C:\dev\semec-wt\*`. Fiz os protótipos (`default` no `exports`, `typesVersions`) em cópias do `package.json` dentro de `node_modules` dos projetos de teste, e os restaurei depois. O CSS pré-compilado fica em `b1-react-legado\_tools\precompilado\`.
- Ao derrubar um servidor Vite meu, encerrei por engano o `vite preview` da porta 47311 do projeto `C:\dev\semec-int\d-agente-ia\react-app`, de outra frente de teste. Subi de novo na hora, com o mesmo comando (`npx vite preview --port 47311 --strictPort`), e conferi que responde HTTP 200. Se essa frente registrou uma falha de conexão nesse intervalo de poucos segundos, foi isso.
- O `@vitejs/plugin-react` atual exige Vite 8 (peer `vite ^8`). Por isso todos os cenários com Vite usam o Vite 8.3.
- A primeira rodada do catálogo em dev no React 18 mostrou `Invalid hook call`, mas a causa era a reotimização de dependências do Vite no meio da navegação (dois hashes `?v=` diferentes). Some com `--force` e não aparece no build de produção, por isso não está entre os achados.
