---
name: semec-ds
description: Use SEMEC Design System (@semec/ds/react) — React + Tailwind v4 + shadcn + Radix. Tokens pv-*, tema data-theme=dark, conteúdo PT-BR/código EN. Use para UI, migração portal, snippets.
---

# SEMEC Design System — Skill OpenCode

Kit `@semec/ds/react` (`packages/react/`) — React + Tailwind v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Conteúdo PT-BR, código EN (ADR-016).

## Fontes para agentes

- `public/llms.txt` — índice rápido
- `public/llms-full.txt` — dump completo (~119KB)
- `public/components/<slug>.md` — 1 md por componente (32) — RAG chunk
- `public/manifest.json` — JSON dsComponents + dsCategories + dsPrompt()
- `packages/react/manifest.js` — fonte única (usage + prompt)

Gera: `node scripts/generate-llms.mjs` (prebuild).

## Instalação

```bash
npm i class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
  @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-accordion
```
```css
@import "tailwindcss";
@import "./base/tokens.css";
@import "./base/shadcn.css";
```

## Tema escuro (ADR-012)

`<html lang="pt-BR" data-theme="dark">`

## Workflow agente

1. `read public/llms.txt` → escolhe code
2. `read public/components/<slug>.md` → copia usage
3. aplica tokens L1 (`--bg`, `--color-action-primary` etc.), sem hex solto
4. checa variantes em `packages/react/manifest.js`

Ex: `import { Button } from "@semec/ds/react"; <Button variant="primary">Salvar</Button>`

## Snippets e demos

- `components/docs/CodeBlock.jsx` + `components/docs/MdxPre.jsx` (copy + shiki)
- `components/demos/base-previews.jsx` + `examples/*` + `patterns/*`
- `PreviewFrame.jsx` iframe isolado com sync theme

## Regras

- PT rótulo, EN código (ADR-016)
- `variant="destructive"` não `color="vermelho"`
- `className` sempre permitido
- Proto: `npm run proto:css` → `public/proto/proto.css`
