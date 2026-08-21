# Registro de Decisões Arquiteturais (ADRs)

Um ADR (*Architecture Decision Record*, registro de decisão arquitetural) é um documento curto que fixa uma decisão estrutural no momento em que ela foi tomada: o contexto que a motivou, a decisão em si, as alternativas descartadas e as consequências aceitas junto com ela. Cada ADR desta pasta é um registro histórico — foi escrito num dia, com a informação disponível naquele dia, e continua valendo como testemunho daquele momento mesmo depois que a realidade mudar. Ler os ADRs em ordem é ler por que o Design System da SEMEC é do jeito que é, incluindo os caminhos que foram considerados e recusados.

A regra deste repositório é simples: **decisão estrutural entra como ADR novo, nunca como edição silenciosa de um ADR existente**. Um ADR já publicado não é reescrito para refletir o que se pensa hoje; correções de digitação e de links são o limite do que se altera no texto. Quando uma decisão deixa de valer, o ADR que a registrava tem o status alterado para `Substituído` e recebe um link para o ADR que o substituiu, enquanto o novo ADR explica o que mudou e por quê. O ciclo de status é: `Proposto` enquanto a decisão está em discussão, `Aceito` quando passa a valer, `Substituído` quando outro ADR toma seu lugar e `Descartado` quando a proposta é abandonada sem sucessora. Para abrir um ADR novo, copie o [TEMPLATE.md](TEMPLATE.md), use o próximo número livre de quatro dígitos e acrescente a linha correspondente na tabela abaixo.

## Índice de status

| ADR | Assunto | Status |
|---|---|---|
| [001](0001-ds-proprio-inspirado-no-govbr.md) | DS próprio, inspirado no gov.br | Aceito |
| [002](0002-monorepo-pnpm-multiplos-pacotes.md) | Monorepo pnpm, múltiplos pacotes | Aceito |
| [003](0003-design-tokens-tres-niveis-dtcg.md) | Tokens em três níveis, DTCG | Aceito |
| [004](0004-tailwind-v4-cva-css-compilado.md) | Tailwind v4 + CVA, CSS compilado | Aceito |
| [005](0005-radix-ui-base-comportamento-acessibilidade.md) | Radix UI como base | Aceito |
| [006](0006-react-19-fronteira-cliente-rsc.md) | React 19 com fronteira RSC | Aceito |
| [007](0007-distribuicao-registry-npm-gitea.md) | Registry npm do Gitea | Aceito (verificação pendente) |
| [008](0008-storybook-documentacao-viva.md) | Storybook como documentação | Aceito |
| [009](0009-testes-vitest-testing-library-axe-regressao-visual.md) | Vitest + axe + regressão visual | Aceito |
| [010](0010-pacote-de-icones-proprio.md) | Pacote de ícones próprio | Proposto |
| [011](0011-dataviz-camada-separada.md) | Dataviz em pacote separado | Aceito |
| [012](0012-tema-por-atributo-de-dados.md) | Tema por atributo, multi-órgão | Aceito |
| [013](0013-politica-de-depreciacao-duas-minors.md) | Depreciação em duas minors | Aceito |
| [014](0014-wcag-21-aa-criterio-bloqueante.md) | WCAG 2.1 AA bloqueante | Aceito |
| [015](0015-formularios-api-controlada.md) | Formulários neutros | Aceito |
| [016](0016-conteudo-em-portugues-codigo-em-ingles.md) | pt-BR no conteúdo, inglês no código | Aceito |

---

> **Nota de organização documental (acrescentada em 21/08/2026, não faz parte dos ADRs originais).**
> Os ADRs 001 a 016 foram extraídos, sem alteração de texto, do documento *Design System SEMEC — Registro de Decisões Arquiteturais (ADRs)*, versão 0.1 de 20/08/2026, que complementa o documento *01 — Documento de Arquitetura*. Ali constavam num arquivo único, encerrado pela tabela de índice de status reproduzida acima. As únicas intervenções na divisão foram: frontmatter YAML por arquivo, promoção do título de `##` para `#` e conversão das citações a outros ADRs em links relativos.
