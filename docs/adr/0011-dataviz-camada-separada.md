---
adr: 11
titulo: "Dataviz como camada separada, com paleta derivada dos tokens"
status: Aceito
data: 2026-08-20
---

# ADR-011 — Dataviz como camada separada, com paleta derivada dos tokens

**Status:** Aceito

**Contexto.** Painéis fiscais e o SICONFORMI precisam de gráficos; regras de cor de gráfico (categórica, sequencial, divergente) são diferentes das de interface e não podem ser improvisadas por projeto.

**Decisão.** `@semec/ds-charts` como pacote próprio, com paletas geradas a partir dos tokens e validadas para contraste e para as principais formas de daltonismo, mais componentes de KPI, eixo, legenda e tooltip padronizados.

**Alternativas descartadas.** Deixar cada painel escolher sua paleta (inconsistência e problemas de acessibilidade); embutir em `ds-react` (peso desnecessário para quem não faz gráfico).

**Consequências.** Escolha da biblioteca de renderização (Recharts, ECharts ou visx) fica para a F3, quando houver requisitos concretos dos painéis.
