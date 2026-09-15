---
adr: 18
titulo: "Pacote de componentes @semec/ds-react, com tokens e config embutidos por ora"
status: Aceito
data: 2026-09-15
---

# ADR-018 — Pacote de componentes `@semec/ds-react`

**Status:** Aceito (15/09/2026).

**Contexto.** O kit de componentes vivia em `base/` sob o nome `@semec/base`, enquanto o [ADR-002](0002-monorepo-pnpm-multiplos-pacotes.md) e o [ADR-006](0006-react-19-fronteira-cliente-rsc.md) já falavam em `@semec/ds-react` e `@semec/ds-react/button`. Essa divergência de nomes obrigava quem lia a documentação a traduzir entre o que estava escrito e o que existia.

**Decisão.** O pacote de componentes é **`@semec/ds-react`**, em `packages/react/`, com a estrutura:

- `src/components/` — os 32 componentes (Radix + CVA).
- `src/lib/` — `cn()` e utilitários (`masks`, `validators`).
- `src/index.ts` — barrel.
- `tokens.css`, `shadcn.css`, `pv-preset.ts` — tokens e preset.
- `manifest.js` — metadado, uso e prompt dos componentes (fonte única dos artefatos para agentes, ver [ADR-020](0020-artefatos-para-agentes.md)).

O pacote permanece `private: true` até a publicação no registry (ver [ADR-021](0021-estado-da-distribuicao-copiavel-antes-do-registry.md)). **Tokens e config ficam embutidos neste pacote nesta fase**; a separação em `@semec/ds-tokens` e `@semec/ds-css` prevista no ADR-002 fica para quando houver um consumidor que precise de CSS sem React.

**Alternativas descartadas.**
- *Manter `@semec/base`*: perpetua a divergência com os ADRs e com a nomenclatura `ds-*`.
- *Separar os seis pacotes do ADR-002 de uma vez*: custo alto sem consumidor real para cada recorte; viola a regra dos dois projetos (CONTRIBUTING).

**Consequências.** Nome único e alinhado aos ADRs. Componentes são importados por `@semec/ds-react` (workspace) ou por cópia de `packages/react/`. O barrel importa `.tsx` transpilado pelo Next via `transpilePackages`. Quando os tokens virarem pacote próprio, os imports de `tokens.css`/`shadcn.css` mudam de caminho — mudança que deve entrar como ADR novo.
