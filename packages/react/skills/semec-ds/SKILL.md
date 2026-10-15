---
name: semec-ds
description: Use SEMEC Design System (@semec/ds) para construir UI em React. Tokens pv-*, {{ds:component-count}} componentes Radix+CVA, a11y WCAG 2.1 AA e padrões de tela. Use quando criar ou editar UI com o kit, migrar portal ou montar telas a partir dos exemplos.
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System — skill completa

> Gerado para `@semec/ds@{{ds:version}}` (versão do `package.json` no build). Se o app tiver outra versão instalada (`npm ls @semec/ds`), o que vale é o README dela.

Kit `@semec/ds` — React + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Conteúdo PT-BR, código EN (ADR-016).

**Regra número 1: use os componentes do kit, não os reimplemente.** Importe de `@semec/ds/react`. Não copie o código-fonte de um componente para o app, não recrie um componente existente com `div` + classes e não troque o estilo dele por outro. Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.

<!-- ds:maintainer:start -->
> **Mantenedores (só na cópia do repositório).** Fonte de dados: `packages/react/manifest.js`. Esta SKILL é gerada de `packages/react/skills/semec-ds/SKILL.md` por `packages/react/scripts/build-artifacts.mjs`, que preenche a contagem e a lista de componentes e tira estes blocos de mantenedor da versão publicada no npm e no site.
<!-- ds:maintainer:end -->

## Instalação

Peer deps obrigatórios: `react ^19.0.0`, `react-dom ^19.0.0`, `tailwindcss ^4.0.0` e `lucide-react >=0.468.0 <2`. Peer **opcional**: `zod ^3.23.0 || ^4.0.0` (só se usar schemas em `@semec/ds/react/validacao`).

```bash
npm install @semec/ds lucide-react   # pnpm add / yarn add: mesmos pacotes
```

Instale `lucide-react` **sempre** junto: é peer (os componentes importam os ícones), e sem ele o build quebra. O npm 7+ instala peer ausente sozinho; o pnpm só com `auto-install-peers=true`; o Yarn (clássico e Berry) nunca. Os pacotes `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge` e `get-nonce` são dependências do `@semec/ds` e vêm automaticamente. **Não** instale lista de Radix à mão.

**Tailwind v4 no bundler:**

- **Vite:** `npm install -D tailwindcss @tailwindcss/vite`, `plugins: [react(), tailwindcss()]` no `vite.config.ts` (`import tailwindcss from "@tailwindcss/vite"`). O CSS global é o `src/index.css`: troque o conteúdo do template pelas linhas abaixo e apague o `import "./App.css"`.
- **Next.js (`create-next-app`):** o Tailwind já vem (`@tailwindcss/postcss`, ou `@tailwindcss/turbopack` sem `postcss.config` no `create-next-app` 16.4; os dois funcionam igual). Em `app/globals.css`, **apague** o que o template gerou (`:root`, `@theme inline` com `--font-sans: var(--font-geist-sans)`, `@media (prefers-color-scheme: dark)`, `body { font-family: Arial… }`): fora de camada, eles vencem o `@layer base` do `tokens.css` e o app fica com Arial e as cores do template. Em `app/layout.tsx`, apague o `next/font/google` Geist e as classes `geist*.variable` do `<body>`, e use `<html lang="pt-BR">`.

No CSS global do app (não via `import` em JS):

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

O `@source` é obrigatório no Tailwind v4: sem ele o CSS não gera as classes das peças (`bg-card`, `shadow-elevation-*`, `animate-in`…). O caminho é **relativo ao arquivo CSS**: `src/index.css` e `app/globals.css` usam `../node_modules/...`; `src/app/globals.css` usa `../../node_modules/...`. Se o Tailwind varrer pastas demais (monorepo), limite com `@import "tailwindcss" source("../src");` (também relativo ao CSS) e mantenha o `@source` do pacote.

O CSS não sofre poda: o `@source` varre o `dist` inteiro, então o CSS do kit é um custo fixo (~68 kB, ~12 kB com gzip) mesmo usando um componente só. O JS é podado (um `Button` custa ~35 kB com as dependências).

**Fonte:** o pacote publica a Poppins (400/500/600/700, licença SIL OFL). Importe **antes** do `tokens.css`:

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

Sem a fonte, o texto cai em `system-ui` (fallback do token `--font-family-sans`). Alternativa no Next.js: `next/font/local` com `variable: "--font-poppins"` na `<html>` e, no CSS global depois do `tokens.css`, `:root { --font-family-sans: var(--font-poppins), system-ui, -apple-system, sans-serif; }` (o `next/font` gera nome de família com hash). Não existem pesos 800/900.

