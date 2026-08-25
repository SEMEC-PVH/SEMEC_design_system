---
adr: 15
titulo: "Formulários com API controlada, sem acoplar biblioteca de formulário"
status: Aceito
data: 2026-08-20
---

# ADR-015 — Formulários com API controlada, sem acoplar biblioteca de formulário

**Status:** Aceito

**Contexto.** SIGO e Cartão Cidade podem escolher bibliotecas diferentes (React Hook Form, Formik) e esquemas de validação diferentes.

**Decisão.** Componentes de formulário expõem API controlada padrão (`value`/`onChange`/`name`/`error`), encaminham `ref` e não dependem de nenhuma biblioteca de formulário. Adaptadores opcionais podem ser publicados depois, em subpath separado.

**Alternativas descartadas.** Acoplar a React Hook Form (impõe escolha a todos os projetos).

**Consequências.** Um pouco mais de código de ligação em cada app, em troca de neutralidade.
