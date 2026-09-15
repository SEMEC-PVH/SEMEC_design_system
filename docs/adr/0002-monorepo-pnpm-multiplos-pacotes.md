---
adr: 2
titulo: "Monorepo pnpm com múltiplos pacotes publicados"
status: Substituído
data: 2026-08-20
substituido_por: 0017-workspace-apps-packages.md
---

# ADR-002 — Monorepo pnpm com múltiplos pacotes publicados

**Status:** Substituído pelo [ADR-017](0017-workspace-apps-packages.md) (15/09/2026) — o alvo de múltiplos pacotes permanece; o gerenciador passou de pnpm para npm workspaces.

**Contexto.** Os alvos de consumo são heterogêneos: React (Next e Vite), HTML puro e painéis de dados. Um pacote único obrigaria uma página estática a baixar React.

**Decisão.** Monorepo com pnpm workspaces, publicando `@semec/ds-tokens`, `@semec/ds-css`, `@semec/ds-icons`, `@semec/ds-react`, `@semec/ds-charts` e `@semec/ds-config`.

**Alternativas descartadas.** Pacote único (peso e acoplamento); repositórios separados (versionamento cruzado inviável de manter).

**Consequências.** Versionamento coordenado por Changesets; build mais complexo; cada alvo carrega só o que usa.
