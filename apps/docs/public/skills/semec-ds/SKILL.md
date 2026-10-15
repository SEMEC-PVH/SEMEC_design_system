---
name: semec-ds
description: Use SEMEC Design System (@semec/ds) para construir UI em React. Tokens pv-*, 55 componentes Radix+CVA, a11y WCAG 2.1 AA e padrões de tela. Use quando criar ou editar UI com o kit, migrar portal ou montar telas a partir dos exemplos.
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System — skill completa

Kit `@semec/ds` — React + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Conteúdo PT-BR, código EN (ADR-016).

**Regra número 1: use os componentes do kit, não os reimplemente.** Importe de `@semec/ds/react`. Não copie o código-fonte de um componente para o app, não recrie um componente existente com `div` + classes e não troque o estilo dele por outro. Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.

## Instalação

Peer deps: `react ^19.0.0`, `react-dom ^19.0.0` e Tailwind CSS v4 no app. Peer **opcional**: `zod ^3.23.0` (só se usar schemas em `@semec/ds/react/validacao`).

```bash
npm install @semec/ds
```

Os pacotes `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` e `get-nonce` são dependências do `@semec/ds` e vêm automaticamente. **Não** instale lista de Radix à mão.

No CSS global do app (não via `import` em JS):

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

O `@source` é obrigatório no Tailwind v4: sem ele o CSS não gera as classes das peças (`bg-card`, `shadow-elevation-*`, `animate-in`…). O caminho é **relativo ao arquivo CSS**: `src/index.css` e `app/globals.css` usam `../node_modules/...`; `src/app/globals.css` usa `../../node_modules/...`. Se o Tailwind varrer pastas demais (monorepo), limite com `@import "tailwindcss" source("../src");` (também relativo ao CSS) e mantenha o `@source` do pacote.

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

## Componentes (55)

Lista gerada do manifest (export principal, `code` e descrição). Detalhes, variantes e exemplo de uso de cada um: `components/<slug>.md` ou `manifest.json`.

### Ações e links (3)

