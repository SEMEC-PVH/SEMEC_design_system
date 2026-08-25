# Questões em aberto

Este documento reúne, em um lugar só, as decisões que ainda não foram tomadas e que outros documentos deste repositório esperam. Elas estavam espalhadas por três fontes: a seção 14 do documento de arquitetura (**Q1–Q6**), a seção "Decisões que dependem de você" do documento de identidade visual (**D1–D5**) e os achados da auditoria de 21/08/2026 (**F5** e **F10**). São treze referências originais para nove questões — algumas fontes fizeram a mesma pergunta com outro nome.

**Como ler os identificadores.** Cada questão recebeu um identificador novo (`QA-01`…`QA-09`) e carrega, ao lado dele, todos os identificadores originais que ela absorveu. Uma anotação antiga que diga "depende da Q5" ou "ver D3" continua encontrável: procure pelo código original nesta página. Nenhum identificador original foi descartado.

**O que este documento não faz.** Ele não responde nenhuma das questões, não escolhe entre alternativas e não harmoniza divergências entre as fontes. Onde dois documentos discordam — e há pelo menos dois casos abaixo — a divergência está registrada como parte do que se sabe, porque ela é o próprio motivo de a questão existir. Respostas entram como [ADR novo](adr/README.md), não como edição desta página; o que muda aqui, quando isso acontecer, é o status da linha na tabela e a lista de documentos a revisar.

---

## Quadro geral

| Identificador | Questão | Quem decide | Status |
|---|---|---|---|
| **QA-01** · `Q1` `D1` `F5` | Qual azul é o azul institucional, e a paleta parte da marca ou de um sistema neutro? | Responsável pela marca institucional, com os mantenedores | Aberta |
| **QA-02** · `Q2` `D5` | O design system é da SEMEC ou nasce como padrão da PMPV? | Direção da SEMEC com a prefeitura | Aberta |
| **QA-03** · `Q6` `D2` | Qual família tipográfica: Rawline/Raleway do gov.br, Poppins ou fonte de sistema? | Responsável pela marca institucional, com os mantenedores | Aberta |
| **QA-04** · `Q3` | O SIGO nasce sobre o design system ou o design system é extraído dele depois? | Mantenedores com a gestão do SIGO | Aberta |
| **QA-05** · `Q4` | Existe capacidade de manter um UIKit no Figma, ou a documentação em código é a única fonte? | Mantenedores com quem desenha | Aberta |
| **QA-06** · `Q5` | O registry npm do Gitea da prefeitura está habilitado, e sob qual owner? | Administração do Gitea institucional, com os mantenedores | Aberta |
| **QA-07** · `D3` | Qual vermelho vira o token de perigo, que hoje não existe na paleta? | Responsável pela marca institucional, com os mantenedores | Aberta |
| **QA-08** · `D4` | A Calculadora de Taxas migra para os tokens institucionais ou fica como exceção documentada? | Mantenedores com o time da Calculadora | Aberta |
| **QA-09** · `F10` | O design system assina como DEVSEMEC ou como SEMEC/PMPV? | Responsável pela marca institucional | Aberta |

---

## QA-01 — O azul institucional · `Q1` `D1` `F5`

**A pergunta.** A escala primária de azul é derivada de qual cor? E, na formulação mais ampla da Q1: paleta e tipografia partem da marca da Prefeitura, da marca da SEMEC ou de um sistema neutro criado para o design system?

