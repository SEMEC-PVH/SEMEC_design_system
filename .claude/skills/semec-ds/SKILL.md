---
name: semec-ds
description: Use SEMEC Design System (@semec/ds-react) para construir UI. Tokens pv-*, componentes Radix+CVA, tema dark via data-theme. Use quando criar/editar UI, migrar portal, ou copiar snippets.
---

# SEMEC Design System — Skill para Claude

Kit `@semec/ds-react` (`packages/react/`) — React + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Conteúdo PT-BR, código EN (ADR-016).

## Onde ler

1. **Índice rápido (2KB):** `public/llms.txt` — lista categorias + 32 componentes com links
2. **Dump completo (~119KB):** `public/llms-full.txt` — packages/react/README.md + tokens.css + shadcn.css + pv-preset.ts + todos os 32 componentes (uso + fonte + prompt)
3. **Per-component md (RAG):** `public/components/<slug>.md` — 1 arquivo por componente (ex: `public/components/botoes.md`)
4. **JSON máquina:** `public/manifest.json` — `dsComponents` + `dsCategories` + `dsPrompt()`
5. **Fonte única:** `packages/react/manifest.js` — categorias, componentes, `usage`, `dsPrompt()`

Gere local: `node scripts/generate-llms.mjs` ou `npm run generate:llms` (roda no `prebuild`).

## Instalação kit (packages/react/README.md)

```bash
# Copie packages/react/ para seu projeto (ou instale @semec/ds-react pelo registry)
npm i class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
  @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-accordion
```

```css
/* globals.css — CSS-first recomendado */
@import "tailwindcss";
@import "./base/tokens.css";
@import "./base/shadcn.css";
/* alternativo: @config "./base/pv-preset.ts" */
```

Carregue Poppins 400–700 (ADR `app/fonts/*.woff2` ou next/font).

## Tema escuro (ADR-012)

```html
<html lang="pt-BR" data-theme="dark">
```

Tokens trocam via `[data-theme="dark"]` em `packages/react/tokens.css`. Proto isolado usa `PreviewFrame.jsx` para sync.

## Workflow

1. Leia `public/llms.txt` → escolha `code` (ex: `button` → slug `botoes`)
2. Abra `public/components/botoes.md` ou `public/manifest.json` → copie `usage`
3. Use tokens L1 (`--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc.) — nunca hex solto `#223f99` (viola Princípio 1)
4. Valide variantes em `packages/react/manifest.js` (prop `variant`, `size` etc.)

Exemplo:
```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@semec/ds-react";
// ou arquivo: "./base/components/button" quando copiado para src/base

<Button variant="primary" size="md">Salvar</Button>
```

## Snippets copiáveis

- Site docs: `components/docs/CodeBlock.jsx` (botão "Copiar código" + "Copiar prompt")
- MDX: `components/docs/MdxPre.jsx` + `rehype-pretty-code` (shiki github-light/dark)
- Swatches: `components/ui/Swatch.jsx`
- Prompt IA: `dsPrompt(c)` em `packages/react/manifest.js` → “Crie um button (Botões) usando @semec/ds-react …”

## Protótipo isolado

`app/proto/proto.css` → `public/proto/proto.css` via `npm run proto:css` (`@source` varre `packages/react/src/components` + `components/demos` + `components/docs`).

## Regras

- Código EN, rótulos PT (ADR-016): `<Button>Salvar</Button>` não `<Button>Save</Button>`
- Semântica > aparência: `variant="destructive"` não `color="vermelho"`
- `className` escapatória sempre permitida
- Toast requer `<ToastProvider><ToastViewport/>` + `useToast()`
- DatePicker nativo `type=date` (ISO YYYY-MM-DD); período = 2 campos

## Referências

- Tokens: `packages/react/tokens.css` + `packages/react/shadcn.css` + `packages/react/pv-preset.ts`
- Barrel: `packages/react/src/index.ts`
- Demos: `components/demos/base-previews.jsx` + `components/demos/examples/*` + `components/demos/patterns/*`
- Docs: `app/(docs)/componentes/[slug]/page.jsx` → `ComponentDoc.jsx` lê fonte via fs
