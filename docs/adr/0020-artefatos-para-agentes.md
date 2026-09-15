---
adr: 20
titulo: "Artefatos para agentes de IA como entrega oficial"
status: Aceito
data: 2026-09-15
---

# ADR-020 — Artefatos para agentes de IA como entrega oficial

**Status:** Aceito (15/09/2026).

**Contexto.** O repositório passou a gerar, para consumo por agentes de IA, um conjunto de artefatos — `llms.txt`, `llms-full.txt`, `manifest.json` e um `.md` por componente — além de skills para Claude e OpenCode. Eles nasceram de forma incremental, sem uma decisão que os reconhecesse como parte oficial do design system, e corriam o risco de divergir do código (a contagem de componentes, por exemplo, já ficou presa em "26" enquanto o kit tinha 32).

**Decisão.** Os artefatos para agentes são **entrega oficial** do repositório e são **gerados** de uma fonte única, `packages/react/manifest.js`, por `apps/docs/scripts/generate-llms.mjs` (executado no `prebuild`). São publicados junto do site, em `apps/docs/public/`:

- `llms.txt` — índice leve (categorias + componentes + uso).
- `llms-full.txt` — dump completo (tokens + todos os componentes + prompts).
- `manifest.json` — JSON com componentes, variantes, uso e prompt.
- `components/<slug>.md` — um arquivo por componente (chunk para RAG).

Nenhum desses arquivos é editado à mão; a edição acontece na fonte (`manifest.js` e o código dos componentes). A contagem de componentes é sempre derivada, nunca fixada no gerador.

**Alternativas descartadas.**
- *Manter como artefato informal*: foi o que gerou a divergência de contagem e de nomes.
- *Servidor MCP dedicado agora*: evolução natural, mas depende de publicação de pacote; fica para depois (ver [ADR-021](0021-estado-da-distribuicao-copiavel-antes-do-registry.md)).

**Consequências.** Toda mudança de componente deve refletir no metadado, e os artefatos regenerados entram no mesmo PR. `manifest.js` vira contrato: além dos agentes, alimenta as páginas do site e, no futuro, o registry shadcn.
