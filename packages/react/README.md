# @semec/ds

Design System SEMEC — componentes React + tokens CSS + artefatos para agentes de IA.

React 19 + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Tokens `pv-*` (tema claro).

## Comece aqui

São 5 passos para o caminho Tailwind v4. Para usar o CSS pronto, siga [Sem Tailwind](#sem-tailwind) e mantenha os providers do passo 4.

### Sem React (Vue, Angular, Svelte, HTML)

Use os tokens e a fonte pelos subpaths `@semec/ds/lite/tokens.css` e `@semec/ds/lite/fonts.css`. A orientação para esses projetos está na skill lite: `node_modules/@semec/ds/dist/lite/semec-ds-lite/SKILL.md` (export `@semec/ds/lite/skills/semec-ds-lite`). Os componentes React não rodam nesses frameworks; a lite fornece tokens e orientações de acessibilidade, não componentes prontos nem CSS de componentes. Sem bundler, veja [Via CDN](#via-cdn).

### 1. Instalar

```bash
npm install @semec/ds lucide-react
# pnpm add @semec/ds lucide-react
# yarn add @semec/ds lucide-react
```

`lucide-react` é **peer dependency** (`>=0.468.0 <2`), não dependência: os componentes importam os ícones dele, e sem ele o build do app quebra. Instale-o junto, sempre, com qualquer gerenciador:

- **npm 7+** instala peers ausentes sozinho (exceto com `--legacy-peer-deps`); listar `lucide-react` no comando só o deixa explícito no `package.json`;
- **pnpm** só instala peers com `auto-install-peers=true` (padrão desde o pnpm 8, mas muitos projetos e monorepos usam `false`);
- **Yarn** (clássico e Berry) **não** instala peers: só avisa.

Os peers obrigatórios são `react` e `react-dom` ^19 (o app já tem) e `lucide-react`. Peers opcionais: `tailwindcss` ^4 (necessário apenas para compilar o CSS no app, passo 2) e `zod` `^3.23.0 || ^4.0.0` (só se usar `@semec/ds/react/validacao`). Os pacotes Radix UI, `class-variance-authority`, `clsx`, `tailwind-merge` e `get-nonce` são **dependências** do `@semec/ds` e vêm automaticamente: não instale a lista de `@radix-ui/*` à mão.

### 2. CSS global (Tailwind v4)

Primeiro, o Tailwind v4 precisa estar ligado ao bundler do app. Depois, as linhas do kit vão no CSS global.

**Vite** (`npm create vite@latest`, template React):

```bash
npm install -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

O CSS global é o `src/index.css` (importado em `src/main.tsx`). **Troque o conteúdo inteiro** pelas linhas do kit (abaixo) e apague o `import "./App.css"` do `App.tsx`: os estilos do template ficam fora de camada e vencem os do kit. No `index.html`, troque `<html lang="en">` por `<html lang="pt-BR">` (o template do Vite gera em inglês, e o leitor de tela lê o português com a pronúncia errada).

**Next.js** (`create-next-app` com Tailwind): o Tailwind v4 já vem configurado. O `create-next-app` 16.4 gera o plugin `@tailwindcss/turbopack`, sem `postcss.config.mjs`; ele funciona igual ao `@tailwindcss/postcss` dos templates anteriores, e as linhas do kit são as mesmas nos dois. Sem Tailwind no projeto: `npm install -D tailwindcss @tailwindcss/postcss` e um `postcss.config.mjs` com `export default { plugins: { "@tailwindcss/postcss": {} } };`.

O template do Next traz estilos que **vencem** os do kit. Só acrescentar as linhas do kit ao `globals.css` deixa o app com Arial, as cores do template e fundo escuro quando o sistema está em modo escuro: o `body { font-family: Arial… }`, o `:root`, o `@theme inline { --font-sans: var(--font-geist-sans) … }` e o `@media (prefers-color-scheme: dark)` do template ficam fora de camada e ganham do `@layer base` do `tokens.css`. Então:

1. em `app/globals.css`, **apague tudo** o que o template gerou (`:root`, `@theme inline`, `@media (prefers-color-scheme: dark)`, `body`) e deixe só as linhas do kit;
2. em `app/layout.tsx`, apague o `next/font/google` (`Geist`, `Geist_Mono`) e as classes `geistSans.variable` / `geistMono.variable` do `<body>`; a fonte vem do passo 3. Aproveite para trocar `lang="en"` por `lang="pt-BR"`:

```tsx
// app/layout.tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

**Logo no Next:** os exemplos usam `logo={<img src="/marca.svg" alt="…" />}`, que é válido, mas o `eslint-config-next` avisa `@next/next/no-img-element`. O `logo` aceita qualquer nó: use `<Image src="/marca.svg" alt="Prefeitura de Porto Velho" width={120} height={36} />` do `next/image`, ou ignore o aviso para SVG estático. É só aviso de lint; o build passa.

**Next com export estático:** remova `cacheComponents` e `experimental.partialPrefetching` se vierem no template; PPR não é compatível com `output: "export"`. Exemplo para hospedar numa subpasta:

```js
// next.config.mjs
export default {
  output: "export",
  basePath: "/meu-sistema",
  images: { unoptimized: true },
};
```

Use `basePath: ""` se publicar na raiz. O `basePath` é definido no build: inclua-o também nos caminhos de imagens e assets de `public/` usados pelo app. `next build` gera `out/`. Export estático não tem servidor por requisição e não suporta o fluxo de nonce da seção CSP.

**React Router v7 / Remix** (Vite): configure `@tailwindcss/vite` junto do plugin do framework. No React Router v7, o `vite.config.ts` fica assim:

```ts
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
});
```

Em `app/app.css`, **substitua todo o CSS do template** pelas linhas do kit e da fonte (passo 3): remova `@theme` com Inter, `html, body`, `dark:bg-gray-950` e regras de modo escuro. Em `app/root.tsx`, retire os links/preconnects do Google Fonts, importe `./app.css`, use `<html lang="pt-BR">` e envolva `<Outlet />` com os `Providers` do passo 4, uma vez no root. O `@source` em `app/app.css` é `"../node_modules/@semec/ds/dist/react"`. No Remix com Vite, mantenha o plugin e os imports do Remix; aplique a mesma limpeza do CSS, fonte, idioma e providers. O exemplo completo de root com SSR está em [Segurança (CSP)](#segurança-csp).

**Parcel 2:** instale `tailwindcss` e `@tailwindcss/postcss` como dependências de desenvolvimento. Crie `.postcssrc`:

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

Acrescente ao `package.json` do app (mescle com os campos existentes):

```json
{ "@parcel/resolver-default": { "packageExports": true } }
```

Isso habilita a [resolução de `exports` do Parcel](https://parceljs.org/features/dependency-resolution/#package-exports); sem ela, `@semec/ds/react` não resolve. Importe o CSS global em `src/main.tsx` e use as mesmas linhas e caminho de `@source` do Vite.

**As linhas do kit**, no arquivo CSS global (`src/index.css` no Vite, `app/globals.css` no Next), não via `import` em JS:

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@import "@semec/ds/react/source.css";
```

- O `source.css` é **obrigatório**: contém `@source "./components/**/*.js"` relativo ao próprio pacote. Assim o Tailwind gera as classes dos componentes (`bg-card`, `shadow-elevation-*`, `animate-in`…) sem depender da posição do CSS do app. Varre somente JS, sem incluir mapas ou declarações de tipos.
- Use o mesmo import com npm, workspaces/monorepo, Astro e Yarn 4 PnP. O pacote declara `preferUnplugged: true`, para o Yarn extrair os arquivos que o scanner precisa ler. Não é necessário calcular um caminho com hash nem executar `yarn unplug` manualmente.
- **Alternativa manual**, substituindo o import de `source.css`: o caminho do `@source` é relativo ao arquivo CSS, não à raiz do projeto:

| Onde está o CSS | `@source` |
|---|---|
| `src/index.css` (Vite) | `"../node_modules/@semec/ds/dist/react/components/**/*.js"` |
| `app/globals.css` (Next) | `"../node_modules/@semec/ds/dist/react/components/**/*.js"` |
| `src/app/globals.css` (Next com `src/`) | `"../../node_modules/@semec/ds/dist/react/components/**/*.js"` |
| `apps/web/src/index.css`, `node_modules` na raiz do monorepo | `"../../../node_modules/@semec/ds/dist/react/components/**/*.js"` |
| `src/styles/global.css` (Astro) | `"../../node_modules/@semec/ds/dist/react/components/**/*.js"` |
| Yarn 4 PnP | prefira o import de `source.css`; o caminho físico fica em `.yarn/unplugged` e contém um hash variável |

Se o CSS minificado de um app mínimo tiver **~14 kB em vez de ~70 kB**, confira se o `source.css` foi importado ou se o `@source` manual encontra o pacote: um caminho inexistente pode falhar sem aviso. O tamanho exato depende das versões e das classes do app.

- Se o Tailwind estiver varrendo pastas demais (build lento, recarga cruzada em monorepo), limite a detecção automática ao código do app com `source()`, também relativo ao CSS: `@import "tailwindcss" source("../src");`. O `@source` do pacote continua necessário.

Alternativa com preset JS (opcional): acrescente `@config "@semec/ds/react/pv-preset";` depois das linhas acima.

### 3. Fonte Poppins

O pacote traz a Poppins auto-hospedada (pesos 400, 500, 600 e 700, `font-display: swap`, subconjunto latino que cobre o PT-BR; licença SIL OFL 1.1 em `dist/react/fonts/OFL.txt`). Não existem 800/900 no sistema. Importe `fonts.css` **antes** do `tokens.css`, no mesmo CSS global:

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@import "@semec/ds/react/source.css";
```

O `@font-face` usa a família `"Poppins"`, que é o nome que `--font-family-sans` já espera; não é preciso ajustar token. As URLs são relativas (`./fonts/Poppins-*.woff2`): `@tailwindcss/postcss` (Next.js) e `@tailwindcss/vite` reescrevem o caminho e o bundler copia os arquivos para o build. Com o `@tailwindcss/cli`, copie as fontes para junto do CSS gerado (por exemplo, `public/app.css`):

```bash
npx semec-ds copiar-fontes public
```

O comando cria o destino e copia `fonts.css` + `fonts/` (quatro pesos e licença OFL), substituindo arquivos de mesmo nome e preservando os demais. Funciona também para PHP, Flask e HTML estático: carregue `<link rel="stylesheet" href="/fonts.css">` ou coloque `fonts/` ao lado do CSS que incorporou os `@font-face`. Destinos com espaços devem ser passados entre aspas.

Sem carregar a fonte, o texto cai no `system-ui` (Segoe UI no Windows) e o layout varia entre máquinas. Quem já usa `next/font/local` pode continuar: aponte o token para a variável gerada (`:root { --font-family-sans: var(--font-poppins), system-ui, -apple-system, sans-serif; }`, depois do `tokens.css`) e não importe `fonts.css`. Evite Google Fonts em sistemas da Prefeitura (rede externa).

### 4. Providers no root (quando necessários)

| Se usar… | Coloque uma vez no root |
|---|---|
| `useToast()` / `toast()` | `<Toaster />` |
| `Tooltip` | `<TooltipProvider>` em volta do app (o Radix exige o provider) |
| CSP estrita com nonce | `<SemecProvider nonce={nonce}>` (ver [Segurança](#segurança-csp)) |

O `SemecProvider` **não** inclui `Toaster` nem `TooltipProvider`; monte-os à parte.

```tsx
import { Toaster } from "@semec/ds/react/toast";
import { TooltipProvider } from "@semec/ds/react/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
```

### 5. Next.js App Router: Server Components e `"use client"`

A partir da 3.2 o `dist` sai **um arquivo por módulo**, e cada componente interativo (estado, efeitos, contexto, Radix ou handlers) começa com `"use client"`. Por isso:

- **pode importar `@semec/ds/react` num Server Component.** Os componentes de apresentação (`Heading`, `Card`, `Badge`, `Button`, `Link`, `Table`, `Alert`, `Skeleton`, `Spinner`, `Separator`, `Breadcrumb`, `EmptyState`, `Footer`, `Timeline`, `IconButton`) renderizam no servidor; os interativos viram fronteira de cliente sozinhos;
- props de função (`onClick`, `onValueChange`, `onOpenChange`…) continuam exigindo um arquivo `"use client"` seu, como em qualquer componente de cliente;
- os providers do passo 4 já são de cliente e podem ir direto no `layout`;
- não use `export *` para reexportar o kit num arquivo `"use client"` (o Next não aceita); reexporte por nome ou importe direto.
- **peso no cliente:** desde a 4.2.1 o barrel `@semec/ds/react` reexporta por nome, e no Turbopack (padrão do Next 16) importar pela raiz num Server Component leva ao cliente só os componentes interativos usados, como o subpath. No 4.2.0 e anteriores, a raiz num Server Component levava o kit inteiro (~77 kB gzip a mais): importe por subpath (`@semec/ds/react/navigation-menu`). Com `next build --webpack`, ligue `experimental.optimizePackageImports: ["@semec/ds/react"]` no `next.config` ou use o subpath.

Na 3.0 e na 3.1 o `dist` era um bundle único sem `"use client"` e importar o kit num Server Component quebrava; se estiver preso a essas versões, use o kit só em arquivos `"use client"`.

Em Vite/SPA nada disso se aplica.

## Sem Tailwind

Instale `@semec/ds` e `lucide-react` no app React 19. Importe uma vez, no ponto de entrada do app (ou no layout raiz do Next):

```tsx
import "@semec/ds/react/fonts.css";
import "@semec/ds/react/styles.css";
```

`styles.css` já inclui os tokens, o reset global do Tailwind v4 e as classes usadas pelos componentes publicados, minificados. Não precisa de plugin Tailwind, `@source` nem de importar `tokens.css` à parte. Os componentes e providers são os mesmos do caminho oficial.

As classes de layout do **app** ficam por conta do app: use CSS próprio ou seu compilador de estilos. Classes passadas em `className` que não aparecem no kit não são incluídas nesse arquivo. Escolha entre este CSS pronto e a compilação Tailwind v4 para evitar duplicar reset e utilitários. O CSS pronto mantém os [requisitos de navegador do Tailwind v4](https://tailwindcss.com/docs/compatibility) (Safari 16.4+, Chrome 111+, Firefox 128+); não é um modo de compatibilidade com navegadores antigos.

## Tailwind v3

**Tailwind v3 não é suportado oficialmente.** Para projetos que permanecem na v3, prefira [o CSS pronto](#sem-tailwind) para os componentes e mantenha o CSS do app separado. Evite aplicar outro reset global sobre o kit.

O preset `@semec/ds/react/pv-preset` existe para quem quiser adaptar a integração. Ele inclui as 45 cores semânticas e as seis animações/keyframes do `@theme`, inclusive fundos de Select/Dialog e cores de Sidebar. Exemplo de configuração ESM:

```js
// tailwind.config.mjs — caminho relativo à raiz deste app
import pvPreset from "@semec/ds/react/pv-preset";

export default {
  presets: [pvPreset],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./node_modules/@semec/ds/dist/react/components/*.js"],
};
```

Esse caminho ainda precisa de `fonts.css` e das variáveis de `tokens.css`. A v3 não processa `@theme`/`@utility`: pode emitir avisos e não gera todos os modificadores de animação (`fade-*`, `zoom-*`, `slide-*`) nem todas as classes v4 do kit. Completar o preset não garante paridade visual ou suporte a navegadores antigos. O peer opcional `tailwindcss` continua na faixa `^4`: uma instalação com v3 pode exigir a política de resolução de peers do seu gerenciador (no npm, `--legacy-peer-deps`, que ignora a validação de todos os peers). Não use essa opção no caminho oficial v4 ou sem Tailwind.

## CSS sem Tailwind / lite

Para adotar apenas as variáveis em um sistema existente, use
`@semec/ds/lite/variables.css` (ou `@semec/ds/react/variables.css`). Esse arquivo
contém somente `:root`: não altera margens, links, fontes ou o fundo da página,
nem contém diretivas do Tailwind. Em um bundler sem Tailwind, pode importar pelo JS:

```js
import "@semec/ds/lite/variables.css";
// Opcionais: Poppins e estilos globais do kit.
import "@semec/ds/lite/fonts.css";
import "@semec/ds/lite/base.css";
```

`base.css` contém reset, tipografia, links, foco visível e reduced motion; depende
das variáveis e sua adoção deve ser explícita. Em HTML sem bundler, copie
`dist/react/variables.css` e, se desejado, `dist/react/base.css` para a pasta
estática e carregue-os via `<link>` nessa ordem. Para as fontes, use `copiar-fontes`.
O `tokens.css` existente continua agregando variáveis, Tailwind e estilos globais;
quem já o importa não precisa adicionar `variables.css` nem `base.css`.

Para consumo exclusivo de CSS/lite com npm 7+:

```bash
npm install @semec/ds --omit=peer
```

Isso evita instalar os peers ausentes (`react`, `react-dom`, `lucide-react` e
`tailwindcss`) nesse comando. As dependências diretas, incluindo Radix, continuam
no pacote; `--omit=peer` não transforma a lite em um pacote separado. Repita a
opção no `npm ci`/`npm install` seguinte se quiser manter essa instalação. Se usar
Tailwind na lite, instale-o explicitamente com o plugin do bundler. Os peers do
kit permanecem obrigatórios para preservar a instalação automática em apps React;
use a instalação normal do passo 1 quando consumir componentes.

## CommonJS / Node

O pacote publica **somente ESM**. No Node 22.12+ e 24, `require()` pode carregar
esse ESM síncrono pela condição `default` dos subpaths, compartilhando os mesmos
módulos de `import` (sem uma segunda cópia de contextos ou estado):

```js
const { Button } = require("@semec/ds/react/button");
const { createElement } = require("react");
const { renderToString } = require("react-dom/server");
console.log(renderToString(createElement(Button, null, "Salvar")));
```

Isso não oferece um build CJS para runtimes antigos. No TypeScript, prefira
`moduleResolution: "bundler"` no bundler ou `module`/`moduleResolution: "nodenext"`
no Node (TS 5.9). `node16` em projeto CommonJS ainda pode emitir TS1479; nesse caso
use `nodenext` ou converta o projeto para ESM com `"type": "module"`.

## Testes com Jest

O Jest 29 usa seu próprio carregador: precisa transformar o ESM do kit mesmo
quando o Node aceita `require(esm)`. Configuração mínima com Babel e jsdom:

```bash
npm install -D jest@29 babel-jest@29 jest-environment-jsdom@29 @babel/core@7 @babel/preset-env@7 @babel/preset-react@7
```

```js
// jest.config.cjs
module.exports = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  transformIgnorePatterns: ["/node_modules/(?!@semec/ds/)"],
};
```

```js
// babel.config.cjs
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
```

Esta receita cobre JavaScript/JSX com npm e `node_modules` convencional. Não
adicione a condição global `import` em `customExportConditions`: ela também muda
a resolução das dependências do Jest. Os subpaths do kit resolvem sem
`moduleNameMapper`; configure mocks de CSS separadamente se o teste importar CSS.

## Uso rápido

```tsx
"use client"; // no Next App Router, só se este arquivo passar handlers ou usar hooks

import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label } from "@semec/ds/react";

export function Exemplo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulário</CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" />
        <Button variant="primary">Salvar</Button>
      </CardContent>
    </Card>
  );
}
```

### Toast

```tsx
import { Button, Toaster, useToast } from "@semec/ds/react";

// Adicionar Toaster no root do app (uma vez)
function App() {
  return (
    <>
      <MinhaPagina />
      <Toaster />
    </>
  );
}

// Usar em qualquer componente
function MeuComponente() {
  const { toast } = useToast();

  return (
    <Button onClick={() => toast({ title: "Salvo!", description: "Dados gravados." })}>
      Salvar
    </Button>
  );
}
```

Não monte `ToastProvider` + `ToastViewport` à mão: eles são as peças cruas do Radix e não leem o estado de `useToast()` — nada aparece. Use `<Toaster />`.

### Sheet (modal lateral)

```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@semec/ds/react";

function Exemplo() {
  return (
    <Sheet>
      <SheetTrigger>Abrir</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Título</SheetTitle>
        </SheetHeader>
        <p>Conteúdo do sheet.</p>
      </SheetContent>
    </Sheet>
  );
}
```

### `cn()`

```tsx
import { cn } from "@semec/ds/react";

<div className={cn("p-4 bg-surface", ativo && "ring-2 ring-ring")} />
```

`cn` = `clsx` + `tailwind-merge`, o mesmo helper usado dentro dos componentes (exportado a partir da 3.1.0).

## Subpath exports

| Import | O que é |
|---|---|
| `@semec/ds/react` | Todos os componentes, `cn()`, masks e validadores puros (`digits` está depreciado e sai na 5.0) |
| `@semec/ds/react/<componente>` | Um componente só, pelo nome do arquivo em `src/components` (ex.: `@semec/ds/react/button`, `@semec/ds/react/dialog`, `@semec/ds/react/form-field`). Desde a 3.2 |
| `@semec/ds/react/validacao` | Schemas Zod (exige o peer `zod`) |
| `@semec/ds/react/tokens.css` | Tokens `pv-*` (primitivos + semânticos) + utilitários de animação |
| `@semec/ds/react/source.css` / `@semec/ds/lite/source.css` | Fontes de classes dos componentes para o scanner Tailwind v4 |
| `@semec/ds/react/variables.css` / `@semec/ds/lite/variables.css` | Somente variáveis `:root`, sem reset nem Tailwind |
| `@semec/ds/react/base.css` / `@semec/ds/lite/base.css` | Estilos globais opcionais, dependem das variáveis |
| `@semec/ds/react/styles.css` | CSS pronto minificado: tokens, reset e classes dos componentes, sem compilador Tailwind no app |
| `@semec/ds/react/pv-preset` | Preset Tailwind v4 (JS config) |
| `@semec/ds/react/pv-preset.ts` | Preset Tailwind v4 (arquivo TS original) |
| `@semec/ds/react/server` | **Depreciado na 4.1, sai na 5.0** (TST-34b). Uso interno do monorepo: só tem `dsPackageRootResolve()`, que procura `packages/react` a partir do `cwd` e lança erro fora do repositório. Em desenvolvimento, avisa no console. Não use em apps consumidores |
| `@semec/ds/skills` | Metadados dos componentes para agentes IA (`dsComponents`, `dsBySlug`, `dsCategories`…) |
| `@semec/ds/skills/llms.txt` | Índice para IA |
| `@semec/ds/skills/llms-full.txt` | Dump completo |
| `@semec/ds/skills/manifest.json` | JSON para consumo por máquinas |
| `@semec/ds/skills/components/*.md` | Chunk RAG por componente |
| `@semec/ds/skills/semec-ds` | Skill full do agente |
| `@semec/ds/lite/skills/semec-ds-lite` | Skill lite (tokens + a11y + responsive) |

**Poda (tree-shaking).** Desde a 3.2 cada componente é um módulo ESM próprio em `dist/react/components/` e o pacote declara `"sideEffects": ["**/*.css"]`, então o bundler do app descarta o que não é importado: `import { Button } from "@semec/ds/react"` custa cerca de 35 kB minificado com as dependências (quase tudo `tailwind-merge`); o código do kit fica em ~3 kB, em vez do kit inteiro (~340 kB na 3.1). Importar pela raiz ou pelo subpath dá o mesmo resultado num bundler com poda (esbuild, Vite, Turbopack); o subpath ajuda ferramentas sem poda e testes. Exceção: Server Component do Next com webpack (`next build --webpack`), em que a raiz leva ao cliente todos os componentes interativos; ali use o subpath ou `experimental.optimizePackageImports: ["@semec/ds/react"]` (ver o passo 5). A CI mede a poda e confere que o barrel reexporta por nome (`npm run test:dist`).

**O CSS não sofre poda por import JS.** O `source.css` faz o Tailwind varrer o JS de todos os componentes, então o CSS gera suas classes, use o app um ou todos: cerca de 70 kB de CSS minificado (~12 kB com gzip). O JS cai para o que é importado (os ~35 kB do `Button` acima).

Metadados de componente (o que versões anteriores deste README chamavam de `getComponentMetadata()`, função que nunca existiu) vêm de `@semec/ds/skills`: `dsBySlug["botoes"]`, `dsComponents`.

Para abrir os artefatos no disco após instalar, use `node_modules/@semec/ds/dist/skills/semec-ds/SKILL.md` (skill completa) e `node_modules/@semec/ds/dist/skills/components/<slug>.md` (por exemplo, `botoes.md`). São arquivos Markdown, não módulos JS. Os caminhos de `exports` da tabela são aliases do pacote, não pastas físicas.

## Componentes

<!-- ds:component-list:start -->
**55 componentes** no manifest (`manifest.js`), pelo export principal de cada um. Lista e contagem geradas por `scripts/build-artifacts.mjs`; não edite à mão.

| Categoria | Componentes |
|---|---|
| **Ações e links** (3) | Button, IconButton, Link |
| **Formulários** (18) | Input, PasswordInput, InputMask, Textarea, Select, Combobox, DatePicker, FileUpload, Checkbox, RadioGroup, Switch, Label, FormField, ErrorSummary, Toggle, Slider, InputOTP, Calendar |
| **Conteúdo e dados** (9) | Card, Heading, Badge, Table, Accordion, Separator, Avatar, DataTable, Timeline |
| **Navegação** (12) | Breadcrumb, Header, Stepper, SkipLink, Footer, Tabs, Pagination, SidebarToggleButton, ScrollArea, DropdownMenu, NavigationMenu, Sidebar |
| **Feedback e estados** (13) | Skeleton, EmptyState, ErrorState, Dialog, Toaster, Tooltip, Alert, AlertDialog, Popover, Spinner, Progress, Drawer, Sheet |
<!-- ds:component-list:end -->

Mais: `SemecProvider`, `cn`, masks (`maskCPF`, `maskCNPJ`, `maskCEP`, `maskCurrency`) e validadores puros (`validateCPF`, `validateCNPJ`, `validateEmail`).

As masks têm a assinatura `(value: string) => string` (tipo `MaskFn`): recebem o texto digitado e devolvem o formatado, para usar no `onValueChange` do `Input`. `maskCurrency` lê os dígitos como centavos (`"123456"` → `"R$ 1.234,56"`, com espaço não separável depois de `R$`) e, desde a 4.1.0, devolve `""` quando não há dígitos significativos (vazio, sem dígitos ou só zeros; antes, `"R$ 0,00"`).

## Tokens

O que existe no pacote está em `tokens.css` (camadas L0 `--pv-*` e L1 semânticas). No Tailwind v4, o `@theme inline` expõe os tokens como utilitários:

| Token | Utilitário | Observação |
|---|---|---|
| `--space-0` … `--space-16` | `p-space-4`, `gap-space-2`, `mt-space-12`… | Dialeto do sistema. `p-4` dá o mesmo valor, mas só os nove degraus (0, 1, 2, 3, 4, 6, 8, 12, 16) fazem parte da escala |
| `--text-xs` … `--text-2xl`, `--text-3xl` (32px), `--text-display` (40px) | `text-xs` … `text-3xl`, `text-display` | Tamanho **e** entrelinha do degrau (`--leading-*`); `leading-*` sobrescreve |
| `--font-regular` … `--font-bold` | `font-regular`, `font-medium`, `font-semibold`, `font-bold` | 400–700 |
| `--text-muted`, `--text-secondary`, `--text-strong` | `text-text-muted`, `text-text-secondary`, `text-text-strong` | `text-muted`/`text-secondary` não são gerados pelo CSS v4, para evitar texto com cor de fundo (1,09:1). `bg-muted`/`bg-secondary` seguem valendo, inclusive com opacidade |
| `--surface-sunken` | `bg-surface-sunken` | Skeleton, trilha de Progress/Slider (1,47:1 sobre `--surface`) |
| `--focus-ring-inverse` | `ring-ring-inverse` | Automático dentro de `data-surface="brand"` ou `bg-brand-hero` (9,38:1); `data-surface="default"` volta ao anel padrão |
| `--text-brand` | `text-text-brand` | Título institucional escuro (12,43:1). Novo na 4.0 |
| `--feedback-success-emphasis`, `--text-on-success-emphasis` | `bg-success-emphasis`, `text-success-emphasis-foreground` | Verde cheio do Toast `success` (texto 5,85:1). Novo na 4.0 |

Primitivos `--pv-*` não geram utilitário desde a 4.0 (não há `bg-pv-*`).

Link solto no texto (`<a>` sem `class`) é sublinhado pelo `tokens.css`; com classe, o sublinhado é do componente/utilitário (`underline`). Tokens de layout que aparecem no site de documentação (`--container-max`, `--measure`, `--control-height-*`, `data-density`) **não fazem parte do pacote**; use os utilitários do Tailwind indicados na skill `semec-ds` (seção "Responsive / Mobile").

### Tokens como dados (sem React)

O build gera `dist/tokens/tokens.json`, `tokens.js` e `tokens.d.ts` a partir do `:root` de `tokens.css`, que continua sendo a fonte de verdade. Os exports públicos são:

```js
import dtcg from "@semec/ds/tokens.json" with { type: "json" };
import { tokens } from "@semec/ds/tokens";
import { dsTokens } from "@semec/ds/lite/skills";

const primary = tokens["action-primary"]; // valor CSS resolvido, sem var()
const reference = dtcg.L1["action-primary"].$value; // {L0.pv-blue-600}
const samePrimary = dsTokens.values["--action-primary"];
const semanticNames = dsTokens.semantic; // todos os L1, incluindo pv-text/radius/leading/duration
```

O JSON segue [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/), com grupos `L0`/`L1` e referências por caminho completo (`{L0.pv-blue-600}`). Cores usam sRGB; dimensões e durações têm valor e unidade; fontes, pesos, entrelinhas, curvas e sombras têm tipos próprios. Cada token preserva o CSS original em `$extensions["br.gov.portovelho.semec"].css` e o valor CSS resolvido em `.resolved`. O auxiliar `pv-gray-900-rgb` é uma cor sRGB no DTCG e mantém os canais no valor CSS; `elevation-0` é uma sombra transparente de dimensão zero (CSS `none`).

- **Figma / Tokens Studio:** use `dist/tokens/tokens.json` como entrada de uma ferramenta ou integração compatível com DTCG 2025.10, mantendo os grupos e as referências. Versões que usam o formato legado precisam de conversão antes da importação.
- **Mobile:** transforme as cores sRGB, dimensões (`px`/`rem`) e demais valores tipados para os recursos da plataforma. A conversão para Android/iOS e a escolha da base de `rem` ficam com o consumidor; o pacote ainda não gera XML ou Swift.
- **Back-end, PDF e e-mail:** importe `tokens` em Node ou leia o JSON com a linguagem do serviço. Os valores em `tokens` e `dsTokens.values` são strings CSS resolvidas; não precisam de DOM, React ou Tailwind em execução.

O catálogo lite mantém as listas `colors`, `semantic`, `typography`, `spacing`, `radii` e `elevation`, agora geradas e completas, e acrescenta `motion` e `values`. `colors` enumera nomes concretos em vez de padrões com `*`.

No CSS v4, `rounded-xs`, `rounded-xl`, `rounded-2xl` e os demais raios nomeados fora da escala deixam de ser gerados. Use `rounded-sm` (2px), `rounded-md` (8px), `rounded-lg` (12px) ou `rounded-full`. `text-fg` e `bg-bg` são apelidos de `text-foreground` e `bg-background`. Não foi adicionado `--color-action-primary`: esse nome já pertence ao tema próprio do site de documentação; para a ação do kit, use `bg-primary`.

## Tema

Os tokens do pacote (`tokens.css`) são tema **claro**. Não há `shadcn.css` no pacote (removido na 2.0.0).

### Via CDN

CDNs servem os arquivos físicos do pacote, não os aliases de `exports`: no jsDelivr, `/react/tokens.css` dá 404. Para HTML sem bundler, use `/dist/react/…`, versão fixa e SRI. Este exemplo usa os arquivos publicados da **4.2.0**, com hashes SHA-384 calculados desses URLs (não inclui correções posteriores):

```html
<link rel="stylesheet" crossorigin="anonymous"
  href="https://cdn.jsdelivr.net/npm/@semec/ds@4.2.0/dist/react/fonts.css"
  integrity="sha384-coHk15sImpWgFqHojyN0dEPSRz68H46mEHmXdN7WXJbJhGuTfZUottZYt30RGkgk">
<link rel="stylesheet" crossorigin="anonymous"
  href="https://cdn.jsdelivr.net/npm/@semec/ds@4.2.0/dist/react/tokens.css"
  integrity="sha384-TlzewAcAUnI8BjIUgRHt1S+sCjOPnYiKyLyv4we2JRsPU4R0ryKWcvsU5rUppu6q">
```

Ao atualizar a versão, recalcule o SRI a partir dos arquivos publicados e teste o carregamento; não reutilize os hashes acima com outro URL. As fontes são buscadas em `dist/react/fonts/`, relativamente ao `fonts.css`. Se houver CSP, autorize `https://cdn.jsdelivr.net` em `style-src` e `font-src`. O SRI valida o CSS do link, não os arquivos de fonte referenciados. Esse uso entrega variáveis CSS e fonte; não gera utilitários Tailwind nem fornece componentes React prontos para `<script>`. O caminho físico é para HTTP/CDN; nos imports do bundler continue usando os subpaths da tabela.

## Validação (Zod)

Schemas Zod ficam no entry **`@semec/ds/react/validacao`** — o entry principal não importa `zod`. O `zod` é peer opcional, `^3.23.0 || ^4.0.0` (o kit é testado com o 3 e o 4): instale-o (`npm install zod`) só se usar esse entry.

A receita de formulário da skill `semec-ds` (React Hook Form + Zod + `FormField` + `ErrorSummary`) usa também `react-hook-form` e `@hookform/resolvers`, que não vêm com o kit (opcionais, só para a receita):

```bash
npm install react-hook-form @hookform/resolvers@^5 zod@^4
```

Essa combinação foi validada; o resolvers 6.0.0 causa `ERESOLVE` no npm 11 pelo conflito do peer opcional `effect@^4` com `effect@3` (integração de 19/10/2026).

```ts
import { cpfSchema, emailSchema } from "@semec/ds/react/validacao";
import { validateCPF } from "@semec/ds/react"; // helpers puros, sem zod
```

### React Hook Form: controles compostos

Use `Controller` para ligar os valores do RHF aos controles. `Select` e `RadioGroup` recebem `value`/`onValueChange`; `Checkbox` recebe `checked`/`onCheckedChange`; `FileUpload` recebe `File[]` em `value`/`onValueChange`. Não espalhe `field` nesses controles: `onChange` não é o callback de valor deles.

```tsx
"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@semec/ds/react/button";
import { Checkbox } from "@semec/ds/react/checkbox";
import { ErrorSummary } from "@semec/ds/react/error-summary";
import { FileUpload } from "@semec/ds/react/file-upload";
import { FormField } from "@semec/ds/react/form-field";
import { Label } from "@semec/ds/react/label";
import { RadioGroup, RadioGroupItem } from "@semec/ds/react/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@semec/ds/react/select";

const schema = z.object({
  city: z.string().min(1, "Escolha o município."),
  shift: z.string().min(1, "Escolha o turno."),
  accepted: z.boolean().refine(Boolean, "Confirme as informações."),
  files: z.array(z.custom<File>()).min(1, "Anexe um documento."),
});
type FormValues = z.infer<typeof schema>;
const initialValues: FormValues = { city: "", shift: "", accepted: false, files: [] };
const fieldOrder = ["city", "shift", "accepted", "files"] as const;

export function RequestForm() {
  const [attempt, setAttempt] = useState(0);
  const { control, handleSubmit, reset, clearErrors, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    shouldFocusError: false, // o ErrorSummary recebe o foco no envio inválido
  });
  const summary = fieldOrder.flatMap((id) => {
    const message = errors[id]?.message;
    return message ? [{ id, message }] : [];
  });

  function clearForm() {
    reset(initialValues, { keepErrors: false });
    setTimeout(() => clearErrors(), 0);
  }

  return (
    <form noValidate onSubmit={handleSubmit(
      () => clearForm(), // no app, salve os dados e só limpe após sucesso
      () => setAttempt((value) => value + 1),
    )} className="grid gap-4">
      <ErrorSummary errors={summary} focusKey={attempt} />
      <Controller name="city" control={control} render={({ field }) => (
        <FormField label="Município" htmlFor="city" error={errors.city?.message} required>
          <Select name={field.name} value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id="city" ref={field.ref} onBlur={field.onBlur}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent><SelectItem value="porto-velho">Porto Velho</SelectItem></SelectContent>
          </Select>
        </FormField>
      )} />
      <Controller name="shift" control={control} render={({ field }) => (
        <FormField label="Turno" htmlFor="shift" error={errors.shift?.message} required>
          <RadioGroup id="shift" name={field.name} value={field.value}
            onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
            <div className="flex min-h-11 items-center gap-2">
              <RadioGroupItem id="shift-morning" value="morning" />
              <Label htmlFor="shift-morning">Manhã</Label>
            </div>
            <div className="flex min-h-11 items-center gap-2">
              <RadioGroupItem id="shift-afternoon" value="afternoon" />
              <Label htmlFor="shift-afternoon">Tarde</Label>
            </div>
          </RadioGroup>
        </FormField>
      )} />
      <Controller name="accepted" control={control} render={({ field }) => (
        <FormField error={errors.accepted?.message}>
          <div className="flex min-h-11 items-center gap-2">
            <Checkbox id="accepted" name={field.name} checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur} ref={field.ref} />
            <Label htmlFor="accepted">Confirmo as informações (obrigatório)</Label>
          </div>
        </FormField>
      )} />
      <Controller name="files" control={control} render={({ field }) => (
        <FormField label="Documento" htmlFor="files" error={errors.files?.message} required>
          <FileUpload id="files" name={field.name} value={field.value}
            onValueChange={field.onChange} inputProps={{ onBlur: field.onBlur }} />
        </FormField>
      )} />
      <Button type="submit">Enviar</Button>
      <Button type="button" variant="outline" onClick={clearForm}>Limpar</Button>
    </form>
  );
}
```

Os IDs do resumo são os controles: `city` fica no **SelectTrigger**, `shift` no **RadioGroup** (o resumo foca a opção dentro dele), `accepted` no Checkbox e `files` no input nativo do FileUpload. Cada RadioGroupItem tem um ID próprio para seu Label. As linhas de opção têm altura mínima de 44 px.

**Depois de `reset()`:** o reset nativo pode disparar callbacks do Select/RadioGroup/Checkbox e fazer o RHF revalidar os valores vazios (INT-D-04). Defina `defaultValues`, passe os valores iniciais ao `reset` e chame `clearErrors()` no próximo ciclo, como acima; confira envio inválido → preenchimento → envio válido → formulário limpo no navegador. Esse contorno limpa as mensagens, não muda o schema nem torna valores vazios válidos. Arquivos também precisam de validação no servidor.

## Segurança (CSP)

### SSR e limites do nonce

O nonce autoriza elementos `<script>`/`<style>` que carregam o mesmo valor da política. **Não autoriza atributos `style`**: no HTML gerado por SSR, eles são controlados por `style-src-attr` (ou por `style-src` quando aquela diretiva está ausente). Portanto, passar `nonce` ao `SemecProvider` não garante ausência de violações nem corrige atributos bloqueados antes da hidratação.

Com as correções CSP da 4.2.1 (onda 0 da integração de 19/10/2026):

| Componente | Resultado com SSR e política estrita |
|---|---|
| Toast / Toaster | Classes estáticas liberam cliques sob a região vazia e preservam ações e fechamento do aviso (INT-B2-01) |
| Checkbox, Switch, RadioGroup, Slider | CSS estático esconde os inputs nativos auxiliares mesmo com os atributos inline bloqueados (INT-B2-02) |
| Progress / Slider | O preenchimento usa SVG e permanece visível no SSR sob CSP estrita |
| Select | O `<style>` do viewport recebe o nonce do SemecProvider; `SelectContent nonce` explícito prevalece (INT-B2-08). Atributos inline ainda podem ser bloqueados |
| ScrollArea | O `<style>` do viewport recebe o nonce, inclusive no SSR; precedência: `viewportProps.nonce` → `nonce` → SemecProvider |
| Dialog, AlertDialog, Drawer, Sheet, DropdownMenu | O bloqueio de rolagem usa `<style>` dinâmico: passe o nonce pelo `SemecProvider` |
| Popover | Zero violações na prova anterior, sem nonce; isso não é garantia para toda composição |

Essas correções preservam os cenários acima, mas os atributos `style` emitidos pelo Radix ainda podem gerar violações de `style-src-attr`. Valide a versão instalada em produção: carregue por SSR, clique num link sob a região de notificações, marque o Checkbox e abra o Select e o Dialog. Testar só SPA ou servidor de desenvolvimento não reproduz os bloqueios de atributos no HTML inicial. Não acrescente `'unsafe-inline'` para esconder esses achados; mantenha `style-src-attr 'none'` e verifique os componentes usados pelo seu app.

### Next.js App Router (servidor por requisição)

Gere um nonce aleatório novo por resposta. O [fluxo de CSP do Next](https://nextjs.org/docs/app/guides/content-security-policy) exige a política também no request interno para aplicar o nonce aos scripts do framework. Exemplo de produção:

```ts
// proxy.ts (ao lado de app/)
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const policy = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; style-src-attr 'none'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`;
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

```tsx
// app/layout.tsx
import { headers } from "next/headers";
import { SemecProvider } from "@semec/ds/react/semec-provider";
import { Providers } from "./providers"; // arquivo do passo 4
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR">
      <body>
        <SemecProvider nonce={nonce}>
          <Providers>{children}</Providers>
        </SemecProvider>
      </body>
    </html>
  );
}
```

Não combine esse layout com `output: "export"`: `headers()` exige uma requisição. Não compartilhe HTML com nonce por cache/CDN. O modo de desenvolvimento do Next precisa de permissões adicionais para depuração; valide a política de produção com `next build` e `next start`.

### React Router v7: nonce ponta a ponta

Exemplo de produção com SSR, Express e o contexto clássico `AppLoadContext` (sem `future.v8_middleware`). Instale `express@^5 @react-router/express@^7 @react-router/node@^7` com a mesma versão 7.x dos demais pacotes React Router. O nonce percorre `getLoadContext` → `loader` → `useRouteLoaderData` → provider; também chega ao renderizador e aos scripts, conforme a [documentação de segurança do React Router v7](https://reactrouter.com/7.18.4/how-to/security).

```js
// server.mjs — depois de npm run build, execute node server.mjs
import { randomBytes } from "node:crypto";
import express from "express";
import { createRequestHandler } from "@react-router/express";
import * as build from "./build/server/index.js";

const app = express();
app.use(express.static("build/client"));
app.use((request, response, next) => {
  const nonce = randomBytes(16).toString("base64");
  response.locals.nonce = nonce;
  response.setHeader("Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; style-src-attr 'none'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`);
  response.setHeader("Cache-Control", "private, no-store");
  next();
});
app.use(createRequestHandler({
  build,
  getLoadContext: (_request, response) => ({ nonce: response.locals.nonce }),
}));
app.listen(3000);
```

```tsx
// app/root.tsx
import {
  Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { SemecProvider } from "@semec/ds/react/semec-provider";
import { Providers } from "./providers"; // arquivo do passo 4
import "./app.css";

export function loader({ context }: LoaderFunctionArgs) {
  return { nonce: typeof context.nonce === "string" ? context.nonce : undefined };
}

// Este loader contém só o nonce do documento; preserve-o nas navegações.
export function shouldRevalidate() { return false; }

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useRouteLoaderData<typeof loader>("root")?.nonce;
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <SemecProvider nonce={nonce}>{children}</SemecProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return <Providers><Outlet /></Providers>;
}
```

No `app/entry.server.tsx`, use o mesmo `loadContext.nonce` também em `ServerRouter` e nas opções de streaming. Este entry completo espera todo o conteúdo antes de responder, para simplificar o exemplo:

```tsx
// app/entry.server.tsx
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, type AppLoadContext, type EntryContext } from "react-router";

export default function handleRequest(
  request: Request,
  status: number,
  headers: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
): Promise<Response> {
  const nonce = typeof loadContext.nonce === "string" ? loadContext.nonce : undefined;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => abort(), 10_000);
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} nonce={nonce} />,
      {
        nonce,
        onAllReady() {
          clearTimeout(timeout);
          const body = new PassThrough();
          headers.set("Content-Type", "text/html; charset=utf-8");
          resolve(new Response(createReadableStreamFromReadable(body), { status, headers }));
          pipe(body);
        },
        onShellError(error) {
          clearTimeout(timeout);
          reject(error);
        },
        onError(error) {
          status = 500;
          console.error(error);
        },
      },
    );
  });
}
```

Mantenha o nonce do documento durante as navegações no cliente: não revalide o loader do root só para obter outro nonce; a CSP em vigor é a da resposta HTML. Teste também navegação e revalidação se o root carregar outros dados. O fluxo acima demonstra o transporte do nonce; os limites de `style-src-attr` da tabela continuam valendo.

## Acessibilidade

Os componentes seguem o WCAG 2.1 AA (ADR-014): teclado, foco visível, contraste e nomes acessíveis já vêm prontos. O que o app monta em volta (rótulos, títulos, ordem da página) é responsabilidade dele; a skill `semec-ds` traz os padrões de tela.

**Teste de teclado no Safari:** com a configuração padrão do macOS, o `Tab` do Safari não para em links nem em botões (só em campos), então os links do `ErrorSummary`, o `SkipLink`, o `Breadcrumb`, o `Link` e os botões parecem "fora do Tab". Não é defeito do kit: ligue **Ajustes do Sistema › Teclado › Navegação por teclado** e, no Safari, **Ajustes › Avançado › Pressionar Tab para destacar cada item** (ou use `Option+Tab`). Mesmo sem isso o formulário continua utilizável, porque os campos do resumo de erros são alcançáveis direto pelo `Tab`.

### axe na CI do seu app

Com `Select`, `DropdownMenu` ou `NavigationMenu` **abertos**, o axe acusa `aria-hidden-focus` (serious). É a exceção aceita **EXC-01** ([docs/excecoes-acessibilidade.md](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/excecoes-acessibilidade.md#exc-01-aria-hidden-focus-com-select-ou-dropdownmenu-abertos-aud-19)), não um defeito do seu app:

- no `Select` e no `DropdownMenu`, o Radix chama `hideOthers` ao abrir e marca o resto da página (`#root`, por exemplo) com `aria-hidden="true"`, sem `inert`. O axe vê elementos focáveis dentro dessa árvore e acusa a regra. Mas, enquanto a camada está aberta, o foco fica preso nela (`Tab` não sai do listbox ou do menu, `Esc` fecha e devolve o foco ao gatilho), o `body` recebe `pointer-events: none` e, ao fechar, o `aria-hidden` sai. Ninguém alcança o que está escondido;
- no `NavigationMenu` a causa é outra: o sentinela de foco do Radix (`<span aria-hidden="true" tabindex="0">`), que repassa o foco na hora para o primeiro ou o último link do conteúdo e nunca fica com ele.

Configure o axe para não falhar por isso **sem** esconder outros problemas:

- desligue **só** a regra `aria-hidden-focus`, **só** na análise feita com uma dessas camadas aberta. As outras regras WCAG continuam valendo nesse estado;
- com a camada aberta, analise só as regras WCAG (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`). O `aria-hidden` do Radix esconde também o `main` e o `h1`, e as regras de *best practice* `landmark-one-main`, `page-has-heading-one` e `region` (moderate) disparam por isso. Elas valem na análise da tela fechada;
- rode a mesma tela também com a camada fechada e a regra ligada, e não desligue a regra em `Dialog`, `AlertDialog`, `Sheet` ou `Drawer` (eles não disparam);
- não use `exclude` para tirar o `#root` (ou a camada) da análise: isso tira do axe a página inteira, não só a regra;
- não "corrija" removendo o `aria-hidden` ou aplicando `inert` por fora: quebra o isolamento que o Radix garante.

Com `@axe-core/playwright`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("formulário sem violações do axe", async ({ page }) => {
  await page.goto("/requerimento");

  // Camadas fechadas: todas as regras, inclusive aria-hidden-focus e best practices.
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Select aberto: só regras WCAG, sem a aria-hidden-focus (EXC-01 do @semec/ds).
  await page.getByRole("combobox", { name: "Município" }).click();
  const aberto = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["aria-hidden-focus"])
    .analyze();
  expect(aberto.violations).toEqual([]);
});
```

Com `axe-core` direto (ou `jest-axe`/`vitest-axe`), o equivalente é passar `{ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, rules: { "aria-hidden-focus": { enabled: false } } }` só na chamada feita com a camada aberta. O próprio kit testa assim (`packages/react/test/open-states.test.tsx` e o gate em Chromium).

## Dependências

O pacote é **somente ESM**. Para TypeScript, use `moduleResolution: "bundler"` com `module: "ESNext"`, ou os pares `moduleResolution: "nodenext"` / `module: "NodeNext"` e `moduleResolution: "node16"` / `module: "Node16"`, com `"type": "module"` no `package.json` do consumidor. A resolução antiga `node`/`node10` não resolve os subpaths; `node16` em projeto CommonJS produz TS1479. Não há build CJS publicado.

- **Peers obrigatórios**: `react` ^19, `react-dom` ^19, `tailwindcss` ^4 e `lucide-react` `>=0.468.0 <2`. O npm 7+ instala peer ausente sozinho; o pnpm só com `auto-install-peers=true`; o Yarn (clássico e Berry) nunca. Por isso o passo 1 instala `lucide-react` explicitamente
- **Peer opcional**: `zod` `^3.23.0 || ^4.0.0` (testado com o 3 e o 4) — só se usar `@semec/ds/react/validacao`
- **Plugin do Tailwind** (do seu build, não do kit): `@tailwindcss/vite` no Vite; `@tailwindcss/postcss` ou `@tailwindcss/turbopack` no Next. O `@source` aponta para `node_modules/@semec/ds/dist/react`, com caminho relativo ao CSS
- **Dependências (vêm automaticamente)**: todos os `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `get-nonce`

## Limitações conhecidas

- **Windows: caminho longo no `next build`.** Com o projeto numa pasta funda, o Turbopack pode falhar com `exceeds max length of filesystem` em `.next/server/chunks/ssr` (limite de 260 caracteres do Windows). Não é do kit: mova o projeto para um caminho curto (ex.: `C:\dev\app`), habilite caminhos longos no Windows (`LongPathsEnabled`) ou use `next build --webpack`.
- **3.0 e 3.1: bundle único e sem fronteira RSC.** Importar uma peça carregava o kit inteiro e importar `@semec/ds/react` num Server Component quebrava. Corrigido na 3.2 (saída por módulo, `"use client"` por componente e subpaths `@semec/ds/react/*`; ver o passo 5 de [Comece aqui](#comece-aqui) e [Subpath exports](#subpath-exports)).

## Migração para a 4.0 e depreciações

**Guia: [docs/migracao-4.0.md](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md)**, com antes/depois, tabela primitivo → semântico e o codemod:

Quem vem da 3.0 ou 3.1 deve começar por [Vindo direto da 3.0 ou da 3.1](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md#vindo-direto-da-30-ou-da-31). O destino é o arquivo versionado em `docs/migracao-4.0.md`, disponível em `main` após o merge desta entrega.

```bash
# funciona com a 3.x ainda instalada (o -p traz a 4.0 e o TypeScript 5 só para o comando)
npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 src           # simulação: relata o que muda
npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 src --write   # grava as trocas onChange → onValueChange
```

O codemod lê o JSX com a API do compilador do TypeScript 5 (o 7 não a tem); o `typescript` não é dependência do pacote. Com a 4.0 e o `typescript@5` no projeto, basta `npx semec-ds codemod-4 src` ou `node node_modules/@semec/ds/codemods/v4.mjs src`. O que ele não vê (spread, `React.createElement`, barrel) o typecheck da 4.0 pega.

Removido na 4.0 (anunciado desde a 3.1.0, política de duas minors, ADR-013):

- `onChange(value)` / `onChange(files)` de `Combobox`, `InputOTP`, `FileUpload` e `Calendar`: use `onValueChange` (contrato `value` / `onValueChange` / `name` / `id` / `invalid`, ADR-015). O tipo recusa `onChange` e o componente o descarta (com `console.error` único em desenvolvimento).
- `DatePicker`: `onChange` passa a receber o **evento nativo** do `<input type="date">`; o valor ISO vem em `onValueChange`.
- Utilitários de primitivo `bg-pv-*` / `text-pv-*` / `border-pv-*` e as variáveis `--color-pv-*` (do `@theme` e do `pv-preset`): use os semânticos. As variáveis `--pv-*` continuam. Semânticos novos: `text-text-brand`, `bg-success-emphasis`, `text-success-emphasis-foreground`.
- Import por caminho de arquivo em `dist/`: o `exports` bloqueia (`ERR_PACKAGE_PATH_NOT_EXPORTED`); use `@semec/ds/react` ou `@semec/ds/react/<componente>`.

Depreciado, sai na 5.0: `ariaLabel` e `emptyMessage` do `Combobox`; `modal` do `AlertDialog` e `onPointerDownOutside`/`onInteractOutside` do `AlertDialogContent` (já ignorados); `digits` de `@semec/ds/react` e `@semec/ds/react/validacao` (use `valor.replace(/\D/g, "")`); o subpath `@semec/ds/react/server` (`dsPackageRootResolve`, uso interno do monorepo). Os dois últimos foram anunciados na 4.1 e avisam no console em desenvolvimento. Lista oficial: [CONTRIBUTING.md § Depreciações anunciadas](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/CONTRIBUTING.md#depreciações-anunciadas).

O que a 2.0.0 removeu sem aviso está na errata do [CHANGELOG](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/CHANGELOG.md).

## Documentação

- [Site de documentação](https://semec-pvh.github.io/SEMEC_design_system/)
- [Repositório](https://github.com/SEMEC-PVH/SEMEC_design_system)
- [Guia de contribuição](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/CONTRIBUTING.md)
- [ADRs](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/README.md)
- [Issues](https://github.com/SEMEC-PVH/SEMEC_design_system/issues)

## Licença e crédito

[MIT](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/LICENSE) — © 2026 Prefeitura de Porto Velho, Secretaria Municipal de Economia (SEMEC). Use, modifique e redistribua mantendo o aviso de copyright e a licença nas cópias do código do pacote.

O crédito no seu projeto **não é obrigatório**, mas é apreciado. Se quiser, inclua no README:

```markdown
## Créditos

Identidade visual e tokens fornecidos pelo
[SEMEC Design System](https://github.com/SEMEC-PVH/SEMEC_design_system),
desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de
Economia de Porto Velho (DevSemec).
```

A fonte Poppins (`@semec/ds/react/fonts.css`) tem licença própria, SIL OFL 1.1 (o `OFL.txt` acompanha os arquivos da fonte no pacote).
