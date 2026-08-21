---
adr: 14
titulo: "WCAG 2.1 AA como critério de aceite bloqueante"
status: Aceito
data: 2026-08-20
---

# ADR-014 — WCAG 2.1 AA como critério de aceite bloqueante

**Status:** Aceito

**Contexto.** Acessibilidade em serviço público não é diferencial; é obrigação. Tratada como recomendação, nunca acontece.

**Decisão.** WCAG 2.1 nível AA como alvo, com atenção ao eMAG. Contraste validado no build dos tokens, `axe` em CI, navegação por teclado documentada e testada por componente. Violação reprova o PR.

**Consequências.** Cada componente custa mais para entrar. Todo sistema construído sobre o DS nasce acessível por padrão.
