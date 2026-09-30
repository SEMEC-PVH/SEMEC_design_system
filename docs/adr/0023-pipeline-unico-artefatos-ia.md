---
adr: 23
titulo: "Pipeline único de artefatos de IA e skills canônicas"
status: Aceito
data: 2026-09-30
substitui_em_parte: [20]
---

# ADR-023 — Pipeline único de artefatos de IA e skills canônicas

**Status:** Aceito (30/09/2026).

**Contexto.** O ADR-020 fixou `packages/react/manifest.js` como fonte única e `apps/docs/scripts/generate-llms.mjs` como gerador dos artefatos publicados no site. Em paralelo, `packages/react/scripts/build-skills.mjs` passou a gerar uma cópia paralela em `dist/skills/` e `dist/lite/`, com schema, versão e textos de instalação divergentes. O conteúdo das skills ficou espalhado em `SKILL.md`, `SEMEC-SKILL.md` e cópias em `public/`, com nomes de frontmatter inconsistentes (`semec-ds` vs `semec-ds-skill`). O `llms.txt` referenciava `.claude/skills/semec-ds/` e `.opencode/skills/semec-ds/` que não existiam no conteúdo.

**Decisão.**

1. **Pipeline único.** `packages/react/scripts/build-artifacts.mjs` é o único gerador de artefatos de IA. Ele importa `packages/react/manifest.js` e publica em três targets:
   - `dist` — `dist/skills/*` e `dist/lite/*` (subpath exports npm);
   - `docs-public` — `apps/docs/public/{llms.txt,llms-full.txt,manifest.json,components/*,skills/*}`;
   - `agent-dirs` — `.claude/skills/semec-ds/SKILL.md` e `.opencode/skills/semec-ds/SKILL.md`.

2. **Schema unificado.** Todos os `manifest.json` usam `version` lida de `packages/react/package.json`, `install` no formato npm (`@semec/ds`) e componentes com `prompt`. O variant `docs-public` acrescenta `url` e `md` com caminhos do site.

3. **Duas skills canônicas**, fontes em `packages/react/skills/`:
   - `semec-ds` — full: instalação, tokens, componentes React, prompts, a11y, responsive, regras, crédito;
   - `semec-ds-lite` — lite: tokens + WCAG + responsive + padrões sem React.
   Skill por categoria fica para fase futura (os `components/<slug>.md` já servem de chunk RAG).

4. **Nomenclatura.** Frontmatter `name: semec-ds` e `name: semec-ds-lite`. Aliases temporários de export: `./skills/ds-semec-skill` → full; `./lite/skills/ds-semec-skill` → lite.

5. **Consumidores.** `apps/docs` roda o target `docs-public` no `prebuild`. O `CopySkillButton` busca `/skills/semec-ds/SKILL.md`. Root `generate:llms` vira alias de `build:skills` do workspace `@semec/ds`.

**Alternativas descartadas.**
- *Manter dois pipelines alinhando schema*: custo de manutenção duplo e risco de nova divergência.
- *Skill por categoria agora*: mais arquivos e frontmatter sem ganho imediato de pipeline.
- *Remover as referências de skill do llms.txt*: os dirs `.claude`/`.opencode` passam a ser populados no build.

**Consequências.** Artefatos e skills são gerados; a edição acontece em `manifest.js` e em `packages/react/skills/*/SKILL.md`. O ADR-020 permanece válido quanto à “entrega oficial” e à fonte única; o gerador e o surface de skills passam a ser os deste ADR. Mudanças de componente ou de skill devem regenerar os artefatos no mesmo PR.
