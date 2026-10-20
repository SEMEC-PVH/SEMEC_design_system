---
name: semec-ds-lite
description: Identidade visual SEMEC Design System sem React — tokens pv-*, acessibilidade WCAG 2.1 AA, padrões de tela e responsive. Use em Vue, Angular, HTML ou qualquer app sem React (Svelte, PHP, templates de servidor) que consuma os tokens CSS (@semec/ds/lite/tokens.css).
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System — skill lite

> Gerado para `@semec/ds@4.4.1` (versão do `package.json` no build). Se o app tiver outra versão instalada (`npm ls @semec/ds`), o que vale é o README dela.

> **Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.1 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.2. Confira a versão instalada com `npm ls @semec/ds`.**

Tokens, acessibilidade, responsive e padrões visuais para interfaces da Prefeitura de Porto Velho. **Sem componentes React.**

Serve para Vue, Angular, Svelte, HTML puro ou páginas geradas no servidor (PHP, templates): qualquer app que não use React. Os componentes React do kit não rodam nesses frameworks; monte a marcação com os tokens e as regras de acessibilidade desta skill.

Para UI com o kit React (`@semec/ds`), use a skill `semec-ds`.

## Pacotes sem React: `@semec/ds-tokens` e `@semec/ds-css`

Para app sem React, prefira os pacotes próprios, que não instalam React nem Radix. O `@semec/ds` (abaixo) continua valendo para quem já usa Tailwind v4.

| Caso | Pacote | Arquivos |
|------|--------|----------|
| HTML, PHP, Django, Flask, Vue, Angular: classes prontas | `@semec/ds-css` | `@semec/ds-css/index.css` (tokens + base + classes, para bundler), `@semec/ds-css/components.css` (só as classes `.semec-*`), `dist/semec-ds.css` (arquivo único para `<link>`/CDN) |
| Só tokens num CSS próprio | `@semec/ds-tokens` | `@semec/ds-tokens/tokens.css` (só `:root`), `base.css` (reset, foco, links, reduced motion), `fonts.css` + `fonts/` |
| Android, iOS, Figma, back-end | `@semec/ds-tokens` | `tokens.json` (DTCG), `tokens` (JS + tipos), `android/colors.xml`, `android/dimens.xml`, `ios/SemecTokens.swift`, `figma/tokens-studio.json` |

```bash
npm install @semec/ds-css   # já traz o @semec/ds-tokens
```

```js
import "@semec/ds-tokens/fonts.css";
import "@semec/ds-css/index.css";
```

Sem bundler, o `<link>` aponta para os arquivos físicos: `fonts.css` (com `fonts/` ao lado) do `@semec/ds-tokens` e `dist/semec-ds.css` do `@semec/ds-css`, com versão fixa e SRI no CDN.

Classes (BEM curto, mesma aparência do componente React): `.semec-btn` (`--primary`, `--secondary`, `--ghost`, `--destructive`, `--link`, `--sm`, `--lg`), `.semec-field` (`[aria-invalid="true"]`), `.semec-label` (`__required`), `.semec-hint`, `.semec-error`, `.semec-form-field`, `.semec-checkbox`, `.semec-radio`, `.semec-choice`, `.semec-card` (`__header`, `__title`, `__description`, `__content`, `__footer`), `.semec-alert` (`--info`, `--success`, `--warning`, `--danger`, `__title`, `__description`), `.semec-header` (`__brand`, `__org`, `__service`, `__nav`, `__link` com `aria-current="page"`), `.semec-footer` (`__link`), `.semec-skip-link`, `.semec-table` (`__wrapper` com `role="region" tabindex="0" aria-label`, `__caption`), `.semec-error-summary` (`__title`, `__list`), `.semec-badge`, `.semec-toast` (`--success`, `--danger`, `--info`, `__title`, `__description`; só aparência) e `.semec-heading--1` a `--4`. O comportamento (foco do resumo de erros, mostrar e fechar toast, menus) fica com o app.

Guia: https://semec-pvh.github.io/SEMEC_design_system/usar-sem-react/

## Instalação

```bash
npm install @semec/ds
```

### Com Tailwind v4

```css
@import "tailwindcss";
@import "@semec/ds/lite/fonts.css";
@import "@semec/ds/lite/tokens.css";
```

O Tailwind v4 precisa estar ligado ao bundler (Vite: `npm install -D tailwindcss @tailwindcss/vite` e `tailwindcss()` nos `plugins` do `vite.config`; Next: o `create-next-app` já traz). Num template novo, troque o CSS global inteiro por essas linhas: estilos do template fora de camada (`body { font-family: Arial… }`, `:root`, `@theme inline`, `@media (prefers-color-scheme: dark)`) vencem o `@layer base` do `tokens.css`.

**Sem `@source`.** A variante lite não usa os componentes React, então o Tailwind só precisa varrer o código do próprio app (detecção automática; para limitar: `@import "tailwindcss" source("../src");`, caminho relativo ao CSS). O `@source` para `dist/react` só é necessário com a skill `semec-ds`, que usa os componentes.

O `npm install` traz junto as dependências do kit React (o pacote é um só) e, no npm 7+, também os peers dele (`react`, `react-dom`, `lucide-react`); a variante lite não os importa, então nada disso entra no seu bundle. No pnpm e no Yarn, o aviso de peer ausente desses pacotes pode ser ignorado na lite.

**Só CSS, sem React (npm 7+):** `npm install @semec/ds --omit=peer` não instala os peers React (`react`, `react-dom`, `lucide-react`). As dependências diretas (Radix etc.) continuam vindo, porque o pacote é um só. Repita `--omit=peer` no `npm ci`/`npm install` seguinte para manter essa instalação. Com Tailwind, instale-o à parte com o plugin do bundler.

**Preset JS (opcional):** `@config "@semec/ds/lite/pv-preset";` no CSS global, depois dos imports. O `tokens.css` já gera os utilitários pelo `@theme inline`; o preset (o mesmo `pv-preset` da variante React) só serve a quem ainda configura o Tailwind por JS. Sem Tailwind, ignore.

**Com `@tailwindcss/cli`:** a CLI não copia os arquivos de fonte. Depois de gerar o CSS final, rode `npx semec-ds copiar-fontes <pasta-do-css>` (por exemplo, `npx semec-ds copiar-fontes public/css` para `public/css/app.css`), que copia `fonts.css` e a pasta `fonts/` com a licença; ou copie `node_modules/@semec/ds/dist/react/fonts/` à mão para `fonts/` ao lado desse CSS. Preserve as URLs relativas `./fonts/…` e confira no navegador que os `.woff2` respondem 200.

**Fonte:** `@semec/ds/lite/fonts.css` (o mesmo arquivo de `@semec/ds/react/fonts.css`) traz a Poppins 400/500/600/700 (SIL OFL) e vai **antes** do `tokens.css`. Sem ela, o texto cai em `system-ui`. Não existem pesos 800/900.

### Sem Tailwind

**CSS legado e foco:** uma regra `:focus { outline: 0 }` fora de `@layer` vence o foco do kit, que está em `@layer base`, mesmo carregada antes dele. Remova essa regra ou substitua-a por um foco visível equivalente. Não basta passar no axe: percorra a tela com Tab e Shift+Tab e confira o anel em cada controle.

Sem Tailwind, **não use o `tokens.css`**: ele traz `@theme` e `@utility`, que o navegador ignora e que o bundler acusa (Vite e PostCSS mostram uns 30 avisos `Unknown at rule`). Use os dois arquivos portáveis:

- **`variables.css`**: só as variáveis `:root` (`--bg`, `--action-primary`, `--pv-*`…). Não mexe em margens, links, fonte ou fundo da página. Basta ele para usar os tokens com `var()` num sistema existente.
- **`base.css`** (opcional, depende do `variables.css`): reset, tipografia, links, foco visível, anel inverso sobre a marca e reduced motion. Adote-o de forma explícita; é a camada base que o `tokens.css` aplicava.

Num bundler (Vite, Next, webpack), importe no JS de entrada, nesta ordem:

```js
import "@semec/ds/lite/fonts.css";
import "@semec/ds/lite/variables.css";
import "@semec/ds/lite/base.css"; // opcional
```

Os subpaths `@semec/ds/lite/*.css` só resolvem num bundler (ou num `@import` que ele processa). Num `<link>` (HTML estático, PHP, servidor sem bundler) o navegador não conhece o `exports` do pacote; aponte para os arquivos reais, `fonts.css` primeiro:

```html
<link rel="stylesheet" href="/node_modules/@semec/ds/dist/react/fonts.css" />
<link rel="stylesheet" href="/node_modules/@semec/ds/dist/react/variables.css" />
<link rel="stylesheet" href="/node_modules/@semec/ds/dist/react/base.css" />
```

O caminho em `dist/` não é contrato público (o `exports` não o expõe) e pode mudar numa versão futura: fixe a versão do pacote (`"@semec/ds": "4.4.1"`, sem `^`) ou copie os arquivos. Se o servidor não publica `node_modules`, copie `dist/react/variables.css` e `dist/react/base.css` para a pasta estática e use `npx semec-ds copiar-fontes <pasta>` para levar `fonts.css` e `fonts/` juntos (as URLs dos `.woff2` são relativas ao `fonts.css`).

**Via CDN** (sem `npm install`): o jsDelivr serve os arquivos físicos, não os aliases do `exports` (`/lite/variables.css` dá 404). Use o caminho `dist/react/`, versão fixa e SRI:

```html
<link rel="stylesheet" crossorigin="anonymous" href="https://cdn.jsdelivr.net/npm/@semec/ds@4.4.1/dist/react/fonts.css" integrity="sha384-…" />
<link rel="stylesheet" crossorigin="anonymous" href="https://cdn.jsdelivr.net/npm/@semec/ds@4.4.1/dist/react/variables.css" integrity="sha384-…" />
<link rel="stylesheet" crossorigin="anonymous" href="https://cdn.jsdelivr.net/npm/@semec/ds@4.4.1/dist/react/base.css" integrity="sha384-…" />
```

Calcule o SRI a partir dos arquivos publicados dessa versão (`variables.css` e `base.css` existem a partir da 4.4.0) e teste o carregamento. As fontes vêm de `dist/react/fonts/`, relativas ao `fonts.css`. Com CSP, autorize `https://cdn.jsdelivr.net` em `style-src` e `font-src`.

### Tokens como dados (sem CSS)

Para Figma/Tokens Studio, apps mobile, back-end, PDF ou e-mail, use os tokens como dados:

```js
import dtcg from "@semec/ds/tokens.json" with { type: "json" }; // DTCG 2025.10, grupos L0/L1
import { tokens } from "@semec/ds/tokens"; // valores CSS resolvidos, tipados

const primary = tokens["action-primary"]; // sem var()
const reference = dtcg.L1["action-primary"].$value; // {L0.pv-blue-600}
```

