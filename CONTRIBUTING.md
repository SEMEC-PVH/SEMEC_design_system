# Como contribuir

Este documento descreve a governança do Design System da SEMEC. Ele deriva de duas fontes escritas antes deste repositório existir: a seção "Governança" do [documento de arquitetura](docs/arquitetura.md) e os guias "Para quem contribui" e "Definição de pronto" da [especificação-alvo](docs/especificacao-alvo.md).

Essas duas fontes descrevem o processo de uma **biblioteca de componentes publicada** — com pacotes, Storybook, testes automatizados de acessibilidade, regressão visual e changesets. Este repositório ainda não é isso. Hoje ele é o **site de documentação**: um projeto Next.js 16 com App Router e `output: 'export'`, que gera HTML estático. Não há pacote publicável, não há componente exportado, não há Storybook e não há integração contínua. É o mesmo diagnóstico do [veredito da auditoria](docs/auditoria/2026-08-21-repositorio.md).

Por isso a governança está dividida em duas partes. A **Parte 1** vale hoje e só cita ferramenta que existe. A **Parte 2** é o processo previsto para quando a biblioteca existir, e nenhum item dela é exigível agora. Exigir hoje um `axe` que ninguém configurou seria pedir a quem contribui que finja — e documentação que finge é o problema que este repositório está tentando corrigir.

---

## Papéis

Iguais nas duas partes.

- **Mantenedores** — Departamento de Tecnologia da SEMEC. Revisam, aprovam e, quando houver o que publicar, publicam.
- **Contribuidores** — equipes de produto, internas ou contratadas. Propõem e implementam.
- **Aprovação de identidade** — quem detém a marca institucional. Decide cor, tipografia e assinatura. De qual órgão é esse papel é uma [questão em aberto](docs/questoes-abertas.md) (QA-02).

---

# Parte 1 — O processo que vale hoje

## 1. Proposta

Toda mudança que não seja correção pontual começa em uma **issue**, antes do código. A issue descreve:

- o **problema** — não a solução;
- **onde ele já apareceu** — em quais telas, de quais produtos;
- as **alternativas consideradas** e por que foram descartadas;
- protótipo, captura de tela ou link, quando houver.

Correção de erro evidente — link quebrado, erro de digitação, valor que contradiz outro no mesmo arquivo — dispensa issue e vai direto a pull request.

## 2. Regra dos dois projetos

Um componente, um padrão ou uma regra só entra na documentação oficial se tiver **uso real em pelo menos dois produtos**. Um caso só não é um sistema: é um requisito de um projeto, e o lugar dele é dentro daquele projeto. Esta é a principal defesa contra o design system inchar até virar peso de manutenção — e ela vale desde agora, mesmo com o repositório sendo apenas documentação, porque documentar como oficial já cria expectativa de suporte.

Quem avalia são os mantenedores, na issue, antes de haver código.

## 3. Implementação

Aprovada a proposta, a issue ganha critérios de aceite e vira trabalho. Neste repositório, "implementar" significa mexer nas páginas de `app/(docs)/` e nos componentes de `components/` que as servem.

Duas regras que o próprio site publica e que valem para quem edita o site:

- **Nada de valor bruto de cor, espaçamento, raio ou sombra** em código novo. Use as variáveis já declaradas. A auditoria contou 33 hex literais em JSX e 30 blocos de `style` inline; não aumente a conta.
- **Não copie um componente para dentro da sua página.** Se o que existe não serve, isso é uma proposta, não um `Ctrl+C`.

## 4. Revisão

Todo pull request é revisado por **pessoa diferente de quem implementou**. A revisão cobre código e acessibilidade.

Sem `axe` configurado, a verificação de acessibilidade **é manual** — e precisa ser feita de fato, porque o [ADR-014](docs/adr/0014-wcag-21-aa-criterio-bloqueante.md) trata WCAG 2.1 AA como critério bloqueante e a auditoria encontrou seis falhas de contraste em componentes já publicados como oficiais:

- percorrer a página inteira **só com o teclado** — Tab, Shift+Tab, Enter, Espaço, Esc e setas onde houver grupo;
- confirmar que o **foco é visível** em todo elemento interativo;
- **calcular o contraste** de qualquer par de cores novo (4.5:1 para texto normal, 3:1 para texto grande e para elemento de interface);
- conferir que imagem tem texto alternativo e que a hierarquia de títulos não pula nível.

## 5. Merge

Aprovado, o pull request entra por merge na branch de destino. **Não há changeset, não há release e não há publicação** — não existe pacote para versionar. Isso muda quando a Parte 2 valer.

## O que um pull request precisa ter hoje

- [ ] Issue de proposta vinculada (exceto correção pontual)
- [ ] `npm run build` passando — é o único portão automatizado que existe; ele roda o `next build` com `output: 'export'` e falha em erro de compilação e em rota que não exporta
- [ ] Página conferida com teclado, foco visível ponta a ponta
- [ ] Contraste calculado para qualquer cor nova
- [ ] Nenhum hex, `rgba()` ou `style` inline novo fora das variáveis existentes
- [ ] Revisão de outra pessoa
- [ ] Mensagens de commit na convenção abaixo

**Scripts que existem hoje** no `package.json`: `dev`, `build` e `start`. Nada além disso.

