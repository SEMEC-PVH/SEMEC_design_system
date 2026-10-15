# @semec/ds

Design System SEMEC — componentes React + tokens CSS + artefatos para agentes de IA.

React 19 + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Tokens `pv-*` (tema claro).

## Comece aqui

São 5 passos. Pular qualquer um deles faz os componentes saírem sem estilo, sem fonte ou sem funcionar.

### 1. Instalar

```bash
npm install @semec/ds
```

Só isso. As dependências Radix UI, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` e `get-nonce` são **dependências do pacote** e vêm automaticamente — não instale a lista de `@radix-ui/*` à mão.

Peers: `react` e `react-dom` 19+, e Tailwind CSS v4 no seu app. Peer opcional: `zod` ^3.23, só se usar `@semec/ds/react/validacao`.

### 2. CSS global (Tailwind v4)

No arquivo CSS global do app (não via `import` em JS):

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

Na 3.0 e na 3.1 o `dist` era um bundle único sem `"use client"` e importar o kit num Server Component quebrava; se estiver preso a essas versões, use o kit só em arquivos `"use client"`.

Em Vite/SPA nada disso se aplica.

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
| `@semec/ds/react` | Todos os componentes, `cn()`, masks e validadores puros |
| `@semec/ds/react/<componente>` | Um componente só, pelo nome do arquivo em `src/components` (ex.: `@semec/ds/react/button`, `@semec/ds/react/dialog`, `@semec/ds/react/form-field`). Desde a 3.2 |
| `@semec/ds/react/validacao` | Schemas Zod (exige o peer `zod`) |
| `@semec/ds/react/tokens.css` | Tokens `pv-*` (primitivos + semânticos) + utilitários de animação |
| `@semec/ds/react/pv-preset` | Preset Tailwind v4 (JS config) |
| `@semec/ds/react/pv-preset.ts` | Preset Tailwind v4 (arquivo TS original) |
| `@semec/ds/react/server` | **Uso interno do monorepo.** Só tem `dsPackageRootResolve()`, que procura `packages/react` a partir do `cwd` e lança erro fora do repositório. Não use em apps consumidores |
| `@semec/ds/skills` | Metadados dos componentes para agentes IA (`dsComponents`, `dsBySlug`, `dsCategories`…) |
| `@semec/ds/skills/llms.txt` | Índice para IA |
| `@semec/ds/skills/llms-full.txt` | Dump completo |
| `@semec/ds/skills/manifest.json` | JSON para consumo por máquinas |
| `@semec/ds/skills/components/*.md` | Chunk RAG por componente |
| `@semec/ds/skills/semec-ds` | Skill full do agente |
| `@semec/ds/lite/skills/semec-ds-lite` | Skill lite (tokens + a11y + responsive) |

**Poda (tree-shaking).** Desde a 3.2 cada componente é um módulo ESM próprio em `dist/react/components/` e o pacote declara `"sideEffects": ["**/*.css"]`, então o bundler do app descarta o que não é importado: `import { Button } from "@semec/ds/react"` custa cerca de 33 kB minificado com as dependências (quase tudo `tailwind-merge`) e 2 kB só de código do kit, em vez do kit inteiro (~340 kB na 3.1). Importar pela raiz ou pelo subpath dá o mesmo resultado num bundler com poda; o subpath ajuda ferramentas sem poda (ex.: `next dev` sem `optimizePackageImports`) e testes. A CI mede isso (`npm run test:dist`).

Metadados de componente (o que versões anteriores deste README chamavam de `getComponentMetadata()`, função que nunca existiu) vêm de `@semec/ds/skills`: `dsBySlug["botoes"]`, `dsComponents`.

## Componentes

<!-- ds:component-list:start -->
**52 componentes** no manifest (`manifest.js`), pelo export principal de cada um. Lista e contagem geradas por `scripts/build-artifacts.mjs`; não edite à mão.

| Categoria | Componentes |
|---|---|
| **Ações e links** (3) | Button, IconButton, Link |
| **Formulários** (16) | Input, Textarea, Select, Combobox, DatePicker, FileUpload, Checkbox, RadioGroup, Switch, Label, FormField, ErrorSummary, Toggle, Slider, InputOTP, Calendar |
| **Conteúdo e dados** (9) | Card, Heading, Badge, Table, Accordion, Separator, Avatar, DataTable, Timeline |
| **Navegação** (11) | Breadcrumb, Header, SkipLink, Footer, Tabs, Pagination, SidebarToggleButton, ScrollArea, DropdownMenu, NavigationMenu, Sidebar |
| **Feedback e estados** (13) | Skeleton, EmptyState, ErrorState, Dialog, Toaster, Tooltip, Alert, AlertDialog, Popover, Spinner, Progress, Drawer, Sheet |
<!-- ds:component-list:end -->

Mais: `SemecProvider`, `cn`, masks (`maskCPF`, `maskCNPJ`, `maskCEP`, `maskCurrency`) e validadores puros (`validateCPF`, `validateCNPJ`, `validateEmail`).

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

Link solto no texto (`<a>` sem `class`) é sublinhado pelo `tokens.css`; com classe, o sublinhado é do componente/utilitário (`underline`). Tokens de layout que aparecem no site de documentação (`--container-max`, `--measure`, `--control-height-*`, `data-density`) **não fazem parte do pacote**; use os utilitários do Tailwind indicados na skill `semec-ds` (seção "Responsive / Mobile").

## Tema

Os tokens do pacote (`tokens.css`) são tema **claro**. Não há `shadcn.css` no pacote (removido na 2.0.0).

## Validação (Zod)

Schemas Zod ficam no entry **`@semec/ds/react/validacao`** — o entry principal não importa `zod`:

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

## Dependências

- **Peer**: React 19+, React DOM 19+
- **Peer opcional**: `zod` ^3.23 — só se usar `@semec/ds/react/validacao`
- **Tailwind CSS**: v4+ no app (com `@source` apontando para `node_modules/@semec/ds/dist/react`, caminho relativo ao CSS)
- **Instaladas automaticamente**: todos os `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `get-nonce`

## Limitações conhecidas

- **3.0 e 3.1: bundle único e sem fronteira RSC.** Importar uma peça carregava o kit inteiro e importar `@semec/ds/react` num Server Component quebrava. Corrigido na 3.2 (saída por módulo, `"use client"` por componente e subpaths `@semec/ds/react/*`; ver o passo 5 de [Comece aqui](#comece-aqui) e [Subpath exports](#subpath-exports)).

## Depreciações anunciadas (saem na 4.0)

Avisadas a partir da 3.1.0 e válidas até a 4.0 (política de duas minors, ADR-013). Lista completa, com o que usar no lugar: [CONTRIBUTING.md § Depreciações anunciadas](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/CONTRIBUTING.md#depreciações-anunciadas).

- Importar por caminho de arquivo em `dist/` (o layout interno do `dist` não é contrato; use `@semec/ds/react` ou os subpaths `@semec/ds/react/*`, disponíveis desde a 3.2).
- `onChange(value)` / `onChange(files)` nos campos não nativos (`Combobox`, `InputOTP`, `DatePicker`, `FileUpload`, `Calendar`): use `onValueChange`, com a mesma assinatura, disponível em todos desde a 3.2.0 (contrato `value` / `onValueChange` / `name` / `id` / `invalid`, ADR-015).
- Utilitários de primitivo `bg-pv-*` / `text-pv-*` (use os semânticos).

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
