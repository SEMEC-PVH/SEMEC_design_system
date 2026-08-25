---
adr: 9
titulo: "Testes: Vitest + Testing Library + axe-core + regressão visual"
status: Aceito
data: 2026-08-20
---

# ADR-009 — Testes: Vitest + Testing Library + axe-core + regressão visual

**Status:** Aceito

**Contexto.** O SIGO já adotou shift-left security com TDD como padrão de projeto; o DS deve seguir o mesmo rigor, sob pena de propagar defeitos para todos os sistemas.

**Decisão.** Vitest e Testing Library para comportamento, `axe-core` sobre as stories para acessibilidade e capturas com Playwright para regressão visual. Violação de acessibilidade quebra o build.

**Alternativas descartadas.** Jest (mais lento no ecossistema Vite); testes manuais (não escalam).

**Consequências.** Pipeline mais lenta e custo inicial maior por componente. Em contrapartida, uma correção validada chega a todos os sistemas.
