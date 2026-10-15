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

Aprovado e com a CI verde, o pull request entra por merge no `main`. Nada entra no `main` por push direto. O que acontece depois com o pacote está em "Publicação e versionamento", abaixo: o merge de um PR com changeset **não publica sozinho**: os changesets se acumulam no `main` até um mantenedor abrir o PR de versão, e a publicação acontece quando esse PR é mergeado.

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

O job `changeset` só roda em PR; em push no `main` e no PR de versão (branch `changeset-release/*`) ele aparece como *skipped*, o que conta como aprovado para a proteção.

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

O pacote `@semec/ds` é publicado no **npm público** ([ADR-022](docs/adr/0022-publicacao-npm-publico.md)) pelo fluxo do [Changesets](https://github.com/changesets/changesets). O **versionamento** é feito por um mantenedor, num PR; o workflow `.github/workflows/release.yml` **só publica**.

Por que não é o workflow que abre o PR de versão: a organização `SEMEC-PVH` bloqueia PR criado por workflow, e o push da branch de versão com PAT (`RELEASE_TOKEN`) foi recusado com 403 no primeiro push no `main` depois da onda 1 (run [38615303248](https://github.com/SEMEC-PVH/SEMEC_design_system/actions/runs/38615303248), AUD-12, #26). Com o versionamento no PR do mantenedor, o workflow não precisa de PAT nem de permissão de PR.

Regras do fluxo:

- **Nenhuma versão sai por bump manual.** A versão de `packages/react/package.json` só muda por `npm run version-packages` (`changeset version`), num PR de versão revisado como qualquer outro. Editar o número à mão foi o que fez três conteúdos diferentes circularem como "3.0.0" (AUD-12).
- **O Release só roda depois da CI verde.** O gatilho é `workflow_run` do workflow `CI`, só para push no `main`, só do próprio repositório (nunca fork) e só com `conclusion == success`; ele faz checkout do commit exato que a CI aprovou e confere que esse commit está no histórico de `origin/main`. Não há gatilho manual que pule a CI.
- **Toda correção no pacote chega ao npm.** Como a CI exige changeset, cada mudança publicada vira entrada de CHANGELOG e entra na próxima versão.

### O que o workflow de release faz

A cada push no `main` com CI verde, o job decide um de três modos (o resumo da execução, em Actions, mostra qual):

| Situação no commit | Modo | O que acontece |
|---|---|---|
| Há arquivos em `.changeset/` | `pending` | Resume o plano (`changeset status --verbose`) e termina **com sucesso**. Nada é publicado, nenhum push, nenhum PR. |
| Nenhum changeset e a versão do `package.json` **não** está no npm | `publish` | Autentica no npm, roda `npm run release` (`build:ds` + `changeset publish`), confere `npm view @semec/ds@x.y.z`, envia a tag `@semec/ds@x.y.z` e cria a GitHub Release. |
| Nenhum changeset e a versão já está no npm | `noop` | Nada a fazer. |

A tag e a GitHub Release usam o `GITHUB_TOKEN` do próprio job (`contents: write`); tag não é bloqueada como PR. Se o push da tag ou a criação da Release falharem **depois** do publish, o job registra **aviso**, não erro: o pacote já está no npm e conferido. Para enviar a tag à mão, a partir do commit publicado:

```bash
git tag -a "@semec/ds@x.y.z" -m "@semec/ds@x.y.z" <sha-do-merge-do-PR-de-versão>
git push origin "refs/tags/@semec/ds@x.y.z"
```

Se houver changesets pendentes **e** a versão do `package.json` ainda não estiver no npm (ex.: um PR com changeset entrou entre o merge do PR de versão e o release), o job avisa (`::warning::`) e não publica. Ou se versiona de novo (a versão seguinte inclui tudo), ou se publica a versão atual pelo fallback local, abaixo.

### Pré-requisito da CI (mantenedores)

O workflow usa um secret do GitHub (Settings → Secrets and variables → Actions). Ele não fica no `env` do job: o `npm ci` roda sem token, e o secret só entra no passo de autenticação npm, e só no modo `publish`.

**`NPM_TOKEN`**:

| Campo | Valor |
|--------|--------|
| Nome do secret | `NPM_TOKEN` (exato) |
| Repo | este repositório (`SEMEC-PVH/SEMEC_design_system`) |
| Tipo de token npm | **Granular** (ou Automation), na conta mantenedora do scope `@semec` |
| Packages and scopes | `@semec` → **Read and write** |
| Bypass 2FA | **Sim**, se a conta tiver 2FA (senão o publish falha com E403) |

Sem esse secret (ou com token inválido), o job falha no passo de autenticação (`npm whoami`), mas só quando vai publicar. Depois de publicar, o workflow **verifica** se `npm view @semec/ds@x.y.z version` responde a versão do `package.json`.

O `RELEASE_TOKEN` (PAT cadastrado em 29/09/2026 para abrir os PRs de versão) **não é mais usado**. Um admin pode apagá-lo (`gh secret delete RELEASE_TOKEN -R SEMEC-PVH/SEMEC_design_system`) e revogar o PAT na conta de quem o criou.

### Fluxo de release

1. **Cada PR traz seu changeset.** Quem muda o pacote roda `npm run changeset`, escolhe `@semec/ds` e o tipo, e descreve a mudança em PT-BR citando a issue:
   - **patch** (3.0.0 → 3.0.1): correção de bug, a11y, contrato, ajuste de estilo
   - **minor** (3.0.0 → 3.1.0): componente, propriedade ou export novo; **depreciação** (ver "Depreciações anunciadas", abaixo)
   - **major** (3.x → 4.0.0): quebra de API, remoção de componente, mudança de export

   O arquivo (`.changeset/<nome>.md`) entra no mesmo PR. A CI (`changeset`) recusa o PR sem ele. Depois do merge, o Release roda em modo `pending` e não publica nada: os changesets se acumulam no `main`.

2. **Um mantenedor abre o PR de versão** quando decide lançar, a partir do `main` atualizado. A branch **precisa** começar com `changeset-release/`: o PR de versão mexe em `package.json` e `CHANGELOG.md` sem changeset (ele consome os changesets), e o check `changeset` da CI é pulado nessas branches.

   ```bash
   git switch main && git pull --ff-only
   npm ci
   git switch -c changeset-release/3.1.0     # o nome da versão que sairá
   npm run version-packages                  # changeset version + package-lock
   git add -A .changeset packages/react/package.json packages/react/CHANGELOG.md package-lock.json
   git commit -m "chore(release): versiona @semec/ds 3.1.0"
   git push -u origin changeset-release/3.1.0
   gh pr create --base main --title "chore(release): versiona @semec/ds 3.1.0" --body "Consome os changesets pendentes."
   ```

   O `version-packages` consome os arquivos de `.changeset/`, faz o bump em `packages/react/package.json`, escreve o `packages/react/CHANGELOG.md` e atualiza o `package-lock.json`. Confira o diff: a versão tem de ser a que o `changeset status` previa e o CHANGELOG tem de listar todos os changesets.

3. **Revisão e merge do PR de versão.** Outro mantenedor confere a versão e o CHANGELOG, aprova e mergeia, como qualquer PR, com CI verde e aprovação de code owner. Ninguém roda `version-packages` direto no `main`.

4. **Publicação.** Com a CI verde no commit do merge, o Release não encontra changesets pendentes, vê que a versão ainda não está no npm e publica (modo `publish`, tabela acima).

Se a publicação falhar (token expirado, npm fora do ar), corrija a causa e use **Re-run jobs** na execução do Release em Actions; ele refaz o checkout do mesmo commit aprovado. Se o publish já tiver acontecido, a nova execução cai em `noop`; envie a tag à mão, se ela faltar.

### Como conferir o que está no npm

```bash
npm view @semec/ds version        # última publicada (dist-tag latest)
npm view @semec/ds dist-tags
npx changeset status --verbose    # o que o próximo PR de versão vai consumir
npx changeset publish-plan        # o que um publish agora publicaria
```

### Fallback local (sem CI)

Se o `NPM_TOKEN` estiver indisponível, um mantenedor autenticado no npm pode publicar da raiz do monorepo — **só** a partir do `main` atualizado, com a CI verde e depois de mergeado o PR de versão (nunca com bump manual). Depois, envie a tag que o `changeset publish` cria localmente (`git push origin "refs/tags/@semec/ds@x.y.z"`):

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

A 2.0.0 e a 3.0.0 removeram coisas sem esse aviso (AUD-43; errata da 2.0.0 no [CHANGELOG](packages/react/CHANGELOG.md)). Para não repetir, toda remoção ou mudança incompatível segue estes passos:

1. **Anunciar numa minor.** O PR que deprecia traz changeset `minor` com uma linha que começa por `Depreciação:` dizendo o que sai, em que major, e o que usar no lugar. Em código: `@deprecated` no JSDoc (com o substituto) e, quando for uso em tempo de execução, um `console.warn` único em desenvolvimento (`process.env.NODE_ENV !== "production"`). Token CSS deprecado ganha comentário `/* @deprecated … */` no `tokens.css`.
2. **Registrar na tabela abaixo**, com a versão em que o aviso começou.
3. **Esperar duas minors.** Anunciado na 3.1.0, só pode sair a partir da 4.0.0 e depois de uma 3.2.0 publicada.
4. **Remover só na major**, com guia de migração no CHANGELOG (o que saiu, o que usar, exemplo `diff`).

### Depreciações anunciadas

Anúncio na **3.1.0** (onda 2 da auditoria de 14/10/2026), remoção ou mudança prevista para a **4.0.0** (onda 3). Até lá, tudo continua funcionando como hoje.

| O que muda na 4.0 | O que fazer desde já | Achado |
|---|---|---|
| **Saída por módulo e subpaths por componente.** O `dist/react` deixa de ser um bundle único; os componentes ganham `"use client"` e subpaths `@semec/ds/react/*`. O caminho interno de arquivos em `dist/` muda (e, com ele, possivelmente o `@source` do Tailwind, que vai constar no guia de migração). | Importe só pelos subpaths do `exports` (`@semec/ds/react`, `@semec/ds/react/validacao`, `@semec/ds/react/tokens.css`…), nunca por caminho de arquivo (`@semec/ds/dist/react/index.js`). | AUD-20 |
| **Contrato único de formulário** (ADR-015): `value` / `onValueChange` / `name` / `id` / `invalid`. Os `onChange(value)` de `Calendar`, `Combobox`, `DatePicker` e `InputOTP` e o `onChange(files)` de `FileUpload` saem; `onChange` passa a significar só o evento nativo. | Desde a **3.2.0** todos têm `onValueChange` (mesma assinatura) e `invalid`: troque `onChange(value)` por `onValueChange`. O `onChange(value)` avisa em desenvolvimento e continua valendo até a 4.0. Tabela por componente na emenda do [ADR-015](docs/adr/0015-formularios-api-controlada.md). | AUD-35 |
| **Primitivos L0 fora do `@theme`.** Os utilitários `bg-pv-*`, `text-pv-*`, `border-pv-*` (gerados de `--color-pv-*`) deixam de existir; as variáveis `--pv-*` continuam no `:root`. | Use os utilitários semânticos (`bg-primary`, `bg-brand-hero`, `text-foreground`, `bg-success-surface`…). Primitivo não é para uso direto. | AUD-55 |
| **Escala de raio decidida.** Os valores de `rounded-sm` (hoje 2px) e `rounded-lg` (hoje 12px, igual ao `rounded-xl` do Tailwind) podem mudar, e os nomes L1 deixam de ser autorreferentes. | Escolha o raio pelo papel (`rounded-md` em controles, `rounded-lg` em cartões, `rounded-full` em pílulas), não pelo valor em px, e não fixe `rounded-[12px]`. | AUD-57 |
| **Button `loading` e estado desabilitado.** O `Button` ganha `loading` (`aria-busy`) e o desabilitado pode passar de `disabled` nativo para `aria-disabled` (o botão continua focável e o componente bloqueia o clique). | Não dependa de `:disabled` em CSS nem de `button.disabled` em testes para o `Button` do kit; teste pelo papel e pelo nome acessível. | AUD-63 |

Se você mantém um desses pontos no código, o `@deprecated` (JSDoc) e o aviso em desenvolvimento entram no PR que fizer a mudança aditiva correspondente; esta tabela é o registro oficial do aviso até lá.

---

## Decisões estruturais

Mudança estrutural entra como **ADR novo** em [`docs/adr/`](docs/adr/README.md) — copiado do [TEMPLATE.md](docs/adr/TEMPLATE.md), com o próximo número livre e uma linha nova no índice. Nunca como edição silenciosa de um ADR existente ou da documentação.

Se sua proposta esbarrar em algo que ninguém decidiu ainda, é provável que já esteja catalogado em [**questões em aberto**](docs/questoes-abertas.md). Nesse caso, a contribuição certa costuma ser ajudar a fechar a questão — não escolher sozinho, no código, uma resposta que o repositório inteiro vai herdar.

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
