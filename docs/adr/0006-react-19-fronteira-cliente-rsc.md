---
adr: 6
titulo: "React 19 com fronteira de cliente explícita (compatibilidade RSC)"
status: Aceito
data: 2026-08-20
---

# ADR-006 — React 19 com fronteira de cliente explícita (compatibilidade RSC)

**Status:** Aceito

**Contexto.** O SIGO usa Next.js, onde componentes são Server Components por padrão. Uma biblioteca que marca tudo como `"use client"` anula esse benefício.

**Decisão.** Componentes de apresentação permanecem neutros; apenas os que usam estado, efeito ou evento levam `"use client"`. Exportações por subpath (`@semec/ds-react/button`) para preservar tree-shaking.

**Alternativas descartadas.** `"use client"` no barril inteiro (simples, mas joga toda a UI para o cliente).

**Consequências.** Disciplina extra na autoria e testes de build em ambiente Next. Ganho direto de desempenho no SIGO.
