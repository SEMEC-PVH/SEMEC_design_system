# Documentação de decisões

Esta pasta guarda as decisões do Design System da SEMEC — por que ele existe, o que já foi decidido, o que ainda não foi e em que estado o código está; o site gerado a partir de `app/` é a documentação de **uso** do sistema, e é coisa diferente.

Cada documento abaixo está marcado pelo que ele descreve. Essa é a distinção que mais confunde quem chega: **estado atual** é o que existe hoje, em código; **estado-alvo** é o que se pretende construir e ainda não existe. Ler um pelo outro é o erro mais fácil de cometer nesta pasta.

| Documento | O que é | Quando ler |
|---|---|---|
| [objetivo.md](objetivo.md) | **Estado atual + canônico.** O que o repositório é, o que contém, em que fase está, o que não é e o mapa da estrutura. Vale sobre qualquer divergência. | Primeiro de tudo, ao chegar no repositório. |
| [arquitetura.md](arquitetura.md) | **Estado-alvo.** O documento de partida: contexto, princípios, arquitetura em camadas, topologia de pacotes, stack, governança, roadmap e riscos. Descreve o sistema que se pretende construir, não o que está no repositório. | Antes de propor qualquer mudança estrutural, e para entender de onde vieram os ADRs. |
| [especificacao-alvo.md](especificacao-alvo.md) | **Estado-alvo.** A especificação completa do design system: fundamentos visuais, tokens semânticos, catálogo de componentes, padrões, acessibilidade e versionamento. A paleta e os componentes aqui descritos ainda não existem em código. | Ao desenhar ou especificar um componente novo, sabendo que é proposta e não referência vigente. |
| [inventario-identidade.md](inventario-identidade.md) | **Estado atual**, do portal `semec-digital`. Levantamento do que aquele repositório usa de fato — cores, tipografia, espaçamento, componentes, stack — congelado em 20/08/2026. | Para saber o que existe hoje no portal, antes de propor migração ou de afirmar que algo "já é assim". |
| [auditoria/2026-08-21-repositorio.md](auditoria/2026-08-21-repositorio.md) | **Estado atual**, deste repositório. Auditoria técnica de 21/08/2026: o que existe, contraste medido, achados F1–F20 e ordem de ataque sugerida. | Para saber o que está quebrado aqui e qual é a prioridade. Auditorias novas entram como arquivos novos — ver [a convenção](auditoria/README.md). |
| [adr/](adr/README.md) | **Registro histórico.** Vinte e uma decisões arquiteturais, uma por arquivo, com contexto, alternativas descartadas e consequências. Não são reescritos: decisão nova entra como ADR novo. | Ao descobrir que uma decisão já foi tomada, ou antes de tomar uma que a contrarie. |
| [questoes-abertas.md](questoes-abertas.md) | **O que falta decidir.** Nove questões (`QA-01`–`QA-09`) consolidadas de treze referências originais espalhadas por três documentos, com quem decide e o que cada resposta destrava. | Quando um trabalho travar esperando uma decisão, e antes de decidir qualquer coisa sozinho. |
| [adocao.md](adocao.md) | **Plano.** Os cinco passos para o portal `semec-digital` passar a consumir o design system sem ser reescrito. | Ao planejar a adoção no portal. |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | **Processo.** Governança em duas partes explicitamente separadas: o que vale hoje neste repositório e o que passa a valer quando a biblioteca existir. | Antes de abrir o primeiro PR. |

## Procedência

Estes documentos foram escritos antes de o repositório existir e circulavam soltos. Foram importados em 21/08/2026 como registro histórico: o texto original foi preservado, e tudo que foi acrescentado na importação está marcado como nota. Contradições entre documentos não foram harmonizadas — quando duas fontes discordam, a divergência ficou registrada, porque em geral ela é o próprio motivo de uma questão estar em aberto. As divergências conhecidas estão apontadas em [questoes-abertas.md](questoes-abertas.md).

Um documento foi aproveitado só em parte: o levantamento preliminar de identidade visual, superado pelo inventário na parte de dados e conflitante com a especificação-alvo na proposta de tokens. Dele foram publicados o caminho de adoção, em [adocao.md](adocao.md), e as decisões pendentes, absorvidas por [questoes-abertas.md](questoes-abertas.md). O restante foi descartado — a nota no topo de `adocao.md` registra a procedência.
