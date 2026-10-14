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

Quem revisa é um **code owner** (`.github/CODEOWNERS`) diferente do autor. Com a proteção do `main` aplicada (ver "Proteção do main" abaixo), o GitHub só libera o merge com essa aprovação e com a CI verde.

## 5. Merge

Aprovado e com a CI verde, o pull request entra por merge no `main`. Nada entra no `main` por push direto. O que acontece depois com o pacote está em "Publicação e versionamento", abaixo: o merge de um PR com changeset **não publica sozinho** — ele alimenta o PR de versão, e a publicação acontece quando esse PR é mergeado.

## O que um pull request precisa ter hoje

O template de PR (`.github/pull_request_template.md`) repete esta lista.

- [ ] Issue de proposta vinculada (exceto correção pontual)
- [ ] Changeset criado se o PR muda arquivo publicado do `@semec/ds` — **a CI falha sem ele** (ver "Changeset obrigatório")
- [ ] `npm run build:ds` passando — roda tsup + build-artifacts, verifica se o pacote compila sem erros
- [ ] `npm run typecheck` passando — verifica tipos
- [ ] `npm run build` passando — roda next build com output: 'export' e verifica se o site compila
- [ ] `npm run lint` passando
- [ ] Artefatos de agentes (`apps/docs/public`) regenerados e commitados quando `packages/react/manifest.js` mudar — **a CI falha se estiverem desatualizados** (`npm run check:artifacts` confere localmente)
- [ ] Página conferida com teclado, foco visível ponta a ponta
- [ ] Contraste calculado para qualquer cor nova
- [ ] Nenhum hex, `rgba()` ou `style` inline novo fora das variáveis existentes
- [ ] Revisão de outra pessoa
- [ ] Mensagens de commit na convenção abaixo

**Scripts que existem hoje** (na raiz, delegando para `apps/docs` e `packages/react`): `dev`, `build`, `build:ds`, `start`, `lint`, `typecheck`, `generate:llms`, `check:artifacts`, `proto:css`, `gate`, `changeset`, `changeset:check`, `version-packages`, `release`.

## O que a CI verifica

`.github/workflows/ci.yml` roda em todo PR para o `main` e em todo push no `main`. Cada job é um check com o nome abaixo — são esses nomes que a proteção do `main` exige.

| Check | O que roda | Falha quando |
|---|---|---|
| `changeset` | `changeset status --since=origin/main` (só em PR) | o PR muda arquivo publicado do `@semec/ds` sem changeset |
| `lint` | `npm run lint` | eslint (`eslint-config-next` + `jsx-a11y`) acusa erro em `apps/docs` |
| `typecheck` | `npm run typecheck` | `tsc --noEmit` do kit falha |
| `build` | `npm run build:ds`, build do site (`next build`, export estático) e conferência de `apps/docs/public` | o pacote ou o site não compilam, ou os artefatos de agentes estão desatualizados |
| `gate` | `npm run gate` | o gate de qualidade e regressão reprova |

Para rodar o mesmo localmente, na ordem: `npm run build:ds`, `npm run typecheck`, `npm run build`, `npm run lint`, `npm run changeset:check`, `npm run check:artifacts`.

**Deriva dos artefatos.** `build:ds` e o `prebuild` do site regeneram `llms.txt`, `llms-full.txt`, `manifest.json`, `components/*.md` e `skills/` em `apps/docs/public` a partir de `packages/react/manifest.js`. A CI regenera tudo e falha se o resultado for diferente do commitado. O carimbo de data (`"generatedAt"` e `> Gerado <data>`) é determinístico — `SOURCE_DATE_EPOCH`, se definido, senão a data do último commit em `packages/react` — então dois builds do mesmo commit geram arquivos idênticos. Mesmo assim essas duas linhas ficam fora da comparação: o commit que muda o pacote ganha data nova depois que os artefatos foram gerados, e a CI usa checkout raso.

### Changeset obrigatório

Um PR precisa de changeset quando muda algo que vai para o npm dentro de `packages/react/`: `src/**`, `skills/**`, `scripts/**`, `manifest.js`, `tokens.css`, `pv-preset.ts`, `server.js`, `tsup.config.ts`, `tsconfig.json` ou `package.json` (lista em `changedFilePatterns`, `.changeset/config.json`). Mudança só no site (`apps/docs`) ou só no `README` do pacote não exige.

```bash
npm run changeset            # escolhe @semec/ds, o tipo (patch/minor/major) e descreve em PT-BR
git add .changeset/*.md
```

Se a mudança em arquivo publicado realmente não precisa de versão nova (ex.: comentário), registre isso explicitamente com `npx changeset add --empty` — o arquivo vazio passa na CI e não gera bump.

## Proteção do main

O `CODEOWNERS` e os checks da CI só obrigam alguma coisa quando o `main` está protegido. Isso é **configuração do repositório no GitHub**, não arquivo — um admin precisa aplicar uma vez. Até lá, a regra da seção 4 ("revisão por pessoa diferente") depende só de disciplina.

