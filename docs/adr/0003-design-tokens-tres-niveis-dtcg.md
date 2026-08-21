---
adr: 3
titulo: "Design tokens em três níveis, formato DTCG, compilados por Style Dictionary"
status: Aceito
data: 2026-08-20
---

# ADR-003 — Design tokens em três níveis, formato DTCG, compilados por Style Dictionary

**Status:** Aceito

**Contexto.** Sem tokens, tema e consistência viram busca-e-substitui. Sem hierarquia, tokens viram sinônimos de cores.

**Decisão.** Autoria em JSON no padrão W3C DTCG, com três níveis obrigatórios: primitivo (`blue-60`), semântico (`color-action-primary`) e de componente (`button-primary-bg`). Componentes consomem apenas os dois últimos. Compilação por Style Dictionary para CSS custom properties, TypeScript, JSON e (se necessário) SCSS.

**Alternativas descartadas.** Tokens direto em CSS (não gera saída para dataviz nem para Figma); tokens em TS (não serve ao alvo HTML puro).

**Consequências.** Toda mudança visual passa por um arquivo de tokens. Trocar tema não toca em componente. Exige disciplina: valor bruto em componente é motivo de reprovação em revisão.
