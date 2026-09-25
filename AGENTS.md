<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SEMEC Design System — Agent Instructions

## Structure

npm workspaces monorepo. Two main locations:

- **`packages/react/`** — `@semec/ds` kit (47 React components, Tailwind v4, shadcn/Radix/CVA). This is the publishable package.
- **`apps/docs/`** — `@semec/docs` documentation site (Next.js 16, static export via `output: 'export'`).

Other dirs: `docs/` (ADRs, architecture decisions), `legacy/` (old content, ignore).

## Commands

All root scripts delegate to workspaces. Key commands:

```bash
npm install             # install all workspaces
npm run dev             # docs site at localhost:3000
npm run build           # prebuild (generate LLM artifacts) + next build + static export
npm run build:ds        # tsup build of @semec/ds package
npm run typecheck       # tsc --noEmit on @semec/ds
npm run lint            # eslint . on apps/docs (flat config, eslint-config-next + jsx-a11y)
npm run generate:llms   # regenerate AI artifacts from packages/react/manifest.js
npm run proto:css       # isolated CSS build for prototyping
```

**Recommended verification order:** `build:ds` → `typecheck` → `build` → `lint`.

**Note:** `next lint` was removed in Next.js 16. Lint runs via `eslint .` directly (see `apps/docs/eslint.config.mjs`).

## Architecture

- Tailwind CSS **v4** (CSS-first config, `@import "tailwindcss"`)
- shadcn pattern: Radix primitives + CVA + clsx + tailwind-merge
- Tokens use `pv-*` prefix (defined in `packages/react/tokens.css`)
- Theme: `data-theme="dark"` on `<html>` (ADR-012). Tokens swap via `[data-theme="dark"]` selectors.
- Language: **PT-BR for content/UI labels, EN for code** (ADR-016)
- Fonts: Poppins 400-700 (self-hosted woff2, ADR app/fonts)

## Conventions

- **Commits:** Portuguese, conventional format — `tipo(escopo): descrição no imperativo` (e.g., `fix(a11y): corrige contraste WCAG AA`)
- **Line endings:** LF everywhere (`.gitattributes` enforces this)
- **Indent:** 2 spaces (`.editorconfig`)
- **No raw hex colors or inline styles** — use `pv-*` token variables. The audit found 33 hex literals and 30 inline `style` blocks; don't add more.
- **No copying components** — if existing ones don't fit, propose a new one via issue.
- **WCAG 2.1 AA is blocking** (ADR-014): verify keyboard navigation, focus visibility, contrast (4.5:1 text, 3:1 large text/UI).

## Known Gotchas

- **Lint violation in `apps/docs/components/docs/Sidebar.jsx`** — `react-hooks/set-state-in-effect`, inherited before migration. Don't suppress it; it's a known issue.
- **Next.js static export** — `basePath` is `/SEMEC_design_system` in production, empty in dev (`apps/docs/next.config.mjs`).
- **`dist/` and `.next/` are gitignored** — rebuild after checkout.
- **`packages/react/manifest.js`** is the single source of truth for component metadata. AI artifacts (`llms.txt`, `manifest.json`, per-component `.md`) are generated from it via `npm run generate:llms` (runs automatically in `prebuild`).

## AI Artifact Sources

For component documentation, read in this order:

1. `apps/docs/public/llms.txt` — quick index (~2KB)
2. `apps/docs/public/manifest.json` — full JSON with `dsComponents`, `dsCategories`, `dsPrompt()`
3. `apps/docs/public/components/<slug>.md` — one file per component (47 total, good for RAG)
4. `packages/react/manifest.js` — canonical source (usage + prompts)

Regenerate: `npm run generate:llms` (auto-runs before `build`).

## PR Checklist

- Issue linked (unless trivial fix)
- `npm run build:ds` passes
- `npm run typecheck` passes
- `npm run build` passes
- `npm run lint` passes (known `Sidebar.jsx` violation excepted)
- Keyboard navigation verified end-to-end
- Contrast calculated for any new colors
- No new hex, `rgba()`, or inline `style` outside existing tokens
- Reviewed by someone other than the author