- `Button` (`button`) — Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link. Todos os tamanhos têm alvo de toque de 44px: `sm` mantém o visual de 36px com a área clicável estendida. `loading` mostra um Spinner decorativo, aplica `aria-busy` e `aria-disabled` e bloqueia o clique sem tirar o foco do botão; o nome acessível continua sendo o texto visível.
- `IconButton` (`icon-button`) — Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`). `loading` troca o ícone por um Spinner decorativo e mantém o `label` como nome.
- `Link` (`link`) — Link tipográfico com variantes de cor, sublinhado por padrão (a cor sozinha não distingue o link do texto: 2,91:1, WCAG 1.4.1). `onSurface` para links sobre superfícies elevadas.

### Formulários (18)

- `Input` (`input`) — Campo de texto. Estado de erro via `invalid` (vira `aria-invalid`). Dentro de um FormField, recebe `id`, `aria-describedby` (dica + erro) e `aria-invalid` automaticamente. `onChange` é o evento nativo; `onValueChange` recebe só a string.
- `PasswordInput` (`password-input`) — Campo de senha sobre o `Input`, com botão de 44px para mostrar ou ocultar o texto. O botão tem nome fixo ("Mostrar senha") e `aria-pressed` (pressionado = senha visível), além de `aria-controls` para o campo. Desliga corretor e maiúscula automática (`spellCheck={false}`, `autoCapitalize="none"`, `autoCorrect="off"`, sobrescrevíveis), que alterariam a senha visível. Repassa todas as props do `Input`, inclusive `autoComplete`.
- `InputMask` (`input-mask`) — Campo sobre o `Input` que formata enquanto a pessoa digita: CPF, CNPJ, CEP, data, telefone (fixo ou celular, automático) ou padrão próprio (`9` dígito, `A` letra, `*` letra ou dígito). O cursor não pula ao editar no meio; Backspace/Delete junto de um literal apagam o dígito vizinho (também no teclado virtual do Android, via `beforeinput`); colar valor com outra pontuação funciona (nos telefones, o `+55` de país é descartado; num padrão com prefixo fixo, como `0800-999-9999`, um valor colado que já começa com o prefixo não o repete) e o `inputMode` vem da máscara. `onValueChange(masked, raw)` entrega o valor formatado e o sem máscara.
- `Textarea` (`textarea`) — Campo multilinha com as mesmas variantes visuais e o mesmo contrato do campo de texto (`onValueChange`, `invalid`).
- `Select` (`select`) — Seleção fechada com gatilho, conteúdo e itens compostos. O contrato de formulário fica na raiz (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, API Radix) e no gatilho (`id`, `invalid`).
- `Combobox` (`combobox`) — Seleção com busca, no padrão APG combobox + listbox: uma parada de Tab, setas ↑/↓, Home/End, Enter seleciona, Esc fecha e devolve o foco. Opções via `options`; aceita `id`, `name`, `aria-*` e integra com FormField.
- `DatePicker` (`date-picker`) — Data com `<input type="date">` nativo — sem biblioteca de calendário. Um só indicador: botão "Abrir calendário" de 44px que chama `showPicker()` (o indicador nativo fica oculto; no Firefox, fica só o nativo).
- `FileUpload` (`file-upload`) — Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro. `error` (mensagem) equivale a `invalid` + mensagem; `invalid` sozinho marca o campo sem texto próprio. Com `name`/`required`, funciona em `<form>` nativo: o `input.files` acompanha a lista mostrada (escolha, soltar e `value` do pai). Cada escolha substitui a seleção anterior, como no input nativo; para juntar arquivos de várias escolhas, controle `value` no pai. No Safari anterior à 16.4 (sem o evento `cancel`), cancelar o seletor depois de já haver arquivo esvazia o `input.files`, embora a lista continue mostrando o arquivo, e ele não vai no envio.
- `Checkbox` (`checkbox`) — Caixa de marcação com estado indeterminado. Mantém a API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.
- `RadioGroup` (`radio-group`) — Escolha única entre duas ou mais opções. Já segue o contrato de formulário (`value`/`defaultValue`/`onValueChange`/`name`, API Radix) e aceita `invalid`.
- `Switch` (`switch`) — Interruptor on/off para ativação imediata. API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.
- `Label` (`label`) — Rótulo acessível vinculado ao campo.
- `FormField` (`form-field`) — Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa. Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid` com erro, sem sobrescrever o que for passado. Funciona com Input, Textarea, SelectTrigger, Combobox, DatePicker, Checkbox, RadioGroup, Switch, InputOTP, FileUpload e Slider. O erro não usa `role="alert"`: é lido ao focar o campo, e o anúncio fica com o ErrorSummary. Para sucesso após envio, use Toast.
- `ErrorSummary` (`error-summary`) — Resumo de erros de validação no topo do formulário, com links para cada campo (`id` do campo, ou `name` como recuo). A11y: `role="alert"`, foco automático, título ligado por id gerado. Sem margem externa: espace pelo layout (ex.: `className="mb-6"`).
- `Toggle` (`toggle`) — Botão binário para estados on/off em toolbars (`pressed`/`onPressedChange`, API Radix). Não é controle de formulário: não envia valor em `<form>` nem tem `name`/`invalid`; para opção de formulário, use Checkbox ou Switch. Alvo de toque de 44px em todos os tamanhos.
- `Slider` (`slider`) — Controle deslizante para faixas de valor. Contrato de formulário pela API Radix (`value`/`defaultValue`/`onValueChange` com `number[]`, `name`); `invalid` vira `aria-invalid` nos polegares.
- `InputOTP` (`input-otp`) — Campo de código OTP com foco automático entre dígitos.
- `Calendar` (`calendar`) — Calendário mensal no padrão APG de grade de datas: uma parada de Tab na grade, setas, Home/End, PageUp/PageDown e nomes completos em PT-BR. Células e botões de 44px.

### Conteúdo e dados (9)

