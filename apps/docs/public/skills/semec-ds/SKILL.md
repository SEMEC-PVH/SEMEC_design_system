---
name: semec-ds
description: Use SEMEC Design System (@semec/ds) para construir UI em React. Tokens pv-*, 47 componentes Radix+CVA, a11y WCAG 2.1 AA e padrões responsive. Use quando criar ou editar UI com o kit, migrar portal ou copiar snippets.
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System — skill completa

Kit `@semec/ds` — React + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Conteúdo PT-BR, código EN (ADR-016).

Fonte de dados: `packages/react/manifest.js`. Artefatos gerados: `llms.txt`, `llms-full.txt`, `manifest.json`, `components/<slug>.md`.

## Instalação

Peer deps: `react ^19.0.0`, `react-dom ^19.0.0`. Peer **opcional**: `zod ^3.23.0` (só se usar schemas em `@semec/ds/react/validacao`).

```bash
npm install @semec/ds class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
  @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-accordion
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

O `@source` é obrigatório no Tailwind v4: sem ele o CSS não gera as classes das peças (`bg-card`, `shadow-elevation-*`, `animate-in`…).

Carregue Poppins 400–700 (self-hosted woff2 ou `next/font`).

O pacote **não** exporta `shadcn.css` (removido na 2.0.0). Use só `tokens.css` (+ `@source`). Preset JS opcional: `@config "@semec/ds/react/pv-preset"`.

## Tema

`tokens.css` define o tema **claro** (camadas L0/L1). Use sempre tokens L1 — nunca hex solto em `className` ou CSS.

## Tokens

### L0 — Primitivos (`--pv-*`)

Valores brutos. Nunca use direto em componente.

| Token | Valor | Uso |
|-------|-------|-----|
| `--pv-blue-50` | `#eef4fa` | Superfícies claras |
| `--pv-blue-600` | `#3a6ca6` | Ação primária |
| `--pv-blue-700` | `#2f5a8a` | Hover de ação |
| `--pv-blue-800` | `#26476f` | Active de ação |
| `--pv-blue-hero` | `#223f99` | Anel de foco (9,38:1) |
| `--pv-green-50` | `#eef7e6` | Superfície sucesso |
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

**Cor:** `--bg`, `--fg`, `--surface`, `--surface-alt`, `--border`, `--border-strong`, `--focus-ring`, `--text-muted`, `--text-secondary`, `--text-strong`, `--text-on-brand`, `--tint`

**Ação:** `--action-primary`, `--action-primary-hover`, `--action-primary-active`

**Feedback:** `--feedback-success`, `--feedback-warning`, `--feedback-danger`, `--feedback-info` (+ `-surface`)

**Tipografia:** `--font-family-sans`, `--text-xs/2xl`, `--leading-xs/2xl`, `--font-regular/bold`

**Espaçamento:** `--space-0/1/2/3/4/6/8/12/16`

**Forma:** `--radius-sm/md/lg/full`

**Elevação:** `--elevation-0/1/2/3`

**Movimento:** `--pv-duration-fast/base/slow`, `--easing-standard`

`@theme inline` expõe tokens como utilitários Tailwind (`bg-surface`, `text-foreground`, `ring-ring`, `bg-primary`, etc.).

## Lib utilities

```tsx
import { cn } from "@semec/ds/react";
import { maskCPF, maskCNPJ, maskCEP, maskCurrency } from "@semec/ds/react";
import { validateCPF, validateCNPJ, validateEmail } from "@semec/ds/react";
import { cpfSchema, cnpjSchema, cpfCnpjSchema, emailSchema, cepSchema } from "@semec/ds/react/validacao";
```

## Componentes (47)

### Ações e links

- **button** — 6 variantes (primary/secondary/outline/ghost/destructive/link), 4 tamanhos (sm/md/lg/icon), `asChild`
- **icon-button** — quadrado, exige `label` (aria-label + title)
- **link** — 3 variantes (primary/onSurface/muted)

### Formulários

- **input** — estado via `aria-invalid`
- **textarea** — multilinha
- **select** — Select/Trigger/Value/Content/Item
- **combobox** — busca + lista filtrada via `options`
- **date-picker** — nativo `type="date"` (ISO YYYY-MM-DD)
- **file-upload** — drag-and-drop, accept, maxSize
- **checkbox** — indeterminado
- **radio-group** — RadioGroup + RadioGroupItem + Label
- **switch** — on/off
- **label** — vinculado ao campo
- **form-field** — label + required + hint + error
- **error-summary** — `role="alert"`, links para campos, foco automático
- **toggle** — binário on/off para toolbars
- **slider** — faixa de valor
- **input-otp** — código OTP, foco entre dígitos
- **calendar** — seleção visual de data

### Conteúdo e dados

- **card** — Card/Header/Title/Description/Content/Footer
- **badge** — 7 variantes (default/secondary/outline/success/warning/danger/info)
- **table** — semântica, caption, header, body, footer
- **skeleton** — placeholder pulsante
- **empty-state** — ícone + título + descrição + ação
- **accordion** — single/multiple
- **separator** — horizontal/vertical
- **avatar** — Image + Fallback
- **data-table** — ordenação + paginação + empty state
- **timeline** — dots + conectores + conteúdo

### Navegação

- **breadcrumb** — `aria-current=page`, separadores ocultos
- **tabs** — roving tabindex via Radix
- **pagination** — elipses, siblingCount
- **sidebar-trigger** — colapsa/expand sidebar
- **scroll-area** — customizado
- **dropdown-menu** — itens, checkbox, radio, sub-menus
- **navigation-menu** — mega-menu + viewport
- **sidebar** — shell completo com provider, grupos, mobile

