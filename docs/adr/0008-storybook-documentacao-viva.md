---
adr: 8
titulo: "Storybook como documentação viva, publicado como site do DS"
status: Substituído
data: 2026-08-20
substituido_por: 0019-documentacao-no-site-storybook-adiado.md
---

# ADR-008 — Storybook como documentação viva, publicado como site do DS

**Status:** Substituído pelo [ADR-019](0019-documentacao-no-site-storybook-adiado.md) (15/09/2026) — a documentação passou a ser o site em `apps/docs/`; o Storybook fica adiado.

**Contexto.** Documentação separada do código envelhece em semanas.

**Decisão.** Storybook (versão corrente) com páginas MDX para fundamentos e diretrizes, publicado pelo CI a cada release. Toda story serve também de caso de teste.

**Alternativas descartadas.** Site estático próprio (duplica esforço); só README (não mostra estados nem interação).

**Consequências.** Storybook vira infraestrutura crítica. Story ausente reprova o PR.
