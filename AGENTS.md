<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SEMEC Design System — instruções para agentes

Kit `@semec/ds-react` (`packages/react/`, React + Tailwind v4 + shadcn + Radix + CVA). Conteúdo PT-BR, código EN (ADR-016), tema `data-theme="dark"` (ADR-012).

**Fontes IA:** `public/llms.txt` (índice), `public/llms-full.txt` (dump 119KB), `public/components/<slug>.md` (1 md por componente, 32), `public/manifest.json` (JSON), `packages/react/manifest.js` (fonte única usage+prompt).

**Gerar:** `node scripts/generate-llms.mjs` ou `npm run generate:llms` (roda no `prebuild` antes de `next build`). Proto CSS: `npm run proto:css` → `public/proto/proto.css` (`app/proto/proto.css` com `@source` para `packages/react/src/components` + `components/demos` + `components/docs`).

**Usar o kit:** importe `@semec/ds-react` (workspace) ou copie `packages/react/` (tokens.css + shadcn.css + pv-preset.ts + src/components + src/lib), importe em `globals.css` (`@import "tailwindcss"; @import "./base/tokens.css"; @import "./base/shadcn.css";`), use `import { Button } from "@semec/ds-react"`.

**Snippets:** `components/docs/CodeBlock.jsx` (Copiar código/prompt) + `components/docs/MdxPre.jsx` (rehype-pretty-code shiki) copiáveis.

**Skills:** `.claude/skills/semec-ds/SKILL.md` (Claude Code) e `.opencode/skills/semec-ds/skill.md` (OpenCode).