Os dois são gerados do `:root` do `tokens.css`, que continua sendo a fonte de verdade. O arquivo físico é `dist/tokens/tokens.json`. A conversão para Android/iOS fica com o app.

O pacote **não** exporta `shadcn.css` (removido na 2.0.0).

## Tokens

### L0 — Primitivos (`--pv-*`)

Valores brutos. Nunca use primitivo direto em componente ou tela. Desde a 4.0 não existem utilitários `bg-pv-*` / `text-pv-*` / `border-pv-*` nem `--color-pv-*` (AUD-55): use o semântico do papel. Tabela primitivo → semântico: https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md

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

**Cor:**

| Token | Uso |
|-------|-----|
| `--bg` | Fundo da página |
| `--fg` | Texto principal |
| `--surface` | Superfície (cards, modais) |
| `--surface-alt` | Superfície alternativa |
| `--surface-sunken` | Superfície rebaixada (skeleton, trilhas) |
| `--border` | Bordas leves |
| `--border-strong` | Borda de campo (`border-input`), contraste mínimo de 3:1 sobre `--surface` |
| `--focus-ring` | Anel de foco (a11y) |
| `--focus-ring-inverse` | Anel de foco sobre a marca |
| `--text-muted` | Texto de apoio |
| `--text-secondary` | Texto intermediário |
| `--text-strong` | Texto em destaque |
| `--text-on-brand` | Texto sobre fundo de marca |
| `--text-brand` | Título institucional escuro (12,43:1 sobre `--surface`) |
| `--tint` | Superfície colorida leve |
| `--brand-hero` | Marca (faixas institucionais, hero, selo) |

**Ação:**

| Token | Uso |
|-------|-----|
| `--action-primary` | Botão/link principal |
| `--action-primary-hover` | Hover de ação |
| `--action-primary-active` | Active de ação |

**Feedback:**

| Token | Uso |
|-------|-----|
| `--feedback-success` | Sucesso |
| `--feedback-warning` | Aviso |
| `--feedback-danger` | Erro/perigo |
| `--feedback-info` | Informação |
| `--feedback-*-surface` | Fundos de feedback |

**Tipografia:**

| Token | Valor |
|-------|-------|
| `--font-family-sans` | `"Poppins", system-ui, -apple-system, sans-serif` |
| `--text-xs` | `0.75rem` |
| `--text-sm` | `0.875rem` |
| `--text-base` | `1rem` |
| `--text-lg` | `1.125rem` |
| `--text-xl` | `1.25rem` |
| `--text-2xl` | `1.5rem` |
| `--text-3xl` | `2rem` |
| `--text-display` | `2.5rem` |
| `--font-regular` | `400` |
| `--font-medium` | `500` |
| `--font-semibold` | `600` |
| `--font-bold` | `700` |

Cada degrau tem altura de linha própria (`--leading-*`), já embutida no utilitário `text-*`. Papéis: `display` 40px = página inicial/hero, `3xl` 32px = h1, `2xl` = h2, `xl` = subtítulo, `lg` = destaque, `base` = corpo, `sm` = apoio, `xs` = etiqueta, dica e mensagem de erro. Rótulo de campo usa `text-sm font-medium` (14px/500), ou `font-size: var(--text-sm); line-height: var(--leading-sm); font-weight: var(--font-medium)` em CSS puro. Não existem pesos 800/900.

**Espaçamento:** `--space-0` 0 · `--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-6` 24px · `--space-8` 32px · `--space-12` 48px · `--space-16` 64px

Use os degraus de espaçamento no layout do app. Preserve as exceções do kit: botão médio `px-5` (20px), botão pequeno `py-1.5` (6px) e `FormField` `gap-1.5` (6px).

**Bordas:** `--radius-sm` 2px · `--radius-md` 8px · `--radius-lg` 12px · `--radius-full` 9999px (escolha pelo papel: controle de entrada (campo, select) `rounded-md` / `--radius-md`, botão `rounded-full` / `--radius-full` (pílula), cartão e diálogo `rounded-lg` / `--radius-lg`; escala fixa, não use `rounded-xl` ou acima)

**Elevação:** `--elevation-0/1/2/3`

**Movimento:** `--pv-duration-fast` 150ms · `--pv-duration-base` 250ms · `--pv-duration-slow` 400ms · `--easing-standard` cubic-bezier(0.16, 1, 0.3, 1)

### Tailwind CSS v4

`@theme inline` expõe os tokens como utilitários. O nome do utilitário nem sempre é o nome do token:

| Utilitário | Token |
|------------|-------|
| `bg-background` | `--bg` |
| `text-foreground` / `text-text-strong` | `--fg` / `--text-strong` |
| `bg-card` / `bg-surface` | `--surface` |
| `bg-surface-alt` | `--surface-alt` |
| `bg-surface-sunken` | `--surface-sunken` |
| `border-border` / `border-border-strong` | `--border` / `--border-strong` |
| `border-input` | `--border-strong` — borda de campo |
| `text-text-muted` (ou `text-muted-foreground`) | `--text-muted` |
| `text-text-secondary` | `--text-secondary` |
| `text-text-on-brand` (ou `text-primary-foreground`) | `--text-on-brand` |
| `ring-ring` / `ring-ring-inverse` | `--focus-ring` / `--focus-ring-inverse` |
| `bg-primary`, `hover:bg-primary-hover` | `--action-primary` (+ hover) |
| `bg-brand-hero` | `--brand-hero` |
| `text-text-brand` | `--text-brand` |
| `bg-success-emphasis` / `text-success-emphasis-foreground` | `--feedback-success-emphasis` / `--text-on-success-emphasis` (verde cheio; nunca como texto) |
| `bg-destructive`, `text-destructive`, `bg-destructive-surface` | `--feedback-danger` (+ surface) |
| `text-success` / `text-warning` / `text-info` (+ `bg-*-surface`) | feedback |
| `p-space-N`, `gap-space-N`, `mt-space-N` | `--space-N` (a escala `p-N` do Tailwind tem os mesmos valores) |
| `text-xs` … `text-3xl`, `text-display` | `--text-*` (com line-height) |
| `rounded-sm/md/lg/full` | `--radius-*` |
| `shadow-elevation-1/2/3` | `--elevation-*` |

**Armadilha:** `text-muted` e `text-secondary` **não geram CSS** desde a 4.4.0 (até a 4.3 compilavam para a cor de fundo `--surface-alt`, 1,09:1). A classe não dá erro: o texto só herda a cor do pai, e a intenção de texto de apoio se perde sem aviso. Use `text-text-muted` e `text-text-secondary`. Os fundos `bg-muted` e `bg-secondary` continuam.

## Tema

`tokens.css` define só o tema **claro** (`data-theme="dark"` não tem efeito). Use sempre tokens L1 — nunca hex solto.

## Acessibilidade (WCAG 2.1 AA — ADR-014)

### Contraste

- Texto normal: **4.5:1** mínimo (WCAG 1.4.3)
- Texto grande: **3:1**. Texto grande é **≥ 24px (18pt) regular** ou **≥ 18,66px (14pt) bold**; 18px bold **não** é texto grande
- UI (bordas, ícones): **3:1** (WCAG 1.4.11)
- Anel de foco `--focus-ring` (`--pv-blue-hero`): **9,38:1** sobre branco; sobre a marca, `bg-brand-hero` ou `data-surface="brand"` trocam o anel para branco (9,38:1) automaticamente, e `ring-ring-inverse` faz o mesmo por classe
- **`data-surface="brand"` não pinta o fundo.** Ele só troca o anel para branco. O elemento precisa do fundo de marca próprio (`background: var(--brand-hero)` ou `bg-brand-hero`); sem ele, o anel branco fica sobre o fundo claro da página com **1,08:1** e o foco some

### Navegação por teclado

- Tab / Shift+Tab, Enter / Space, Escape, setas
- Camadas modais (diálogos, gavetas) prendem o foco e o devolvem ao gatilho ao fechar
- Ordem de tabulação lógica e previsível

### Foco visível

O `tokens.css` já aplica, na camada base:

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

Nunca `outline: none` sem alternativa visível com 3:1.

### Labels e semântica

- Todo campo acessível precisa de `<label>` associado
- Botões de ícone: `aria-label` + `title`
- Ícones decorativos: `aria-hidden="true"`
- Estados: `aria-invalid`, `aria-expanded`, `aria-current="page"`
- Textos auxiliares: `sr-only`

### Áreas clicáveis

- **Régua do DS: 44×44px** (`min-h-11 min-w-11`). É decisão do projeto, mais exigente que o AA: o WCAG 2.1 AA não tem critério de tamanho de alvo; o de 44px (2.5.5) é **AAA** (no WCAG 2.2, o 2.5.8, AA, pede 24×24px). Espaçamento de 8px entre alvos (regra do DS)

### prefers-reduced-motion

O `tokens.css` já reduz animações e transições globalmente com `@media (prefers-reduced-motion: reduce)`.

### Não uso exclusivo de cores

Complementar com ícone, texto ou padrão. Link em texto corrido é sublinhado.

## Padrões de tela (Tailwind, sem React)

- **Esqueleto:** link "Pular para o conteúdo" como primeiro foco (`<a href="#conteudo">`, visível ao receber foco) → `<header>` → `<nav aria-label="Menu principal">` → um único `<main id="conteudo" tabindex="-1">` → `<footer>` institucional. Cada `<nav>` com `aria-label` distinto.
- **Container:** `mx-auto w-full max-w-[75rem] px-4` (1200px) em todas as telas; texto corrido `max-w-prose`; formulário `max-w-3xl`.
- **Títulos:** um `h1` por página com o nome da tarefa (`text-3xl font-bold`, 32px), `h2` em `text-2xl`, `h3` em `text-xl`, sem pular nível; `text-display` só no hero da página inicial.
- **Marca e ação:** cabeçalho do portal em `bg-surface border-b border-border`, marca em `text-brand-hero font-bold` e link atual em `text-brand-hero font-semibold`. Reserve `bg-brand-hero text-text-on-brand` para hero e faixas de destaque dentro da página. Ação principal = `bg-primary` (um botão principal por grupo). Não use a cor de marca em botão nem a de ação como faixa institucional. A logo oficial não vem no pacote: peça o SVG à SEMEC e salve como `public/marca.svg`.
- **Formulários e Validação:**
  - Label associado ao campo (`<label for="id">`; placeholder não é rótulo).
  - Três padrões de erro:
    1. *Inline no campo:* mensagem em texto abaixo do campo (`text-xs text-destructive`, token `--feedback-danger`, 5,98:1). Com erro, a dica sai da tela e o campo recebe `aria-invalid="true"` e `aria-describedby="[id]-error"`; sem erro, use `aria-describedby="[id]-hint"` apenas se houver dica. Sem `role="alert"` em listas para não interromper leitores de tela.
    2. *Resumo no topo:* contêiner com `role="alert"`, `tabindex="-1"`, foco automático ao submeter e links para cada campo com erro (`<a href="#id">`).
    3. *Erro de servidor:* caixa de aviso (`role="alert"`, fundo `--feedback-danger-surface`, texto e borda `--feedback-danger`; com Tailwind, `bg-destructive-surface text-destructive border-destructive`) com instruções claras de recuperação. Nunca os primitivos `--pv-red-*` direto.
  - *Legenda Auxiliar de Ação / Download:* botões que geram efeitos secundários (ex.: download de PDF gerado) devem conter legenda explicativa complementar abaixo (`text-xs text-text-muted`).
