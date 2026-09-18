---
adr: 21
titulo: "Estado da distribuição: kit copiável antes do registry"
status: Substituído por 022
data: 2026-09-15
substituido_por: 22
---

# ADR-021 — Estado da distribuição: kit copiável antes do registry

**Status:** Substituído por [ADR-022](0022-publicacao-npm-publico.md).

**Contexto.** O [ADR-007](0007-distribuicao-registry-npm-gitea.md) definiu publicar os pacotes sob o escopo `@semec` no registry npm do Gitea institucional. Essa publicação nunca aconteceu: o registry não foi confirmado e o remoto atual do repositório é o GitHub. Enquanto isso, o kit `@semec/ds-react` já é consumível por workspace (`import { Button } from "@semec/ds-react"`) ou copiando `packages/react/` para o projeto.

**Decisão.** A distribuição **vigente** é o kit copiável/workspace, com o pacote marcado `private: true`. A publicação no registry permanece o **alvo**, condicionada à verificação do [ADR-007](0007-distribuicao-registry-npm-gitea.md) (QA-06). Quando a publicação for habilitada, ela entra como ADR novo (ou atualização do ADR-007) e remove o `private`.

**Alternativas descartadas.**
- *Publicar em npm público agora*: código institucional exposto e dependência externa, já descartado no ADR-007.
- *Publicar no GitHub Packages*: resolveria o imediato, mas contraria a restrição de manter o código na infraestrutura da prefeitura; fica como plano B se o Gitea não habilitar.
- *Não distribuir até o registry existir*: travaria a adoção; a cópia já entrega valor e é o que o [caminho de adoção](../adocao.md) pressupõe.

**Consequências.** O consumo é por cópia ou workspace, e a atualização é manual (não há SemVer efetivo nem changeset enquanto não publicar). A governança da Parte 2 do [CONTRIBUTING](../../CONTRIBUTING.md) só passa a valer com a publicação. Este ADR deve ser revisto assim que a QA-06 for respondida.
