---
adr: 12
titulo: "Tema por atributo de dados, com suporte a claro/escuro e a multi-órgão"
status: Aceito
data: 2026-08-20
---

# ADR-012 — Tema por atributo de dados, com suporte a claro/escuro e a multi-órgão

**Status:** Aceito

**Contexto.** O DS nasce na SEMEC, mas há interesse plausível de outras secretarias, e sistemas internos usados o dia inteiro se beneficiam de tema escuro.

**Decisão.** Tema aplicado por atributo no elemento raiz (`data-theme="semec"`, `data-color-scheme="dark"`), trocando apenas o mapeamento primitivo→semântico em CSS custom properties. Sem recompilação, sem fork.

**Alternativas descartadas.** Build por tema (multiplica artefatos); classes de tema (mais frágil para aninhamento).

**Consequências.** Todo componente precisa ser validado nos dois esquemas de cor. Reaproveitamento por outros órgãos vira configuração.
