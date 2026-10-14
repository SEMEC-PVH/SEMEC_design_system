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

---

> **Nota de aplicação (acrescentada em 14/10/2026, AUD-43; não altera a decisão).** A política não foi seguida na 2.0.0 (23 tokens, tema escuro e `shadcn.css` removidos sem aviso) nem na 3.0.0 (schemas Zod tirados do entry principal), duas majors em dois dias. A 2.0.0 ganhou errata no `packages/react/CHANGELOG.md` com a lista do que saiu e os substitutos. O procedimento operacional (changeset `minor` com "Depreciação:", `@deprecated` no JSDoc, aviso em desenvolvimento, tabela de depreciações anunciadas) e a lista do que sai na 4.0 ficam no [CONTRIBUTING.md](../../CONTRIBUTING.md) § *Depreciações anunciadas*. O primeiro anúncio é a 3.1.0; pela regra das duas minors, a 4.0 só pode sair depois de uma 3.2.0 publicada.