> **Sobre o `lint`.** A branch `fix/acessibilidade-e-build`, ainda não mesclada, acrescenta um script `lint` (`eslint .`, com `eslint-config-next` e `eslint-plugin-jsx-a11y`). Quando ela for mesclada, `npm run lint` passa a fazer parte do checklist acima — inclusive com regras de acessibilidade em JSX, que hoje ninguém verifica automaticamente. Até lá, o comando não existe: não o cite em revisão e não o coloque em nenhuma instrução.

## Convenção de commits

Mensagens em **português**, no formato `tipo(escopo): descrição no imperativo`. O escopo é opcional. Tipos observados no histórico:

```
docs: adiciona README e ferramental minimo do repositorio
fix(a11y): corrige contraste WCAG AA em botoes, foco e texto secundario
fix(build): auto-hospeda fontes e remove dependencia do Google Fonts em build
chore: normaliza fim de linha para LF (.gitattributes)
```

Os commits mais antigos do repositório (`initial commit`, `migration to nextjs`, `dark mode added`) são anteriores a essa convenção, estão em inglês e sem prefixo. Não servem de modelo. O histórico recente também escreve os assuntos sem acentuação — é o que está lá, não uma regra: acentuar corretamente é bem-vindo.

## Fim de linha

Todo arquivo de texto usa **LF**. Configure seu editor para isso.

> **Sobre o `.gitattributes`.** O arquivo **não existe nesta branch**. Ele vem da branch `fix/acessibilidade-e-build` (commit `chore: normaliza fim de linha para LF`), que ainda não foi mesclada, e declara `* text=auto eol=lf` mais as exceções binárias para `png`, `jpg`, `pdf`, `woff`, `woff2` e `ico`. Enquanto essa branch não entrar, a normalização depende inteiramente da configuração de cada máquina — e é por isso que a auditoria encontrou o working tree inteiro aparecendo como modificado sem nenhuma mudança real de conteúdo.

---

# Parte 2 — O processo previsto, para quando a biblioteca existir

Nada nesta parte é exigível hoje. Cada item aqui depende de infraestrutura que ainda não foi construída: os pacotes em `packages/`, o Storybook, a suíte de testes e a integração contínua descritos na [arquitetura](docs/arquitetura.md). Esta parte existe para que, quando a infraestrutura chegar, a régua já esteja escrita — e para deixar explícito o que **não** está sendo cobrado enquanto isso.

## Fluxo completo de entrada de um componente

1. **Proposta** em issue — igual à Parte 1.
2. **Regra dos dois projetos** — igual à Parte 1.
3. **Implementação**: componente, tipos, stories, testes, teste de acessibilidade, documentação de uso **e de quando não usar**.
4. **Revisão** de código e de acessibilidade, por pessoa diferente de quem implementou.
5. **Merge**, changeset, release.

## Definição de pronto

- [ ] API tipada e documentada
- [ ] Estados cobertos: padrão, hover, foco, ativo, desabilitado, erro, carregando, vazio
- [ ] Responsivo nos pontos de quebra definidos
- [ ] Tema claro e tema escuro
- [ ] Navegação por teclado documentada e testada
- [ ] `axe` sem violações
- [ ] Story no Storybook com exemplo de uso e de mau uso
- [ ] Teste de regressão visual

**O que falta para cada item ser exigível:**

| Item | Depende de |
|---|---|
| API tipada | Pacote com TypeScript — hoje o repositório é JSX sem tipos |
| Tema claro e escuro | Camada L0 de tokens e a resposta de [QA-01](docs/questoes-abertas.md) |
| `axe` sem violações | Vitest + Testing Library + axe, do [ADR-009](docs/adr/0009-testes-vitest-testing-library-axe-regressao-visual.md); nada disso está instalado |
| Story no Storybook | Storybook, do [ADR-008](docs/adr/0008-storybook-documentacao-viva.md); não existe no repositório |
| Regressão visual | Suíte de snapshot e um CI para rodá-la; não há CI |

## Publicação e versionamento

- **Changesets** geram versão e registro de mudanças a cada release.
- **Versionamento semântico estrito**: quebra de API ou mudança visual disruptiva incrementa a maior; componente ou propriedade nova, a menor; correção, a de correção.
- **Canais**: `latest` para produção, `next` para validação prévia.
- **Depreciação**: propriedade ou componente marcado como obsoleto continua funcionando por **duas versões menores**, com aviso, antes de sair em uma versão maior — conforme o [ADR-013](docs/adr/0013-politica-de-depreciacao-duas-minors.md). Toda versão maior traz guia de migração.
- **Registry**: escopo `@semec` no Gitea institucional, com token de publicação exclusivo do CI, conforme o [ADR-007](docs/adr/0007-distribuicao-registry-npm-gitea.md) — que segue com verificação pendente, registrada em [QA-06](docs/questoes-abertas.md).

Enquanto o registry não estiver confirmado e não houver CI, nenhuma dessas regras tem onde rodar.

---

## Decisões estruturais

Mudança estrutural entra como **ADR novo** em [`docs/adr/`](docs/adr/README.md) — copiado do [TEMPLATE.md](docs/adr/TEMPLATE.md), com o próximo número livre e uma linha nova no índice. Nunca como edição silenciosa de um ADR existente ou da documentação.

Se sua proposta esbarrar em algo que ninguém decidiu ainda, é provável que já esteja catalogado em [**questões em aberto**](docs/questoes-abertas.md). Nesse caso, a contribuição certa costuma ser ajudar a fechar a questão — não escolher sozinho, no código, uma resposta que o repositório inteiro vai herdar.

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