**Providers no root (quando usar):** `<Toaster />` se usar `useToast()`; `<TooltipProvider>` em volta do app se usar `Tooltip`; `<SemecProvider nonce>` só para CSP estrita. O `SemecProvider` não inclui os outros dois.

**Next.js App Router:** desde a 3.2 o `dist` sai por módulo e cada componente interativo já traz `"use client"`; importar `@semec/ds/react` num Server Component funciona (apresentacionais como `Heading`, `Card`, `Badge`, `Button`, `Link`, `Table` renderizam no servidor). Passar handler (`onClick`, `onValueChange`…) ou usar hook continua exigindo um arquivo `"use client"` seu. Não use `export *` do kit num arquivo `"use client"`. Um componente só: `@semec/ds/react/<arquivo>` (ex.: `@semec/ds/react/button`). Na 3.0/3.1 (bundle único, sem `"use client"`) o kit só funcionava em arquivos `"use client"`.

O pacote **não** exporta `shadcn.css` (removido na 2.0.0). Use só `tokens.css` (+ `@source`). Preset JS opcional: `@config "@semec/ds/react/pv-preset"`.

## Tema

`tokens.css` define só o tema **claro** (camadas L0/L1). Não há tema escuro no pacote: `data-theme="dark"` não tem efeito. Use sempre tokens L1 — nunca hex solto em `className` ou CSS.

## Tokens

### L0 — Primitivos (`--pv-*`)

Valores brutos. Nunca use direto em componente ou tela. Desde a 4.0 não existem utilitários `bg-pv-*` / `text-pv-*` / `border-pv-*` (AUD-55): a classe não gera CSS. Use o semântico do papel (tabela em `docs/migracao-4.0.md`).

| Token | Valor | Uso |
|-------|-------|-----|
| `--pv-blue-50` | `#eef4fa` | Superfícies claras |
| `--pv-blue-600` | `#3a6ca6` | Ação primária |
| `--pv-blue-700` | `#2f5a8a` | Hover de ação |
| `--pv-blue-800` | `#26476f` | Active de ação |
| `--pv-blue-900` | `#26325B` | Azul institucional escuro (texto do toast de sucesso) |
| `--pv-blue-hero` | `#223f99` | Marca e anel de foco (9,38:1 sobre branco) |
| `--pv-green-50` | `#eef7e6` | Superfície sucesso |
| `--pv-green-500` | `#82C353` | Fundo do toast de sucesso — **nunca como cor de texto** |
| `--pv-green-800` | `#3a6420` | Sucesso |
| `--pv-yellow-800` | `#8a5a00` | Aviso |
| `--pv-red-50` | `#fef2f2` | Superfície erro |
| `--pv-red-700` | `#b91c1c` | Perigo |
| `--pv-gray-50` | `#f4f6f9` | Fundo de página |
| `--pv-gray-100` | `#f5f5f5` | Superfície alternativa |
| `--pv-gray-200` | `#e5e7eb` | Borda padrão |
| `--pv-gray-400` | `#78849a` | Borda de campo |
| `--pv-gray-600` | `#4b5563` | Texto secundário |
| `--pv-gray-700` | `#374151` | Texto secundário forte |
| `--pv-gray-900` | `#14233a` | Texto principal |

### L1 — Semânticos

Camada do dia a dia. Diz o papel, não a cor. Use estes, nunca os L0.

**Cor:** `--bg`, `--fg`, `--surface`, `--surface-alt`, `--surface-sunken`, `--border`, `--border-strong`, `--focus-ring`, `--focus-ring-inverse`, `--text-muted`, `--text-secondary`, `--text-strong`, `--text-on-brand`, `--text-brand`, `--tint`, `--brand-hero`

**Ação:** `--action-primary`, `--action-primary-hover`, `--action-primary-active`

**Feedback:** `--feedback-success`, `--feedback-warning`, `--feedback-danger`, `--feedback-info` (+ `-surface`); `--feedback-success-emphasis` + `--text-on-success-emphasis` (verde cheio do Toast `success`)

**Tipografia:** `--font-family-sans`, `--text-xs/sm/base/lg/xl/2xl/3xl` e `--text-display`, `--leading-*`, `--font-regular/medium/semibold/bold`

**Espaçamento:** `--space-0/1/2/3/4/6/8/12/16`

**Forma:** `--radius-sm/md/lg/full`

**Elevação:** `--elevation-0/1/2/3`

**Movimento:** `--pv-duration-fast/base/slow`, `--easing-standard`

### Do token ao utilitário Tailwind

O `@theme inline` do `tokens.css` gera utilitários para cor, espaçamento (`p-space-N`), tipografia (`text-*` com line-height, `font-*`), raio, sombra e duração/easing. O nome do utilitário nem sempre é o nome do token: use a tabela.