**Code owners.** A organização `SEMEC-PVH` não tem times (`gh api orgs/SEMEC-PVH/teams` devolve `[]`), então `.github/CODEOWNERS` lista usuários: `@Rug-gieri` e `@VgavaBR123`, os dois admins que mais contribuem. Como o GitHub não aceita que o autor aprove o próprio PR, o PR de um precisa da aprovação do outro. Para não depender de duas pessoas só, inclua mais gente com permissão de escrita (hoje: `pdrokbott`, `RomuloMaltez`, `LeonardoSeijiNakayama`, `MariMeng`, `ThiagoACNascimento`) ou crie o time `design-system` na organização e troque as linhas por `@SEMEC-PVH/design-system`.

**O que a proteção exige:**

- PR obrigatório para entrar no `main` (sem push direto, inclusive para admins);
- 1 aprovação, de code owner, descartada se chegarem commits novos, e a aprovação precisa vir de alguém que não fez o último push;
- checks obrigatórios e branch atualizada: `changeset`, `lint`, `typecheck`, `build`, `gate`;
- conversas resolvidas antes do merge;
- sem force push e sem apagar o `main`.

**Passo a passo (Settings).** Settings → Branches → Add branch protection rule → Branch name pattern `main` → marcar "Require a pull request before merging" (Required approvals: 1; "Dismiss stale pull request approvals when new commits are pushed"; "Require review from Code Owners"; "Require approval of the most recent reviewable push") → "Require status checks to pass before merging" ("Require branches to be up to date"; adicionar `changeset`, `lint`, `typecheck`, `build`, `gate` — eles só aparecem na busca depois de rodarem uma vez) → "Require conversation resolution before merging" → "Do not allow bypassing the above settings" → Create.

**O mesmo pela API** (admin autenticado no `gh`):

```bash
gh api -X PUT repos/SEMEC-PVH/SEMEC_design_system/branches/main/protection \
  -H "Accept: application/vnd.github+json" --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "changeset" },
      { "context": "lint" },
      { "context": "typecheck" },
      { "context": "build" },
      { "context": "gate" }
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true,
    "require_last_push_approval": true
  },
  "required_conversation_resolution": true,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Conferir depois:

```bash
gh api repos/SEMEC-PVH/SEMEC_design_system/branches/main/protection \
  --jq '{checks: [.required_status_checks.checks[].context], reviews: .required_pull_request_reviews.required_approving_review_count, codeowners: .required_pull_request_reviews.require_code_owner_reviews, admins: .enforce_admins.enabled}'
