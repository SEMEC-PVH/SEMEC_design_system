---
name: semec-ds
description: Use SEMEC Design System (@semec/ds) para construir UI em React. Tokens pv-*, 55 componentes Radix+CVA, a11y WCAG 2.1 AA e padrões de tela. Use quando criar ou editar UI com o kit, migrar portal ou montar telas a partir dos exemplos.
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System — skill completa

> Gerado para `@semec/ds@4.2.0` (versão do `package.json` no build). Se o app tiver outra versão instalada (`npm ls @semec/ds`), o que vale é o README dela.

> **Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.2.1. Confira a versão instalada com `npm ls @semec/ds`.**

Kit `@semec/ds` — React + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Conteúdo PT-BR, código EN (ADR-016).

App em Vue, Angular, Svelte ou HTML sem React: use a skill lite (`@semec/ds/lite/skills/semec-ds-lite`), que traz só tokens, acessibilidade e padrões visuais.

**Regra número 1: use os componentes do kit, não os reimplemente.** Importe de `@semec/ds/react`. Não copie o código-fonte de um componente para o app, não recrie um componente existente com `div` + classes e não troque o estilo dele por outro. Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.

## Instalação

Peer deps obrigatórios: `react ^19.0.0`, `react-dom ^19.0.0`, `tailwindcss ^4.0.0` e `lucide-react >=0.468.0 <2`. Peer **opcional**: `zod ^3.23.0 || ^4.0.0` (só se usar schemas em `@semec/ds/react/validacao`).

```bash
npm install @semec/ds lucide-react   # pnpm add / yarn add: mesmos pacotes
```

Instale `lucide-react` **sempre** junto: é peer (os componentes importam os ícones), e sem ele o build quebra. O npm 7+ instala peer ausente sozinho; o pnpm só com `auto-install-peers=true`; o Yarn (clássico e Berry) nunca. Os pacotes `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge` e `get-nonce` são dependências do `@semec/ds` e vêm automaticamente. **Não** instale lista de Radix à mão.

Formulários com a receita oficial (React Hook Form + Zod, seção "Padrão de formulários"): instale também os pacotes da receita, que são **opcionais** e não vêm com o kit:

```bash
npm install react-hook-form @hookform/resolvers@^5 zod@^4
```

**Tailwind v4 no bundler:**

- **Vite:** `npm install -D tailwindcss @tailwindcss/vite`, `plugins: [react(), tailwindcss()]` no `vite.config.ts` (`import tailwindcss from "@tailwindcss/vite"`). O CSS global é o `src/index.css`: troque o conteúdo do template pelas linhas abaixo e apague o `import "./App.css"`. No `index.html`, troque `<html lang="en">` por `<html lang="pt-BR">`.
- **Next.js (`create-next-app`):** o Tailwind já vem (`@tailwindcss/postcss`, ou `@tailwindcss/turbopack` sem `postcss.config` no `create-next-app` 16.4; os dois funcionam igual). Em `app/globals.css`, **apague** o que o template gerou (`:root`, `@theme inline` com `--font-sans: var(--font-geist-sans)`, `@media (prefers-color-scheme: dark)`, `body { font-family: Arial… }`): fora de camada, eles vencem o `@layer base` do `tokens.css` e o app fica com Arial e as cores do template. Em `app/layout.tsx`, apague o `next/font/google` Geist e as classes `geist*.variable` do `<body>`, e use `<html lang="pt-BR">`. No `logo` do `HeaderBrand`, o `<img>` dos exemplos gera o aviso de lint `@next/next/no-img-element`; troque por `<Image>` do `next/image` (com `alt`) ou ignore o aviso para SVG estático.

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

**Next.js App Router:** desde a 3.2 o `dist` sai por módulo e cada componente interativo já traz `"use client"`; importar `@semec/ds/react` num Server Component funciona (apresentacionais como `Heading`, `Card`, `Badge`, `Button`, `Link`, `Table` renderizam no servidor). Passar handler (`onClick`, `onValueChange`…) ou usar hook continua exigindo um arquivo `"use client"` seu. Não use `export *` do kit num arquivo `"use client"`. Um componente só: `@semec/ds/react/<arquivo>` (ex.: `@semec/ds/react/button`). Peso no cliente: com Turbopack (padrão do Next 16) e kit 4.2.1+, a raiz num Server Component custa o mesmo que o subpath; com `next build --webpack` ou kit 4.2.0, prefira o subpath nos Server Components (ou `experimental.optimizePackageImports: ["@semec/ds/react"]`), senão o kit inteiro vai para o cliente. Na 3.0/3.1 (bundle único, sem `"use client"`) o kit só funcionava em arquivos `"use client"`.

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

**Espaçamento:** `--space-N` → `p-space-N`, `gap-space-N`, `mt-space-N` etc. (degraus 0, 1, 2, 3, 4, 6, 8, 12, 16). A escala do Tailwind continua valendo e tem os mesmos valores (`p-4` = `p-space-4` = 16px); use esses degraus no layout do app. Exceções do kit que devem ser preservadas: botão médio `px-5` (20px), botão pequeno `py-1.5` (6px) e `FormField` `gap-1.5` (6px).

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
| `text-xs` | 12px | Etiqueta, dica e mensagem de erro; rótulo de campo usa `text-sm font-medium` (14px) |

Pesos: `font-regular` 400, `font-medium` 500, `font-semibold` 600, `font-bold` 700 (não existem 800/900).

**Raio:** `rounded-sm` 2px · `rounded-md` 8px · `rounded-lg` 12px · `rounded-full`. Escolha pelo papel (controle de entrada (campo, select) `rounded-md`, botão `rounded-full` (pílula), cartão e diálogo `rounded-lg`). A escala é fixa (decisão de 15/10/2026); não use `rounded-xl` ou acima, que ficam fora dela.

**Sombra:** `shadow-elevation-1/2/3` (nunca `shadow-md` e afins do Tailwind, que usam preto puro).

**Movimento:** `duration-fast/base/slow`, `ease-standard`.

## Lib utilities

```tsx
import { cn } from "@semec/ds/react"; // a partir da 3.1.0 (na 3.0.0 não era exportado)
import { maskCPF, maskCNPJ, maskCEP, maskCurrency } from "@semec/ds/react";
import { validateCPF, validateCNPJ, validateEmail } from "@semec/ds/react";
import { cpfSchema, cnpjSchema, cpfCnpjSchema, emailSchema, cepSchema } from "@semec/ds/react/validacao";
```