**Cor** (o nome do utilitário nem sempre é o nome do token):

| Papel | Token L1 | Utilitário |
|---|---|---|
| Fundo da página | `--bg` | `bg-background` |
| Texto principal | `--fg` | `text-foreground` |
| Cartão, modal, popover | `--surface` | `bg-card` / `bg-surface` / `bg-popover` |
| Superfície alternativa | `--surface-alt` | `bg-surface-alt` (também `bg-muted`, `bg-secondary`, `bg-accent`) |
| Superfície rebaixada (Skeleton, trilhas) | `--surface-sunken` | `bg-surface-sunken` |
| Borda leve / forte / campo | `--border` / `--border-strong` | `border-border` / `border-border-strong` / `border-input` |
| Texto de apoio (7,56:1) | `--text-muted` | `text-text-muted` (ou `text-muted-foreground`) |
| Texto secundário forte (10,31:1) | `--text-secondary` | `text-text-secondary` |
| Texto em destaque (15,77:1) | `--text-strong` | `text-text-strong` (ou `text-foreground`) |
| Texto sobre marca/ação | `--text-on-brand` | `text-text-on-brand` (ou `text-primary-foreground`) |
| Marca | `--brand-hero` | `bg-brand-hero`, `text-brand-hero` |
| Título institucional escuro (12,43:1) | `--text-brand` | `text-text-brand` |
| Ação primária | `--action-primary` (+ hover/active) | `bg-primary`, `hover:bg-primary-hover`, `active:bg-primary-active`, `text-primary` |
| Anel de foco | `--focus-ring` | `ring-ring`, `outline-ring` |
| Anel de foco sobre marca | `--focus-ring-inverse` | `ring-ring-inverse` |
| Perigo | `--feedback-danger` (+ surface) | `bg-destructive`, `text-destructive`, `bg-destructive-surface` |
| Sucesso / aviso / info | `--feedback-*` (+ surface) | `text-success`, `bg-success-surface`, `text-warning`, `bg-warning-surface`, `text-info`, `bg-info-surface` |
| Sucesso em destaque (fundo cheio, texto 5,85:1) | `--feedback-success-emphasis` / `--text-on-success-emphasis` | `bg-success-emphasis text-success-emphasis-foreground` (nunca o verde cheio como texto: 2,13:1) |
| Superfície colorida leve | `--tint` | `bg-tint` |

**Armadilha (AUD-30):** **nunca** use `text-muted` nem `text-secondary` para texto: eles **compilam para a cor de fundo** `--surface-alt` (1,09:1, texto invisível), porque `--color-muted` e `--color-secondary` são cores de superfície no estilo shadcn. Use `text-text-muted`, `text-text-secondary` e `text-text-strong`.

**Espaçamento:** `--space-N` → `p-space-N`, `gap-space-N`, `mt-space-N` etc. (degraus 0, 1, 2, 3, 4, 6, 8, 12, 16). A escala do Tailwind continua valendo e tem os mesmos valores (`p-4` = `p-space-4` = 16px); fique nos degraus do DS (nada de `px-5`, `py-1.5`).

**Texto:** cada degrau já inclui a altura de linha do DS. Papel de cada um:

| Utilitário | Tamanho | Papel |
|---|---|---|
| `text-display` | 40px | Página inicial / hero |
| `text-3xl` | 32px | `h1` da página |
| `text-2xl` | 24px | `h2` |
| `text-xl` | 20px | Subtítulo (`h3`) |
| `text-lg` | 18px | Destaque |
| `text-base` | 16px | Corpo |
| `text-sm` | 14px | Apoio |
| `text-xs` | 12px | Rótulo |

Pesos: `font-regular` 400, `font-medium` 500, `font-semibold` 600, `font-bold` 700 (não existem 800/900).

**Raio:** `rounded-sm` 2px · `rounded-md` 8px · `rounded-lg` 12px · `rounded-full`. Escolha pelo papel (controle `rounded-md`, cartão `rounded-lg`, pílula `rounded-full`). A escala é fixa (decisão de 15/10/2026); não use `rounded-xl` ou acima, que ficam fora dela.

**Sombra:** `shadow-elevation-1/2/3` (nunca `shadow-md` e afins do Tailwind, que usam preto puro).

**Movimento:** `duration-fast/base/slow`, `ease-standard`.

## Lib utilities

```tsx
import { cn } from "@semec/ds/react"; // a partir da 3.1.0 (na 3.0.0 não era exportado)
import { maskCPF, maskCNPJ, maskCEP, maskCurrency } from "@semec/ds/react";
import { validateCPF, validateCNPJ, validateEmail } from "@semec/ds/react";
import { cpfSchema, cnpjSchema, cpfCnpjSchema, emailSchema, cepSchema } from "@semec/ds/react/validacao";
```

