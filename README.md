# SEMEC Design System

Monorepo do **Design System da SEMEC** — Secretaria Municipal de Economia da Prefeitura de Porto Velho.

Ele reúne três coisas:

- **`packages/react/`** — o kit de componentes **`@semec/ds-react`** (32 componentes React + Tailwind CSS v4 + shadcn/Radix/CVA, tokens `pv-*`, tema claro/escuro via `data-theme`).
- **`apps/docs/`** — o **site de documentação** (Next.js 16, export estático), que publica fundamentos, componentes e padrões.
- **`apps/docs/public/`** — os **artefatos para agentes de IA** (`llms.txt`, `llms-full.txt`, `manifest.json`, um `.md` por componente), gerados de uma fonte única.

> **Objetivo completo, fase atual e o que este repositório não é:** [`docs/objetivo.md`](docs/objetivo.md).

## Estrutura

```
apps/docs/       Site de documentação (Next.js) + artefatos gerados para IA
packages/react/  Kit @semec/ds-react (tokens + 32 componentes) + manifest.js
docs/            Decisões: objetivo, arquitetura, ADRs, auditorias, questões abertas
legacy/          Versão anterior do guia + MIV da PMPV (a limpar)
```

## Como rodar

Requer Node >= 20. Na raiz (workspace npm):

```bash
npm install
npm run dev        # site em http://localhost:3000
npm run build      # artefatos de IA (prebuild) + export estático em apps/docs/out
npm run lint       # ESLint do site
npm run proto:css  # CSS isolado dos componentes (apps/docs/public/proto/proto.css)
```

## Usar o kit

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@semec/ds-react";

<Button variant="primary">Salvar</Button>
```

Por workspace (`@semec/ds-react` já está ligado no monorepo) ou copiando `packages/react/` para o projeto. Publicação em registry npm ainda não ocorreu — ver [ADR-021](docs/adr/0021-estado-da-distribuicao-copiavel-antes-do-registry.md).

## Para agentes de IA

Comece por `apps/docs/public/llms.txt` (índice) ou `apps/docs/public/manifest.json` (JSON com todos os componentes e prompts). A fonte única é `packages/react/manifest.js`; regenere com `npm run generate:llms` (roda no `prebuild`).

## Decisões

O porquê de cada escolha está nos [ADRs](docs/adr/README.md). O que ainda não foi decidido está em [questões abertas](docs/questoes-abertas.md). Como contribuir: [CONTRIBUTING.md](CONTRIBUTING.md).

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
