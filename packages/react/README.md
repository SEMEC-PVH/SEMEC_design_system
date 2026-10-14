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

O pacote **não traz arquivos de fonte**. O `tokens.css` declara `--font-family-sans: "Poppins", system-ui, -apple-system, sans-serif`; sem carregar a Poppins, o texto cai na fonte do sistema (Segoe UI no Windows). Carregue os pesos 400, 500, 600 e 700 de uma destas formas:

**Next.js (`next/font/local`, self-hosted, recomendado)** — o `next/font` gera um nome de família com hash, então aponte o token para a variável:

```tsx
// app/layout.tsx
import localFont from "next/font/local";

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
```

```css
/* no CSS global, depois do @import do tokens.css */
:root {
  --font-family-sans: var(--font-poppins), system-ui, -apple-system, sans-serif;
}
```

(`next/font/google` com `Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" })` funciona igual.)

**Vite / outros (self-hosted)** — copie os `.woff2` para o app e declare `@font-face` com `font-family: "Poppins"` (o nome que o token já usa), `font-display: swap`, um bloco por peso. Os arquivos estão no repositório em [`apps/docs/app/fonts/`](https://github.com/SEMEC-PVH/SEMEC_design_system/tree/main/apps/docs/app/fonts) (Poppins, licença SIL OFL).

**Google Fonts** — `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">`. Funciona sem ajuste no token, mas depende de rede externa; prefira self-host em sistemas da Prefeitura.

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

### 5. Next.js App Router: importe o kit só em arquivos `"use client"`

Na 3.0 e na 3.1 o `dist` é **um bundle único, sem a diretiva `"use client"`**. Importar `@semec/ds/react` num Server Component quebra (hooks como `useLayoutEffect` não existem no ambiente `react-server`). Até a correção (planejada para uma versão futura, AUD-20):

- use os componentes em arquivos que começam com `"use client"`;
- monte os providers do passo 4 num componente `"use client"` (ex.: `app/providers.tsx`) e use-o no `layout`;
- não use `export *` para reexportar o kit num arquivo `"use client"`; reexporte por nome ou importe direto.

Em Vite/SPA nada disso se aplica.

## Uso rápido

```tsx
"use client"; // só necessário no Next App Router

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

Metadados de componente (o que versões anteriores deste README chamavam de `getComponentMetadata()`, função que nunca existiu) vêm de `@semec/ds/skills`: `dsBySlug["botoes"]`, `dsComponents`.

## Componentes

**49 componentes** (um por módulo em `src/components`, exceto o `SemecProvider`, que é provider), pelos nomes exportados:

| Categoria | Componentes |
|---|---|
| **Ações e links** (3) | Button, IconButton, Link |
| **Formulários** (16) | Input, Textarea, Select, Combobox, DatePicker, FileUpload, Checkbox, RadioGroup, Switch, Label, FormField, ErrorSummary, Toggle, Slider, InputOTP, Calendar |
| **Conteúdo e dados** (8) | Card, Badge, Table, Accordion, Separator, Avatar, DataTable, Timeline |
| **Feedback e estados** (13) | Skeleton, EmptyState, ErrorState, Dialog, Toast, Tooltip, Alert, AlertDialog, Popover, Spinner, Progress, Drawer, Sheet |
| **Navegação** (9) | Breadcrumb, Header, Tabs, Pagination, SidebarTrigger, ScrollArea, DropdownMenu, NavigationMenu, Sidebar |

Mais: `SemecProvider`, `cn`, masks (`maskCPF`, `maskCNPJ`, `maskCEP`, `maskCurrency`) e validadores puros (`validateCPF`, `validateCNPJ`, `validateEmail`).

## Tokens

O que existe no pacote está em `tokens.css` (camadas L0 `--pv-*` e L1 semânticas). Tokens de layout que aparecem no site de documentação (`--container-max`, `--measure`, `--control-height-*`, `data-density`) **não fazem parte do pacote**; use os utilitários do Tailwind indicados na skill `semec-ds` (seção "Responsive / Mobile").

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

## Limitações conhecidas (3.0 e 3.1)

- **Bundle único**: importar uma peça carrega o kit inteiro (sem poda de árvore por módulo). Saída por módulo planejada para uma versão futura (AUD-20).
- **Sem fronteira RSC**: ver o passo 5 de [Comece aqui](#comece-aqui).

## Documentação

- [Site de documentação](https://semec-pvh.github.io/SEMEC_design_system/)
- [Repositório](https://github.com/SEMEC-PVH/SEMEC_design_system)
- [Guia de contribuição](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/CONTRIBUTING.md)
- [ADRs](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/README.md)
- [Issues](https://github.com/SEMEC-PVH/SEMEC_design_system/issues)

## Licença

MIT
