---
name: semec-ds-lite
description: Identidade visual SEMEC Design System sem React — tokens pv-*, acessibilidade WCAG 2.1 AA, padrões de tela e responsive. Use em apps que consomem só os tokens CSS (@semec/ds/lite/tokens.css).
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System — skill lite

> Gerado para `@semec/ds@{{ds:version}}` (versão do `package.json` no build). Se o app tiver outra versão instalada (`npm ls @semec/ds`), o que vale é o README dela.

<!-- ds:release-status -->

Tokens, acessibilidade, responsive e padrões visuais para interfaces da Prefeitura de Porto Velho. **Sem componentes React.**

Para UI com o kit React (`@semec/ds`), use a skill `semec-ds`.

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

**Preset JS (opcional):** `@config "@semec/ds/lite/pv-preset";` no CSS global, depois dos imports. O `tokens.css` já gera os utilitários pelo `@theme inline`; o preset (o mesmo `pv-preset` da variante React) só serve a quem ainda configura o Tailwind por JS. Sem Tailwind, ignore.

**Fonte:** `@semec/ds/lite/fonts.css` (o mesmo arquivo de `@semec/ds/react/fonts.css`) traz a Poppins 400/500/600/700 (SIL OFL) e vai **antes** do `tokens.css`. Sem ela, o texto cai em `system-ui`. Não existem pesos 800/900.

### Sem Tailwind

As variáveis do `:root` (`--bg`, `--action-primary`…) e a camada base (foco visível, links, reduced motion) funcionam em CSS puro com `var()`; os blocos `@theme` e `@utility` são ignorados pelo navegador, e os utilitários da tabela abaixo só existem com o Tailwind v4 processando o `tokens.css`.

Os subpaths `@semec/ds/lite/*.css` só resolvem **num bundler** (Vite, Next, webpack): `import "@semec/ds/lite/fonts.css"; import "@semec/ds/lite/tokens.css";` no JS de entrada, ou `@import` num CSS que o bundler processa. Num `<link>` (HTML estático, servidor sem bundler) o navegador não conhece o `exports` do pacote; aponte para os arquivos reais, `fonts.css` antes do `tokens.css`:

```html
<link rel="stylesheet" href="/node_modules/@semec/ds/dist/react/fonts.css" />
<link rel="stylesheet" href="/node_modules/@semec/ds/dist/react/tokens.css" />
```

O caminho em `dist/` não é contrato público (o `exports` não o expõe) e pode mudar numa versão futura: fixe a versão do pacote (`"@semec/ds": "{{ds:version}}"`, sem `^`) ou copie os arquivos. Se o servidor não publica `node_modules`, copie `dist/react/tokens.css`, `dist/react/fonts.css` e a pasta `dist/react/fonts/` para a pasta estática, mantendo `fonts/` ao lado do `fonts.css` (as URLs dos `.woff2` são relativas a ele).

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
| `--border-strong` | Bordas proeminentes |
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

Cada degrau tem altura de linha própria (`--leading-*`), já embutida no utilitário `text-*`. Papéis: `display` 40px = página inicial/hero, `3xl` 32px = h1, `2xl` = h2, `xl` = subtítulo, `lg` = destaque, `base` = corpo, `sm` = apoio, `xs` = rótulo. Não existem pesos 800/900.

**Espaçamento:** `--space-0` 0 · `--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-6` 24px · `--space-8` 32px · `--space-12` 48px · `--space-16` 64px

**Bordas:** `--radius-sm` 2px · `--radius-md` 8px · `--radius-lg` 12px · `--radius-full` 9999px (escolha pelo papel: controle `md`, cartão `lg`, pílula `full`; escala fixa, não use `rounded-xl` ou acima)

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

**Armadilha:** **nunca** use `text-muted` nem `text-secondary` para texto: compilam para a cor de fundo `--surface-alt` (1,09:1). Use `text-text-muted` e `text-text-secondary`.

## Tema