As máscaras têm a mesma assinatura, `(value: string) => string` (tipo `MaskFn`): recebem o texto digitado (com ou sem máscara) e devolvem o texto formatado. Aplique no `onValueChange` do `Input`: `onValueChange={(v) => setValor(maskCurrency(v))}`.

- `maskCPF` → `000.000.000-00` · `maskCNPJ` → `00.000.000/0000-00` · `maskCEP` → `00000-000` (só os dígitos contam; o excesso é cortado).
- `maskCurrency(value: string): string` → moeda BRL: guarda até 12 dígitos e lê os 2 últimos como centavos (`"123456"` → `"R$ 1.234,56"`). Entrada sem dígitos significativos (`""`, `"abc"`, só zeros como `"R$ 0,0"` ao apagar com Backspace) devolve `""` (desde a 4.1.0; até a 4.0.1 devolvia `"R$ 0,00"`), então o campo volta a vazio e `z.string().min(1)` barra o envio. A saída vem do `Intl` (`toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`), com espaço não separável (U+00A0) depois de `R$`: compare com o mesmo `Intl` ou só com os dígitos, nunca com um literal digitado com espaço comum. O valor é texto: converta para número no envio (`Number(valor.replace(/\D/g, "")) / 100`).

```tsx
import { useState } from "react";
import { FormField, Input, maskCurrency } from "@semec/ds/react";

const [valor, setValor] = useState("");

<FormField label="Valor da taxa" htmlFor="valor" required hint="Somente números; os centavos entram sozinhos">
  <Input id="valor" inputMode="numeric" value={valor} onValueChange={(v) => setValor(maskCurrency(v))} />
</FormField>
```

Com React Hook Form, o campo R$ está no exemplo canônico (seção "Padrão de formulários").

## Componentes (55)

Lista gerada do manifest (export principal, `code`, arquivo `.md` e descrição). Detalhes, variantes e exemplo de uso de cada um: o `components/<slug>.md` indicado em cada linha (o slug é em português, ex.: `DataTable` → `components/tabela-de-dados.md`) ou `manifest.json`.

### Ações e links (3)

- `Button` (`button`, `components/botoes.md`) — Ação principal. Sete variantes e quatro tamanhos; `asChild` transforma o botão num link. Todos os tamanhos têm alvo de toque de 44px: `sm` mantém o visual de 36px com a área clicável estendida. A altura é mínima (`min-h-*`), não fixa: rótulo longo quebra em linhas balanceadas em vez de criar rolagem horizontal; para reduzir a altura com `className`, sobrescreva o `min-h-*` junto com o `h-*`. `loading` mostra um Spinner decorativo, aplica `aria-busy` e `aria-disabled` e bloqueia o clique sem tirar o foco do botão; o nome acessível continua sendo o texto visível.
- `IconButton` (`icon-button`, `components/botao-de-icone.md`) — Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`). `loading` troca o ícone por um Spinner decorativo e mantém o `label` como nome.
- `Link` (`link`, `components/link.md`) — Link tipográfico com variantes de cor, sublinhado por padrão (a cor sozinha não distingue o link do texto: 2,91:1, WCAG 1.4.1). `onSurface` para links sobre superfícies elevadas.

### Formulários (18)

- `Input` (`input`, `components/caixa-de-texto.md`) — Campo de texto. Estado de erro via `invalid` (vira `aria-invalid`). Dentro de um FormField, recebe `id`, `aria-describedby` e `aria-invalid` automaticamente: sem erro, `aria-describedby` aponta para a dica; com erro, a dica sai e ele aponta só para a mensagem de erro. `onChange` é o evento nativo; `onValueChange` recebe só a string.
- `PasswordInput` (`password-input`, `components/campo-de-senha.md`) — Campo de senha sobre o `Input`, com botão de 44px para mostrar ou ocultar o texto. O botão tem nome fixo ("Mostrar senha") e `aria-pressed` (pressionado = senha visível), além de `aria-controls` para o campo. Desliga corretor e maiúscula automática (`spellCheck={false}`, `autoCapitalize="none"`, `autoCorrect="off"`, sobrescrevíveis), que alterariam a senha visível. Repassa todas as props do `Input`, inclusive `autoComplete`.
- `InputMask` (`input-mask`, `components/campo-com-mascara.md`) — Campo sobre o `Input` que formata enquanto a pessoa digita: CPF, CNPJ, CEP, data, telefone (fixo ou celular, automático) ou padrão próprio (`9` dígito, `A` letra, `*` letra ou dígito). O cursor não pula ao editar no meio; Backspace/Delete junto de um literal apagam o dígito vizinho (também no teclado virtual do Android, via `beforeinput`); colar valor com outra pontuação funciona (nos telefones, o `+55` de país é descartado; num padrão com prefixo fixo, como `0800-999-9999`, um valor colado que já começa com o prefixo não o repete) e o `inputMode` vem da máscara. `onValueChange(masked, raw)` entrega o valor formatado e o sem máscara.
- `Textarea` (`textarea`, `components/area-de-texto.md`) — Campo multilinha com as mesmas variantes visuais e o mesmo contrato do campo de texto (`onValueChange`, `invalid`).
- `Select` (`select`, `components/menu-de-selecao.md`) — Seleção fechada com gatilho, conteúdo e itens compostos. O contrato de formulário fica na raiz (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, API Radix) e no gatilho (`id`, `invalid`).
- `Combobox` (`combobox`, `components/combobox.md`) — Seleção com busca, no padrão APG combobox + listbox: uma parada de Tab, setas ↑/↓, Home/End, Enter seleciona, Esc fecha e devolve o foco. Opções via `options`; aceita `id`, `name`, `aria-*` e integra com FormField.
- `DatePicker` (`date-picker`, `components/seletor-de-data.md`) — Data com `<input type="date">` nativo — sem biblioteca de calendário. Um só indicador: botão "Abrir calendário" de 44px que chama `showPicker()` (o indicador nativo fica oculto; no Firefox, fica só o nativo). O formato mostrado (dd/mm/aaaa ou mm/dd/aaaa) vem do idioma do navegador, não do `lang` da página: nos PCs da prefeitura, deixe o navegador em português. Num navegador sem `type="date"` o campo vira texto e `onValueChange` recebe o que foi digitado, então valide o ISO no schema (ex.: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`). Em teste automatizado, preencha com `fill("2026-10-16")`, não digitando a data.
- `FileUpload` (`file-upload`, `components/envio-de-arquivos.md`) — Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro. `error` (mensagem) equivale a `invalid` + mensagem; `invalid` sozinho marca o campo sem texto próprio. Com `name`/`required`, funciona em `<form>` nativo: o `input.files` acompanha a lista mostrada (escolha, soltar e `value` do pai). Cada escolha substitui a seleção anterior, como no input nativo; para juntar arquivos de várias escolhas, controle `value` no pai. No Safari anterior à 16.4 (sem o evento `cancel`), cancelar o seletor depois de já haver arquivo esvazia o `input.files`, embora a lista continue mostrando o arquivo, e ele não vai no envio.
- `Checkbox` (`checkbox`, `components/caixa-de-marcacao.md`) — Caixa de marcação com estado indeterminado. Mantém a API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.
- `RadioGroup` (`radio-group`, `components/botao-de-opcao.md`) — Escolha única entre duas ou mais opções. Já segue o contrato de formulário (`value`/`defaultValue`/`onValueChange`/`name`, API Radix) e aceita `invalid`.
- `Switch` (`switch`, `components/interruptor.md`) — Interruptor on/off para ativação imediata. API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.
- `Label` (`label`, `components/rotulo.md`) — Rótulo acessível vinculado ao campo.
- `FormField` (`form-field`, `components/campo-de-formulario.md`) — Estrutura do campo: label, obrigatório (*), dica e mensagem de erro na ordem a11y correta. Integra-se ao react-hook-form (via Controller ou register) e esquemas Zod (@semec/ds/react/validacao). Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (sem erro, a dica; com erro, a dica sai e ele aponta só para a mensagem de erro) e `aria-invalid`. Suporta três padrões de erro: inline, resumo no topo com ErrorSummary e falha de servidor com Alert. Inclui padrão para legenda auxiliar de ação/download em botões de envio.
- `ErrorSummary` (`error-summary`, `components/error-summary.md`) — Resumo de erros de validação no topo do formulário, com links para cada campo (`id` do campo, ou `name` como recuo). A11y: `role="alert"`, foco automático só quando o `focusKey` muda (passe `focusKey={tentativa}`, somado a cada envio inválido; sem `focusKey`, foca ao passar de 0 para N erros). O resumo que some e volta enquanto a pessoa digita não rouba o foco. Título ligado por id gerado. Liste os itens na ordem dos campos na tela; com React Hook Form, use `shouldFocusError: false`. Sem margem externa: espace pelo layout (ex.: `className="mb-6"`).
- `Toggle` (`toggle`, `components/toggle.md`) — Botão binário para estados on/off em toolbars (`pressed`/`onPressedChange`, API Radix). Não é controle de formulário: não envia valor em `<form>` nem tem `name`/`invalid`; para opção de formulário, use Checkbox ou Switch. Alvo de toque de 44px em todos os tamanhos. Ligado = fundo `tint` + contorno de 2px em `primary` (5,00:1 sobre `--bg`, 5,42:1 sobre branco) e texto `foreground`; o estado vai ao leitor de tela por `aria-pressed`.
- `Slider` (`slider`, `components/slider.md`) — Controle deslizante para faixas de valor. Contrato de formulário pela API Radix (`value`/`defaultValue`/`onValueChange` com `number[]`, `name`); `invalid` vira `aria-invalid` nos polegares.
- `InputOTP` (`input-otp`, `components/input-otp.md`) — Campo de código OTP com foco automático entre dígitos.
- `Calendar` (`calendar`, `components/calendario.md`) — Calendário mensal no padrão APG de grade de datas: uma parada de Tab na grade, setas, Home/End, PageUp/PageDown e nomes completos em PT-BR. Células e botões de 44px.

