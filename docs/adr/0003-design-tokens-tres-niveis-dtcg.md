---
adr: 3
titulo: "Design tokens em três níveis, formato DTCG, compilados por Style Dictionary"
status: Aceito
data: 2026-08-20
---

# ADR-003 — Design tokens em três níveis, formato DTCG, compilados por Style Dictionary

**Status:** Aceito

> **Nota de status (19/10/2026).** Atualizado pelo [ADR-026](0026-pacote-ds-tokens-saidas-por-plataforma.md). Na prática a fonte dos tokens continua sendo o CSS (`packages/react/tokens.css`), e o JSON DTCG é **derivado** dele no build, não autoria. O Style Dictionary 5 gera, a partir desse JSON, as saídas de Android, iOS e Figma (Tokens Studio) do pacote `@semec/ds-tokens`. O nível de componente (`button-primary-bg`) segue não implementado: os componentes usam L1.

**Contexto.** Sem tokens, tema e consistência viram busca-e-substitui. Sem hierarquia, tokens viram sinônimos de cores.

**Decisão.** Autoria em JSON no padrão W3C DTCG, com três níveis obrigatórios: primitivo (`blue-60`), semântico (`color-action-primary`) e de componente (`button-primary-bg`). Componentes consomem apenas os dois últimos. Compilação por Style Dictionary para CSS custom properties, TypeScript, JSON e (se necessário) SCSS.

**Alternativas descartadas.** Tokens direto em CSS (não gera saída para dataviz nem para Figma); tokens em TS (não serve ao alvo HTML puro).

**Consequências.** Toda mudança visual passa por um arquivo de tokens. Trocar tema não toca em componente. Exige disciplina: valor bruto em componente é motivo de reprovação em revisão.