**O que já se sabe.** As três fontes chegaram à mesma pergunta por caminhos diferentes. A Q1 a colocou como questão de origem da identidade. A D1 a colocou como escolha entre dois valores — `#1e3a5f`, do portal, e `#1f4493`, que ela atribui à logo — e recomendou alinhar a paleta à logo, "porque a marca é o ativo mais estável". A auditoria, medindo o repositório, encontrou um terceiro valor: `#223f99` em `--hero`, usado por herói, rodapé e logotipo, escrito à mão em quatro arquivos JSX e como variável avulsa no CSS, enquanto a escala `pv-blue-50 → 950`, publicada como "Azul institucional (primário)", é interpolada a partir de `#1e3a5f`. **As fontes divergem sobre qual é o hex da logo** (`#1f4493` no documento de identidade, `#223f99` na auditoria); a divergência está registrada aqui como dado, não resolvida. O [inventário](inventario-identidade.md) contabiliza quatro azuis em circulação. A auditoria formulou a decisão como binária: ou `#223f99` vira o centro de uma escala reconstruída, ou a escala atual é rebatizada como neutro de interface e o azul de marca ganha token próprio — conviver não resolve.

A parte tipográfica da Q1 está desdobrada em **QA-03**; a parte de qual marca assina, em **QA-02** e **QA-09**.

**O que a resposta destrava.** A camada L0 de tokens primitivos descrita na [arquitetura](arquitetura.md) e no [ADR-003](adr/0003-design-tokens-tres-niveis-dtcg.md) — enquanto o valor de origem não estiver fixado, gerar a escala é trabalho a refazer. Destrava também a correção das falhas de contraste medidas pela auditoria, a eliminação da segunda fonte da verdade da paleta e os passos 1 e 3 do [caminho de adoção](adocao.md), que pressupõem tokens estáveis para substituir os hex literais.

**O que fica desatualizado quando ela for respondida.** [`especificacao-alvo.md`](especificacao-alvo.md), nas seções "A marca" e "Escala primária — Azul"; [`inventario-identidade.md`](inventario-identidade.md), seção 2 inteira, em especial "Os quatro azuis em circulação"; [`auditoria/2026-08-21-repositorio.md`](auditoria/2026-08-21-repositorio.md), achados F5 e F6 e a tabela de contraste da seção 2; [`arquitetura.md`](arquitetura.md), seção 10.

---

## QA-02 — Escopo institucional: SEMEC ou PMPV · `Q2` `D5`

**A pergunta.** O design system é da SEMEC, ou nasce já como padrão da Prefeitura de Porto Velho? A Q2 observa que isso muda a governança e o nome do escopo npm. A D5 faz a mesma pergunta pelo lado do tema: `semec` é um tema dentro de um sistema `pmpv`, ou o contrário?

**O que já se sabe.** O [ADR-012](adr/0012-tema-por-atributo-de-dados.md) já decidiu que o tema é aplicado por atributo de dados e que o sistema é multi-órgão, o que torna a resposta possível em qualquer ordem — mas não a dispensa, porque ela define qual órgão é o padrão e qual é a exceção. O [ADR-007](adr/0007-distribuicao-registry-npm-gitea.md) já fixou o escopo `@semec` para publicação. O roadmap da [arquitetura](arquitetura.md) prevê "adoção fora da SEMEC" apenas na fase F4, e a D5 argumenta que vale definir agora, não na F4. O papel de "aprovação de identidade" descrito na governança é de quem detém a identidade institucional — que órgão é esse depende desta resposta.

**O que a resposta destrava.** O nome do escopo npm e o owner do registry (ver **QA-06**), a composição dos papéis de governança descritos no [CONTRIBUTING.md](../CONTRIBUTING.md), e a hierarquia de temas — qual conjunto de tokens é a base e qual é a variação.