- **Navegação:** página atual com `aria-current="page"`; sidebar vira gaveta no mobile.
- **Feedback:** avisos com ícone + título + texto; erro no contexto do campo. Sucesso pós-envio via notificação ou mensagem confirmando protocolo.
- **Tabelas:** `<table>` com `<caption>` e `<th scope>`; no mobile, menos colunas ou lista de cartões. Se a tabela rolar na horizontal sem nenhum elemento focável dentro, o contêiner que rola precisa de `tabindex="0"`, `role="region"` e `aria-label`.
- **Estados vazios:** título, descrição e ação.

Para os mesmos padrões com componentes prontos (`SkipLink`, `Header`, `Heading`, `Footer`, `Table`…), veja a skill `semec-ds`.

### Equivalentes sem Tailwind

Em CSS puro, aplique as declarações abaixo em classes do app, no arquivo CSS. Mantenha o HTML e os atributos acessíveis descritos acima; eles funcionam sem Tailwind. As dimensões de layout (75rem, 65ch, 48rem) não têm token no pacote.

| Padrão | CSS puro e semântica |
|--------|---------------------|
| Esqueleto | Página com `background: var(--bg); color: var(--fg); font-family: var(--font-family-sans)`. Preserve link de pular, header, nav, main e footer; deixe o link de pular visível, inclusive ao focar. |
| Container | `box-sizing: border-box; margin-inline: auto; width: 100%; max-width: 75rem; padding-inline: var(--space-4)`. Texto corrido: `max-width: 65ch`; formulário: `max-width: 48rem`. |
| Títulos | h1: `font-size: var(--text-3xl); line-height: var(--leading-3xl); font-weight: var(--font-bold); color: var(--fg)`. h2: `--text-2xl` / `--leading-2xl`; h3: `--text-xl` / `--leading-xl`; hero: `--text-display` / `--leading-display`. |
| Marca e ação | Header: `background: var(--surface); border-bottom: 1px solid var(--border)`; marca: `color: var(--brand-hero); font-weight: var(--font-bold)`. Hero/faixa: `background: var(--brand-hero); color: var(--text-on-brand)` e `data-surface="brand"`. Ação: `background: var(--action-primary); color: var(--text-on-brand)`; hover: `background: var(--action-primary-hover)`. |
| Formulários e validação | Rótulo: `font-size: var(--text-sm); line-height: var(--leading-sm); font-weight: var(--font-medium)`. Borda de campo: `border: 1px solid var(--border-strong)`. Dica/legenda de ação: `font-size: var(--text-xs); line-height: var(--leading-xs); color: var(--text-muted)`. Erro inline: mesma tipografia, `color: var(--feedback-danger)`; esconda a dica e referencie só o erro. Resumo: foco programático, links para os campos e `color: var(--feedback-danger)`. Erro de servidor: `background: var(--feedback-danger-surface); color: var(--feedback-danger); border: 1px solid var(--feedback-danger)`. |
| Navegação | Link atual: `color: var(--brand-hero); font-weight: var(--font-semibold)`, com `aria-current="page"`. Preserve `aria-label` distinto em cada nav e o comportamento de gaveta no mobile; CSS sozinho não controla foco nem `inert`. |
| Feedback | Ícone, título e texto, com `color: var(--feedback-success)` e `background: var(--feedback-success-surface)` para sucesso; use os tokens de perigo para erro. Anuncie a confirmação com `role="status"`; cor sozinha não comunica o resultado. |
| Tabelas | Região nomeada e focável: `overflow-x: auto; color: var(--fg); background: var(--surface)`; células: `padding: var(--space-4); border-bottom: 1px solid var(--border)`. Preserve caption e th com scope; teste a rolagem por setas. |
| Estados vazios | Título em `color: var(--fg)`, descrição em `color: var(--text-muted)`, ação em `background: var(--action-primary); color: var(--text-on-brand)`. Mantenha a hierarquia de títulos e o nome acessível da ação. |

## Responsive / Mobile

| Prefixo | Largura | Uso |
|---------|---------|-----|
| `sm:` | 640px | Mobile grande |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop largo |
| `2xl:` | 1536px | Full HD |

- Alvos de toque: 44px com `min-h-11 min-w-11` (régua do DS)
- Sidebar mobile: gaveta off-canvas + `inert` quando fechada
- Reflow: a tela funciona em 320px de largura sem rolagem horizontal da página (1.4.10)
- Container e largura de leitura: ver "Padrões de tela"
- O pacote **não** tem `--container-max`, `--container-docs`, `--measure`, `--control-height-*` nem modo `data-density="compact"`: esses nomes existem só no CSS do site de documentação. `var()` com eles resolve para vazio, sem erro

## Checklist de verificação

- Percorra todos os controles com Tab e Shift+Tab; o anel deve permanecer visível, inclusive após aplicar o CSS legado. Axe sozinho não detecta foco apagado.
- Em 320px e 390px, confirme reflow e use as setas para rolar a região focável da tabela.
- Clique nos rótulos de Checkbox/Radio e confira a seleção; teste Space e setas pelo teclado.
- Confira as fontes na aba de rede e os estados de dica/erro com leitor de tela.

## Regras

- PT-BR rótulos, EN código (ADR-016)
- Sem hex solto, sem `rgba()`, sem `style` inline — use tokens L1
- Semântica > aparência
- `className` escapatória sempre permitida

## Anatomia dos componentes (sem React)

Receitas geradas das classes reais do TSX/CVA; não edite as strings. O campo `classes` do manifest contém `css` (CSS puro compartilhado) e `recipes` (HTML, HTML Tailwind e entradas completas por parte/variante). Não combine duas entradas completas no mesmo elemento.

**Sem Tailwind:** carregue `fonts.css`, `variables.css` e `base.css` (no lugar do `tokens.css`, cujas diretivas do Tailwind geram avisos no bundler) e copie o CSS puro abaixo para seu arquivo de receitas; use os trechos HTML com classes `semec-*`. Preserve a pasta `fonts/` junto de `fonts.css`. **Com Tailwind v4:** use os imports da instalação lite e o HTML Tailwind; mantenha as classes literais em arquivos que o Tailwind escaneia (ou registre o arquivo com `@source`). Não precisa escanear o React.

As receitas preservam foco, responsividade e estados CSS. Comportamentos interativos precisam de HTML nativo ou JavaScript da aplicação; ARIA sozinha não implementa interação.

### Button

Use uma entrada completa por combinação de variante/tamanho. No tamanho icon, forneça aria-label. disabled é nativo; loading exige bloquear a ação e manter o foco com aria-busy e aria-disabled.

HTML sem Tailwind:

```html
<button type="submit" class="semec-button-root">Revisar solicitação</button>
```

HTML com Tailwind v4:

```html
<button type="submit" class="inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active min-h-11 px-5 py-2 text-sm">Revisar solicitação</button>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-button-root` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active min-h-11 px-5 py-2 text-sm` |
| primary-sm | `semec-button-primary-sm` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2` |
| primary-md | `semec-button-primary-md` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active min-h-11 px-5 py-2 text-sm` |
| primary-lg | `semec-button-primary-lg` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active min-h-12 px-6 py-2 text-base` |
| primary-icon | `semec-button-primary-icon` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active h-11 w-11` |
| secondary-sm | `semec-button-secondary-sm` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2` |
| secondary-md | `semec-button-secondary-md` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 min-h-11 px-5 py-2 text-sm` |
| secondary-lg | `semec-button-secondary-lg` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 min-h-12 px-6 py-2 text-base` |
| secondary-icon | `semec-button-secondary-icon` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11 w-11` |
| outline-sm | `semec-button-outline-sm` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2` |
| outline-md | `semec-button-outline-md` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground min-h-11 px-5 py-2 text-sm` |
| outline-lg | `semec-button-outline-lg` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground min-h-12 px-6 py-2 text-base` |
| outline-icon | `semec-button-outline-icon` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground h-11 w-11` |
| ghost-sm | `semec-button-ghost-sm` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2` |
| ghost-md | `semec-button-ghost-md` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground min-h-11 px-5 py-2 text-sm` |
| ghost-lg | `semec-button-ghost-lg` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground min-h-12 px-6 py-2 text-base` |
| ghost-icon | `semec-button-ghost-icon` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground h-11 w-11` |
| destructive-sm | `semec-button-destructive-sm` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2` |
| destructive-md | `semec-button-destructive-md` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-11 px-5 py-2 text-sm` |
| destructive-lg | `semec-button-destructive-lg` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-12 px-6 py-2 text-base` |
| destructive-icon | `semec-button-destructive-icon` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 w-11` |
| success-sm | `semec-button-success-sm` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-success text-white hover:bg-success/90 focus-visible:ring-success/30 min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2` |
| success-md | `semec-button-success-md` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-success text-white hover:bg-success/90 focus-visible:ring-success/30 min-h-11 px-5 py-2 text-sm` |
| success-lg | `semec-button-success-lg` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-success text-white hover:bg-success/90 focus-visible:ring-success/30 min-h-12 px-6 py-2 text-base` |
| success-icon | `semec-button-success-icon` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-success text-white hover:bg-success/90 focus-visible:ring-success/30 h-11 w-11` |
| link-sm | `semec-button-link-sm` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-primary underline-offset-4 hover:underline min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2` |
| link-md | `semec-button-link-md` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-primary underline-offset-4 hover:underline min-h-11 px-5 py-2 text-sm` |
| link-lg | `semec-button-link-lg` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-primary underline-offset-4 hover:underline min-h-12 px-6 py-2 text-base` |
| link-icon | `semec-button-link-icon` | `inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-primary underline-offset-4 hover:underline h-11 w-11` |

### Input

Inválido: use aria-invalid="true" e aria-describedby apontando para o erro. Input/Textarea têm 16px abaixo de 640px (evita zoom no iOS) e 14px no desktop.

HTML sem Tailwind:

```html
<label for="nome" class="semec-form-field-label">Nome completo</label>
<input id="nome" name="nome" autocomplete="name" class="semec-input-root" aria-describedby="nome-hint">
<p id="nome-hint" class="semec-form-field-hint">Informe seu nome completo.</p>
```

