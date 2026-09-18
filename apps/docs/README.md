# apps/docs — site de documentação

Site do Design System SEMEC: Next.js 16 (App Router) com `output: 'export'`, gera HTML estático em `out/`. Documenta fundamentos, componentes e padrões, e serve os artefatos para agentes de IA.

- **Componentes documentados:** vêm do kit `@semec/ds` (`packages/react/`). O metadado/uso/prompt é lido de `@semec/ds/skills`.
- **Artefatos de IA:** `public/llms.txt`, `public/llms-full.txt`, `public/manifest.json`, `public/components/<slug>.md` — **gerados**; não edite à mão. Fonte: `packages/react/manifest.js`; gerador: `scripts/generate-llms.mjs` (roda no `prebuild`).
- **Proto isolado:** `app/proto/proto.css` compila para `public/proto/proto.css` via `npm run proto:css` (varre `packages/react/src/components` + demos).

## Scripts

```bash
npm run dev        # http://localhost:3000
npm run build      # prebuild (gera artefatos) + next build → out/
npm run lint
npm run generate:llms
npm run proto:css
```

Rodam também pela raiz do monorepo (`npm run dev`, etc.), que delega para este workspace.

> Objetivo do repositório e mapa completo: [`../../docs/objetivo.md`](../../docs/objetivo.md).