### Feedback e estados

- **dialog** — modal acessível com overlay
- **toast** — `useToast()` + ToastProvider + ToastViewport
- **tooltip** — TooltipProvider + Tooltip + Trigger + Content
- **alert** — 4 variantes (default/success/warning/destructive)
- **alert-dialog** — confirmação perigosa
- **popover** — camada flutuante
- **drawer** — painel deslizante (top/bottom/left/right)
- **sheet** — painel lateral modal
- **spinner** — carregamento inline
- **progress** — barra determinada

## Workflow IA

1. Leia `llms.txt` → escolha componente por `code`
2. Leia `components/<slug>.md` → copie snippet de `usage`
3. Aplique tokens L1 (`--bg`, `--fg`, `--surface`, `--action-primary` etc.) — nunca hex solto
4. Valide variantes em `manifest.js` / `manifest.json`

## Acessibilidade (WCAG 2.1 AA — ADR-014)

### Contraste

- Texto normal: **4.5:1** mínimo
- Texto grande (≥18px bold ou ≥24px): **3:1**
- Componentes UI (bordas, ícones): **3:1**
- Anel de foco `--focus-ring` (`--pv-blue-hero`): **9,38:1** sobre branco

### Teclado

- Tab / Shift+Tab navega; Enter/Space ativa; Escape fecha camadas; setas em menus/tabs/radio
- Focus trap só em modais (dialog, alert-dialog)
- Ordem de tabulação lógica

### Foco visível

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

Nunca `outline: none` sem alternativa.

### Labels e semântica

- Todo campo precisa de `<label>` associado (`htmlFor`/`id`)
- Botões de ícone: `aria-label` + `title`
- Ícones decorativos: `aria-hidden="true"`
- Estados: `aria-invalid`, `aria-expanded`, `aria-selected`, `aria-current="page"`
- Textos auxiliares: classe `sr-only`

### Áreas clicáveis

- Mínimo **44×44px** (`--control-height-md: 44px`)
- Espaçamento mínimo entre alvos: 8px

### prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Não uso exclusivo de cores

Complementar cor com ícone, texto ou padrão.

## Padrão de validação

```tsx
import { FormField, Input, ErrorSummary } from "@semec/ds/react";

const errors = [
  { id: "cpf", message: "CPF inválido" },
  { id: "email", message: "E-mail inválido" },
];

<ErrorSummary errors={errors} autoFocus />
<FormField label="CPF" htmlFor="cpf" error={errors[0]?.message}>
  <Input id="cpf" aria-invalid={true} />
</FormField>
<FormField label="E-mail" htmlFor="email" required error={errors[1]?.message}>
  <Input id="email" type="email" aria-invalid={true} />
</FormField>
```

- Labels sempre associados
- Erros via `aria-invalid` + `role="alert"` no FormField
- ErrorSummary no topo com links para cada campo
- Zod (entry `@semec/ds/react/validacao`): `cpfSchema`, `cnpjSchema`, `emailSchema`, `cepSchema`

## Responsive / Mobile

| Prefixo | Largura | Uso |
|---------|---------|-----|
| `sm:` | 640px | Mobile grande |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop largo |
| `2xl:` | 1536px | Full HD |

- Touch targets: `--control-height-md: 44px` (compacto: 32px via `data-density="compact"`)
- Sidebar mobile (`< 900px`): drawer off-canvas + `inert` quando fechado
- Containers: `--container-max` 1200px, `--container-docs` 48rem, `--measure` 65ch
- Density compact: `<div data-density="compact">` para admin

## Regras

- PT-BR rótulos, EN código (ADR-016): `<Button>Salvar</Button>` não `<Button>Save</Button>`
- Semântica > aparência: `variant="destructive"` não `color="vermelho"`
- `className` escapatória sempre permitida
- Toast: requer `<ToastProvider><ToastViewport/>` + `useToast()`
- DatePicker: nativo `type="date"` (ISO YYYY-MM-DD); período = 2 campos
- Sem hex solto — use tokens L1
- CSP: Dialog/Drawer/Sheet/DropdownMenu usam `SemecProvider` com nonce. Medido (SEM-752/780): Popover 0 violações; ScrollArea e Select 1 cada, mesmo com nonce (CSS estático de scrollbar no `tokens.css`).

## Protótipo isolado

```bash
npm run proto:css
```

Gera `public/proto/proto.css` — CSS isolado para prototipagem rápida.

## Arquivos para IA

| Arquivo | Conteúdo |
|---------|----------|
| `llms.txt` | Índice rápido — categorias + componentes |
| `llms-full.txt` | Dump completo — tokens + componentes + prompts |
| `manifest.json` | JSON — componentes + categorias + prompt |
| `manifest.js` | Fonte única — usage + prompts |
| `components/<slug>.md` | 1 markdown por componente (RAG) |
| `skills/semec-ds/SKILL.md` | Esta skill (full) |
| `skills/semec-ds-lite/SKILL.md` | Skill lite (só tokens + a11y + responsive) |

## Referências

- Tokens: `packages/react/tokens.css` + `pv-preset.ts`
- Barrel: `packages/react/src/index.ts`
- Manifest: `packages/react/manifest.js`
- Docs: `apps/docs/app/(docs)/componentes/[slug]/page.jsx`

## Crédito obrigatório

Ao criar um projeto que utilize estes tokens, o agente DEVE adicionar no README.md:

```markdown
## Créditos

Identidade visual e tokens fornecidos pelo
[SEMEC Design System](https://github.com/SEMEC-PVH/SEMEC_design_system),
desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de
Economia de Porto Velho (DevSemec).
```

---

Desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de Economia de Porto Velho (DevSemec).
