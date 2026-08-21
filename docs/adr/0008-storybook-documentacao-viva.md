---
adr: 8
titulo: "Storybook como documentação viva, publicado como site do DS"
status: Aceito
data: 2026-08-20
---

# ADR-008 — Storybook como documentação viva, publicado como site do DS

**Status:** Aceito

**Contexto.** Documentação separada do código envelhece em semanas.

**Decisão.** Storybook (versão corrente) com páginas MDX para fundamentos e diretrizes, publicado pelo CI a cada release. Toda story serve também de caso de teste.

**Alternativas descartadas.** Site estático próprio (duplica esforço); só README (não mostra estados nem interação).

**Consequências.** Storybook vira infraestrutura crítica. Story ausente reprova o PR.