## Componentes ({{ds:component-count}})

Lista gerada do manifest (export principal, `code` e descrição). Detalhes, variantes e exemplo de uso de cada um: `components/<slug>.md` ou `manifest.json`.

<!-- ds:component-list -->

## Comportamentos fixos do kit

Coisas que o componente faz sozinho e que mudam como você monta a tela. Leve em conta antes de acrescentar `role`, títulos ou landmarks por fora.

- **Anúncios:** o `Alert` usa `role="alert"` (assertivo) só em `variant="destructive"`; as demais variantes usam `role="status"` (educado). A prop `announce` controla isso quando o padrão não serve (ex.: alerta estático que não deve ser anunciado). O `ErrorSummary` e o `ErrorState` são anunciados; o erro do `FormField` é lido ao focar o campo (via `aria-describedby`) e o erro de validação local do `FileUpload` usa `aria-live="polite"`. Não acrescente outro `role="alert"` em volta.
- **Níveis de título:** os títulos internos (`AlertTitle`, `CardTitle`, `TimelineTitle`, `EmptyState`, `ErrorState`, `SectionHeader`, `FooterSection`) aceitam `as`/`titleAs` para escolher o nível. Ajuste o nível à hierarquia da página (ex.: `EmptyState titleAs="h2"` logo abaixo do `h1`) em vez de deixar o padrão pular nível.
- **`SidebarInset` é `<main>` por padrão** (aceita `as`): não aninhe outro `<main>` dentro dele; se a página já tem `<main>`, use `as="div"`.
- **`Sidebar`** é `<nav aria-label="Menu lateral">`; `SidebarMenuButton isActive` vira `aria-current="page"`.
- **`HeaderBrand` sem `logo`** mostra um placeholder decorativo (`aria-hidden`) e avisa no console em desenvolvimento. Passe sempre `logo` com o asset real (`<img alt="Prefeitura de Porto Velho">`). O nome quebra linha no mobile (use `truncate` para cortar).
- **`NavigationMenu`** é `<nav aria-label="Menu principal">` por padrão; passe outro `aria-label` se houver mais de um menu na página.
- **`FormField`** liga dica e erro ao controle sozinho (contexto com `useId`): o controle filho recebe `id`, `aria-describedby`, `aria-invalid` e `aria-required`. Não monte `aria-describedby` à mão; o que você passar explicitamente vence.


## Padrões de tela

Toda tela de serviço segue o mesmo esqueleto, para que as telas da Prefeitura pareçam um só sistema (AUD-51, AUD-58).

### Esqueleto da página

1. **Link de pular** (`SkipLink`) como primeiro elemento focável: leva ao `#conteudo`.
2. **Cabeçalho** (`Header` + `HeaderBrand` + `HeaderNav`), que é o landmark `banner`.
3. **Navegação** com nome: `<nav aria-label="Menu principal">` (ou `NavigationMenu aria-label="Menu principal"`), trilha com `Breadcrumb`.
4. **Um único `<main id="conteudo">`** com o container de página e **um** `h1` (`Heading level={1}`).
5. **Rodapé institucional** (`Footer`), que é o landmark `contentinfo`.

```tsx
import {
  SkipLink, Header, HeaderBrand, HeaderNav, HeaderNavLink, Heading,
  Footer, FooterContent, FooterSection, FooterLinks, FooterLink, FooterBottom,
} from "@semec/ds/react";

export function PaginaDeServico() {
  return (
    <>
      {/* padrão: "Pular para o conteúdo principal", href="#conteudo" */}
      <SkipLink />
      <Header>
        <HeaderBrand logo={<img src="/marca.svg" alt="Prefeitura de Porto Velho" />} serviceName="Emissão de certidões" />
        <HeaderNav aria-label="Menu principal">
          <HeaderNavLink href="/certidoes" current>Certidões</HeaderNavLink>
        </HeaderNav>
      </Header>
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[75rem] px-4 py-8">
        <Heading level={1}>Emitir certidão negativa</Heading>
        {/* conteúdo */}
      </main>
      <Footer>
        <FooterContent>
          <FooterSection title="Atendimento">
            <FooterLinks>
              <FooterLink href="/contato">Fale conosco</FooterLink>
            </FooterLinks>
          </FooterSection>
        </FooterContent>
        <FooterBottom>Prefeitura de Porto Velho · Secretaria Municipal de Economia</FooterBottom>
      </Footer>
    </>
  );
}
```


