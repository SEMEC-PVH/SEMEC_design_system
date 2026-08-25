---
adr: 1
titulo: "DS próprio, inspirado no gov.br, sem fork do `@govbr-ds/core`"
status: Aceito
data: 2026-08-20
---

# ADR-001 — DS próprio, inspirado no gov.br, sem fork do `@govbr-ds/core`

**Status:** Aceito (20/08/2026)

**Contexto.** O Padrão Digital de Governo oferece biblioteca CSS/JS pronta e conformidade com o padrão federal. Nossos produtos, porém, são majoritariamente sistemas administrativos densos — tabelas grandes, formulários longos, painéis —, cenário pouco coberto pelo gov.br DS, que é otimizado para páginas institucionais e serviços ao cidadão.

**Decisão.** Construir biblioteca própria, reproduzindo a *estrutura* do gov.br DS (fundamentos → componentes → padrões → templates, documentação pública, governança de contribuição) e não seu código.

**Alternativas descartadas.**
- *Camada sobre `@govbr-ds/core`*: herdaríamos conformidade, mas ficaríamos presos ao ciclo de release federal e a um CSS difícil de sobrescrever para telas densas.
- *Adoção pura*: sem identidade própria e sem os componentes de sistema de que precisamos.

**Consequências.** Ganhamos controle total e componentes adequados ao nosso domínio. Perdemos conformidade automática com o padrão federal — compensada por [ADR-014](0014-wcag-21-aa-criterio-bloqueante.md) (acessibilidade como critério bloqueante) e pela manutenção de nomenclatura semântica compatível, deixando aberta uma convergência futura por tema.
