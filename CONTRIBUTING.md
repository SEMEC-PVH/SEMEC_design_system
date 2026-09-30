# Como contribuir

Este documento descreve a governança do Design System da SEMEC. Ele deriva de duas fontes escritas antes deste repositório existir: a seção "Governança" do [documento de arquitetura](docs/arquitetura.md) e os guias "Para quem contribui" e "Definição de pronto" da [especificação-alvo](docs/especificacao-alvo.md).

Essas duas fontes descrevem o processo de uma **biblioteca de componentes publicada** — com pacotes em registry, Storybook, testes automatizados de acessibilidade, regressão visual e changesets. Este repositório **publica** o pacote `@semec/ds` no npm público, com subpath exports (`@semec/ds/react` para componentes, `@semec/ds/skills` para artefatos de agentes). O site de documentação vive em `apps/docs/` (Next.js 16, `output: 'export'`) e os artefatos para agentes são gerados a partir de `packages/react/manifest.js`. Ver [objetivo.md](docs/objetivo.md), [ADR-022](docs/adr/0022-publicacao-npm-publico.md) e o [veredito da auditoria](docs/auditoria/2026-08-21-repositorio.md).

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

Aprovada a proposta, a issue ganha critérios de aceite e vira trabalho. Neste repositório, "implementar" significa mexer nas páginas de `apps/docs/app/(docs)/`, nos componentes de `apps/docs/components/` que as servem, ou nos componentes do kit em `packages/react/src/components/`.

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

Aprovado, o pull request entra por merge na branch de destino. Se o `package.json` do pacote tiver versão **superior** à do npm (houver changeset aplicado), a CI publica o `@semec/ds` (ver seção "Publicação e versionamento" abaixo).

## O que um pull request precisa ter hoje

- [ ] Issue de proposta vinculada (exceto correção pontual)
- [ ] Changeset criado (se houver mudança relevante)
- [ ] `npm run build:ds` passando — roda tsup + build-artifacts, verifica se o pacote compila sem erros
- [ ] `npm run typecheck` passando — verifica tipos
- [ ] `npm run build` passando — roda next build com output: 'export' e verifica se o site compila
- [ ] Página conferida com teclado, foco visível ponta a ponta
- [ ] Contraste calculado para qualquer cor nova
- [ ] Nenhum hex, `rgba()` ou `style` inline novo fora das variáveis existentes
- [ ] Revisão de outra pessoa
- [ ] Mensagens de commit na convenção abaixo

**Scripts que existem hoje** (na raiz, delegando para `apps/docs` e `packages/react`): `dev`, `build`, `build:ds`, `start`, `lint`, `typecheck`, `generate:llms`, `proto:css`, `changeset`, `version-packages`, `release`.

> **Sobre o `lint`.** O script `lint` (`eslint .`, com `eslint-config-next` e `eslint-plugin-jsx-a11y`) já existe e roda em `apps/docs`. Ainda há uma violação conhecida de `react-hooks/set-state-in-effect` em `apps/docs/components/docs/Sidebar.jsx`, herdada antes da migração.

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

Todo arquivo de texto usa **LF**. O `.gitattributes` da raiz (`* text=auto eol=lf`, com exceções binárias para `png`, `jpg`, `pdf`, `woff`, `woff2` e `ico`) garante isso. Configure seu editor para LF também.

---

# Parte 2 — O processo previsto, para quando a biblioteca existir

Nesta parte, apenas a **publicação e versionamento** já está ativa (ver Parte 1). Os demais itens dependem de infraestrutura que ainda não foi construída: o Storybook, a suíte de testes e a integração contínua descritos na [arquitetura](docs/arquitetura.md). Esta parte existe para que, quando a infraestrutura chegar, a régua já esteja escrita — e para deixar explícito o que **não** está sendo cobrado enquanto isso.

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

O pacote `@semec/ds` é publicado no **npm público** ([ADR-022](docs/adr/0022-publicacao-npm-publico.md)). A CI (`.github/workflows/release.yml`) publica em todo push para `main` — **mas só se** a versão local for maior que a do registry. Sem changeset + `version-packages`, o publish é um no-op (não sobe nada).

