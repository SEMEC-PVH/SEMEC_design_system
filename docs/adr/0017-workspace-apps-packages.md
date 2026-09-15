---
adr: 17
titulo: "Workspace npm com apps/ e packages/"
status: Aceito
data: 2026-09-15
---

# ADR-017 — Workspace npm com `apps/` e `packages/`

**Status:** Aceito (15/09/2026). Substitui o [ADR-002](0002-monorepo-pnpm-multiplos-pacotes.md).

**Contexto.** O repositório nasceu como site de documentação e ganhou um kit de componentes (`base/`) e artefatos para agentes sem que a estrutura acompanhasse. O resultado era ambíguo para quem chegava: site, kit e documentação misturados na raiz, sem separar o que é produto do que é ferramenta. O [ADR-002](0002-monorepo-pnpm-multiplos-pacotes.md) já previa um monorepo com múltiplos pacotes, mas isso nunca foi implementado e o gerenciador escolhido (pnpm) nunca foi adotado.

**Decisão.** Adotar um **workspace npm** (npm workspaces), com duas raízes:

- `apps/` — aplicações consumidoras, começando por `apps/docs` (o site de documentação).
- `packages/` — bibliotecas publicáveis, começando por `packages/react` (`@semec/ds-react`).

A raiz do repositório guarda apenas o `package.json` do workspace e scripts que delegam para os workspaces (`dev`, `build`, `lint`, `generate:llms`, `proto:css`). O alvo de múltiplos pacotes do ADR-002 permanece; o que muda é o gerenciador (npm em vez de pnpm) e a primeira concretização (um pacote agora, `@semec/ds-react`, com tokens e config embutidos — ver [ADR-018](0018-pacote-componentes-ds-react.md)).

**Alternativas descartadas.**
- *Manter tudo na raiz*: o problema de compreensão que motivou esta decisão; site, kit e docs indistinguíveis.
- *pnpm workspaces (ADR-002)*: exigiria trocar lockfile e ferramental sem ganho imediato; o npm já atende e reduz o atrito de adoção.
- *Repositórios separados*: versionamento cruzado difícil de manter, já descartado no ADR-002.

**Consequências.** A raiz passa a ser um workspace; cada pacote tem seu `package.json`. Publicar um pacote novo ou um app novo é criar um diretório sob `packages/` ou `apps/`. Scripts da raiz delegam, então o fluxo de quem chega não muda (`npm run build` na raiz continua funcionando). Exige disciplina: dependência compartilhada deve ser declarada no workspace que a usa, não na raiz. Fica para depois separar `@semec/ds-tokens`, `@semec/ds-css`, `@semec/ds-icons` e `@semec/ds-charts` (ver [ADR-018](0018-pacote-componentes-ds-react.md)).
