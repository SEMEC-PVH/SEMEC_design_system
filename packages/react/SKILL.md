---
name: semec-ds
description: Use SEMEC Design System (@semec/ds) para construir UI. Tokens pv-*, 47 componentes Radix+CVA, tema dark via data-theme. Use quando criar/editar UI, migrar portal,
  ou copiar snippets.
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System

Kit `@semec/ds` — React + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Conteúdo PT-BR, código EN (ADR-016).

## Instalação

Peer deps: `react ^19.0.0`, `react-dom ^19.0.0`

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
@import "@semec/ds/react/shadcn.css";
```

Carregue Poppins 400–700 (self-hosted woff2 ou next/font).

## Tema escuro (ADR-012)

```html
<html lang="pt-BR" data-theme="dark">
```

Tokens trocam via `[data-theme="dark"]` em `tokens.css`.

## Tokens

Duas camadas em `tokens.css`:

### L0 — Primitivos (`--pv-*`): valores brutos. Nunca use direto.

- Cores: `--pv-blue-*`, `--pv-green-*`, `--pv-yellow-*`, `--pv-red-*`, `--pv-gray-*`
- `--pv-blue-hero (#223f99)` — anel de foco (contraste 9,38:1)

### L1 — Semânticos: camada do dia a dia. Diz o papel, não a cor.

- Cor: `--bg`, `--fg`, `--surface`, `--surface-alt`, `--border`, `--border-strong`, `--focus-ring`, `--text-muted`, `--text-secondary`, `--text-strong`, `--text-on-brand`, `--tint`
- Ação: `--action-primary`, `--action-primary-hover`, `--action-primary-active`
- Feedback: `--feedback-success`, `--feedback-warning`, `--feedback-danger`, `--feedback-info` (+ `-surface`)
- Tipografia: `--font-family-sans`, `--text-xs/2xl`, `--leading-xs/2xl`, `--font-regular/bold`
- Espaçamento: `--space-0/1/2/3/4/6/8/12/16`
- Forma: `--radius-sm/md/lg/full`
- Elevação: `--elevation-0/1/2/3`
- Movimento: `--duration-fast/base/slow`, `--easing-standard`

### shadcn.css — variáveis HSL no formato shadcn (claro/escuro).

### `@theme inline` — expõe tokens como utilitários Tailwind (`bg-surface`, `text-foreground`, `ring-ring`, etc.).

## Lib utilities

```tsx
import { cn } from "@semec/ds/react";       // clsx + tailwind-merge
import { maskCPF, maskCNPJ, maskCEP, maskCurrency } from "@semec/ds/react";
import { validateCPF, validateCNPJ, validateEmail } from "@semec/ds/react";
import { cpfSchema, cnpjSchema, cpfCnpjSchema, emailSchema, cepSchema } from "@semec/ds/react"; // Zod
```

## Componentes (47)

### Ações e links

- **button** — 6 variantes (primary/secondary/outline/ghost/destructive/link), 4 tamanhos (sm/md/lg/icon), asChild
- **icon-button** — quadrado, exige label (aria-label + title)
- **link** — 3 variantes (primary/onSurface/muted)

### Formulários

- **input** — estado via aria-invalid
- **textarea** — multilinha
- **select** — Select/Trigger/Value/Content/Item
- **combobox** — busca + lista filtrada via options
- **date-picker** — nativo type="date" (ISO YYYY-MM-DD)
- **file-upload** — drag-and-drop, accept, maxSize
- **checkbox** — indeterminado
- **radio-group** — RadioGroup + RadioGroupItem + Label
- **switch** — on/off
- **label** — vinculado ao campo
- **form-field** — label + required + hint + error
- **error-summary** — role="alert", links para campos, foco automático
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
- **separator** — horizontal/vertical, decorative/semantic
- **avatar** — Image + Fallback
- **data-table** — ordenação + paginação + empty state
- **timeline** — dots + conectores + conteúdo

### Navegação

- **breadcrumb** — aria-current=page, separadores ocultos
- **tabs** — roving tabindex via Radix
- **pagination** — elipses, siblingCount
- **sidebar-trigger** — colapsa/expand sidebar
- **scroll-area** — customizado
- **dropdown-menu** — itens, checkbox, radio, sub-menus
- **navigation-menu** — mega-menu + viewport
- **sidebar** — shell completo com provider, grupos, mobile

### Feedback e estados

- **dialog** — modal acessível com overlay
- **toast** — useToast() + ToastProvider + ToastViewport
- **tooltip** — TooltipProvider + Tooltip + Trigger + Content
- **alert** — 4 variantes (default/success/warning/destructive)
- **alert-dialog** — confirmação perigosa
- **popover** — camada flutuante
- **drawer** — painel deslizante (top/bottom/left/right)
- **sheet** — painel lateral modal
- **spinner** — carregamento inline
- **progress** — barra determinada

## Workflow

1. Leia `llms.txt` → escolha componente por code
2. Leia `components/<slug>.md` → copie snippet de usage
3. Aplique tokens L1 (`--bg`, `--fg`, `--surface`, `--color-action-primary` etc.) — nunca hex solto
4. Valide variantes em `manifest.js`

## Acessibilidade (WCAG 2.1 AA — ADR-014)

- Contraste: 4.5:1 texto normal, 3:1 texto grande/UI
- Navegação teclado: Tab, Enter, Escape, setas
- Foco visível: `:focus-visible` com `--focus-ring`
- Semântica: role, aria-label, aria-invalid, aria-current, aria-expanded
- Labels: todo campo acessível precisa de label associado

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

## Regras

- PT-BR rótulos, EN código (ADR-016): `<Button>Salvar</Button>` não `<Button>Save</Button>`
- Semântica > aparência: `variant="destructive"` não `color="vermelho"`
- `className` escapatória sempre permitida
- Toast: requer `<ToastProvider><ToastViewport/>` + `useToast()`
- DatePicker: nativo `type="date"` (ISO YYYY-MM-DD); período = 2 campos
- Sem hex solto — use tokens L1

## Protótipo isolado

```bash
npm run proto:css
```

Gera `public/proto/proto.css` — CSS isolado para prototipagem rápida.

## Arquivos para IA

| Arquivo               | Conteúdo                                          |
| --------------------- | ------------------------------------------------- |
| `llms.txt`            | Índice rápido — categorias + 47 componentes       |
| `llms-full.txt`       | Dump completo — tokens + todos componentes + prompts |
| `manifest.json`       | JSON — dsComponents + dsCategories + dsPrompt()   |
| `manifest.js`         | Fonte única — usage + prompts                      |
| `components/<slug>.md`| 1 markdown por componente (RAG)                   |

## Referências

- Tokens: `packages/react/tokens.css` + `shadcn.css` + `pv-preset.ts`
- Barrel: `packages/react/src/index.ts`
- Manifest: `packages/react/manifest.js`
- Docs: `apps/docs/app/(docs)/componentes/[slug]/page.jsx`

---

## Créditos

Design system desenvolvido pelo DevSemec — equipe de tecnologia da Secretaria Municipal de Economia de Porto Velho (PMV).

- Repositório: https://github.com/SEMEC/design-system
- Licença: MIT