HTML com Tailwind v4:

```html
<label for="nome" class="text-sm font-medium text-foreground">Nome completo</label>
<input id="nome" name="nome" autocomplete="name" class="flex h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive" aria-describedby="nome-hint">
<p id="nome-hint" class="text-xs text-muted-foreground">Informe seu nome completo.</p>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-input-root` | `flex h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive` |
| invalid | `semec-input-invalid` | `flex h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive` |

### Select

A receita usa select nativo com as classes do SelectTrigger: teclado e popup são do navegador. Não copie role=combobox nem simule o Radix só com CSS. O menu nativo pode ter aparência própria do sistema. Inválido: aria-invalid e descrição do erro, como Input.

HTML sem Tailwind:

```html
<label for="escola" class="semec-form-field-label">Escola</label>
<select id="escola" name="escola" class="semec-select-root"><option value="">Selecione</option><option value="centro">Escola Centro</option></select>
```

HTML com Tailwind v4:

```html
<label for="escola" class="text-sm font-medium text-foreground">Escola</label>
<select id="escola" name="escola" class="flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground shadow-elevation-1 placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive [&>span]:line-clamp-1 [&>span]:truncate [&>span]:text-left"><option value="">Selecione</option><option value="centro">Escola Centro</option></select>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-select-root` | `flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground shadow-elevation-1 placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive [&>span]:line-clamp-1 [&>span]:truncate [&>span]:text-left` |
| invalid | `semec-select-invalid` | `flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground shadow-elevation-1 placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive [&>span]:line-clamp-1 [&>span]:truncate [&>span]:text-left` |

### Textarea

Ligue dica/erro com aria-describedby; use aria-invalid="true" quando houver erro.

HTML sem Tailwind:

```html
<label for="observacoes" class="semec-form-field-label">Observações</label>
<textarea id="observacoes" name="observacoes" class="semec-textarea-root"></textarea>
```

HTML com Tailwind v4:

```html
<label for="observacoes" class="text-sm font-medium text-foreground">Observações</label>
<textarea id="observacoes" name="observacoes" class="flex min-h-[80px] w-full rounded-md border border-input bg-surface px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive"></textarea>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-textarea-root` | `flex min-h-[80px] w-full rounded-md border border-input bg-surface px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive` |
| invalid | `semec-textarea-invalid` | `flex min-h-[80px] w-full rounded-md border border-input bg-surface px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive` |

### FormField

Sem erro, substitua a mensagem pela dica (classe hint) e atualize aria-describedby. O FormField React oculta a dica enquanto há erro. Não anuncie todos os erros com role=alert; use o resumo no envio.

HTML sem Tailwind:

```html
<div class="semec-form-field-root">
  <label for="email" class="semec-form-field-label">E-mail (obrigatório)</label>
  <input id="email" name="email" type="email" autocomplete="email" required aria-invalid="true" aria-describedby="email-error" class="semec-input-invalid">
  <p id="email-error" class="semec-form-field-error">Informe um e-mail válido.</p>
</div>
```

HTML com Tailwind v4:

```html
<div class="grid content-start gap-1.5">
  <label for="email" class="text-sm font-medium text-foreground">E-mail (obrigatório)</label>
  <input id="email" name="email" type="email" autocomplete="email" required aria-invalid="true" aria-describedby="email-error" class="flex h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive">
  <p id="email-error" class="text-xs text-destructive">Informe um e-mail válido.</p>
</div>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-form-field-root` | `grid content-start gap-1.5` |
| label | `semec-form-field-label` | `text-sm font-medium text-foreground` |
| required | `semec-form-field-required` | `text-destructive` |
| hint | `semec-form-field-hint` | `text-xs text-muted-foreground` |
| error | `semec-form-field-error` | `text-xs text-destructive` |

### Card

Escolha o nível do título conforme a hierarquia da página.

HTML sem Tailwind:

```html
<section class="semec-card-root" aria-labelledby="card-title">
  <div class="semec-card-header"><h2 id="card-title" class="semec-card-title">Solicitação</h2><p class="semec-card-description">Confira seus dados.</p></div>
  <div class="semec-card-content">Conteúdo do cartão.</div>
  <div class="semec-card-footer">Protocolo disponível após o envio.</div>
</section>
```

HTML com Tailwind v4:

```html
<section class="rounded-lg border border-border bg-card text-card-foreground shadow-elevation-1 ring-1 ring-foreground/5" aria-labelledby="card-title">
  <div class="flex flex-col space-y-1.5 p-6"><h2 id="card-title" class="text-lg font-semibold leading-tight tracking-tight">Solicitação</h2><p class="text-sm text-muted-foreground">Confira seus dados.</p></div>
  <div class="p-6 pt-0">Conteúdo do cartão.</div>
  <div class="flex items-center p-6 pt-0">Protocolo disponível após o envio.</div>
</section>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-card-root` | `rounded-lg border border-border bg-card text-card-foreground shadow-elevation-1 ring-1 ring-foreground/5` |
| header | `semec-card-header` | `flex flex-col space-y-1.5 p-6` |
| title | `semec-card-title` | `text-lg font-semibold leading-tight tracking-tight` |
| description | `semec-card-description` | `text-sm text-muted-foreground` |
| content | `semec-card-content` | `p-6 pt-0` |
| footer | `semec-card-footer` | `flex items-center p-6 pt-0` |

### Alert

Destructive: role=alert apenas para erro dinâmico urgente; demais: role=status. Avisos estáticos podem omitir role. O ícone é decorativo; escreva o significado no texto.

HTML sem Tailwind:

```html
<div role="status" class="semec-alert-root">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v1m0 3v5"/></svg>
  <p class="semec-alert-title">Informação</p>
  <div class="semec-alert-description"><p>Confira os dados antes de enviar.</p></div>
</div>
```

HTML com Tailwind v4:

```html
<div role="status" class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4 border-info/40 bg-info-surface text-foreground [&>svg]:text-info pl-10">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v1m0 3v5"/></svg>
  <p class="mb-1 font-semibold leading-tight tracking-tight">Informação</p>
  <div class="text-sm [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1.5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1.5"><p>Confira os dados antes de enviar.</p></div>
</div>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-alert-root` | `relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4 border-info/40 bg-info-surface text-foreground [&>svg]:text-info pl-10` |
| title | `semec-alert-title` | `mb-1 font-semibold leading-tight tracking-tight` |
| description | `semec-alert-description` | `text-sm [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1.5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1.5` |
| default | `semec-alert-default` | `relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4 border-info/40 bg-info-surface text-foreground [&>svg]:text-info pl-10` |
| success | `semec-alert-success` | `relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4 border-success/40 bg-success-surface text-foreground [&>svg]:text-success pl-10` |
| warning | `semec-alert-warning` | `relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4 border-warning/40 bg-warning-surface text-foreground [&>svg]:text-warning pl-10` |
| destructive | `semec-alert-destructive` | `relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4 border-destructive/40 bg-destructive-surface text-foreground [&>svg]:text-destructive pl-10` |

### Header

O cabeçalho usa superfície clara e borda. Acrescente o logo oficial com texto alternativo. Só o link atual recebe aria-current=page e a entrada current.

HTML sem Tailwind:

```html
<header class="semec-header-root">
  <a href="#conteudo" class="semec-header-brand" aria-label="SEMEC — Atendimento — ir para o início"><span class="semec-header-brand-text">SEMEC <span aria-hidden="true" class="semec-header-separator">|</span> <span class="semec-header-service">Atendimento</span></span></a>
  <nav aria-label="Principal" class="semec-header-nav"><a href="#conteudo" aria-current="page" class="semec-header-current">Solicitações</a><a href="#ajuda" class="semec-header-link">Ajuda</a></nav>
</header>
```

HTML com Tailwind v4:

```html
<header class="flex w-full max-w-full flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6">
  <a href="#conteudo" class="flex min-h-11 min-w-0 items-center gap-3 no-underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="SEMEC — Atendimento — ir para o início"><span class="min-w-0 text-base font-bold leading-snug text-brand-hero break-words">SEMEC <span aria-hidden="true" class="font-normal text-muted-foreground">|</span> <span class="font-semibold text-foreground">Atendimento</span></span></a>
  <nav aria-label="Principal" class="flex flex-wrap items-center gap-2"><a href="#conteudo" aria-current="page" class="inline-flex min-h-11 items-center rounded-md px-2 text-sm no-underline transition-colors duration-fast ease-standard hover:text-brand-hero focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background font-semibold text-brand-hero">Solicitações</a><a href="#ajuda" class="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground no-underline transition-colors duration-fast ease-standard hover:text-brand-hero focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Ajuda</a></nav>
</header>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-header-root` | `flex w-full max-w-full flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6` |
| brand | `semec-header-brand` | `flex min-h-11 min-w-0 items-center gap-3 no-underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| brandText | `semec-header-brand-text` | `min-w-0 text-base font-bold leading-snug text-brand-hero break-words` |
| separator | `semec-header-separator` | `font-normal text-muted-foreground` |
| service | `semec-header-service` | `font-semibold text-foreground` |
| nav | `semec-header-nav` | `flex flex-wrap items-center gap-2` |
| link | `semec-header-link` | `inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground no-underline transition-colors duration-fast ease-standard hover:text-brand-hero focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| current | `semec-header-current` | `inline-flex min-h-11 items-center rounded-md px-2 text-sm no-underline transition-colors duration-fast ease-standard hover:text-brand-hero focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background font-semibold text-brand-hero` |

### ErrorSummary

Após cada envio inválido, foque o resumo com JavaScript; não mova o foco ao digitar. Os links devem focar os campos correspondentes. O CSS não implementa esse comportamento.

HTML sem Tailwind:

```html
<div id="resumo" role="alert" tabindex="-1" aria-labelledby="resumo-title" class="semec-error-summary-root">
  <h2 id="resumo-title" class="semec-error-summary-title">Há um problema</h2>
  <ul class="semec-error-summary-list"><li><a href="#email" class="semec-error-summary-link">Informe um e-mail válido.</a></li></ul>
</div>
```

HTML com Tailwind v4:

```html
<div id="resumo" role="alert" tabindex="-1" aria-labelledby="resumo-title" class="border-2 border-l-[3px] border-destructive rounded-md bg-destructive/5 p-4 px-6 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1">
  <h2 id="resumo-title" class="text-xl font-semibold text-destructive mb-3">Há um problema</h2>
  <ul class="space-y-2 ml-0 pl-6 text-base"><li><a href="#email" class="text-destructive font-medium underline underline-offset-[0.2em] hover:decoration-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 rounded-sm">Informe um e-mail válido.</a></li></ul>
</div>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-error-summary-root` | `border-2 border-l-[3px] border-destructive rounded-md bg-destructive/5 p-4 px-6 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1` |
| title | `semec-error-summary-title` | `text-xl font-semibold text-destructive mb-3` |
| list | `semec-error-summary-list` | `space-y-2 ml-0 pl-6 text-base` |
| link | `semec-error-summary-link` | `text-destructive font-medium underline underline-offset-[0.2em] hover:decoration-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 rounded-sm` |

### Badge

Escreva o estado no texto; não dependa só da cor. Badge não é botão.

HTML sem Tailwind:

```html
<span class="semec-badge-success">Aprovado</span>
```

HTML com Tailwind v4:

```html
<span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-success-surface text-success">Aprovado</span>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-badge-root` | `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground` |
| default | `semec-badge-default` | `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground` |
| secondary | `semec-badge-secondary` | `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground` |
| outline | `semec-badge-outline` | `inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground` |
| success | `semec-badge-success` | `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-success-surface text-success` |
| warning | `semec-badge-warning` | `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-warning-surface text-warning` |
| danger | `semec-badge-danger` | `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive-surface text-destructive` |
| info | `semec-badge-info` | `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-info-surface text-info` |

### Toast

Crie a região viva vazia antes de inserir a mensagem; implemente fechar por clique/teclado e devolva o foco se necessário. Esta anatomia é estática: sem temporizador, swipe ou atalho F8 do Radix. A entrada viewport é opcional; não deixe uma camada vazia bloquear cliques. Não use data-state/data-swipe sem implementar os estados correspondentes.

HTML sem Tailwind:

```html
<div role="status" aria-live="polite" aria-atomic="true">
  <div class="semec-toast-success">
    <div><p class="semec-toast-title">Solicitação salva</p><p class="semec-toast-description">Seu protocolo está disponível.</p></div>
    <button type="button" toast-close="" aria-label="Fechar notificação" class="semec-toast-close">×</button>
  </div>
</div>
```

HTML com Tailwind v4:

```html
<div role="status" aria-live="polite" aria-atomic="true">
  <div class="group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[12px] border border-border p-4 shadow-elevation-2 font-sans transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out border-none bg-success-emphasis text-success-emphasis-foreground px-5 py-4 [&_[toast-close]]:text-success-emphasis-foreground [&_[toast-close]]:hover:bg-success-emphasis-foreground/10">
    <div><p class="text-base font-bold leading-tight">Solicitação salva</p><p class="text-sm font-normal leading-[1.4] opacity-95">Seu protocolo está disponível.</p></div>
    <button type="button" toast-close="" aria-label="Fechar notificação" class="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">×</button>
  </div>
</div>
```

| Parte / variante | Classe no CSS puro | Classes do componente |
|---|---|---|
| root | `semec-toast-root` | `group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[12px] border p-4 shadow-elevation-2 font-sans transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out border-border bg-card text-card-foreground` |
| viewport | `semec-toast-viewport` | `pointer-events-none fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:top-4 sm:right-4 md:max-w-[420px]` |
| title | `semec-toast-title` | `text-base font-bold leading-tight` |
| description | `semec-toast-description` | `text-sm font-normal leading-[1.4] opacity-95` |
| close | `semec-toast-close` | `-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring` |
| action | `semec-toast-action` | `inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-border bg-transparent px-4 text-sm font-medium transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50` |
| default | `semec-toast-default` | `group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[12px] border p-4 shadow-elevation-2 font-sans transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out border-border bg-card text-card-foreground` |
| success | `semec-toast-success` | `group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[12px] border border-border p-4 shadow-elevation-2 font-sans transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out border-none bg-success-emphasis text-success-emphasis-foreground px-5 py-4 [&_[toast-close]]:text-success-emphasis-foreground [&_[toast-close]]:hover:bg-success-emphasis-foreground/10` |
| warning | `semec-toast-warning` | `group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[12px] border p-4 shadow-elevation-2 font-sans transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out border-warning/40 bg-warning-surface text-foreground` |
| destructive | `semec-toast-destructive` | `group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[12px] border p-4 shadow-elevation-2 font-sans transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out border-destructive/40 bg-destructive-surface text-destructive` |

### CSS puro das receitas

Gerado pelo Tailwind no build do kit. O consumidor copia CSS padrão com `var(--…)`, incluindo os defaults de reset/ring necessários à paridade; não executa Tailwind. Este bloco compartilhado atende todas as anatomias acima. Use-o depois de variables.css e base.css (ou do tokens.css, com Tailwind), antes das personalizações da aplicação.