- **Landmarks:** um `banner`, um `main`, um `contentinfo`; cada `<nav>` com `aria-label` distinto ("Menu principal", "Menu lateral", "Trilha de navegação", "Paginação"). O `tabIndex={-1}` no `<main>` deixa o link de pular mover o foco de fato.
- **Com `Sidebar`:** o `SidebarInset` faz o papel do `<main>` (dê a ele `id="conteudo"` e `tabIndex={-1}`); o `SkipLink` e o `Header` ficam antes do `SidebarProvider` ou no topo do `SidebarInset`.

### Container e largura de leitura

- Container de página: `mx-auto w-full max-w-[75rem] px-4` (1200px, igual ao site de docs). Use **sempre** este; não invente `max-w-6xl`, `max-w-7xl` ou `container`.
- Texto corrido: `max-w-prose` (65ch). Coluna de formulário ou leitura: `max-w-3xl` (48rem).
- O pacote **não** tem `--container-max`, `--container-docs`, `--measure`, `--control-height-*` nem modo `data-density="compact"`: esses nomes existem só no CSS do site de documentação. `var()` com eles resolve para vazio, sem erro.

### Título da página

- Um `h1` por página, com o nome da tarefa ("Emitir certidão negativa"), não o nome do sistema. Depois `h2` para seções, sem pular nível.
- Use `Heading level={1}` (h1, 32px/`text-3xl`), `level={2}` (`text-2xl`), `level={3}` (`text-xl`); a prop `size` muda só o tamanho visual, sem mudar o nível. Sem o componente: `h1` em `text-3xl font-bold text-foreground`. `text-display` (40px) só no hero da página inicial.

### Marca e ação

- **Marca = `brand-hero`.** Faixas institucionais, hero e selo usam `bg-brand-hero text-primary-foreground` (ou `text-brand-hero` sobre fundo claro). Não use `bg-primary` para marca.
- **Ação = `primary`.** O botão principal de cada tela é `<Button variant="primary">` (`bg-primary`), **um** por grupo de ações; os demais são `outline` ou `ghost`. Não use `brand-hero` em botão.
- **Foco sobre a marca:** o anel padrão (`--focus-ring` = `--pv-blue-hero`) some sobre a marca (1,00:1). Áreas com `bg-brand-hero` ou `data-surface="brand"` trocam o anel automaticamente para branco (9,38:1); fora disso, use `ring-ring-inverse` (`--focus-ring-inverse`) em controles sobre fundo de marca.

### Tabelas

- Use `Table` (ou `DataTable` para ordenar e paginar) com `TableCaption` ou `caption` descrevendo o conteúdo; cabeçalhos em `TableHead`.
- A `Table` já rola na horizontal (wrapper `overflow-auto`), mas esse wrapper não recebe foco: se a tabela não tiver nenhum elemento focável, quem usa só teclado não consegue rolar. Em telas estreitas, prefira **menos colunas** (as secundárias vão para uma tela de detalhe) ou uma **lista de `Card`** abaixo de `md:`, mantendo a `Table` a partir de `md:`.
- Quando a linha tem várias ações, use uma coluna "Ações" com `Button`, não a linha inteira clicável.

### Sidebar (painéis administrativos)

- `SidebarProvider` > `Sidebar` + `SidebarInset`. Abaixo de 768px (48rem, `matchMedia`; o complemento exato do `md:`) a barra vira gaveta: um diálogo modal com foco preso, Esc para fechar e botão "Fechar menu". O `SidebarTrigger` tem 44px e `aria-expanded`.
- O `SidebarInset` já traz `min-w-0`: conteúdo largo (tabelas, gráficos) rola dentro dele em vez de empurrar a largura da página.


## Workflow IA

1. Leia `llms.txt` → escolha o componente pelo `code` (lista em "Componentes", acima)
2. Leia `components/<slug>.md` → parta do exemplo de `usage` e **importe** o componente; nunca o reimplemente
3. Monte a tela pelo esqueleto de "Padrões de tela"
4. Aplique tokens L1 pelos utilitários da tabela "Do token ao utilitário" — nunca hex solto
5. Valide variantes em `manifest.json` e confira teclado e contraste (seção abaixo)

## Acessibilidade (WCAG 2.1 AA — ADR-014)

### Contraste

- Texto normal: **4,5:1** mínimo (1.4.3)
- Texto grande: **3:1**. Texto grande é **≥ 24px (18pt) regular** ou **≥ 18,66px (14pt) bold**. `text-lg font-bold` (18px) **não** é texto grande: precisa de 4,5:1.
- Componentes de interface e gráficos (bordas de campo, ícones informativos, anel de foco): **3:1** (1.4.11)
- Anel de foco `--focus-ring` (`--pv-blue-hero`): **9,38:1** sobre branco e 8,66:1 sobre `--bg`; sobre a marca, o anel inverso (branco, 9,38:1) entra sozinho em `bg-brand-hero`/`data-surface="brand"` (ver "Marca e ação")