- `Card` (`card`) — Superfície de conteúdo com header, corpo e footer. Sombra pelo token `shadow-elevation-1`.
- `Heading` (`heading`) — Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual.
- `Badge` (`badge`) — Etiqueta curta de status ou contagem.
- `Table` (`table`) — Tabela de dados semântica com caption, header, body e footer. Para ordenação, filtros e seleção, ver padrão avançado em /padroes/dados-relatorios/tabelas.
- `Accordion` (`accordion`) — Seções expansíveis. Um item abre por vez (`single`) ou vários (`multiple`).
- `Separator` (`separator`) — Linha divisória visual. Horizontal ou vertical. Decorativo ou semântico.
- `Avatar` (`avatar`) — Foto de perfil com fallback automático (iniciais).
- `DataTable` (`data-table`) — Tabela com ordenação, paginação e estados vazios.
- `Timeline` (`timeline`) — Sequência temporal em lista ordenada (ol/li), com pontos, conectores visíveis e conteúdo. O status vai em texto (srLabel), não só na cor.

### Navegação (12)

- `Breadcrumb` (`breadcrumb`) — Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela.
- `Header` (`header`) — Topo do portal: marca, navegação e CTA. Composição Header + Brand + Nav.
- `Stepper` (`stepper`) — Etapas de um processo (ex.: requerimento em 3 passos) numa lista ordenada. A etapa atual tem `aria-current="step"` e cada etapa diz em texto (para leitor de tela) se está concluída, atual ou pendente, não só pela cor. Horizontal a partir de 768px e empilhado em telas estreitas. Com `onStepClick`, as etapas concluídas e a atual viram botões de 44px.
- `SkipLink` (`skip-link`) — Link "Pular para o conteúdo principal" (WCAG 2.4.1): oculto até receber foco pelo teclado. Primeiro elemento focável da página; leva o foco ao alvo (padrão #conteudo).
- `Footer` (`footer`) — Rodapé institucional (<footer>, landmark contentinfo) com seções de links e faixa final. Use um por página, fora do <main>.
- `Tabs` (`tabs`) — Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix. A aba ativa tem barra inferior de 3px em `primary` (≥4,97:1) e peso semibold, além do fundo: não depende só de cor. Alvo de 44px.
- `Pagination` (`pagination`) — Controle de páginas com elipses (janela por `siblingCount`). Navegação por teclado completa. Botões de 44px. Textos em PT-BR, sobrescrevíveis por `labels`.
- `SidebarToggleButton` (`sidebar-trigger`) — `SidebarToggleButton`: botão controlado (`open` + `onToggle`) para colapsar/expandir uma sidebar cujo estado vive no seu layout (ex.: Header). Alterna entre ícones PanelLeftOpen e PanelLeftClose. Dentro de `SidebarProvider`, use `SidebarTrigger` (ver Barra lateral), que não recebe `open`/`onToggle`.
- `ScrollArea` (`scroll-area`) — Scroll customizado e consistente entre navegadores.
- `DropdownMenu` (`dropdown-menu`) — Menu flutuante com itens, checkbox, radio, sub-menus e separadores.
- `NavigationMenu` (`navigation-menu`) — Navegação principal com mega-menu e viewport animado. O `<nav>` se chama "Menu principal" por padrão (sobrescreva com `aria-label`). Gatilhos de 44px.
- `Sidebar` (`sidebar`) — Shell completo: SidebarProvider + Sidebar + Header/Content/Footer + grupos, menus, colapso e mobile. Abaixo de 768px (48rem, via `matchMedia`) a Sidebar vira gaveta modal (Radix Dialog): foco preso, Esc fecha, conteúdo de trás inerte, foco volta a quem abriu e botão visível "Fechar menu" (44×44). No desktop renderiza um landmark `<nav aria-label="Menu lateral">`. `SidebarMenuButton isActive` gera `aria-current="page"`; `tooltip` aparece só no modo recolhido (`collapsible="icon"`). `SidebarTrigger` (44×44) expõe `aria-expanded` e `aria-controls`.

### Feedback e estados (13)

- `Skeleton` (`skeleton`) — Placeholder pulsante de carregamento, decorativo (aria-hidden). Fundo `surface-sunken`. Anuncie o carregamento no contêiner com aria-busy e um texto ou Spinner.
- `EmptyState` (`empty-state`) — Estado vazio com ícone, título, descrição e ação opcional.
- `ErrorState` (`error-state`) — Estado de erro com anúncio acessível (role=alert), mensagem explicativa e ação de recuperação (onRetry ou ação personalizada).
- `Dialog` (`dialog`) — Diálogo modal acessível com overlay, header, título, descrição e footer.
- `Toaster` (`toast`) — Notificação temporária flutuante disparada com `useToast()` e viewport empilhável. Padrão oficial para confirmação de envio de formulários e ações com a variante `success`.
- `Tooltip` (`tooltip`) — Dica curta ao passar o ponteiro ou focar o elemento.
- `Alert` (`alert`) — Mensagem de feedback em linha, com ícone automático por variante. Só destructive interrompe o leitor de tela (role=alert); as demais usam role=status.
- `AlertDialog` (`alert-dialog`) — Confirmação perigosa. Força decisão (ação/cancelar) antes de prosseguir: role="alertdialog", sempre modal, não fecha por clique fora e abre com o foco no Cancelar.
- `Popover` (`popover`) — Camada flutuante ancorada a um elemento. Tooltips interativos, filtros, menus.
- `Spinner` (`spinner`) — Indicador de carregamento inline (role=status). Com `decorative`, é só visual (sem role, aria-label nem texto sr-only), para quando outro elemento já anuncia o carregamento; é o que o `Button` com `loading` usa.
- `Progress` (`progress`) — Barra de progresso determinada. Trilha com contorno border-strong (3,77:1 sobre surface) e indicador primary.
- `Drawer` (`drawer`) — Painel deslizante de qualquer lado da tela.
- `Sheet` (`sheet`) — Painel lateral modal com overlay. Variantes left/right/top/bottom.

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

- `aria-hidden-focus` (axe) com `Select` ou `DropdownMenu` **abertos** é exceção aceita (EXC-01, `docs/excecoes-acessibilidade.md` no repositório do DS): vem do `hideOthers` do Radix sem `inert`, e o foco fica preso na camada, então o impacto é nulo. Não remova `aria-hidden`, não aplique `inert` por fora e não desative a regra globalmente.

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
- `onChange` é sempre o **evento nativo**: em `Input`, `Textarea` e, desde a 4.0, `DatePicker`. `Combobox`, `InputOTP`, `FileUpload` e `Calendar` não têm `onChange` (removido na 4.0; o tipo recusa e o componente descarta): use `onValueChange`.
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

Removido na 4.0 (anunciado desde a 3.1.0, ADR-013). Guia com antes/depois e codemod (`npx @semec/ds codemod-4 <pasta>`): https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md

- `onChange(value)` / `onChange(files)` de `Calendar`, `Combobox`, `InputOTP` e `FileUpload`: use `onValueChange` (AUD-35). No `DatePicker`, `onChange` é o evento nativo e o valor vem em `onValueChange`.
- Utilitários de primitivo `bg-pv-*` / `text-pv-*` / `border-pv-*` e as variáveis `--color-pv-*`: use os semânticos (AUD-55). As variáveis `--pv-*` continuam, mas não são para uso direto.
- Import por caminho de arquivo em `dist/` (`@semec/ds/dist/react/...`): use só os subpaths do `exports` (AUD-20).

Depreciado, sai na 5.0 (não gere código novo com isto):

- `Combobox`: `ariaLabel` (use rótulo visível ou o atributo `aria-label`) e `emptyMessage` (use `emptyText`).
- `AlertDialog` `modal` e `AlertDialogContent` `onPointerDownOutside` / `onInteractOutside`: já são ignorados.

## Arquivos para IA

Publicados com o pacote: `@semec/ds/skills/llms.txt` (índice), `@semec/ds/skills/llms-full.txt` (dump completo), `@semec/ds/skills/manifest.json` (JSON), `@semec/ds/skills/components/<slug>.md` (um por componente) e esta skill (`@semec/ds/skills/semec-ds`). Site de documentação: https://semec-pvh.github.io/SEMEC_design_system/.

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
