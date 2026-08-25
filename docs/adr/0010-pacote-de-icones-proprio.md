---
adr: 10
titulo: "Pacote de ícones próprio, com base em biblioteca aberta"
status: Proposto
data: 2026-08-20
---

# ADR-010 — Pacote de ícones próprio, com base em biblioteca aberta

**Status:** Proposto

**Contexto.** O gov.br DS usa Font Awesome, cuja versão completa tem restrições de licença e peso. Precisamos de ícones em React e como sprite SVG para HTML puro.

**Decisão.** `@semec/ds-icons` construído a partir de um conjunto aberto e permissivo (Lucide, licença ISC) como base, acrescido dos ícones institucionais próprios. Geração automática de componentes React tipados e de sprite SVG.

**Alternativas descartadas.** Font Awesome Pro (licenciamento); fonte de ícones (pior acessibilidade e sem tree-shaking).

**Consequências.** Ícone novo passa por um processo de curadoria. Diferença visual em relação ao gov.br — aceitável dado o [ADR-001](0001-ds-proprio-inspirado-no-govbr.md).
