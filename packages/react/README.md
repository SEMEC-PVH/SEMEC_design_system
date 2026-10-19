# @semec/ds

Design System SEMEC — componentes React + tokens CSS + artefatos para agentes de IA.

React 19 + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Tokens `pv-*` (tema claro).

## Comece aqui

São 5 passos para o caminho Tailwind v4. Para usar o CSS pronto, siga [Sem Tailwind](#sem-tailwind) e mantenha os providers do passo 4.

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

**As linhas do kit**, no arquivo CSS global (`src/index.css` no Vite, `app/globals.css` no Next), não via `import` em JS:

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

- O `@source` é **obrigatório**: sem ele o Tailwind não gera as classes usadas dentro do pacote (`bg-card`, `shadow-elevation-*`, `animate-in`…) e os componentes saem sem estilo.
- O caminho do `@source` é **relativo ao arquivo CSS**, não à raiz do projeto. Ajuste a quantidade de `../` até chegar em `node_modules`:

| Onde está o CSS | `@source` |
|---|---|
| `src/index.css` (Vite) | `"../node_modules/@semec/ds/dist/react"` |
| `app/globals.css` (Next) | `"../node_modules/@semec/ds/dist/react"` |
| `src/app/globals.css` (Next com `src/`) | `"../../node_modules/@semec/ds/dist/react"` |
| monorepo com `node_modules` na raiz | suba até a pasta que contém o `node_modules` com `@semec/ds` |

- Se o Tailwind estiver varrendo pastas demais (build lento, recarga cruzada em monorepo), limite a detecção automática ao código do app com `source()`, também relativo ao CSS: `@import "tailwindcss" source("../src");`. O `@source` do pacote continua necessário.

Alternativa com preset JS (opcional): acrescente `@config "@semec/ds/react/pv-preset";` depois das linhas acima.

### 3. Fonte Poppins

O pacote traz a Poppins auto-hospedada (pesos 400, 500, 600 e 700, `font-display: swap`, subconjunto latino que cobre o PT-BR; licença SIL OFL 1.1 em `dist/react/fonts/OFL.txt`). Não existem 800/900 no sistema. Importe `fonts.css` **antes** do `tokens.css`, no mesmo CSS global:

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

O `@font-face` usa a família `"Poppins"`, que é o nome que `--font-family-sans` já espera; não é preciso ajustar token. As URLs são relativas (`./fonts/Poppins-*.woff2`): `@tailwindcss/postcss` (Next.js) e `@tailwindcss/vite` reescrevem o caminho e o bundler copia os arquivos para o build. Com o `@tailwindcss/cli`, que não reescreve URL de CSS importado, importe `fonts.css` pelo JS (`import "@semec/ds/react/fonts.css";`) ou copie `dist/react/fonts/` para junto do CSS gerado.

Sem carregar a fonte, o texto cai no `system-ui` (Segoe UI no Windows) e o layout varia entre máquinas. Quem já usa `next/font/local` pode continuar: aponte o token para a variável gerada (`:root { --font-family-sans: var(--font-poppins), system-ui, -apple-system, sans-serif; }`, depois do `tokens.css`) e não importe `fonts.css`. Evite Google Fonts em sistemas da Prefeitura (rede externa).

### 4. Providers no root (quando necessários)

| Se usar… | Coloque uma vez no root |
|---|---|
| `useToast()` / `toast()` | `<Toaster />` |
| `Tooltip` | `<TooltipProvider>` em volta do app (o Radix exige o provider) |
| CSP estrita com nonce | `<SemecProvider nonce={nonce}>` (ver [Segurança](#segurança-csp)) |

O `SemecProvider` **não** inclui `Toaster` nem `TooltipProvider`; monte-os à parte.

```tsx
import { Toaster, TooltipProvider } from "@semec/ds/react";

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

**O CSS não sofre poda.** A poda vale para o JS. O `@source "…/node_modules/@semec/ds/dist/react"` faz o Tailwind varrer o `dist` inteiro, então o CSS gera as classes de todos os componentes, use o app um ou todos: cerca de 68 kB de CSS do kit (~12 kB com gzip), um custo fixo medido num app novo com a 4.0.0. O JS, sim, cai para o que é importado (os ~35 kB do `Button` acima).

Metadados de componente (o que versões anteriores deste README chamavam de `getComponentMetadata()`, função que nunca existiu) vêm de `@semec/ds/skills`: `dsBySlug["botoes"]`, `dsComponents`.

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

O que existe no pacote está em `tokens.css` (camadas L0 `--pv-*` e L1 semânticas). O `@theme inline` expõe os tokens como utilitários (o preset JS gera os mesmos nomes):

| Token | Utilitário | Observação |
|---|---|---|
| `--space-0` … `--space-16` | `p-space-4`, `gap-space-2`, `mt-space-12`… | Dialeto do sistema. `p-4` dá o mesmo valor, mas só os nove degraus (0, 1, 2, 3, 4, 6, 8, 12, 16) fazem parte da escala |
| `--text-xs` … `--text-2xl`, `--text-3xl` (32px), `--text-display` (40px) | `text-xs` … `text-3xl`, `text-display` | Tamanho **e** entrelinha do degrau (`--leading-*`); `leading-*` sobrescreve |
| `--font-regular` … `--font-bold` | `font-regular`, `font-medium`, `font-semibold`, `font-bold` | 400–700 |
| `--text-muted`, `--text-secondary`, `--text-strong` | `text-text-muted`, `text-text-secondary`, `text-text-strong` | **Não** use `text-muted`/`text-secondary`: são a cor de fundo `--surface-alt` (1,09:1). `bg-muted`/`bg-secondary` seguem valendo |
| `--surface-sunken` | `bg-surface-sunken` | Skeleton, trilha de Progress/Slider (1,47:1 sobre `--surface`) |
| `--focus-ring-inverse` | `ring-ring-inverse` | Automático dentro de `data-surface="brand"` ou `bg-brand-hero` (9,38:1); `data-surface="default"` volta ao anel padrão |
| `--text-brand` | `text-text-brand` | Título institucional escuro (12,43:1). Novo na 4.0 |
| `--feedback-success-emphasis`, `--text-on-success-emphasis` | `bg-success-emphasis`, `text-success-emphasis-foreground` | Verde cheio do Toast `success` (texto 5,85:1). Novo na 4.0 |

Primitivos `--pv-*` não geram utilitário desde a 4.0 (não há `bg-pv-*`).

Link solto no texto (`<a>` sem `class`) é sublinhado pelo `tokens.css`; com classe, o sublinhado é do componente/utilitário (`underline`). Tokens de layout que aparecem no site de documentação (`--container-max`, `--measure`, `--control-height-*`, `data-density`) **não fazem parte do pacote**; use os utilitários do Tailwind indicados na skill `semec-ds` (seção "Responsive / Mobile").

## Tema

Os tokens do pacote (`tokens.css`) são tema **claro**. Não há `shadcn.css` no pacote (removido na 2.0.0).

## Validação (Zod)

Schemas Zod ficam no entry **`@semec/ds/react/validacao`** — o entry principal não importa `zod`. O `zod` é peer opcional, `^3.23.0 || ^4.0.0` (o kit é testado com o 3 e o 4): instale-o (`npm install zod`) só se usar esse entry.

A receita de formulário da skill `semec-ds` (React Hook Form + Zod + `FormField` + `ErrorSummary`) usa também `react-hook-form` e `@hookform/resolvers`, que não vêm com o kit (opcionais, só para a receita):

```bash
npm install react-hook-form @hookform/resolvers zod
```

```ts
import { cpfSchema, emailSchema } from "@semec/ds/react/validacao";
import { validateCPF } from "@semec/ds/react"; // helpers puros, sem zod
```

## Segurança (CSP)

Alguns componentes Radix injetam `<style>` dinamicamente (scrollbar hiding, scroll locking). Para ambientes com **Content Security Policy** estrita, use o `SemecProvider` com o nonce do servidor:

```tsx
import { SemecProvider } from "@semec/ds/react";

function RootLayout({ nonce }) {
  return (
    <html>
      <body>
        <SemecProvider nonce={nonce}>
          <App />
        </SemecProvider>
      </body>
    </html>
  );
}
```

Medido na prova com política estrita (SEM-752/SEM-780):

- **Popover** — 0 violações de política (sem nonce).
- **ScrollArea, Select** — 1 violação cada, mesmo com nonce (continuam com scrollbar CSS estático no `tokens.css`).
- **Dialog, AlertDialog, Drawer, Sheet, DropdownMenu** — scroll locking do body; use `SemecProvider` com nonce.

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

- **Peers obrigatórios**: `react` ^19, `react-dom` ^19, `tailwindcss` ^4 e `lucide-react` `>=0.468.0 <2`. O npm 7+ instala peer ausente sozinho; o pnpm só com `auto-install-peers=true`; o Yarn (clássico e Berry) nunca. Por isso o passo 1 instala `lucide-react` explicitamente
- **Peer opcional**: `zod` `^3.23.0 || ^4.0.0` (testado com o 3 e o 4) — só se usar `@semec/ds/react/validacao`
- **Plugin do Tailwind** (do seu build, não do kit): `@tailwindcss/vite` no Vite; `@tailwindcss/postcss` ou `@tailwindcss/turbopack` no Next. O `@source` aponta para `node_modules/@semec/ds/dist/react`, com caminho relativo ao CSS
- **Dependências (vêm automaticamente)**: todos os `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `get-nonce`

## Limitações conhecidas

- **Windows: caminho longo no `next build`.** Com o projeto numa pasta funda, o Turbopack pode falhar com `exceeds max length of filesystem` em `.next/server/chunks/ssr` (limite de 260 caracteres do Windows). Não é do kit: mova o projeto para um caminho curto (ex.: `C:\dev\app`), habilite caminhos longos no Windows (`LongPathsEnabled`) ou use `next build --webpack`.
- **3.0 e 3.1: bundle único e sem fronteira RSC.** Importar uma peça carregava o kit inteiro e importar `@semec/ds/react` num Server Component quebrava. Corrigido na 3.2 (saída por módulo, `"use client"` por componente e subpaths `@semec/ds/react/*`; ver o passo 5 de [Comece aqui](#comece-aqui) e [Subpath exports](#subpath-exports)).

## Migração para a 4.0 e depreciações

**Guia: [docs/migracao-4.0.md](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md)**, com antes/depois, tabela primitivo → semântico e o codemod:

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
