---
adr: 2
titulo: "Monorepo pnpm com múltiplos pacotes publicados"
status: Aceito
data: 2026-08-20
---

# ADR-002 — Monorepo pnpm com múltiplos pacotes publicados

**Status:** Aceito

**Contexto.** Os alvos de consumo são heterogêneos: React (Next e Vite), HTML puro e painéis de dados. Um pacote único obrigaria uma página estática a baixar React.

**Decisão.** Monorepo com pnpm workspaces, publicando `@semec/ds-tokens`, `@semec/ds-css`, `@semec/ds-icons`, `@semec/ds-react`, `@semec/ds-charts` e `@semec/ds-config`.

**Alternativas descartadas.** Pacote único (peso e acoplamento); repositórios separados (versionamento cruzado inviável de manter).

**Consequências.** Versionamento coordenado por Changesets; build mais complexo; cada alvo carrega só o que usa.