### Pré-requisito da CI (mantenedores)

O workflow usa o secret do GitHub **`NPM_TOKEN`** (Settings → Secrets and variables → Actions), exposto como `NODE_AUTH_TOKEN` no job:

| Campo | Valor |
|--------|--------|
| Nome do secret | `NPM_TOKEN` (exato) |
| Repo | este repositório (`SEMEC-PVH/SEMEC_design_system`) |
| Tipo de token npm | **Granular** (ou Automation), na conta mantenedora do scope `@semec` |
| Packages and scopes | `@semec` → **Read and write** |
| Bypass 2FA | **Sim**, se a conta tiver 2FA (senão o publish falha com E403) |

Sem esse secret (ou com token inválido), o job falha no passo de diagnóstico (`npm whoami`). O workflow também roda `typecheck` + `build:ds` antes de `changeset publish` e **verifica** ao final se `npm view @semec/ds version` bate com o `package.json`.

### Fluxo de release

1. **Crie um changeset** descrevendo sua mudança:
   ```bash
   npm run changeset
   ```
   Escolha o tipo:
   - **patch** (2.1.0 → 2.1.1) — bugfix, correção de typo, ajuste de estilo
   - **minor** (2.1.0 → 2.2.0) — componente novo, propriedade nova, funcionalidade
   - **major** (2.x → 3.0.0) — quebra de API, remoção de componente, mudança de export

2. **Aplique o versionamento** (bump em `packages/react/package.json` + CHANGELOG):
   ```bash
   npm run version-packages
   ```

3. **Commit e push** para a branch `main` (só os arquivos de release + o conteúdo do changeset):
   ```bash
   git add packages/react/package.json packages/react/CHANGELOG.md package-lock.json
   git commit -m "chore(release): @semec/ds x.y.z"
   git push
   ```

4. **A CI publica** (`changeset publish` → npm) e **confirma** a versão no registry. O Changesets cria a tag git `@semec/ds@x.y.z`.

### Como conferir o que está no npm

```bash
npm view @semec/ds version        # última publicada (dist-tag latest)
npm view @semec/ds dist-tags
npx changeset publish-plan        # o que a próxima release publicaria
```

### Fallback local (sem CI)

Se o `NPM_TOKEN` estiver indisponível, um mantenedor autenticado no npm pode publicar da raiz do monorepo:

```bash
npm login                          # conta com publish em @semec
npm whoami
npm run build:ds
npx changeset publish              # ou: npm run release
```

Conta com 2FA no npm: use token granular com bypass 2FA, ou `npx changeset publish --otp=XXXXXX`.

### Consumidores do pacote

```bash
# Última versão (latest)
npm install @semec/ds

# Versão específica
npm install @semec/ds@2.1.0

# Dentro do range semver
npm install @semec/ds@^2.0.0
```

### Versionamento semântico

- **Major**: quebra de API, mudança visual disruptiva ou remoção de export
- **Minor**: componente, propriedade ou export novo
- **Patch**: correção de bug, ajuste de tipografia, contrato

**Depreciação**: propriedade ou componente marcado como obsoleto continua funcionando por **duas versões menores**, com aviso, antes de sair em uma versão maior — conforme o [ADR-013](docs/adr/0013-politica-de-depreciacao-duas-minors.md). Toda versão maior traz guia de migração.

---

## Decisões estruturais

Mudança estrutural entra como **ADR novo** em [`docs/adr/`](docs/adr/README.md) — copiado do [TEMPLATE.md](docs/adr/TEMPLATE.md), com o próximo número livre e uma linha nova no índice. Nunca como edição silenciosa de um ADR existente ou da documentação.

Se sua proposta esbarrar em algo que ninguém decidiu ainda, é provável que já esteja catalogado em [**questões em aberto**](docs/questoes-abertas.md). Nesse caso, a contribuição certa costuma ser ajudar a fechar a questão — não escolher sozinho, no código, uma resposta que o repositório inteiro vai herdar.

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
