---
adr: 12
titulo: "Tema por atributo de dados, com suporte a claro/escuro e a multi-órgão"
status: Substituído por 025
substituido_por: 25
data: 2026-08-20
---

# ADR-012 — Tema por atributo de dados, com suporte a claro/escuro e a multi-órgão

**Status:** Substituído por [ADR-025](0025-tema-unico-claro.md) (15/10/2026).

> **Nota (15/10/2026, AUD-47; não altera o texto original).** O tema escuro saiu do pacote na 2.0.0 sem ADR (errata no CHANGELOG, AUD-43), e o mecanismo multi-órgão nunca foi implementado. O [ADR-025](0025-tema-unico-claro.md) registra o estado atual: o pacote `@semec/ds` tem tema único claro; o tema escuro por `data-theme` existe só no CSS do site de documentação.

**Contexto.** O DS nasce na SEMEC, mas há interesse plausível de outras secretarias, e sistemas internos usados o dia inteiro se beneficiam de tema escuro.

**Decisão.** Tema aplicado por atributo no elemento raiz (`data-theme="semec"`, `data-color-scheme="dark"`), trocando apenas o mapeamento primitivo→semântico em CSS custom properties. Sem recompilação, sem fork.

**Alternativas descartadas.** Build por tema (multiplica artefatos); classes de tema (mais frágil para aninhamento).

**Consequências.** Todo componente precisa ser validado nos dois esquemas de cor. Reaproveitamento por outros órgãos vira configuração.
