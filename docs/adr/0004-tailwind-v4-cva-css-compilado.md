---
adr: 4
titulo: "Tailwind CSS v4 + CVA como motor de estilo, com CSS compilado para o alvo sem build"
status: Aceito
data: 2026-08-20
---

# ADR-004 — Tailwind CSS v4 + CVA como motor de estilo, com CSS compilado para o alvo sem build

**Status:** Aceito

**Contexto.** Precisamos de estilo consistente em React e também de classes prontas para páginas HTML sem pipeline de build.

**Decisão.** Tailwind v4 (CSS-first, lê custom properties nativamente) com preset distribuído em `@semec/ds-config`; variantes de componente declaradas com `class-variance-authority`. O pacote `@semec/ds-css` publica o CSS já compilado com classes semânticas (`.semec-btn--primary`) para consumo direto por `<link>`.

**Alternativas descartadas.** CSS-in-JS (custo em runtime e atrito com React Server Components); CSS Modules puro (perde a ergonomia de utilitários e o compartilhamento de preset).

**Consequências.** Projetos React precisam do preset Tailwind. O pacote CSS exige um passo extra de build e um contrato de nomes de classe que passa a ser API pública.