```css
/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
@layer properties;
@layer theme, base, components, utilities;
@layer theme {
  :root, :host {
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    --color-white: #fff;
    --spacing: 0.25rem;
    --text-base: var(--pv-text-base);
    --font-weight-normal: 400;
    --tracking-tight: -0.025em;
    --leading-tight: 1.25;
    --leading-snug: 1.375;
    --leading-relaxed: 1.625;
    --default-transition-duration: 150ms;
    --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    --default-font-family: var(--font-family-sans);
    --default-mono-font-family: var(--font-mono);
    --color-border: var(--border);
    --leading-base: var(--pv-leading-base);
  }
}
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }
  html, :host {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    font-family: var(--default-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    font-feature-settings: var(--default-font-feature-settings, normal);
    font-variation-settings: var(--default-font-variation-settings, normal);
    -webkit-tap-highlight-color: transparent;
  }
  hr {
    height: 0;
    color: inherit;
    border-top-width: 1px;
  }
  abbr:where([title]) {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }
  h1, h2, h3, h4, h5, h6 {
    font-size: inherit;
    font-weight: inherit;
  }
  a {
    color: inherit;
    -webkit-text-decoration: inherit;
    text-decoration: inherit;
  }
  b, strong {
    font-weight: bolder;
  }
  code, kbd, samp, pre {
    font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
    font-feature-settings: var(--default-mono-font-feature-settings, normal);
    font-variation-settings: var(--default-mono-font-variation-settings, normal);
    font-size: 1em;
  }
  small {
    font-size: 80%;
  }
  sub, sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }
  sub {
    bottom: -0.25em;
  }
  sup {
    top: -0.5em;
  }
  table {
    text-indent: 0;
    border-color: inherit;
    border-collapse: collapse;
  }
  :-moz-focusring:where(:not(iframe)) {
    outline: auto;
  }
  progress {
    vertical-align: baseline;
  }
  summary {
    display: list-item;
  }
  ol, ul, menu {
    list-style: none;
  }
  img, svg, video, canvas, audio, iframe, embed, object {
    display: block;
    vertical-align: middle;
  }
  img, video {
    max-width: 100%;
    height: auto;
  }
  button, input, select, optgroup, textarea, ::file-selector-button {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    border-radius: 0;
    background-color: transparent;
    opacity: 1;
  }
  :where(select:is([multiple], [size])) optgroup {
    font-weight: bolder;
  }
  :where(select:is([multiple], [size])) optgroup option {
    padding-inline-start: 20px;
  }
  ::file-selector-button {
    margin-inline-end: 4px;
  }
  ::placeholder {
    opacity: 1;
  }
  @supports (not (-webkit-appearance: -apple-pay-button))  or (contain-intrinsic-size: 1px) {
    ::placeholder {
      color: currentcolor;
      @supports (color: color-mix(in lab, red, red)) {
        color: color-mix(in oklab, currentcolor 50%, transparent);
      }
    }
  }
  textarea {
    resize: vertical;
  }
  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }
  ::-webkit-date-and-time-value {
    min-height: 1lh;
    text-align: inherit;
  }
  ::-webkit-datetime-edit {
    display: inline-flex;
  }
  ::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  ::-webkit-datetime-edit, ::-webkit-datetime-edit-year-field, ::-webkit-datetime-edit-month-field, ::-webkit-datetime-edit-day-field, ::-webkit-datetime-edit-hour-field, ::-webkit-datetime-edit-minute-field, ::-webkit-datetime-edit-second-field, ::-webkit-datetime-edit-millisecond-field, ::-webkit-datetime-edit-meridiem-field {
    padding-block: 0;
  }
  ::-webkit-calendar-picker-indicator {
    line-height: 1;
  }
  :-moz-ui-invalid {
    box-shadow: none;
  }
  button, input:where([type="button"], [type="reset"], [type="submit"]), ::file-selector-button {
    appearance: button;
  }
  ::-webkit-inner-spin-button, ::-webkit-outer-spin-button {
    height: auto;
  }
  [hidden]:where(:not([hidden="until-found"])) {
    display: none !important;
  }
}
@layer utilities;
@property --tw-animation-delay {
  syntax: "*";
  inherits: false;
  initial-value: 0s;
}
@property --tw-animation-direction {
  syntax: "*";
  inherits: false;
  initial-value: normal;
}
@property --tw-animation-duration {
  syntax: "*";
  inherits: false;
}
@property --tw-animation-fill-mode {
  syntax: "*";
  inherits: false;
  initial-value: none;
}
@property --tw-animation-iteration-count {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-enter-opacity {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-enter-rotate {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-enter-scale {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-enter-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-enter-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-exit-opacity {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-exit-rotate {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-exit-scale {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-exit-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-exit-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@keyframes enter {
  from {
    opacity: var(--tw-enter-opacity, 1);
    transform: translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0));
  }
}
@keyframes exit {
  to {
    opacity: var(--tw-exit-opacity, 1);
    transform: translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0));
  }
}
@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height, auto);
  }
}
@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height, auto);
  }
  to {
    height: 0;
  }
}
@keyframes collapsible-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-collapsible-content-height, auto);
  }
}
@keyframes collapsible-up {
  from {
    height: var(--radix-collapsible-content-height, auto);
  }
  to {
    height: 0;
  }
}
@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    border-color: var(--color-border, currentcolor);
  }
  body {
    font-family: var(--font-family-sans);
    font-size: var(--text-base);
    line-height: var(--leading-base);
    background: var(--bg);
    color: var(--fg);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  a:not([class]) {
    text-decoration-line: underline;
    text-underline-offset: 0.2em;
  }
  :focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
  [data-surface="brand"], .bg-brand-hero {
    --focus-ring: var(--focus-ring-inverse);
  }
  .bg-brand-hero {
    background-color: var(--brand-hero);
    color: var(--text-on-brand);
  }
  .bg-brand-hero:focus-visible, [data-surface="default"] {
    --focus-ring: var(--pv-blue-hero);
  }
  button[role="checkbox"] + input[type="checkbox"][aria-hidden="true"], button[role="switch"] + input[type="checkbox"][aria-hidden="true"], button[role="radio"] + input[type="radio"][aria-hidden="true"] {
    position: absolute;
    pointer-events: none;
    opacity: 0;
    margin: 0;
  }
  [data-semec-slider] > input {
    display: none;
  }
  [data-semec-slider][data-orientation="horizontal"] {
    --radix-slider-thumb-transform: translateX(-50%);
  }
  [data-semec-slider][data-orientation="vertical"] {
    --radix-slider-thumb-transform: translateY(50%);
  }
  [data-semec-slider] > span:has(> [role="slider"]) {
    position: absolute;
    transform: var(--radix-slider-thumb-transform);
  }
  [data-semec-slider] [role="slider"]:not([aria-valuenow]) {
    visibility: hidden;
  }
}
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
[data-radix-scroll-area-viewport], [data-radix-select-viewport] {
  scrollbar-width: none;
}
[data-radix-scroll-area-viewport]::-webkit-scrollbar, [data-radix-select-viewport]::-webkit-scrollbar {
  display: none;
}
.semec-button-root {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--action-primary);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--action-primary-hover);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:active {
    background-color: var(--action-primary-active);
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-primary-sm {
  position: relative;
  display: inline-flex;
  min-height: calc(var(--spacing) * 9);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--action-primary);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 1.5);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::after {
    content: var(--tw-content);
    position: absolute;
  }
  &::after {
    content: var(--tw-content);
    top: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    left: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    height: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-height: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    width: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-width: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &:hover {
    @media (hover: hover) {
      background-color: var(--action-primary-hover);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:active {
    background-color: var(--action-primary-active);
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-primary-md {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--action-primary);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--action-primary-hover);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:active {
    background-color: var(--action-primary-active);
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-primary-lg {
  display: inline-flex;
  min-height: calc(var(--spacing) * 12);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--action-primary);
  padding-inline: calc(var(--spacing) * 6);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--action-primary-hover);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:active {
    background-color: var(--action-primary-active);
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-primary-icon {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  width: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--action-primary);
  text-align: center;
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--action-primary-hover);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:active {
    background-color: var(--action-primary-active);
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-secondary-sm {
  position: relative;
  display: inline-flex;
  min-height: calc(var(--spacing) * 9);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--surface-alt);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 1.5);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::after {
    content: var(--tw-content);
    position: absolute;
  }
  &::after {
    content: var(--tw-content);
    top: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    left: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    height: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-height: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    width: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-width: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
      background-color: var(--surface-alt);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--surface-alt) calc(80 * 1%), transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-secondary-md {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--surface-alt);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
      background-color: var(--surface-alt);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--surface-alt) calc(80 * 1%), transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-secondary-lg {
  display: inline-flex;
  min-height: calc(var(--spacing) * 12);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--surface-alt);
  padding-inline: calc(var(--spacing) * 6);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
      background-color: var(--surface-alt);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--surface-alt) calc(80 * 1%), transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-secondary-icon {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  width: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--surface-alt);
  text-align: center;
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
      background-color: var(--surface-alt);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--surface-alt) calc(80 * 1%), transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-outline-sm {
  position: relative;
  display: inline-flex;
  min-height: calc(var(--spacing) * 9);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: transparent;
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 1.5);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::after {
    content: var(--tw-content);
    position: absolute;
  }
  &::after {
    content: var(--tw-content);
    top: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    left: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    height: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-height: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    width: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-width: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-outline-md {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: transparent;
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-outline-lg {
  display: inline-flex;
  min-height: calc(var(--spacing) * 12);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: transparent;
  padding-inline: calc(var(--spacing) * 6);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-outline-icon {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  width: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: transparent;
  text-align: center;
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-ghost-sm {
  position: relative;
  display: inline-flex;
  min-height: calc(var(--spacing) * 9);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 1.5);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::after {
    content: var(--tw-content);
    position: absolute;
  }
  &::after {
    content: var(--tw-content);
    top: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    left: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    height: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-height: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    width: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-width: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-ghost-md {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-ghost-lg {
  display: inline-flex;
  min-height: calc(var(--spacing) * 12);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  padding-inline: calc(var(--spacing) * 6);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-ghost-icon {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  width: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  text-align: center;
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-destructive-sm {
  position: relative;
  display: inline-flex;
  min-height: calc(var(--spacing) * 9);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-danger);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 1.5);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::after {
    content: var(--tw-content);
    position: absolute;
  }
  &::after {
    content: var(--tw-content);
    top: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    left: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    height: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-height: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    width: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-width: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-danger);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-danger) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-destructive-md {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-danger);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-danger);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-danger) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-destructive-lg {
  display: inline-flex;
  min-height: calc(var(--spacing) * 12);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-danger);
  padding-inline: calc(var(--spacing) * 6);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-danger);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-danger) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-destructive-icon {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  width: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-danger);
  text-align: center;
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--text-on-brand);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-danger);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-danger) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-success-sm {
  position: relative;
  display: inline-flex;
  min-height: calc(var(--spacing) * 9);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-success);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 1.5);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--color-white);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::after {
    content: var(--tw-content);
    position: absolute;
  }
  &::after {
    content: var(--tw-content);
    top: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    left: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    height: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-height: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    width: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-width: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-success);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-success) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--feedback-success);
    @supports (color: color-mix(in lab, red, red)) {
      --tw-ring-color: color-mix(in oklab, var(--feedback-success) 30%, transparent);
    }
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-success-md {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-success);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--color-white);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-success);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-success) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--feedback-success);
    @supports (color: color-mix(in lab, red, red)) {
      --tw-ring-color: color-mix(in oklab, var(--feedback-success) 30%, transparent);
    }
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-success-lg {
  display: inline-flex;
  min-height: calc(var(--spacing) * 12);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-success);
  padding-inline: calc(var(--spacing) * 6);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--color-white);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-success);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-success) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--feedback-success);
    @supports (color: color-mix(in lab, red, red)) {
      --tw-ring-color: color-mix(in oklab, var(--feedback-success) 30%, transparent);
    }
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-success-icon {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  width: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  background-color: var(--feedback-success);
  text-align: center;
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--color-white);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--feedback-success);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--feedback-success) 90%, transparent);
      }
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--feedback-success);
    @supports (color: color-mix(in lab, red, red)) {
      --tw-ring-color: color-mix(in oklab, var(--feedback-success) 30%, transparent);
    }
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-link-sm {
  position: relative;
  display: inline-flex;
  min-height: calc(var(--spacing) * 9);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 1.5);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--action-primary);
  text-decoration-line: none;
  text-underline-offset: 4px;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::after {
    content: var(--tw-content);
    position: absolute;
  }
  &::after {
    content: var(--tw-content);
    top: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    left: calc(1 / 2 * 100%);
  }
  &::after {
    content: var(--tw-content);
    height: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-height: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    width: 100%;
  }
  &::after {
    content: var(--tw-content);
    min-width: calc(var(--spacing) * 11);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &::after {
    content: var(--tw-content);
    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &:hover {
    @media (hover: hover) {
      text-decoration-line: underline;
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-link-md {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--action-primary);
  text-decoration-line: none;
  text-underline-offset: 4px;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      text-decoration-line: underline;
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-link-lg {
  display: inline-flex;
  min-height: calc(var(--spacing) * 12);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  padding-inline: calc(var(--spacing) * 6);
  padding-block: calc(var(--spacing) * 2);
  text-align: center;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--action-primary);
  text-decoration-line: none;
  text-underline-offset: 4px;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      text-decoration-line: underline;
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-button-link-icon {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  width: calc(var(--spacing) * 11);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--pv-radius-full);
  text-align: center;
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  text-wrap: balance;
  color: var(--action-primary);
  text-decoration-line: none;
  text-underline-offset: 4px;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      text-decoration-line: underline;
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
  & svg {
    pointer-events: none;
  }
  & svg {
    flex-shrink: 0;
  }
}
.semec-input-root {
  display: flex;
  height: calc(var(--spacing) * 11);
  width: 100%;
  border-radius: var(--pv-radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: var(--surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 2);
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  color: var(--fg);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::placeholder {
    color: var(--text-muted);
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--surface);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    cursor: not-allowed;
  }
  &:disabled {
    opacity: 50%;
  }
  &[aria-invalid="true"] {
    border-color: var(--feedback-danger);
  }
  &[aria-invalid="true"] {
    &:focus-visible {
      --tw-ring-color: var(--feedback-danger);
    }
  }
  @media (width >= 40rem) {
    font-size: var(--pv-text-sm);
    line-height: var(--tw-leading, var(--pv-leading-sm));
  }
}
.semec-input-invalid {
  display: flex;
  height: calc(var(--spacing) * 11);
  width: 100%;
  border-radius: var(--pv-radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: var(--surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 2);
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  color: var(--fg);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::placeholder {
    color: var(--text-muted);
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--surface);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    cursor: not-allowed;
  }
  &:disabled {
    opacity: 50%;
  }
  &[aria-invalid="true"] {
    border-color: var(--feedback-danger);
  }
  &[aria-invalid="true"] {
    &:focus-visible {
      --tw-ring-color: var(--feedback-danger);
    }
  }
  @media (width >= 40rem) {
    font-size: var(--pv-text-sm);
    line-height: var(--tw-leading, var(--pv-leading-sm));
  }
}
.semec-select-root {
  display: flex;
  height: calc(var(--spacing) * 11);
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border-radius: var(--pv-radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: var(--surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 2);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  white-space: nowrap;
  color: var(--fg);
  --tw-shadow: var(--elevation-1);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::placeholder {
    color: var(--text-muted);
  }
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-ring-offset-color: var(--surface);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    cursor: not-allowed;
  }
  &:disabled {
    opacity: 50%;
  }
  &[aria-invalid="true"] {
    border-color: var(--feedback-danger);
  }
  &>span {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  &>span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &>span {
    text-align: left;
  }
}
.semec-select-invalid {
  display: flex;
  height: calc(var(--spacing) * 11);
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border-radius: var(--pv-radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: var(--surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 2);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  white-space: nowrap;
  color: var(--fg);
  --tw-shadow: var(--elevation-1);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::placeholder {
    color: var(--text-muted);
  }
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-ring-offset-color: var(--surface);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    cursor: not-allowed;
  }
  &:disabled {
    opacity: 50%;
  }
  &[aria-invalid="true"] {
    border-color: var(--feedback-danger);
  }
  &>span {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  &>span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &>span {
    text-align: left;
  }
}
.semec-textarea-root {
  display: flex;
  min-height: 80px;
  width: 100%;
  border-radius: var(--pv-radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: var(--surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  color: var(--fg);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::placeholder {
    color: var(--text-muted);
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--surface);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    cursor: not-allowed;
  }
  &:disabled {
    opacity: 50%;
  }
  &[aria-invalid="true"] {
    border-color: var(--feedback-danger);
  }
  &[aria-invalid="true"] {
    &:focus-visible {
      --tw-ring-color: var(--feedback-danger);
    }
  }
  @media (width >= 40rem) {
    font-size: var(--pv-text-sm);
    line-height: var(--tw-leading, var(--pv-leading-sm));
  }
}
.semec-textarea-invalid {
  display: flex;
  min-height: 80px;
  width: 100%;
  border-radius: var(--pv-radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border-strong);
  background-color: var(--surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  color: var(--fg);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &::placeholder {
    color: var(--text-muted);
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--surface);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    cursor: not-allowed;
  }
  &:disabled {
    opacity: 50%;
  }
  &[aria-invalid="true"] {
    border-color: var(--feedback-danger);
  }
  &[aria-invalid="true"] {
    &:focus-visible {
      --tw-ring-color: var(--feedback-danger);
    }
  }
  @media (width >= 40rem) {
    font-size: var(--pv-text-sm);
    line-height: var(--tw-leading, var(--pv-leading-sm));
  }
}
.semec-form-field-root {
  display: grid;
  align-content: flex-start;
  gap: calc(var(--spacing) * 1.5);
}
.semec-form-field-label {
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--fg);
}
.semec-form-field-required {
  color: var(--feedback-danger);
}
.semec-form-field-hint {
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  color: var(--text-muted);
}
.semec-form-field-error {
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  color: var(--feedback-danger);
}
.semec-card-root {
  border-radius: var(--pv-radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border);
  background-color: var(--surface);
  color: var(--fg);
  --tw-shadow: var(--elevation-1);
  --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color: var(--fg);
  @supports (color: color-mix(in lab, red, red)) {
    --tw-ring-color: color-mix(in oklab, var(--fg) 5%, transparent);
  }
}
.semec-card-header {
  display: flex;
  flex-direction: column;
  :where(& > :not(:last-child)) {
    --tw-space-y-reverse: 0;
    margin-block-start: calc(calc(var(--spacing) * 1.5) * var(--tw-space-y-reverse));
    margin-block-end: calc(calc(var(--spacing) * 1.5) * calc(1 - var(--tw-space-y-reverse)));
  }
  padding: calc(var(--spacing) * 6);
}
.semec-card-title {
  font-size: var(--pv-text-lg);
  line-height: var(--tw-leading, var(--pv-leading-lg));
  --tw-leading: var(--leading-tight);
  line-height: var(--leading-tight);
  --tw-font-weight: var(--font-semibold);
  font-weight: var(--font-semibold);
  --tw-tracking: var(--tracking-tight);
  letter-spacing: var(--tracking-tight);
}
.semec-card-description {
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  color: var(--text-muted);
}
.semec-card-content {
  padding: calc(var(--spacing) * 6);
  padding-top: 0px;
}
.semec-card-footer {
  display: flex;
  align-items: center;
  padding: calc(var(--spacing) * 6);
  padding-top: 0px;
}
.semec-alert-root {
  position: relative;
  width: 100%;
  border-radius: var(--pv-radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--feedback-info);
  @supports (color: color-mix(in lab, red, red)) {
    border-color: color-mix(in oklab, var(--feedback-info) 40%, transparent);
  }
  background-color: var(--feedback-info-surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  padding-left: calc(var(--spacing) * 10);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  color: var(--fg);
  &>svg {
    position: absolute;
  }
  &>svg {
    top: calc(var(--spacing) * 4);
  }
  &>svg {
    left: calc(var(--spacing) * 4);
  }
  &>svg {
    height: calc(var(--spacing) * 4);
  }
  &>svg {
    width: calc(var(--spacing) * 4);
  }
  &>svg {
    color: var(--feedback-info);
  }
}
.semec-alert-title {
  margin-bottom: var(--spacing);
  --tw-leading: var(--leading-tight);
  line-height: var(--leading-tight);
  --tw-font-weight: var(--font-semibold);
  font-weight: var(--font-semibold);
  --tw-tracking: var(--tracking-tight);
  letter-spacing: var(--tracking-tight);
}
.semec-alert-description {
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  & ol {
    margin-top: calc(var(--spacing) * 2);
  }
  & ol {
    list-style-position: inside;
  }
  & ol {
    list-style-type: decimal;
  }
  & ol {
    :where(& > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(calc(var(--spacing) * 1.5) * var(--tw-space-y-reverse));
      margin-block-end: calc(calc(var(--spacing) * 1.5) * calc(1 - var(--tw-space-y-reverse)));
    }
  }
  & p {
    --tw-leading: var(--leading-relaxed);
    line-height: var(--leading-relaxed);
  }
  & ul {
    margin-top: calc(var(--spacing) * 2);
  }
  & ul {
    list-style-position: inside;
  }
  & ul {
    list-style-type: disc;
  }
  & ul {
    :where(& > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(calc(var(--spacing) * 1.5) * var(--tw-space-y-reverse));
      margin-block-end: calc(calc(var(--spacing) * 1.5) * calc(1 - var(--tw-space-y-reverse)));
    }
  }
}
.semec-alert-default {
  position: relative;
  width: 100%;
  border-radius: var(--pv-radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--feedback-info);
  @supports (color: color-mix(in lab, red, red)) {
    border-color: color-mix(in oklab, var(--feedback-info) 40%, transparent);
  }
  background-color: var(--feedback-info-surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  padding-left: calc(var(--spacing) * 10);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  color: var(--fg);
  &>svg {
    position: absolute;
  }
  &>svg {
    top: calc(var(--spacing) * 4);
  }
  &>svg {
    left: calc(var(--spacing) * 4);
  }
  &>svg {
    height: calc(var(--spacing) * 4);
  }
  &>svg {
    width: calc(var(--spacing) * 4);
  }
  &>svg {
    color: var(--feedback-info);
  }
}
.semec-alert-success {
  position: relative;
  width: 100%;
  border-radius: var(--pv-radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--feedback-success);
  @supports (color: color-mix(in lab, red, red)) {
    border-color: color-mix(in oklab, var(--feedback-success) 40%, transparent);
  }
  background-color: var(--feedback-success-surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  padding-left: calc(var(--spacing) * 10);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  color: var(--fg);
  &>svg {
    position: absolute;
  }
  &>svg {
    top: calc(var(--spacing) * 4);
  }
  &>svg {
    left: calc(var(--spacing) * 4);
  }
  &>svg {
    height: calc(var(--spacing) * 4);
  }
  &>svg {
    width: calc(var(--spacing) * 4);
  }
  &>svg {
    color: var(--feedback-success);
  }
}
.semec-alert-warning {
  position: relative;
  width: 100%;
  border-radius: var(--pv-radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--feedback-warning);
  @supports (color: color-mix(in lab, red, red)) {
    border-color: color-mix(in oklab, var(--feedback-warning) 40%, transparent);
  }
  background-color: var(--feedback-warning-surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  padding-left: calc(var(--spacing) * 10);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  color: var(--fg);
  &>svg {
    position: absolute;
  }
  &>svg {
    top: calc(var(--spacing) * 4);
  }
  &>svg {
    left: calc(var(--spacing) * 4);
  }
  &>svg {
    height: calc(var(--spacing) * 4);
  }
  &>svg {
    width: calc(var(--spacing) * 4);
  }
  &>svg {
    color: var(--feedback-warning);
  }
}
.semec-alert-destructive {
  position: relative;
  width: 100%;
  border-radius: var(--pv-radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--feedback-danger);
  @supports (color: color-mix(in lab, red, red)) {
    border-color: color-mix(in oklab, var(--feedback-danger) 40%, transparent);
  }
  background-color: var(--feedback-danger-surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  padding-left: calc(var(--spacing) * 10);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  color: var(--fg);
  &>svg {
    position: absolute;
  }
  &>svg {
    top: calc(var(--spacing) * 4);
  }
  &>svg {
    left: calc(var(--spacing) * 4);
  }
  &>svg {
    height: calc(var(--spacing) * 4);
  }
  &>svg {
    width: calc(var(--spacing) * 4);
  }
  &>svg {
    color: var(--feedback-danger);
  }
}
.semec-header-root {
  display: flex;
  width: 100%;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 4);
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
  border-color: var(--border);
  background-color: var(--surface);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  @media (width >= 40rem) {
    padding-inline: calc(var(--spacing) * 6);
  }
}
.semec-header-brand {
  display: flex;
  min-height: calc(var(--spacing) * 11);
  min-width: 0px;
  align-items: center;
  gap: calc(var(--spacing) * 3);
  text-decoration-line: none;
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-header-brand-text {
  min-width: 0px;
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-leading: var(--leading-snug);
  line-height: var(--leading-snug);
  --tw-font-weight: var(--font-bold);
  font-weight: var(--font-bold);
  overflow-wrap: break-word;
  color: var(--brand-hero);
}
.semec-header-separator {
  --tw-font-weight: var(--font-weight-normal);
  font-weight: var(--font-weight-normal);
  color: var(--text-muted);
}
.semec-header-service {
  --tw-font-weight: var(--font-semibold);
  font-weight: var(--font-semibold);
  color: var(--fg);
}
.semec-header-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) * 2);
}
.semec-header-link {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  border-radius: var(--pv-radius-md);
  padding-inline: calc(var(--spacing) * 2);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--fg);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      color: var(--brand-hero);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-header-current {
  display: inline-flex;
  min-height: calc(var(--spacing) * 11);
  align-items: center;
  border-radius: var(--pv-radius-md);
  padding-inline: calc(var(--spacing) * 2);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-semibold);
  font-weight: var(--font-semibold);
  color: var(--brand-hero);
  text-decoration-line: none;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      color: var(--brand-hero);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus-visible {
    --tw-ring-offset-color: var(--bg);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-error-summary-root {
  border-radius: var(--pv-radius-md);
  border-style: var(--tw-border-style);
  border-width: 2px;
  border-left-style: var(--tw-border-style);
  border-left-width: 3px;
  border-color: var(--feedback-danger);
  background-color: var(--feedback-danger);
  @supports (color: color-mix(in lab, red, red)) {
    background-color: color-mix(in oklab, var(--feedback-danger) 5%, transparent);
  }
  padding: calc(var(--spacing) * 4);
  padding-inline: calc(var(--spacing) * 6);
  &:focus-visible {
    outline-style: var(--tw-outline-style);
    outline-width: 2px;
  }
  &:focus-visible {
    outline-offset: 1px;
  }
  &:focus-visible {
    outline-color: var(--focus-ring);
  }
}
.semec-error-summary-title {
  margin-bottom: calc(var(--spacing) * 3);
  font-size: var(--pv-text-xl);
  line-height: var(--tw-leading, var(--pv-leading-xl));
  --tw-font-weight: var(--font-semibold);
  font-weight: var(--font-semibold);
  color: var(--feedback-danger);
}
.semec-error-summary-list {
  margin-left: 0px;
  :where(& > :not(:last-child)) {
    --tw-space-y-reverse: 0;
    margin-block-start: calc(calc(var(--spacing) * 2) * var(--tw-space-y-reverse));
    margin-block-end: calc(calc(var(--spacing) * 2) * calc(1 - var(--tw-space-y-reverse)));
  }
  padding-left: calc(var(--spacing) * 6);
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
}
.semec-error-summary-link {
  border-radius: var(--pv-radius-sm);
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--feedback-danger);
  text-decoration-line: underline;
  text-underline-offset: 0.2em;
  &:hover {
    @media (hover: hover) {
      text-decoration-thickness: 2px;
    }
  }
  &:focus-visible {
    outline-style: var(--tw-outline-style);
    outline-width: 2px;
  }
  &:focus-visible {
    outline-offset: 1px;
  }
  &:focus-visible {
    outline-color: var(--focus-ring);
  }
}
.semec-badge-root {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: transparent;
  background-color: var(--action-primary);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--text-on-brand);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-badge-default {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: transparent;
  background-color: var(--action-primary);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--text-on-brand);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-badge-secondary {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: transparent;
  background-color: var(--surface-alt);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--fg);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-badge-outline {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--fg);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-badge-success {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: transparent;
  background-color: var(--feedback-success-surface);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--feedback-success);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-badge-warning {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: transparent;
  background-color: var(--feedback-warning-surface);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--feedback-warning);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-badge-danger {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: transparent;
  background-color: var(--feedback-danger-surface);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--feedback-danger);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-badge-info {
  display: inline-flex;
  align-items: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: transparent;
  background-color: var(--feedback-info-surface);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: var(--spacing);
  font-size: var(--pv-text-xs);
  line-height: var(--tw-leading, var(--pv-leading-xs));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  color: var(--feedback-info);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &:focus {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus {
    --tw-ring-offset-width: 2px;
    --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  }
  &:focus {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-toast-root {
  pointer-events: auto;
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 3);
  overflow: hidden;
  border-radius: 12px;
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border);
  background-color: var(--surface);
  padding: calc(var(--spacing) * 4);
  font-family: var(--font-family-sans);
  color: var(--fg);
  --tw-shadow: var(--elevation-2);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &[data-state="closed"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-state="open"] {
    animation: enter var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="cancel"] {
    --tw-translate-x: 0px;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    --tw-translate-x: var(--radix-toast-swipe-end-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="move"] {
    --tw-translate-x: var(--radix-toast-swipe-move-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="move"] {
    transition-property: none;
  }
}
.semec-toast-viewport {
  pointer-events: none;
  position: fixed;
  top: 0px;
  right: 0px;
  z-index: 100;
  display: flex;
  max-height: 100vh;
  width: 100%;
  flex-direction: column;
  gap: calc(var(--spacing) * 2);
  padding: calc(var(--spacing) * 4);
  @media (width >= 40rem) {
    top: calc(var(--spacing) * 4);
  }
  @media (width >= 40rem) {
    right: calc(var(--spacing) * 4);
  }
  @media (width >= 48rem) {
    max-width: 420px;
  }
}
.semec-toast-title {
  font-size: var(--pv-text-base);
  line-height: var(--tw-leading, var(--pv-leading-base));
  --tw-leading: var(--leading-tight);
  line-height: var(--leading-tight);
  --tw-font-weight: var(--font-bold);
  font-weight: var(--font-bold);
}
.semec-toast-description {
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-leading: 1.4;
  line-height: 1.4;
  --tw-font-weight: var(--font-weight-normal);
  font-weight: var(--font-weight-normal);
  opacity: 95%;
}
.semec-toast-close {
  margin: calc(var(--spacing) * -2);
  display: inline-flex;
  width: calc(var(--spacing) * 11);
  height: calc(var(--spacing) * 11);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--pv-radius-lg);
  color: var(--text-muted);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
}
.semec-toast-action {
  display: inline-flex;
  height: calc(var(--spacing) * 11);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--pv-radius-full);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border);
  background-color: transparent;
  padding-inline: calc(var(--spacing) * 4);
  font-size: var(--pv-text-sm);
  line-height: var(--tw-leading, var(--pv-leading-sm));
  --tw-font-weight: var(--font-medium);
  font-weight: var(--font-medium);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  transition-duration: var(--pv-duration-fast);
  --tw-ease: var(--easing-standard);
  transition-timing-function: var(--easing-standard);
  &:hover {
    @media (hover: hover) {
      background-color: var(--surface-alt);
    }
  }
  &:hover {
    @media (hover: hover) {
      color: var(--fg);
    }
  }
  &:focus-visible {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  &:focus-visible {
    --tw-ring-color: var(--focus-ring);
  }
  &:focus-visible {
    --tw-outline-style: none;
    outline-style: none;
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  }
  &:disabled {
    pointer-events: none;
  }
  &:disabled {
    opacity: 50%;
  }
}
.semec-toast-default {
  pointer-events: auto;
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 3);
  overflow: hidden;
  border-radius: 12px;
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--border);
  background-color: var(--surface);
  padding: calc(var(--spacing) * 4);
  font-family: var(--font-family-sans);
  color: var(--fg);
  --tw-shadow: var(--elevation-2);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &[data-state="closed"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-state="open"] {
    animation: enter var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="cancel"] {
    --tw-translate-x: 0px;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    --tw-translate-x: var(--radix-toast-swipe-end-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="move"] {
    --tw-translate-x: var(--radix-toast-swipe-move-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="move"] {
    transition-property: none;
  }
}
.semec-toast-success {
  pointer-events: auto;
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 3);
  overflow: hidden;
  border-radius: 12px;
  border-style: var(--tw-border-style);
  border-width: 1px;
  --tw-border-style: none;
  border-style: none;
  border-color: var(--border);
  background-color: var(--feedback-success-emphasis);
  padding: calc(var(--spacing) * 4);
  padding-inline: calc(var(--spacing) * 5);
  padding-block: calc(var(--spacing) * 4);
  font-family: var(--font-family-sans);
  color: var(--text-on-success-emphasis);
  --tw-shadow: var(--elevation-2);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &[data-state="closed"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-state="open"] {
    animation: enter var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="cancel"] {
    --tw-translate-x: 0px;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    --tw-translate-x: var(--radix-toast-swipe-end-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="move"] {
    --tw-translate-x: var(--radix-toast-swipe-move-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="move"] {
    transition-property: none;
  }
  & [toast-close] {
    color: var(--text-on-success-emphasis);
  }
  & [toast-close] {
    &:hover {
      @media (hover: hover) {
        background-color: var(--text-on-success-emphasis);
        @supports (color: color-mix(in lab, red, red)) {
          background-color: color-mix(in oklab, var(--text-on-success-emphasis) 10%, transparent);
        }
      }
    }
  }
}
.semec-toast-warning {
  pointer-events: auto;
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 3);
  overflow: hidden;
  border-radius: 12px;
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--feedback-warning);
  @supports (color: color-mix(in lab, red, red)) {
    border-color: color-mix(in oklab, var(--feedback-warning) 40%, transparent);
  }
  background-color: var(--feedback-warning-surface);
  padding: calc(var(--spacing) * 4);
  font-family: var(--font-family-sans);
  color: var(--fg);
  --tw-shadow: var(--elevation-2);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &[data-state="closed"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-state="open"] {
    animation: enter var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="cancel"] {
    --tw-translate-x: 0px;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    --tw-translate-x: var(--radix-toast-swipe-end-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="move"] {
    --tw-translate-x: var(--radix-toast-swipe-move-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="move"] {
    transition-property: none;
  }
}
.semec-toast-destructive {
  pointer-events: auto;
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 3);
  overflow: hidden;
  border-radius: 12px;
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--feedback-danger);
  @supports (color: color-mix(in lab, red, red)) {
    border-color: color-mix(in oklab, var(--feedback-danger) 40%, transparent);
  }
  background-color: var(--feedback-danger-surface);
  padding: calc(var(--spacing) * 4);
  font-family: var(--font-family-sans);
  color: var(--feedback-danger);
  --tw-shadow: var(--elevation-2);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  &[data-state="closed"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-state="open"] {
    animation: enter var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="cancel"] {
    --tw-translate-x: 0px;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    --tw-translate-x: var(--radix-toast-swipe-end-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="end"] {
    animation: exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);
  }
  &[data-swipe="move"] {
    --tw-translate-x: var(--radix-toast-swipe-move-x);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  &[data-swipe="move"] {
    transition-property: none;
  }
}
@property --tw-font-weight {
  syntax: "*";
  inherits: false;
}
@property --tw-ease {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-inset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-ring-inset {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-offset-width {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}
@property --tw-ring-offset-color {
  syntax: "*";
  inherits: false;
  initial-value: #fff;
}
@property --tw-ring-offset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-content {
  syntax: "*";
  initial-value: "";
  inherits: false;
}
@property --tw-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-z {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-space-y-reverse {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-leading {
  syntax: "*";
  inherits: false;
}
@property --tw-tracking {
  syntax: "*";
  inherits: false;
}
@property --tw-outline-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
    *, ::before, ::after, ::backdrop {
      --tw-animation-delay: 0s;
      --tw-animation-direction: normal;
      --tw-animation-duration: initial;
      --tw-animation-fill-mode: none;
      --tw-animation-iteration-count: 1;
      --tw-enter-opacity: 1;
      --tw-enter-rotate: 0;
      --tw-enter-scale: 1;
      --tw-enter-translate-x: 0;
      --tw-enter-translate-y: 0;
      --tw-exit-opacity: 1;
      --tw-exit-rotate: 0;
      --tw-exit-scale: 1;
      --tw-exit-translate-x: 0;
      --tw-exit-translate-y: 0;
      --tw-font-weight: initial;
      --tw-ease: initial;
      --tw-shadow: 0 0 #0000;
      --tw-shadow-color: initial;
      --tw-shadow-alpha: 100%;
      --tw-inset-shadow: 0 0 #0000;
      --tw-inset-shadow-color: initial;
      --tw-inset-shadow-alpha: 100%;
      --tw-ring-color: initial;
      --tw-ring-shadow: 0 0 #0000;
      --tw-inset-ring-color: initial;
      --tw-inset-ring-shadow: 0 0 #0000;
      --tw-ring-inset: initial;
      --tw-ring-offset-width: 0px;
      --tw-ring-offset-color: #fff;
      --tw-ring-offset-shadow: 0 0 #0000;
      --tw-content: "";
      --tw-translate-x: 0;
      --tw-translate-y: 0;
      --tw-translate-z: 0;
      --tw-border-style: solid;
      --tw-space-y-reverse: 0;
      --tw-leading: initial;
      --tw-tracking: initial;
      --tw-outline-style: solid;
    }
  }
}
```

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