### Conteúdo e dados (9)

- `Card` (`card`, `components/cartao.md`) — Superfície de conteúdo com header, corpo e footer. Sombra pelo token `shadow-elevation-1`.
- `Heading` (`heading`, `components/titulo.md`) — Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual. Escala: 1 = `text-3xl` (32px, título da página), 2 = `text-2xl` (24px), 3 = `text-xl` (20px), 4 = `text-base`, 5 = `text-sm`, 6 = `text-xs` em caixa alta.
- `Badge` (`badge`, `components/etiqueta.md`) — Etiqueta curta de status ou contagem.
- `Table` (`table`, `components/tabela.md`) — Tabela de dados semântica com caption, header, body e footer. Para ordenação, filtros e seleção, ver https://semec-pvh.github.io/SEMEC_design_system/padroes/dados-relatorios/tabelas/. Se houver rolagem horizontal, use uma região nomeada e focável, como no exemplo, e teste Tab e setas em tela estreita.
- `Accordion` (`accordion`, `components/acordeao.md`) — Seções expansíveis. Um item abre por vez (`single`) ou vários (`multiple`).
- `Separator` (`separator`, `components/separador.md`) — Linha divisória visual. Horizontal ou vertical. Decorativo ou semântico.
- `Avatar` (`avatar`, `components/avatar.md`) — Foto de perfil com fallback automático (iniciais). Com a foto quebrada, o `AvatarFallback` anuncia o `alt` da `AvatarImage` (as iniciais ficam só visuais); um `aria-label` no `AvatarFallback` continua aceito e tem prioridade.
- `DataTable` (`data-table`, `components/tabela-de-dados.md`) — Tabela com ordenação, paginação e estados vazios. Com `onRowClick`, passe `rowLabel` para dar nome à linha clicável.
- `Timeline` (`timeline`, `components/timeline.md`) — Sequência temporal em lista ordenada (ol/li), com pontos, conectores visíveis e conteúdo. O status vai em texto (srLabel), não só na cor.

### Navegação (12)