`tokens.css` define só o tema **claro** (`data-theme="dark"` não tem efeito). Use sempre tokens L1 — nunca hex solto.

## Acessibilidade (WCAG 2.1 AA — ADR-014)

### Contraste

- Texto normal: **4.5:1** mínimo (WCAG 1.4.3)
- Texto grande: **3:1**. Texto grande é **≥ 24px (18pt) regular** ou **≥ 18,66px (14pt) bold**; 18px bold **não** é texto grande
- UI (bordas, ícones): **3:1** (WCAG 1.4.11)
- Anel de foco `--focus-ring` (`--pv-blue-hero`): **9,38:1** sobre branco; sobre a marca, `bg-brand-hero` ou `data-surface="brand"` trocam o anel para branco (9,38:1) automaticamente, e `ring-ring-inverse` faz o mesmo por classe

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

## Padrões de tela (sem React)

- **Esqueleto:** link "Pular para o conteúdo" como primeiro foco (`<a href="#conteudo">`, visível ao receber foco) → `<header>` → `<nav aria-label="Menu principal">` → um único `<main id="conteudo" tabindex="-1">` → `<footer>` institucional. Cada `<nav>` com `aria-label` distinto.
- **Container:** `mx-auto w-full max-w-[75rem] px-4` (1200px) em todas as telas; texto corrido `max-w-prose`; formulário `max-w-3xl`.
- **Títulos:** um `h1` por página com o nome da tarefa (`text-3xl font-bold`, 32px), `h2` em `text-2xl`, `h3` em `text-xl`, sem pular nível; `text-display` só no hero da página inicial.
- **Marca e ação:** marca = `bg-brand-hero text-text-on-brand`; ação principal = `bg-primary` (um botão principal por grupo). Não use a cor de marca em botão nem a de ação como faixa institucional.
- **Formulários e Validação:**
  - Label associado ao campo (`<label for="id">`; placeholder não é rótulo).
  - Três padrões de erro:
    1. *Inline no campo:* mensagem em texto abaixo do campo (`text-xs text-destructive`, `--feedback-danger: #b91c1c`, 5,98:1), campo com `aria-invalid="true"` e `aria-describedby="[id]-hint [id]-error"`. Sem `role="alert"` em listas para não interromper leitores de tela.
    2. *Resumo no topo:* contêiner com `role="alert"`, `tabindex="-1"`, foco automático ao submeter e links para cada campo com erro (`<a href="#id">`).
    3. *Erro de servidor:* caixa de aviso (`role="alert"`, fundo `--feedback-danger-surface`, texto e borda `--feedback-danger`; com Tailwind, `bg-destructive-surface text-destructive border-destructive`) com instruções claras de recuperação. Nunca os primitivos `--pv-red-*` direto.
  - *Legenda Auxiliar de Ação / Download:* botões que geram efeitos secundários (ex.: download de PDF gerado) devem conter legenda explicativa complementar abaixo (`text-xs text-text-muted`).
- **Navegação:** página atual com `aria-current="page"`; sidebar vira gaveta no mobile.
- **Feedback:** avisos com ícone + título + texto; erro no contexto do campo. Sucesso pós-envio via notificação ou mensagem confirmando protocolo.
- **Tabelas:** `<table>` com `<caption>` e `<th scope>`; no mobile, menos colunas ou lista de cartões. Se a tabela rolar na horizontal sem nenhum elemento focável dentro, o contêiner que rola precisa de `tabindex="0"`, `role="region"` e `aria-label`.
- **Estados vazios:** título, descrição e ação.

Para os mesmos padrões com componentes prontos (`SkipLink`, `Header`, `Heading`, `Footer`, `Table`…), veja a skill `semec-ds`.

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

## Regras

- PT-BR rótulos, EN código (ADR-016)
- Sem hex solto, sem `rgba()`, sem `style` inline — use tokens L1
- Semântica > aparência
- `className` escapatória sempre permitida

<!-- ds:component-recipes -->

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