### Teclado

- Tab / Shift+Tab navega; Enter/Space ativa; Escape fecha camadas; setas em menus, abas, radio e listas
- Camadas modais prendem o foco e o devolvem ao gatilho ao fechar: `Dialog`, `AlertDialog`, `Sheet`, `Drawer` e a gaveta mobile da `Sidebar`. Menus e popovers fecham com Esc e devolvem o foco ao gatilho
- `AlertDialog` é `role="alertdialog"`: não fecha por clique fora e o foco inicial vai para "Cancelar". Use-o para confirmação destrutiva; valide antes de fechar
- `Calendar` é grade (padrão APG): setas movem o dia, PageUp/PageDown trocam o mês; um único Tab entra na grade
- `Dialog`/`Sheet` controlados sem `Trigger` não devolvem o foco sozinhos: use `onCloseAutoFocus` para focar o elemento de origem
- Ordem de tabulação = ordem visual

### Foco visível

O `tokens.css` já aplica, na camada base:

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

Nunca `outline: none` sem alternativa visível com 3:1.

### Exceção conhecida (não corrigir)

- `aria-hidden-focus` (axe, serious) com `Select` ou `DropdownMenu` **abertos** é exceção aceita (EXC-01, `docs/excecoes-acessibilidade.md` no repositório do DS): vem do `hideOthers` do Radix sem `inert`, e o foco fica preso na camada (`Tab` não sai, `Esc` fecha e devolve o foco ao gatilho), então o impacto é nulo. O `NavigationMenu` aberto também está na EXC-01, por outra causa (sentinela de foco do Radix, que repassa o foco na hora). Não remova `aria-hidden`, não aplique `inert` por fora e não desative a regra globalmente.
- **axe na CI do app:** desligue só `aria-hidden-focus` e só na análise feita com uma dessas camadas aberta (`new AxeBuilder({ page }).disableRules(["aria-hidden-focus"])` ou `{ rules: { "aria-hidden-focus": { enabled: false } } }` no `axe.run`); analise a mesma tela fechada com todas as regras. Não use `exclude` no `#root` (tira a página inteira da análise). Exemplo completo no README do pacote, seção "Acessibilidade".

### Labels e semântica

- Todo campo precisa de `<label>` associado (`htmlFor`/`id`); placeholder não é rótulo
- Botões só de ícone: `IconButton` com `label` (vira `aria-label` e `title`)
- Ícones decorativos: `aria-hidden="true"`
- Estados: `aria-invalid`, `aria-expanded`, `aria-selected`, `aria-current="page"`
- Textos auxiliares: classe `sr-only`
- Idioma: `<html lang="pt-BR">`

### Áreas clicáveis

- **Régua do DS: 44×44px** nos controles interativos (`min-h-11 min-w-11`, `h-11`, `size-11`). É **decisão do projeto**, mais exigente que o AA: o WCAG 2.1 AA não tem critério de tamanho de alvo; o critério de 44px (2.5.5 Target Size) é **AAA**. (No WCAG 2.2, o 2.5.8, AA, pede 24×24px.)
- Os padrões do kit já seguem a régua: Pagination, Tabs, Toggle, NavigationMenuTrigger e o X dos overlays têm 44px; o `Button size="sm"` mantém 36px visuais com área de toque de 44px
- Espaçamento entre alvos: 8px (regra do DS)
- O pacote não define `--control-height-*`; use os utilitários acima

### prefers-reduced-motion

O `tokens.css` já reduz animações e transições globalmente com `@media (prefers-reduced-motion: reduce)`. Não reative animação dentro desse media query.

### Não uso exclusivo de cores

Complementar cor com ícone, texto ou padrão (erro com mensagem, status com rótulo). O `Link` é sublinhado por padrão; `underline={false}` só em navegação (menus, cabeçalho), nunca em texto corrido. A aba ativa do `Tabs` tem barra de 3px, além da cor.

## Padrão de formulários e feedback (Validação + Toast)

Nos formulários do SEMEC DS, o ciclo de feedback segue uma regra estrita de UX e Acessibilidade (WCAG 2.1 AA):

1. **Erros de Validação (Inline + Resumo)**:
   - Nunca use `Toast` para erros de preenchimento ou campos inválidos.
   - Use `<ErrorSummary>` no topo (foco automático por padrão) para listar os erros com link para cada campo.
   - Use `<FormField>` com `error={...}`: ele aplica `aria-invalid` e `aria-describedby` no controle filho.