- `Breadcrumb` (`breadcrumb`, `components/trilha-de-navegacao.md`) — Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela.
- `Header` (`header`, `components/cabecalho.md`) — Topo do portal: marca, navegação e CTA. Composição Header + Brand + Nav.
- `Stepper` (`stepper`, `components/etapas.md`) — Etapas de um processo (ex.: requerimento em 3 passos) numa lista ordenada. A etapa atual tem `aria-current="step"` e cada etapa diz em texto (para leitor de tela) se está concluída, atual ou pendente, não só pela cor. Horizontal a partir de 768px e empilhado em telas estreitas. Com `onStepClick`, as etapas concluídas e a atual viram botões de 44px.
- `SkipLink` (`skip-link`, `components/link-para-o-conteudo.md`) — Link "Pular para o conteúdo principal" (WCAG 2.4.1): oculto até receber foco pelo teclado. Primeiro elemento focável da página; leva o foco ao alvo (padrão #conteudo).
- `Footer` (`footer`, `components/rodape.md`) — Rodapé institucional (<footer>, landmark contentinfo) com seções de links e faixa final. Use um por página, fora do <main>.
- `Tabs` (`tabs`, `components/abas.md`) — Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix. A aba ativa tem barra inferior de 3px em `primary` (≥4,97:1) e peso semibold, além do fundo: não depende só de cor. Alvo de 44px.
- `Pagination` (`pagination`, `components/paginacao.md`) — Controle de páginas com elipses (janela por `siblingCount`). Navegação por teclado completa. Botões de 44px que não encolhem. Abaixo de `sm` ficam só as setas e a página atual ± 1 (primeira, última e elipses ocultas). Textos em PT-BR, sobrescrevíveis por `labels`.
- `SidebarToggleButton` (`sidebar-trigger`, `components/gatilho-da-barra-lateral.md`) — `SidebarToggleButton`: botão controlado (`open` + `onToggle`) para colapsar/expandir uma sidebar cujo estado vive no seu layout (ex.: Header). Alterna entre ícones PanelLeftOpen e PanelLeftClose. Dentro de `SidebarProvider`, use `SidebarTrigger` (ver Barra lateral), que não recebe `open`/`onToggle`.
- `ScrollArea` (`scroll-area`, `components/scroll-area.md`) — Scroll customizado e consistente entre navegadores. A região rolável é alcançável pelo teclado: sem nada focável dentro (ex.: texto puro), a viewport vira parada de Tab com anel de foco (`focusable="auto"`, o padrão). Dê nome à região com `viewportProps={{ "aria-label": "…" }}`.
- `DropdownMenu` (`dropdown-menu`, `components/menu-suspenso.md`) — Menu flutuante com itens, checkbox, radio, sub-menus e separadores.
- `NavigationMenu` (`navigation-menu`, `components/menu-de-navegacao.md`) — Navegação principal com mega-menu e viewport animado. O `<nav>` se chama "Menu principal" por padrão (sobrescreva com `aria-label`). Gatilhos de 44px. O `NavigationMenuLink` já vem estilizado: alvo de 44px (`min-h-11`), `px-4`, hover/foco em `tint` e anel de foco por dentro; `active` marca a página atual com `aria-current="page"`.
- `Sidebar` (`sidebar`, `components/sidebar.md`) — Shell completo: SidebarProvider + Sidebar + Header/Content/Footer + grupos, menus, colapso e mobile. Abaixo de 768px (48rem, via `matchMedia`) a Sidebar vira gaveta modal (Radix Dialog): foco preso, Esc fecha, conteúdo de trás inerte, foco volta a quem abriu e botão visível "Fechar menu" (44×44). No desktop renderiza um landmark `<nav aria-label="Menu lateral">`. `SidebarMenuButton isActive` gera `aria-current="page"`; `tooltip` aparece só no modo recolhido (`collapsible="icon"`). `SidebarTrigger` (44×44) expõe `aria-expanded` e `aria-controls`.

### Feedback e estados (13)

- `Skeleton` (`skeleton`, `components/esqueleto.md`) — Placeholder pulsante de carregamento, decorativo (aria-hidden). Fundo `surface-sunken`. Anuncie o carregamento no contêiner com aria-busy e um texto ou Spinner.
- `EmptyState` (`empty-state`, `components/estado-vazio.md`) — Estado vazio com ícone, título, descrição e ação opcional.
- `ErrorState` (`error-state`, `components/estado-de-erro.md`) — Estado de erro com anúncio acessível (role=alert), mensagem explicativa e ação de recuperação (onRetry ou ação personalizada).
- `Dialog` (`dialog`, `components/modal.md`) — Diálogo modal acessível com overlay, header, título, descrição e footer.
- `Toaster` (`toast`, `components/notificacao.md`) — Notificação temporária flutuante disparada com `useToast()` e viewport empilhável. Padrão oficial para confirmação de envio de formulários e ações com a variante `success`.
- `Tooltip` (`tooltip`, `components/dica.md`) — Dica curta ao passar o ponteiro ou focar o elemento.
- `Alert` (`alert`, `components/aviso.md`) — Mensagem de feedback em linha, com ícone automático por variante. Só destructive interrompe o leitor de tela (role=alert); as demais usam role=status.
- `AlertDialog` (`alert-dialog`, `components/dialogo-de-alerta.md`) — Confirmação perigosa. Força decisão (ação/cancelar) antes de prosseguir: role="alertdialog", sempre modal, não fecha por clique fora e abre com o foco no Cancelar.
- `Popover` (`popover`, `components/popover.md`) — Camada flutuante ancorada a um elemento. Tooltips interativos, filtros, menus.
- `Spinner` (`spinner`, `components/spinner.md`) — Indicador de carregamento inline (role=status). Com `decorative`, é só visual (sem role, aria-label nem texto sr-only), para quando outro elemento já anuncia o carregamento; é o que o `Button` com `loading` usa.
- `Progress` (`progress`, `components/progress.md`) — Barra de progresso determinada. Trilha com contorno border-strong (3,77:1 sobre surface) e indicador primary.
- `Drawer` (`drawer`, `components/drawer.md`) — Painel deslizante de qualquer lado da tela.
- `Sheet` (`sheet`, `components/sheet.md`) — Painel lateral modal com overlay. Variantes left/right/top/bottom.

## Comportamentos fixos do kit

Coisas que o componente faz sozinho e que mudam como você monta a tela. Leve em conta antes de acrescentar `role`, títulos ou landmarks por fora.

- **Anúncios:** o `Alert` usa `role="alert"` (assertivo) só em `variant="destructive"`; as demais variantes usam `role="status"` (educado). A prop `announce` controla isso quando o padrão não serve (ex.: alerta estático que não deve ser anunciado). O `ErrorSummary` e o `ErrorState` são anunciados; o erro do `FormField` é lido ao focar o campo (via `aria-describedby`) e o erro de validação local do `FileUpload` usa `aria-live="polite"`. Não acrescente outro `role="alert"` em volta.
- **Níveis de título:** os títulos internos (`AlertTitle`, `CardTitle`, `TimelineTitle`, `EmptyState`, `ErrorState`, `SectionHeader`, `FooterSection`) aceitam `as`/`titleAs` para escolher o nível. Ajuste o nível à hierarquia da página (ex.: `EmptyState titleAs="h2"` logo abaixo do `h1`) em vez de deixar o padrão pular nível.
- **`SidebarInset` é `<main>` por padrão** (aceita `as`): não aninhe outro `<main>` dentro dele; se a página já tem `<main>`, use `as="div"`.
- **`Sidebar`** é `<nav aria-label="Menu lateral">`; `SidebarMenuButton isActive` vira `aria-current="page"`.
- **`HeaderBrand` sem `logo`** mostra um placeholder decorativo (`aria-hidden`) e avisa no console em desenvolvimento. Passe sempre `logo` com o asset real (`<img alt="Prefeitura de Porto Velho">`). O nome quebra linha no mobile (use `truncate` para cortar). A logo oficial não vem no pacote: peça o SVG à SEMEC e salve como `public/marca.svg`. Informe `orgName` com o nome da secretaria do app; o padrão é `"SEMEC"`.
- **`NavigationMenu`** é `<nav aria-label="Menu principal">` por padrão; passe outro `aria-label` se houver mais de um menu na página.
- **`FormField`** liga dica e erro ao controle sozinho (contexto com `useId`): o controle filho recebe `id`, `aria-describedby`, `aria-invalid` e `aria-required`. Com erro, a dica some e `aria-describedby` referencia só a mensagem de erro; sem erro, referencia a dica, quando houver. Não monte `aria-describedby` à mão; o que você passar explicitamente vence.
- **`Toggle` ligado** (`pressed`) tem fundo `tint`, contorno de 2px em `primary` e texto `foreground`: o contorno tem 5,00:1 sobre `--bg` e 5,42:1 sobre branco, então ligado e solto se distinguem sem depender só do cinza. O estado vai para o leitor de tela por `aria-pressed`. Não troque o visual do ligado por `className` com `bg-accent` (1,01:1 contra o fundo).
- **`Button` com rótulo longo** quebra em linhas balanceadas em vez de criar rolagem horizontal: os tamanhos usam altura **mínima** (`min-h-9`/`min-h-11`/`min-h-12`). Para reduzir a altura por `className`, sobrescreva o `min-h-*` junto com o `h-*`. Mesmo assim, prefira rótulos curtos (verbo + objeto).
- **`ScrollArea`** vira parada de Tab sozinha quando não há nada focável dentro (`focusable="auto"`, o padrão): quem usa teclado consegue rolar texto puro. Dê nome à região com `viewportProps={{ "aria-label": "Termos de uso" }}`. `focusable` aceita `true` (sempre focável) e `false` (nunca; só se o conteúdo garantir outro caminho de teclado).
- **`Avatar` com foto quebrada:** o `AvatarFallback` anuncia o `alt` da `AvatarImage` (as iniciais ficam só visuais). Um `aria-label` no `AvatarFallback` continua aceito e tem prioridade. `alt=""` (foto decorativa) não anuncia nada.
- **`NavigationMenuLink`** já vem com alvo de 44px (`min-h-11`), `px-4`, hover/foco em `tint` e anel de foco por dentro (`navigationMenuLinkStyle`, exportado). `active` marca a página atual (`aria-current="page"`). Para o visual de gatilho, use `className={navigationMenuTriggerStyle()}`.
- **`Pagination`:** `siblingCount` aceita `0` (padrão `1`; negativo conta como `0`). Abaixo de `sm` ficam só as setas e a página atual ± 1: primeira, última e elipses somem, para as setas não encolherem.

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
        <HeaderBrand orgName="SEMEC" logo={<img src="/marca.svg" alt="Prefeitura de Porto Velho" />} serviceName="Emissão de certidões" />
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
- **Com `Sidebar`:** use a composição de "Esqueleto com Sidebar", logo abaixo. É a única testada.

### Esqueleto com Sidebar (painéis administrativos)

Uma composição só (TST-04): **`SkipLink` antes do `SidebarProvider`** e **`Header` dentro do `SidebarInset`**, com o `SidebarInset` como `div` e o `<main id="conteudo">` dentro dele, depois do `Header`.

```tsx
import {
  SkipLink, Header, HeaderBrand, HeaderNav, HeaderNavLink, Heading,
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarInset, SidebarTrigger,
} from "@semec/ds/react";

export function PainelDeProtocolos() {
  return (
    <>
      {/* 1ª parada de Tab, fora do SidebarProvider */}
      <SkipLink />
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Gestão</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive>
                      <a href="/protocolos">Protocolos</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        {/* "div": o <main> é o de baixo, depois do Header (banner fora do main) */}
        <SidebarInset as="div">
          <Header>
            {/* Gatilho e marca num grupo: o Header é justify-between, e com 3 filhos soltos a marca ia para o meio */}
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <HeaderBrand orgName="SEMEC" href="/" logo={<img src="/marca.svg" alt="Prefeitura de Porto Velho" />} serviceName="Gestão de protocolos" />
            </div>
            <HeaderNav aria-label="Menu principal">
              <HeaderNavLink href="/ajuda">Ajuda</HeaderNavLink>
            </HeaderNav>
          </Header>
          <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[75rem] px-4 py-8">
            <Heading level={1}>Protocolos</Heading>
            {/* conteúdo */}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
```

- **Por que assim:** no desktop a `Sidebar` é `fixed` desde o topo da janela (`inset-y-0`). Um `Header` antes do `SidebarProvider` ocupa a largura toda e fica com o começo **embaixo** da barra: a marca do `HeaderBrand` recebe o foco sem aparecer (WCAG 2.4.7), e o axe não acusa. Dentro do `SidebarInset`, o `Header` começa depois da barra.
- **Resultado (Chromium, 1280 e 390 px):** o `SkipLink` é a 1ª parada de Tab e leva o foco ao `<main id="conteudo">`; o `Header` e a marca ficam visíveis e focáveis; há um `banner` e um `main`; axe sem violação serious ou critical. No desktop a ordem segue com os itens da `Sidebar` e depois o `Header`; no mobile a barra vira gaveta e o `SidebarTrigger` do `Header` é a 2ª parada.
- **Não faça:** `Header` antes do `SidebarProvider` (fica sob a barra) nem `SkipLink` dentro do `SidebarInset` (deixa de ser a 1ª parada, porque a `Sidebar` vem antes no DOM). O `SidebarTrigger` só funciona dentro do `SidebarProvider`.

### Container e largura de leitura

- Container de página: `mx-auto w-full max-w-[75rem] px-4` (1200px, igual ao site de docs). Use **sempre** este; não invente `max-w-6xl`, `max-w-7xl` ou `container`.
- Texto corrido: `max-w-prose` (65ch). Coluna de formulário ou leitura: `max-w-3xl` (48rem).
- O pacote **não** tem `--container-max`, `--container-docs`, `--measure`, `--control-height-*` nem modo `data-density="compact"`: esses nomes existem só no CSS do site de documentação. `var()` com eles resolve para vazio, sem erro.

### Título da página

- Um `h1` por página, com o nome da tarefa ("Emitir certidão negativa"), não o nome do sistema. Depois `h2` para seções, sem pular nível.
- Use `Heading level={1}` (h1, 32px/`text-3xl`), `level={2}` (`text-2xl`), `level={3}` (`text-xl`); a prop `size` muda só o tamanho visual, sem mudar o nível. Sem o componente: `h1` em `text-3xl font-bold text-foreground`. `text-display` (40px) só no hero da página inicial.

### Marca e ação

- **Cabeçalho do portal:** `bg-surface border-b border-border`, marca em `text-brand-hero font-bold` e link atual em `text-brand-hero font-semibold`.
- **Marca = `brand-hero`.** Reserve `bg-brand-hero text-primary-foreground` para hero e faixas de destaque dentro da página. Não use `bg-primary` para marca.
- **Ação = `primary`.** O botão principal de cada tela é `<Button variant="primary">` (`bg-primary`), **um** por grupo de ações; os demais são `outline` ou `ghost`. Não use `brand-hero` em botão.
- **Foco sobre a marca:** o anel padrão (`--focus-ring` = `--pv-blue-hero`) some sobre a marca (1,00:1). Áreas com `bg-brand-hero` ou `data-surface="brand"` trocam o anel automaticamente para branco (9,38:1). O `data-surface="brand"` não pinta o fundo: use-o junto de `bg-brand-hero` (ou `background: var(--brand-hero)`), senão o anel branco fica com 1,08:1 sobre o fundo claro; fora disso, use `ring-ring-inverse` (`--focus-ring-inverse`) em controles sobre fundo de marca.

### Tabelas

- Use `Table` (ou `DataTable` para ordenar e paginar) com `TableCaption` ou `caption` descrevendo o conteúdo; cabeçalhos em `TableHead`.
- A `Table` já rola na horizontal (wrapper `overflow-auto`), mas esse wrapper não recebe foco: se a tabela não tiver nenhum elemento focável, quem usa só teclado não consegue rolar. Se precisar manter a rolagem, envolva a `Table` em `<div role="region" aria-label="Serviços solicitados" tabIndex={0} className="overflow-x-auto [&>div]:overflow-visible">`. A variante `[&>div]:overflow-visible` transfere a rolagem do wrapper interno para a região focável. Teste Tab e setas em 390px. Em telas estreitas, prefira **menos colunas** (as secundárias vão para uma tela de detalhe) ou uma **lista de `Card`** abaixo de `md:`, mantendo a `Table` a partir de `md:`.
- Quando a linha tem várias ações, use uma coluna "Ações" com `Button`, não a linha inteira clicável.
- **`DataTable` com `onRowClick`:** passe também `rowLabel` (ex.: `rowLabel={(p) => \`Abrir protocolo ${p.numero}\`}`). A linha clicável é focável, mas sem `rowLabel` não tem nome e o leitor de tela não diz o que o Enter faz. Cliques e teclas em controles da célula (botão, link, campo, menu aberto por ela) **não** ativam a linha.
- **Ordenação do `DataTable`:** o `columnheader` e o botão de ordenar se chamam só pelo nome da coluna; a instrução "Ordenar por …" (`labels.sortBy`) é a **descrição** do botão (`aria-describedby`), e a ordem atual vem em `aria-sort`. Num cabeçalho ordenável feito à mão, faça igual: não ponha "Ordenar por X" no `aria-label` do botão (vira o nome do cabeçalho e se repete em cada célula).

### Sidebar (painéis administrativos)

- `SidebarProvider` > `Sidebar` + `SidebarInset`, com `SkipLink` antes do provider e `Header` dentro do `SidebarInset` (ver "Esqueleto com Sidebar"). Abaixo de 768px (48rem, `matchMedia`; o complemento exato do `md:`) a barra vira gaveta: um diálogo modal com foco preso, Esc para fechar e botão "Fechar menu". O `SidebarTrigger` tem 44px e `aria-expanded`.
- O `SidebarInset` já traz `min-w-0`: conteúdo largo (tabelas, gráficos) rola dentro dele em vez de empurrar a largura da página.

## Workflow IA

1. Leia `llms.txt` → escolha o componente pelo `code` (lista em "Componentes", acima)
2. Leia `components/<slug>.md` (o arquivo citado na lista de componentes, não o `code`) → parta do exemplo de `usage` e **importe** o componente; nunca o reimplemente
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
- Teste de teclado no Safari: no padrão do macOS o `Tab` não para em links nem botões. Ligue "Navegação por teclado" no macOS e "Pressionar Tab para destacar cada item" no Safari (ou use `Option+Tab`) antes de concluir que algo saiu da ordem de Tab

### Áreas clicáveis

- **Régua do DS: 44×44px** nos controles interativos (`min-h-11 min-w-11`, `h-11`, `size-11`). É **decisão do projeto**, mais exigente que o AA: o WCAG 2.1 AA não tem critério de tamanho de alvo; o critério de 44px (2.5.5 Target Size) é **AAA**. (No WCAG 2.2, o 2.5.8, AA, pede 24×24px.)
- Os padrões do kit já seguem a régua: Pagination, Tabs, Toggle, NavigationMenuTrigger, `NavigationMenuLink`, os itens do `DropdownMenu` (inclusive Checkbox e Radio), o botão de ordenação do `DataTable`, o polegar do `Slider` e o X dos overlays têm 44px; o `Button size="sm"` mantém 36px visuais com área de toque de 44px
- `Checkbox` e `RadioGroupItem` têm 20×20px de propósito e **não** ampliam o alvo: o alvo é o conjunto caixa + `<Label>`. Ponha o rótulo ao lado (`<Label htmlFor>`), e o clique nele marca o controle. Para chegar a 44px de altura na linha, use `<div className="flex min-h-11 items-center gap-2"><Checkbox id="aceite" /><Label htmlFor="aceite">Li e aceito</Label></div>` (decisão da auditoria de 14/10/2026)
- Abaixo de `sm`, o `Link`, os links do `Breadcrumb` e o `FooterLink` ganham área de toque de no mínimo 44×44px sem mudar o visual (no `Link`, um `::after`, sem alterar a altura da linha; no `Breadcrumb`, `min-h-11` mais um `::after` de largura)
- Espaçamento entre alvos: 8px (regra do DS)
- O pacote não define `--control-height-*`; use os utilitários acima

### prefers-reduced-motion

O `tokens.css` já reduz animações e transições globalmente com `@media (prefers-reduced-motion: reduce)`. Não reative animação dentro desse media query.

### Não uso exclusivo de cores

Complementar cor com ícone, texto ou padrão (erro com mensagem, status com rótulo). O `Link` é sublinhado por padrão; `underline={false}` só em navegação (menus, cabeçalho), nunca em texto corrido. A aba ativa do `Tabs` tem barra de 3px, além da cor. O `Toggle` ligado tem contorno `primary` de 2px, além do fundo `tint`.

## Padrão de formulários e feedback (Validação + Toast)

Nos formulários do SEMEC DS, o ciclo de validação e feedback segue três padrões consolidados de UX e Acessibilidade (WCAG 2.1 AA):

### Os Três Padrões de Tratamento de Erro

1. **Padrão 1: Erro Inline no Campo (`FormField`)**:
   - Erros de validação pontuais exibidos imediatamente abaixo do controle correspondente.
   - O `<FormField error={erro}>` aplica `aria-invalid="true"` e vincula o erro ao campo via `aria-describedby` automaticamente.
   - **A11y:** Por padrão, a mensagem inline não possui `role="alert"` (anúncio assertivo interromperia leitores de tela caso existissem múltiplos erros; o erro é anunciado de forma natural ao focar o controle — AUD-22). Em campos avulsos fora de formulários agrupados, use `errorRole="alert"`.
   - **Contraste:** A cor do erro é sempre `--feedback-danger` (`--pv-red-700`, `#b91c1c`), atingindo 5,98:1 sobre branco (excede 4,5:1).

2. **Padrão 2: Resumo Consolidado no Topo (`ErrorSummary`)**:
   - Obrigatório quando houver múltiplos campos ou formulários longos.
   - Posicionado no início do `<form>`, com `role="alert"` e foco programático (`autoFocus`, padrão `true`). Com `focusKey` (passe `focusKey={tentativa}`, somado a cada envio inválido), o resumo puxa o foco **só** quando o `focusKey` muda. Enquanto a pessoa digita, a lista muda, o resumo some e volta (0 → N erros), e ele **não** rouba o foco. Sem `focusKey`, o resumo foca ao passar de 0 para N erros; por isso, com validação ao vivo, passe sempre o `focusKey`.
   - Com React Hook Form, use `shouldFocusError: false` no `useForm`: senão o RHF foca o 1º campo inválido e o resumo nunca recebe o foco.
   - Os itens seguem a ordem dos campos na tela (lista fixa de ids), não a ordem de `Object.entries(errors)`.
   - Cada erro é um link (`<a href="#<id>">`) com scroll suave e transferência de foco direta ao campo correspondente.

3. **Padrão 3: Erro de Submissão do Servidor (`Alert variant="destructive"`)**:
   - Falhas globais de comunicação (timeout, 500, indisponibilidade) não pertencem a um campo isolado.
   - Utilize `<Alert variant="destructive">` no topo do formulário com título e explicação clara de como proceder ou tentar novamente.

### Limpar o formulário

Com React Hook Form e controles Radix (`Select`, `RadioGroup`, `Checkbox`), o reset nativo pode disparar `onValueChange`/`onCheckedChange` e revalidar campos vazios. Depois de `reset()`, chame `setTimeout(() => clearErrors(), 0)` para limpar os erros no próximo ciclo. Obtenha `reset` e `clearErrors` do mesmo `useForm`; confira os valores e a ausência de erros após limpar. Esse contorno não deve apagar erros de um novo envio.

### Padrão de Legenda Auxiliar de Ação / Download

Quando o botão de submissão do formulário disparar uma ação de efeito secundário (como download imediato de arquivo gerado, emissão de PDF ou protocolo assíncrono), é obrigatório fornecer uma **Legenda Auxiliar de Ação / Download**:
- Posicionada logo abaixo do `<Button variant="primary">`.
- Estilizada com tipografia auxiliar acessível: `text-xs text-text-muted` (ou `text-muted-foreground`), garantindo contraste mínimo de 4,5:1.
- Exemplo textual: *"Ao clicar, o arquivo PDF do requerimento será gerado e baixado automaticamente."*

### Exemplo Canônico: React Hook Form + Zod + SEMEC DS

A receita usa três pacotes que **não** vêm com o kit. Instale-os junto (são opcionais: só para esta receita de formulário):

```bash
npm install react-hook-form @hookform/resolvers@^5 zod@^4
```

Três regras da receita (TST-17):

- **`shouldFocusError: false`** no `useForm`. Sem isso, o RHF foca o 1º campo inválido no envio e o `ErrorSummary` nunca recebe o foco.
- **`focusKey={tentativa}`**, com `tentativa` somada no callback de envio inválido (`handleSubmit(onSubmit, onInvalid)`). O `ErrorSummary` só puxa o foco quando o `focusKey` muda. Enquanto a pessoa corrige os campos, a lista se atualiza sem roubar o foco, mesmo quando o resumo some e volta porque ela apagou um campo e redigitou. O último `focusKey` focado fica guardado no `<form>`, então a renderização condicional abaixo funciona.
- **Ordem fixa dos itens**: monte a lista a partir de um array com os ids na ordem da tela (`ORDEM_CAMPOS`), nunca de `Object.entries(errors)`, que segue a ordem em que o resolver devolveu os erros.

```tsx
import {
  FormField,
  Input,
  ErrorSummary,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
  maskCPF,
  maskCurrency,
} from "@semec/ds/react";
import { cpfSchema, emailSchema } from "@semec/ds/react/validacao";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

const requerimentoSchema = z.object({
  nome: z.string().min(3, "Informe o nome completo (ao menos 3 caracteres)."),
  email: emailSchema,
  cpf: cpfSchema,
  valor: z.string().min(1, "Informe o valor da taxa."),
});

type RequerimentoForm = z.infer<typeof requerimentoSchema>;

// Ids dos campos na ordem em que aparecem na tela (ordem do ErrorSummary).
const ORDEM_CAMPOS = ["nome", "email", "cpf", "valor"] as const satisfies readonly (keyof RequerimentoForm)[];

export function FormularioRequerimento() {
  const { toast } = useToast();
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RequerimentoForm>({
    resolver: zodResolver(requerimentoSchema),
    defaultValues: { nome: "", email: "", cpf: "", valor: "" },
    // O foco do envio inválido vai para o ErrorSummary, não para o 1º campo.
    shouldFocusError: false,
  });

  // Padrão 2: Resumo de erros para o topo, na ordem da tela
  const errorSummaryItems = ORDEM_CAMPOS.flatMap((id) => {
    const message = errors[id]?.message;
    return message ? [{ id, message }] : [];
  });

  const onSubmit = async (dados: RequerimentoForm) => {
    try {
      setErroServidor(null);
      // Simulação de envio da API:
      // await api.post("/requerimentos", dados);
      void dados;

      // Sucesso na submissão pós-envio via Toast:
      toast({
        variant: "success",
        title: "Requerimento enviado com sucesso!",
        description: "O protocolo foi gerado e o PDF baixado.",
      });
    } catch {
      // Padrão 3: Erro de servidor via Alert destructive
      setErroServidor("Falha ao comunicar com o servidor. Verifique a conexão e tente novamente.");
    }
  };

  // Cada envio inválido muda o focusKey: o ErrorSummary volta a receber o foco.
  const onInvalid = () => setTentativa((t) => t + 1);

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      className="max-w-3xl space-y-4"
    >
      {/* Padrão 2: Resumo consolidado no topo */}
      {errorSummaryItems.length > 0 && (
        <ErrorSummary
          title="Há pendências a corrigir antes de prosseguir"
          errors={errorSummaryItems}
          focusKey={tentativa}
        />
      )}

      {/* Padrão 3: Alerta de erro de servidor */}
      {erroServidor && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível enviar</AlertTitle>
          <AlertDescription>{erroServidor}</AlertDescription>
        </Alert>
      )}

      {/* Padrão 1: Campos com validação inline */}
      <FormField
        label="Nome completo"
        htmlFor="nome"
        required
        hint="Como consta no documento oficial"
        error={errors.nome?.message}
      >
        <Input id="nome" {...register("nome")} />
      </FormField>

      <FormField
        label="E-mail"
        htmlFor="email"
        required
        hint="Para envio do comprovante"
        error={errors.email?.message}
      >
        <Input id="email" type="email" {...register("email")} />
      </FormField>

      {/* Controller para componentes controlados ou máscaras */}
      <Controller
        name="cpf"
        control={control}
        render={({ field }) => (
          <FormField
            label="CPF"
            htmlFor="cpf"
            required
            hint="000.000.000-00"
            error={errors.cpf?.message}
          >
            <Input
              id="cpf"
              inputMode="numeric"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value}
              onValueChange={(v) => field.onChange(maskCPF(v))}
            />
          </FormField>
        )}
      />

      {/* Campo R$: maskCurrency devolve "" quando não há dígitos, então min(1) barra o vazio */}
      <Controller
        name="valor"
        control={control}
        render={({ field }) => (
          <FormField
            label="Valor da taxa"
            htmlFor="valor"
            required
            hint="Somente números; os centavos entram sozinhos"
            error={errors.valor?.message}
          >
            <Input
              id="valor"
              inputMode="numeric"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value}
              onValueChange={(v) => field.onChange(maskCurrency(v))}
            />
          </FormField>
        )}
      />

      {/* Ação principal com Legenda Auxiliar */}
      <div className="pt-2 space-y-2">
        <Button type="submit" variant="primary">
          Gerar e baixar requerimento
        </Button>
        <p className="text-xs text-text-muted">
          Ao clicar, o arquivo PDF do requerimento será gerado e baixado automaticamente.
        </p>
      </div>
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
import { FormField, Combobox, InputOTP, InputOTPGroup, InputOTPSlot } from "@semec/ds/react";

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
- Zod (entry `@semec/ds/react/validacao`): `cpfSchema`, `cnpjSchema`, `emailSchema`, `cepSchema`, `cpfCnpjSchema`

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
- CSP: Dialog/Drawer/Sheet/DropdownMenu usam `SemecProvider` com nonce. Na 4.2.1, o provider também repassa o nonce aos elementos `<style>` dos viewports de Select e ScrollArea, inclusive no SSR. `SelectContent nonce` explícito prevalece; em ScrollArea, a ordem é `viewportProps.nonce` → `nonce` → provider. O nonce não autoriza atributos `style` do Radix: ainda podem ocorrer violações de `style-src-attr`. Valide SSR e interações com a política de produção.

## Removido na 4.0 e depreciações anunciadas

Removido na 4.0 (anunciado desde a 3.1.0, ADR-013). Guia com antes/depois e codemod (`npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta>`): https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md

- `onChange(value)` / `onChange(files)` de `Calendar`, `Combobox`, `InputOTP` e `FileUpload`: use `onValueChange` (AUD-35). No `DatePicker`, `onChange` é o evento nativo e o valor vem em `onValueChange`.
- Utilitários de primitivo `bg-pv-*` / `text-pv-*` / `border-pv-*` e as variáveis `--color-pv-*`: use os semânticos (AUD-55). As variáveis `--pv-*` continuam, mas não são para uso direto.
- Import por caminho de arquivo em `dist/` (`@semec/ds/dist/react/...`): use só os subpaths do `exports` (AUD-20).

Depreciado, sai na 5.0 (não gere código novo com isto):

- `Combobox`: `ariaLabel` (use rótulo visível ou o atributo `aria-label`) e `emptyMessage` (use `emptyText`).
- `AlertDialog` `modal` e `AlertDialogContent` `onPointerDownOutside` / `onInteractOutside`: já são ignorados.
- `digits` (de `@semec/ds/react` e `@semec/ds/react/validacao`): use `valor.replace(/\D/g, "")` no seu código. Anunciado na 4.1; avisa no console em desenvolvimento.
- Subpath `@semec/ds/react/server` (`dsPackageRootResolve`): uso interno do monorepo, sem substituto no pacote. Anunciado na 4.1; avisa no console em desenvolvimento.

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