**O que fica desatualizado quando ela for respondida.** [`arquitetura.md`](arquitetura.md), seções 6 (topologia de pacotes), 11 (governança) e 12 (roadmap); [`adr/0007-distribuicao-registry-npm-gitea.md`](adr/0007-distribuicao-registry-npm-gitea.md) e [`adr/0012-tema-por-atributo-de-dados.md`](adr/0012-tema-por-atributo-de-dados.md), que passam a exigir ADR sucessor se o escopo mudar; [`especificacao-alvo.md`](especificacao-alvo.md), nas seções "Instalação" e "Pacotes"; [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## QA-03 — Tipografia · `Q6` `D2`

**A pergunta.** Usar Rawline/Raleway, o padrão do gov.br, ou uma fonte de sistema — considerando licenciamento e desempenho (Q6)? Ou consolidar em Poppins, ou ainda aproveitar o design system para escolher uma família com melhor leitura em tabela densa (D2)?

**O que já se sabe.** O [ADR-001](adr/0001-ds-proprio-inspirado-no-govbr.md) toma o gov.br como inspiração, o que coloca Rawline/Raleway como candidata natural, mas não como decisão tomada. A [especificação-alvo](especificacao-alvo.md) documenta Poppins como família única. O [inventário](inventario-identidade.md) registra as famílias efetivamente carregadas hoje e a escala de tamanhos e pesos em uso. A [auditoria](auditoria/2026-08-21-repositorio.md) observou que o corpo do site de documentação usa JetBrains Mono enquanto a página de Tipografia documenta Poppins, e classificou isso como defensável mas não declarado; registrou também que o build dependia de internet aberta para o Google Fonts, o que faz do licenciamento e da auto-hospedagem parte da conta desta escolha.

**O que a resposta destrava.** O token de família na camada L0, a decisão de auto-hospedar os arquivos de fonte e a escala tipográfica final. Enquanto estiver aberta, qualquer documentação de tipografia é provisória.

**O que fica desatualizado quando ela for respondida.** [`especificacao-alvo.md`](especificacao-alvo.md), seções "Famílias", "Escala" e "Pesos e hierarquia"; [`inventario-identidade.md`](inventario-identidade.md), seção 3; [`arquitetura.md`](arquitetura.md), seção 10; [`auditoria/2026-08-21-repositorio.md`](auditoria/2026-08-21-repositorio.md), achados F4 e F10.

---

## QA-04 — O projeto piloto · `Q3`

**A pergunta.** O SIGO adota o design system desde o primeiro commit — o que a arquitetura recomenda — ou o design system é extraído dele depois?

**O que já se sabe.** O roadmap da [arquitetura](arquitetura.md) coloca o SIGO como projeto piloto da fase F1, "construído inteiramente sobre o DS", e a tabela de riscos usa o piloto obrigatório como mitigação para o risco de o design system virar projeto de uma pessoa e morrer. O [caminho de adoção](adocao.md), escrito depois, propõe o portal SEMEC Digital como primeiro consumidor real, por ser "a maior base de código de frontend da secretaria". **Os dois documentos apontam para primeiros consumidores diferentes**; a divergência fica registrada, não resolvida — decidir qual dos dois é o piloto faz parte desta questão.

**O que a resposta destrava.** O critério de encerramento das fases F0 e F1 (nenhuma fase termina em "biblioteca pronta esperando usuário") e a ordem de trabalho entre extrair tokens do portal e construir componentes novos para o SIGO.

**O que fica desatualizado quando ela for respondida.** [`arquitetura.md`](arquitetura.md), seções 12 e 13; [`adocao.md`](adocao.md), que define uma sequência de cinco passos amarrada ao portal; [`auditoria/2026-08-21-repositorio.md`](auditoria/2026-08-21-repositorio.md), no veredito e na ordem de ataque sugerida.

---

## QA-05 — Figma e UIKit · `Q4`

**A pergunta.** Existe capacidade de manter um UIKit sincronizado com o código, ou a documentação em código é a única fonte da verdade?

**O que já se sabe.** O [ADR-008](adr/0008-storybook-documentacao-viva.md) elegeu o Storybook como documentação viva do comportamento dos componentes, o que cobre o lado do código mas não o do desenho. O guia "Para quem desenha", na [especificação-alvo](especificacao-alvo.md), instrui a trabalhar a partir dos fundamentos publicados — instrução que funciona sem Figma, mas que muda de forma se houver um UIKit. Não existe UIKit versionado neste repositório hoje.

**O que a resposta destrava.** O conteúdo do guia de quem desenha, a definição de pronto — se manter o UIKit atualizado passa a ser item obrigatório de cada componente — e o custo de licenças e de manutenção que precisa entrar no planejamento.

**O que fica desatualizado quando ela for respondida.** [`especificacao-alvo.md`](especificacao-alvo.md), seção "Para quem desenha" e a "Definição de pronto"; [`arquitetura.md`](arquitetura.md), seção 11; [`CONTRIBUTING.md`](../CONTRIBUTING.md), na parte de processo futuro; [`adr/0008-storybook-documentacao-viva.md`](adr/0008-storybook-documentacao-viva.md), se a resposta transformar o Figma em fonte concorrente.

---

## QA-06 — Registry npm do Gitea · `Q5`

**A pergunta.** O recurso de pacotes está habilitado na instância de Gitea da prefeitura, e sob qual owner os pacotes seriam publicados — uma organização `semec`?

**O que já se sabe.** Esta é a única questão que já está registrada dentro de um ADR: o [ADR-007](adr/0007-distribuicao-registry-npm-gitea.md) foi aceito com a pendência escrita no próprio frontmatter (`pendencia: "Q5 — confirmar se o registry npm está habilitado na instância da prefeitura e sob qual owner"`), e seu status no [índice de ADRs](adr/README.md) é "Aceito (verificação pendente)". O suporte do Gitea a registry npm com pacotes escopados, dist-tags e autenticação por token está confirmado na documentação oficial do Gitea — o que falta é verificação na instância real. A [arquitetura](arquitetura.md) registra o plano B na tabela de riscos: Verdaccio no Portainer da SMTI, ou tarballs anexados a releases do Gitea. O owner depende de **QA-02**.

**O que a resposta destrava.** A fase F0 inteira: sem registry confirmado não há `@semec/ds-tokens` publicado, e sem pacote publicado nenhum projeto consome nada. Destrava também o token de publicação do CI e a seção de instalação da documentação.

**O que fica desatualizado quando ela for respondida.** [`adr/0007-distribuicao-registry-npm-gitea.md`](adr/0007-distribuicao-registry-npm-gitea.md), cuja linha `pendencia` deixa de existir — e que precisa de ADR sucessor se a resposta for o plano B; [`adr/README.md`](adr/README.md), na coluna de status; [`arquitetura.md`](arquitetura.md), seções 8, 12 e 13; [`especificacao-alvo.md`](especificacao-alvo.md), seção "Instalação"; [`CONTRIBUTING.md`](../CONTRIBUTING.md), na parte de processo futuro.

---

## QA-07 — O vermelho de erro · `D3`

**A pergunta.** Qual vermelho vira o token de perigo? Ele não existe na paleta institucional e precisa ser criado e validado para contraste.

**O que já se sabe.** A paleta institucional declarada tem azul, verde, amarelo e neutros — não tem vermelho, como registra o [inventário](inventario-identidade.md), que também cataloga as cores em uso fora de qualquer sistema. A [especificação-alvo](especificacao-alvo.md) já prevê a existência de tokens semânticos e regras de contraste, e o [ADR-014](adr/0014-wcag-21-aa-criterio-bloqueante.md) torna WCAG 2.1 AA critério bloqueante — ou seja, o vermelho escolhido precisa passar no cálculo antes de ser adotado, não depois.

**O que a resposta destrava.** O estado de erro dos componentes, que a definição de pronto exige de todos; os formulários do [ADR-015](adr/0015-formularios-api-controlada.md), que precisam de cor de erro para mensagem e borda; e o conjunto de tokens semânticos de feedback.

**O que fica desatualizado quando ela for respondida.** [`especificacao-alvo.md`](especificacao-alvo.md), seções "Tokens semânticos" e "Regras de contraste"; [`inventario-identidade.md`](inventario-identidade.md), seção 2; [`auditoria/2026-08-21-repositorio.md`](auditoria/2026-08-21-repositorio.md), na tabela de contraste medido.

---

## QA-08 — A Calculadora de Taxas · `D4`

**A pergunta.** A Calculadora de Taxas migra para os tokens institucionais na fase F1, ou fica com o tema próprio como exceção documentada?

**O que já se sabe.** O [inventário](inventario-identidade.md) registra que existe uma segunda paleta em circulação, em tokens no formato shadcn escopados a essa aplicação — ou seja, o tema próprio é fato consumado, não hipótese. O [ADR-012](adr/0012-tema-por-atributo-de-dados.md) dá o mecanismo para manter a exceção de forma formal, por atributo de dados, em vez de por divergência. O [caminho de adoção](adocao.md) prevê a substituição mecânica dos hex institucionais por tokens, e o alcance dessa substituição depende desta resposta.

**O que a resposta destrava.** O escopo do passo 3 do caminho de adoção e quantos temas o sistema precisa carregar já na F1 — o que, por sua vez, é o primeiro teste real da arquitetura multi-tema.

**O que fica desatualizado quando ela for respondida.** [`adocao.md`](adocao.md); [`inventario-identidade.md`](inventario-identidade.md), na seção sobre a segunda paleta; [`arquitetura.md`](arquitetura.md), seção 12; [`adr/0012-tema-por-atributo-de-dados.md`](adr/0012-tema-por-atributo-de-dados.md), que ganha ou perde seu primeiro caso de uso concreto.

---

## QA-09 — A assinatura de marca do site · `F10`

**A pergunta.** O design system assina como DEVSEMEC, a marca do time de tecnologia, ou como SEMEC/PMPV, a marca institucional?

**O que já se sabe.** A [auditoria](auditoria/2026-08-21-repositorio.md) levantou a questão a partir de fatos medidos: o logotipo do cabeçalho é a palavra DEVSEMEC em Press Start 2P, uma fonte pixel de videogame; a página de anti-padrões do próprio site proíbe `font-press-start` "fora do logotipo", isto é, a regra foi escrita para acomodar a exceção; há um MIV oficial da PMPV de 20 MB dentro do repositório; e o `app/icon.svg` é um "S" em Arial. A auditoria classificou o achado como MÉDIO, mas observou que ele **é a Q1 do documento de arquitetura** e que trava a definição dos tokens primitivos.

Esta questão ficou separada de **QA-01** e **QA-02** de propósito: ela decide um artefato concreto e imediato — o que está escrito no cabeçalho e no favicon deste repositório hoje —, enquanto QA-01 decide a paleta e QA-02 decide de quem é o sistema. As três se tocam e provavelmente serão respondidas na mesma conversa; responder uma não responde as outras.

**O que a resposta destrava.** A substituição do logotipo e do favicon, o uso (ou a remoção) do MIV oficial que já está versionado aqui, e o destino da regra de exceção de fonte na página de anti-padrões.

**O que fica desatualizado quando ela for respondida.** [`auditoria/2026-08-21-repositorio.md`](auditoria/2026-08-21-repositorio.md), achado F10 e os itens menores ligados a ícone e marca; [`inventario-identidade.md`](inventario-identidade.md), seção 1, sobre assets e duplicação de marca; [`especificacao-alvo.md`](especificacao-alvo.md), seção "Marca e ilustração".

---

## Como responder uma questão

1. A decisão é tomada por quem a tabela indica, com registro de quem decidiu e quando.
2. A decisão entra como **ADR novo** em [`adr/`](adr/README.md), copiado do [TEMPLATE.md](adr/TEMPLATE.md) — nunca como edição silenciosa de um ADR existente. Se ela substituir um ADR anterior, o antigo passa a `Substituído` e ganha link para o sucessor.
3. O status desta questão muda de `Aberta` para `Respondida`, com link para o ADR que a respondeu. A questão permanece nesta página: ela é registro histórico, não fila de tarefas a esvaziar.
4. Os documentos listados em "o que fica desatualizado" são revisados — e o que for revisado ganha nota dizendo por qual decisão.

Ver também: [`arquitetura.md`](arquitetura.md), [`adr/README.md`](adr/README.md), [`auditoria/README.md`](auditoria/README.md) e [`CONTRIBUTING.md`](../CONTRIBUTING.md).