gh api repos/SEMEC-PVH/SEMEC_design_system/codeowners/errors   # deve devolver {"errors":[]}
```

O job `changeset` só roda em PR; em push no `main` e no PR de versão (`changeset-release/main`) ele aparece como *skipped*, o que conta como aprovado para a proteção.

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

Nesta parte, apenas a **publicação e versionamento** já está ativa (ver Parte 1). Os demais itens dependem de infraestrutura que ainda não foi construída: o Storybook, a suíte de testes e a parte da integração contínua que roda testes, descritos na [arquitetura](docs/arquitetura.md). Esta parte existe para que, quando a infraestrutura chegar, a régua já esteja escrita — e para deixar explícito o que **não** está sendo cobrado enquanto isso.

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
| Regressão visual | Suíte de snapshot e um job na CI para rodá-la; a CI existe, a suíte não |

## Publicação e versionamento

O pacote `@semec/ds` é publicado no **npm público** ([ADR-022](docs/adr/0022-publicacao-npm-publico.md)) pelo fluxo do [Changesets](https://github.com/changesets/changesets) com a action `changesets/action`, em `.github/workflows/release.yml`.

Regras do fluxo:

- **Nenhuma versão sai por bump manual.** A versão de `packages/react/package.json` só muda pelo PR de versão que o workflow abre (`changeset version`). Bump manual foi o que fez três conteúdos diferentes circularem como "3.0.0" (AUD-12).
- **O Release só roda depois da CI verde.** O gatilho é `workflow_run` do workflow `CI`, só para push no `main` e só com `conclusion == success`; ele faz checkout do commit exato que a CI aprovou. Não há gatilho manual que pule a CI.
- **Toda correção no pacote chega ao npm.** Como a CI exige changeset, cada mudança publicada vira entrada de CHANGELOG e entra na próxima versão.

### Pré-requisito da CI (mantenedores)

O workflow usa dois secrets do GitHub (Settings → Secrets and variables → Actions). Nenhum deles fica no `env` do job: o `npm ci` roda sem token, e cada secret só entra no passo que precisa dele.

**`NPM_TOKEN`** — só nos passos de autenticação npm e de publicação, e só quando não há changesets pendentes (modo publicação):

| Campo | Valor |
|--------|--------|
| Nome do secret | `NPM_TOKEN` (exato) |
| Repo | este repositório (`SEMEC-PVH/SEMEC_design_system`) |
| Tipo de token npm | **Granular** (ou Automation), na conta mantenedora do scope `@semec` |
| Packages and scopes | `@semec` → **Read and write** |
| Bypass 2FA | **Sim**, se a conta tiver 2FA (senão o publish falha com E403) |

Sem esse secret (ou com token inválido), o job falha no passo de autenticação (`npm whoami`) — mas só quando vai publicar; abrir o PR de versão não precisa do token. Depois de publicar, o workflow **verifica** se `npm view @semec/ds version` bate com o `package.json`.

**`RELEASE_TOKEN`** — token usado para fazer push da branch `changeset-release/main`, abrir o PR de versão e enviar as tags. O secret já existe no repositório (cadastrado em 29/09/2026 como PAT para abrir os PRs de versão). Ele precisa de, no mínimo:

| Tipo | Permissões |
|------|------------|
| PAT fine-grained (recomendado) | repositório `SEMEC-PVH/SEMEC_design_system`; `Contents: Read and write`, `Pull requests: Read and write` |
| PAT clássico | escopo `repo` |

Ninguém consegue ler um secret depois de salvo, então quem criou o token confere tipo, escopo e validade. Se ele vencer, gere outro com as permissões acima e salve com o mesmo nome:

```bash
gh secret set RELEASE_TOKEN -R SEMEC-PVH/SEMEC_design_system   # cola o token quando pedir
```

Push feito com PAT dispara a CI no PR de versão, então os checks obrigatórios rodam normalmente. É por isso que o workflow prefere o PAT ao `GITHUB_TOKEN`.

**Alternativa sem `RELEASE_TOKEN`.** Se o secret for apagado, o workflow cai no `GITHUB_TOKEN` padrão. Hoje isso **não funciona**, porque o repositório está com `can_approve_pull_request_reviews: false`. Para usar essa via, um admin liga Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests":

```bash
gh api -X PUT repos/SEMEC-PVH/SEMEC_design_system/actions/permissions/workflow   -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
```

Nesse modo, o PR aberto com `GITHUB_TOKEN` **não dispara a CI**, e os checks obrigatórios ficam pendentes. Para destravar, um mantenedor fecha e reabre o PR de versão: o evento `reopened`, feito por uma pessoa, dispara a CI. Também funciona fazer um push qualquer na branch `changeset-release/main`.

### Fluxo de release

1. **Cada PR traz seu changeset.** Quem muda o pacote roda `npm run changeset`, escolhe `@semec/ds` e o tipo, e descreve a mudança em PT-BR citando a issue:
   - **patch** (3.0.0 → 3.0.1) — correção de bug, a11y, contrato, ajuste de estilo
   - **minor** (3.0.0 → 3.1.0) — componente, propriedade ou export novo
   - **major** (3.x → 4.0.0) — quebra de API, remoção de componente, mudança de export

   O arquivo (`.changeset/<nome>.md`) entra no mesmo PR. A CI (`changeset`) recusa o PR sem ele.

2. **Merge no `main` → PR de versão.** Com a CI verde no `main`, o Release vê changesets pendentes e abre (ou atualiza) o PR **"chore(release): versiona pacotes"** na branch `changeset-release/main`. Esse PR roda `npm run version-packages` (`changeset version` + `npm install --package-lock-only`): consome os arquivos de `.changeset/`, faz o bump em `packages/react/package.json`, escreve o `packages/react/CHANGELOG.md` e atualiza o `package-lock.json`. Vários PRs acumulam no mesmo PR de versão.

3. **Revisão e merge do PR de versão.** Um mantenedor confere a versão e o CHANGELOG, aprova e mergeia — como qualquer PR, com CI verde e aprovação de code owner. Ninguém roda `version-packages` à mão no `main`.

4. **Publicação.** Com a CI verde no commit do merge, o Release não encontra changesets pendentes e roda `npm run release` (`build:ds` + `changeset publish`): publica no npm só o que ainda não está lá, cria a tag `@semec/ds@x.y.z`, a GitHub Release, e confere a versão no registry.

Se a publicação falhar (token expirado, npm fora do ar), corrija a causa e use **Re-run jobs** na execução do Release em Actions; ele refaz o checkout do mesmo commit aprovado.

### Como conferir o que está no npm

```bash
npm view @semec/ds version        # última publicada (dist-tag latest)
npm view @semec/ds dist-tags
npx changeset publish-plan        # o que a próxima release publicaria
```

### Fallback local (sem CI)

Se o `NPM_TOKEN` estiver indisponível, um mantenedor autenticado no npm pode publicar da raiz do monorepo — **só** a partir do `main` atualizado, com a CI verde e depois de mergeado o PR de versão (nunca com bump manual):

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
