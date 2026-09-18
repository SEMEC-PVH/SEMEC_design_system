---
adr: 7
titulo: "Distribuição pelo registry npm do Gitea institucional, versionada com Changesets"
status: Substituído por 022
substituido_por: 22
data: 2026-08-20
---

# ADR-007 — Distribuição pelo registry npm do Gitea institucional, versionada com Changesets

**Status:** Substituído por [ADR-022](0022-publicacao-npm-publico.md).

**Contexto.** O código não pode sair da infraestrutura da prefeitura, e os projetos precisam atualizar de forma controlada.

**Decisão.** Publicar sob o escopo `@semec` no registry npm do Gitea (`git.portovelho.ro.gov.br`), com SemVer estrito, canais `latest` e `next`, e changelog gerado por Changesets. Token de publicação exclusivo do CI.

**Alternativas descartadas.** npm público (código institucional exposto e dependência externa); Git submodule ou dependência via URL (sem versionamento real); estilo shadcn com cópia de código (correções não propagam).

**Consequências.** O Gitea suporta nativamente registry npm com pacotes escopados, dist-tags e autenticação por token — confirmado na documentação oficial. Resta verificar se o recurso de pacotes está habilitado na instância da prefeitura e sob qual owner. Republicar a mesma versão é bloqueado pelo registry, o que reforça o SemVer estrito. Plano B: Verdaccio no Portainer da SMTI, ou tarballs anexados a releases do Gitea.