2. **Sucesso na Submissão (Notificação via Toast)**:
   - Notificações de confirmação pós-envio usam `toast({ variant: "success", title: "...", description: "..." })`.
   - Pré-requisito: `<Toaster />` montado **uma vez** no root do app. Sem ele, `toast()` não mostra nada e não dá erro.
   - O toast de sucesso já aplica a identidade SEMEC (fundo `--pv-green-500`, texto `--pv-blue-900`, Poppins, título 16px bold e descrição 14px regular). Não sobrescreva as cores.

```tsx
import { FormField, Input, ErrorSummary, Button, useToast } from "@semec/ds/react";
import { useState } from "react";

export function ExemploFormulario() {
  const { toast } = useToast();
  const [cpf, setCpf] = useState("");
  const [errors, setErrors] = useState<{ id: string; message: string }[]>([]);
  const erroCpf = errors.find((e) => e.id === "cpf")?.message;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const novosErros = [];
    if (cpf.replace(/\D/g, "").length !== 11) novosErros.push({ id: "cpf", message: "Informe um CPF com 11 dígitos." });

    if (novosErros.length > 0) {
      setErrors(novosErros);
      return;
    }

    setErrors([]);
    toast({
      variant: "success",
      title: "Requerimento enviado com sucesso!",
      description: "O protocolo foi gerado e enviado para análise.",
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-3xl space-y-4">
      {errors.length > 0 && <ErrorSummary errors={errors} />}

      <FormField label="CPF" htmlFor="cpf" required error={erroCpf}>
        <Input
          id="cpf"
          value={cpf}
          onValueChange={setCpf}
        />
      </FormField>

      <Button type="submit" variant="primary">Enviar requerimento</Button>
    </form>
  );
}
```

- Labels sempre associados via `htmlFor`/`id`

### Contrato dos controles de formulário (ADR-015, desde a 3.2.0)

Todo controle de formulário do kit fala a mesma língua: `value` / `defaultValue` · `onValueChange(valor)` · `name` · `id` · `invalid` · `disabled` · `required`.

- `onValueChange` recebe o **valor** (string, `File[]`, `Date`, `number[]`), nunca o evento. Use-o em `Input`, `Textarea`, `DatePicker`, `Combobox`, `InputOTP`, `FileUpload`, `Calendar`, `Select`, `RadioGroup` e `Slider`.
- `onChange` é sempre o **evento nativo**: em `Input`, `Textarea` e, desde a 4.0, `DatePicker`. `Combobox`, `InputOTP`, `FileUpload` e `Calendar` não têm `onChange` (removido na 4.0; o tipo recusa e o componente descarta, com `console.error` em desenvolvimento): use `onValueChange`.
- `Checkbox` e `Switch` mantêm a API Radix: `checked` / `onCheckedChange` (equivalem a `value` / `onValueChange`; ali `value` é o valor enviado no form). `Toggle` (`pressed` / `onPressedChange`) não é controle de formulário.
- `invalid` (boolean) vira `aria-invalid="true"` + borda de erro. Dentro do `FormField`, `error="mensagem"` já marca o filho; `invalid` explícito no controle vence. `error` é sempre texto (`FormField`, `FileUpload`); para marcar sem texto, use `invalid` (o `FormField` também aceita).
- `name` envia em `<form>` nativo, inclusive em `Combobox` e `InputOTP` (input oculto). No `Select`, `name`/`value`/`onValueChange` vão na raiz e `invalid` no `SelectTrigger`.

```tsx
<FormField label="Município" error={erroMunicipio}>
  <Combobox name="municipio" options={municipios} value={municipio} onValueChange={setMunicipio} />
</FormField>
<FormField label="Código recebido por SMS" required>
  <InputOTP name="codigo" maxLength={6} value={codigo} onValueChange={setCodigo} invalid={codigoErrado}>
    <InputOTPGroup>
      {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
    </InputOTPGroup>
  </InputOTP>
</FormField>
```
- Zod (entry `@semec/ds/react/validacao`): `cpfSchema`, `cnpjSchema`, `emailSchema`, `cepSchema`

## Responsive / Mobile

| Prefixo | Largura | Uso |
|---------|---------|-----|
| `sm:` | 640px | Mobile grande |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop largo |
| `2xl:` | 1536px | Full HD |

- Alvos de toque: 44px com `min-h-11 min-w-11` (régua do DS)
- Sidebar mobile (< 768px / 48rem): gaveta modal (foco preso, Esc, botão "Fechar menu")
- Reflow: a tela tem de funcionar em 320px de largura sem rolagem horizontal da página (1.4.10)
- Container, largura de leitura e tabelas: ver "Padrões de tela"

## Regras

