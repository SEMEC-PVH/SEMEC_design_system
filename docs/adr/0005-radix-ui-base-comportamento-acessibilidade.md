---
adr: 5
titulo: "Radix UI como base de comportamento e acessibilidade"
status: Aceito
data: 2026-08-20
---

# ADR-005 — Radix UI como base de comportamento e acessibilidade

**Status:** Aceito

**Contexto.** Comportamento acessível de dialog, combobox, menu e tooltip (foco, `aria-*`, teclado, portal, dismiss) é a parte mais difícil e a que mais falha em DS internos.

**Decisão.** Usar primitivos headless do Radix UI como base dos componentes interativos, aplicando estilo por cima.

**Alternativas descartadas.** Implementação própria (risco alto de falha de acessibilidade); Headless UI (menor cobertura); biblioteca já estilizada como MUI (arrasta tema próprio e dificulta os tokens).

**Consequências.** Dependência externa relevante — mitigada por ser headless, sem opinião visual, e por ser possível substituir componente a componente. Reduz drasticamente o risco de acessibilidade.
