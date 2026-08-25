---
adr: 13
titulo: "Política de depreciação com janela de duas versões minor"
status: Aceito
data: 2026-08-20
---

# ADR-013 — Política de depreciação com janela de duas versões minor

**Status:** Aceito

**Contexto.** Sem política, ou o DS congela ou quebra os consumidores.

**Decisão.** Prop ou componente marcado como deprecated continua funcionando por duas versões minor, com aviso em desenvolvimento e registro no changelog, sendo removido apenas em major. Toda major traz guia de migração e, quando possível, codemod.

**Consequências.** Carrega código legado por um tempo. Em troca, atualizar o DS deixa de ser um evento arriscado.
