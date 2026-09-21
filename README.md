# SEMEC Design System

Monorepo do **Design System da SEMEC** — Secretaria Municipal de Economia da Prefeitura de Porto Velho.

Ele reúne três coisas:

- **`packages/react/`** — o pacote npm **`@semec/ds`** (componentes React + Tailwind CSS v4 + shadcn/Radix/CVA, tokens `pv-*`, tema claro/escuro via `data-theme`).
- **`apps/docs/`** — o **site de documentação** (Next.js 16, export estático), que publica fundamentos, componentes e padrões.
- **`packages/react/manifest.js`** — a **fonte única** para artefatos de IA (`llms.txt`, `manifest.json`, `components/*.md`), gerados automaticamente no build.

> **Objetivo completo, fase atual e o que este repositório não é:** [`docs/objetivo.md`](docs/objetivo.md).

## Estrutura

```
apps/docs/        Site de documentação (Next.js) + artefatos gerados para IA
packages/react/   Kit @semec/ds (tokens + componentes) + manifest.js
docs/             Decisões: objetivo, arquitetura, ADRs, auditorias, questões abertas
legacy/           Versão anterior do guia + MIV da PMPV (a limpar)
```

## Como rodar

Requer Node >= 20. Na raiz (workspace npm):

```bash
npm install
npm run dev          # site em http://localhost:3000
npm run build        # artefatos de IA (prebuild) + export estático em apps/docs/out
npm run build:ds     # build do pacote @semec/ds (tsup + build-skills)
npm run typecheck    # verifica tipos do pacote
npm run lint         # ESLint do site
npm run proto:css    # CSS isolado dos componentes
```

## Instalar o kit

```bash
npm install @semec/ds
```

```tsx
// Importar tokens
import "@semec/ds/react/tokens.css";
import "@semec/ds/react/shadcn.css";

// Usar componentes
import { Button, Card, CardHeader, CardTitle, CardContent } from "@semec/ds/react";

<Button variant="primary">Salvar</Button>
```

### Subpath exports

| Import | O que é |
|---|---|
| `@semec/ds/react` | Todos os componentes + `cn()` |
| `@semec/ds/react/tokens.css` | Tokens `pv-*` (primitivos + semânticos) |
| `@semec/ds/react/shadcn.css` | Variáveis shadcn HSL |
| `@semec/ds/react/pv-preset` | Preset Tailwind v4 (JS) |
| `@semec/ds/react/server` | Helpers Node.js |
| `@semec/ds/skills` | Manifest + componentes para agentes IA |
| `@semec/ds/skills/llms.txt` | Índice para IA |
| `@semec/ds/skills/manifest.json` | JSON completo para máquinas |
| `@semec/ds/skills/components/*.md` | Chunk RAG por componente |

## Publicação

O pacote é publicado automaticamente no npm sempre que há mudanças na branch `main`:

1. Crie um changeset: `npm run changeset`
2. Escolha patch/minor/major e descreva a mudança
3. Faça commit e push para `main`
4. A CI publica automaticamente no npm

Detalhes completos: [CONTRIBUTING.md](CONTRIBUTING.md).

## Para agentes de IA

Comece por `@semec/ds/skills/llms.txt` (índice) ou `@semec/ds/skills/manifest.json` (JSON com todos os componentes e prompts). A fonte única é `packages/react/manifest.js`.

## Decisões

O porquê de cada escolha está nos [ADRs](docs/adr/README.md). O que ainda não foi decidido está em [questões abertas](docs/questoes-abertas.md). Como contribuir: [CONTRIBUTING.md](CONTRIBUTING.md).

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
