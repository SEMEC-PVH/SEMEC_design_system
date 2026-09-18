---
adr: 22
titulo: "Publicação no npm público e pacote unificado @semec/ds"
status: Aceito
data: 2026-09-17
substitui: [7, 21]
---

# ADR-022 — Publicação no npm público e pacote unificado `@semec/ds`

**Status:** Aceito (17/09/2026).

**Substitui.** [ADR-007](0007-distribuicao-registry-npm-gitea.md) (registry Gitea) e [ADR-021](0021-estado-da-distribuicao-copiavel-antes-do-registry.md) (kit copiável antes do registry).

**Contexto.** O ADR-007 definiu publicar sob o escopo `@semec` no registry npm do Gitea institucional. Essa publicação nunca aconteceu: o registry não foi confirmado (QA-06 pendente), o repositório remoto é o GitHub, e a adoção externa (conselhos regionais, outros municípios) esbarra na impossibilidade de instalar de um registry institucional inacessível. Enquanto isso, o kit só é consumível por cópia direta ou workspace local, o que impede versionamento real, atualização controlada e adoção por terceiros.

**Decisão.** Publicar o pacote unificado **`@semec/ds`** no **npm público**, com subpath exports granulares:

| Subpath | Conteúdo |
|---------|----------|
| `@semec/ds/react` | Componentes React (barrel) |
| `@semec/ds/react/tokens.css` | Tokens CSS (L0 + L1 + dark theme) |
| `@semec/ds/react/shadcn.css` | Variáveis shadcn HSL |
| `@semec/ds/react/pv-preset.ts` | Preset Tailwind v4 |
| `@semec/ds/skills` | Manifest + helpers para agentes |
| `@semec/ds/skills/llms.txt` | Índice leve para LLMs |
| `@semec/ds/skills/llms-full.txt` | Dump completo (~119KB) |
| `@semec/ds/skills/manifest.json` | JSON para consumo por máquinas |
| `@semec/ds/skills/components/*.md` | Chunks RAG por componente |

Build via tsup (ESM + dts), CI/CD via GitHub Actions, versionamento via Changesets com SemVer estrito. Tokens CSS permanecem embutidos no pacote nesta fase; separação em `@semec/ds-tokens` fica para quando houver consumidor CSS-only (ver [ADR-002](0002-monorepo-pnpm-multiplos-pacotes.md)).

**Alternativas descartadas.**
- *Registry Gitea institucional (ADR-007)*: blockado desde agosto/2026 pela QA-06; inaccessible para adotantes externos.
- *GitHub Packages*: resolveria o imediato mas exige autenticação GitHub para instalar, o que cria atrito para conselhos regionais e municípios sem conta GitHub.
- *Verdaccio no Portainer da SMTI*: infraestrutura adicional para manter sem benefício claro sobre npm público.
- *Separar `@semec/ds-react` + `@semec/ds-skills` em dois pacotes*:complexidade de manutenção sem ganho — os skills são markdown puro e não pesam no bundle.
- *47 pacotes individuais (`@semec/button`, etc.)*: overhead de manutenção desproporcional; tree-shaking resolve o problema de bundle size com pacote único.

**Consequências.**
- Código institucional fica público no npm. Como o repositório já é público no GitHub, o risco incremental é mínimo.
- Adotantes externos podem instalar com `npm install @semec/ds` sem configuração de registry.
- O scope `@semec` no npm precisa ser registrado (gratuito para Organizações npm).
- Publicações acidentais de código sensível são mitigadas por CI com lint + typecheck + build antes de publish.
- O ADR-007 e o ADR-021 passam a `Substituído`.
