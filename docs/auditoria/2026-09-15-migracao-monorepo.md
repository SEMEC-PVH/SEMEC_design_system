# Migração para monorepo `apps/` + `packages/` — SEMEC_design_system

Auditoria/registro · 15/09/2026
Repositório: `github.com/SEMEC-PVH/SEMEC_design_system`
Método: execução da migração em fases com build verde a cada fase; verificação por `npm run build`, `npm run generate:llms`, `npm run proto:css`.

---

## Veredito

O repositório deixou de ser apenas o site de documentação. O kit de componentes foi extraído para `packages/react` como `@semec/ds-react` (32 componentes), o site foi movido para `apps/docs`, e os artefatos para agentes passaram a ser gerados de uma fonte única (`packages/react/manifest.js`). A estrutura agora separa produto (design system), documentação de uso, artefatos para IA e decisões — a ambiguidade apontada na auditoria de [21/08/2026](2026-08-21-repositorio.md) foi resolvida.

O que **não** mudou: o pacote ainda não é publicado num registry, não há Storybook, suíte de testes nem CI de acessibilidade. A publicação segue condicionada à QA-06 ([ADR-021](../adr/0021-estado-da-distribuicao-copiavel-antes-do-registry.md)).

## O que existe hoje

| Item | Valor |
|---|---|
| Estrutura | workspace npm: `apps/docs` + `packages/react` |
| Componentes do kit | 32 (`packages/react/src/components/`) |
| Pacote | `@semec/ds-react` (`private: true`) |
| Artefatos de IA | `apps/docs/public/llms.txt`, `llms-full.txt`, `manifest.json`, `components/*.md` (gerados) |
| Documentação | site Next.js 16, export estático, `apps/docs/out` |
| ADRs | 001–021 |
| Build | verde (raiz → `apps/docs`) |

## Fases executadas

1. **F1 — Workspace base:** `workspaces` npm, `LICENSE`, `CODEOWNERS`, lock regenerado. `.gitattributes` já existia.
2. **F2 — Extrair `@semec/ds-react`:** `base/` → `packages/react/` (`src/`), `lib/base-manifest.js` → `packages/react/manifest.js`; imports do site trocados para `@semec/ds-react`; `transpilePackages` no Next; gerador com contagem dinâmica (fim do "26" fixo).
3. **F3 — Mover site:** `app/`, `components/`, `lib/` (site), `public/`, `scripts/` e configs → `apps/docs/`; scripts da raiz delegam; workflow de GitHub Pages.
4. **F4 — Objetivo e mapa:** `docs/objetivo.md` canônico; README reescrito; `CONTRIBUTING` e `docs/README` alinhados; README de `apps/docs`.
5. **F5 — ADRs:** 017–021 criados; 002 e 008 marcados `Substituído`; índice atualizado.

## Achados e pendências

- **`npm run lint`** falha com 1 erro pré-existente (`react-hooks/set-state-in-effect` em `apps/docs/components/docs/Sidebar.jsx`), herdado da fase anterior à migração. Não é regressão desta migração.
- **`legacy/`** ainda guarda o `index.html` antigo e o PDF de 20 MB do MIV da PMPV — a limpar (ver F6).
- **`packages/react/manifest.js`** é ESM com helpers de Node (`node:fs`, `node:path`); consumido por Server Components. Não deve ser importado por Client Component.
- **Tokens/config** permanecem dentro de `@semec/ds-react`; a separação em `@semec/ds-tokens`/`@semec/ds-css` fica para depois ([ADR-018](../adr/0018-pacote-componentes-ds-react.md)).
- **`CODEOWNERS`** usa `@SEMEC-PVH/design-system` como placeholder — confirmar o time real na organização.

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
