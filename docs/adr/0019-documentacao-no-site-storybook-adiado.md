---
adr: 19
titulo: "Documentação no site Next.js; Storybook adiado"
status: Aceito
data: 2026-09-15
---

# ADR-019 — Documentação no site Next.js; Storybook adiado

**Status:** Aceito (15/09/2026). Substitui o [ADR-008](0008-storybook-documentacao-viva.md).

**Contexto.** O [ADR-008](0008-storybook-documentacao-viva.md) escolheu Storybook como documentação viva e definiu que "story ausente reprova o PR". O Storybook nunca foi instalado. Em vez dele, cresceu um site próprio em Next.js (App Router, `output: 'export'`) que publica fundamentos, componentes, padrões e demos, além de gerar artefatos para agentes.

**Decisão.** A documentação oficial é o **site em `apps/docs/`** (Next.js 16, export estático, publicado no GitHub Pages). O Storybook fica **adiado**, não descartado: pode voltar quando houver testes de interação e regressão visual para justificá-lo. O site documenta os componentes lendo o fonte real de `packages/react/` e o metadado de `packages/react/manifest.js`, de modo que a documentação não duplica a implementação.

**Alternativas descartadas.**
- *Adotar o Storybook agora*: infraestrutura nova sem consumidor e sem suíte de testes; o site já cobre o caso de uso atual.
- *Documentação só em Markdown*: não mostra estados nem interação, e não serve os artefatos para agentes.

**Consequências.** O site é infraestrutura crítica e precisa de build verde. Os demos passam a ser a referência visual — o que exige que sejam acessíveis (a auditoria de 21/08/2026 apontou falhas neles). "Story ausente reprova o PR" deixa de valer; no lugar, vale "a página do componente precisa existir e refletir o componente real".