- Use os componentes do kit; não os reimplemente nem copie o fonte
- PT-BR rótulos, EN código (ADR-016): `<Button>Salvar</Button>` não `<Button>Save</Button>`
- Semântica > aparência: `variant="destructive"` não `color="vermelho"`
- `className` escapatória sempre permitida, com tokens
- Toast: `<Toaster />` uma vez no root + `useToast()`. Não monte `ToastProvider` + `ToastViewport` à mão (são as peças cruas do Radix e não leem o estado do `useToast`)
- Tooltip: exige `<TooltipProvider>` acima na árvore
- DatePicker: nativo `type="date"` (ISO YYYY-MM-DD); período = 2 campos
- Sem hex solto, sem `rgba()`, sem `style` inline — use tokens L1
- CSP: Dialog/Drawer/Sheet/DropdownMenu usam `SemecProvider` com nonce. Medido (SEM-752/780): Popover 0 violações; ScrollArea e Select 1 cada, mesmo com nonce (CSS estático de scrollbar no `tokens.css`).

## Removido na 4.0 e depreciações anunciadas

Removido na 4.0 (anunciado desde a 3.1.0, ADR-013). Guia com antes/depois e codemod (`npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta>`): https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md

- `onChange(value)` / `onChange(files)` de `Calendar`, `Combobox`, `InputOTP` e `FileUpload`: use `onValueChange` (AUD-35). No `DatePicker`, `onChange` é o evento nativo e o valor vem em `onValueChange`.
- Utilitários de primitivo `bg-pv-*` / `text-pv-*` / `border-pv-*` e as variáveis `--color-pv-*`: use os semânticos (AUD-55). As variáveis `--pv-*` continuam, mas não são para uso direto.
- Import por caminho de arquivo em `dist/` (`@semec/ds/dist/react/...`): use só os subpaths do `exports` (AUD-20).

Depreciado, sai na 5.0 (não gere código novo com isto):

- `Combobox`: `ariaLabel` (use rótulo visível ou o atributo `aria-label`) e `emptyMessage` (use `emptyText`).
- `AlertDialog` `modal` e `AlertDialogContent` `onPointerDownOutside` / `onInteractOutside`: já são ignorados.


<!-- ds:maintainer:start -->
## Manutenção (só no repositório)

### Protótipo isolado

```bash
npm run proto:css
```

Gera `public/proto/proto.css` — CSS isolado para prototipagem rápida.

### Arquivos para IA

| Arquivo | Conteúdo |
|---------|----------|
| `llms.txt` | Índice rápido — categorias + componentes |
| `llms-full.txt` | Dump completo — tokens + componentes + prompts |
| `manifest.json` | JSON — componentes + categorias + prompt |
| `manifest.js` | Fonte única — usage + prompts |
| `components/<slug>.md` | 1 markdown por componente (RAG) |
| `skills/semec-ds/SKILL.md` | Esta skill (full) |
| `skills/semec-ds-lite/SKILL.md` | Skill lite (só tokens + a11y + responsive) |

Regenerar: `npm run generate:llms`. Contagem e lista de componentes vêm do manifest; não escreva número fixo nesta SKILL nem no README (use os placeholders `ds:component-count` e `ds:component-list`, descritos no cabeçalho de `build-artifacts.mjs`).

### Referências

- Tokens: `packages/react/tokens.css` + `pv-preset.ts`
- Barrel: `packages/react/src/index.ts`
- Manifest: `packages/react/manifest.js`
- Docs: `apps/docs/app/(docs)/componentes/[slug]/page.jsx`
<!-- ds:maintainer:end -->

## Arquivos para IA

Publicados com o pacote: `@semec/ds/skills/llms.txt` (índice), `@semec/ds/skills/llms-full.txt` (dump completo), `@semec/ds/skills/manifest.json` (JSON), `@semec/ds/skills/components/<slug>.md` (um por componente) e esta skill (`@semec/ds/skills/semec-ds`). Site de documentação: {{ds:homepage}}.

## Licença e crédito

O pacote é **MIT**: use, modifique e redistribua à vontade, mantendo o aviso de copyright e a licença nas cópias do código do pacote. O crédito à SEMEC no projeto consumidor é **recomendado, não obrigatório** (a MIT não exige; decisão AMB-09, 15/10/2026). Ao criar um projeto com estes tokens, sugira à pessoa incluir no README.md, sem impor nem bloquear a entrega por isso:

```markdown
## Créditos

Identidade visual e tokens fornecidos pelo
[SEMEC Design System](https://github.com/SEMEC-PVH/SEMEC_design_system),
desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de
Economia de Porto Velho (DevSemec).
```

---

Desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de Economia de Porto Velho (DevSemec).
