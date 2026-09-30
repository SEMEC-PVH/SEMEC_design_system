# Objetivo do repositório

> Documento canônico. Se houver divergência entre este arquivo e qualquer outro, vale o que está aqui — e o outro arquivo está desatualizado.

## O que é

O repositório do **Design System da SEMEC** (Secretaria Municipal de Economia de Porto Velho). Ele reúne, num só lugar:

1. **O kit de componentes** `@semec/ds` (`packages/react/`) — 47 componentes React + Tailwind CSS v4 + shadcn (Radix + CVA), tokens `pv-*` e tema claro (o dark theme do site de documentação vive no CSS do app, não nos tokens do pacote — removido em 2.0.0).
2. **O site de documentação** (`apps/docs/`) — Next.js 16 com export estático, que publica os fundamentos, componentes e padrões e serve os artefatos para agentes.
3. **Os artefatos para agentes de IA** (`apps/docs/public/`) — `llms.txt`, `llms-full.txt`, `manifest.json`, skills e um `.md` por componente, gerados a partir de uma fonte única (`packages/react/manifest.js`) pelo pipeline `build-artifacts.mjs` ([ADR-023](adr/0023-pipeline-unico-artefatos-ia.md)).

## Fase atual

O kit é **publicado no npm público** desde 17/09/2026 ([ADR-022](adr/0022-publicacao-npm-publico.md)), na versão **2.1.0**, sob o nome `@semec/ds`. O consumo é via `npm install @semec/ds` (subpath exports: `/react`, `/skills`, `/lite/skills`, tokens CSS e preset Tailwind).

Não há Storybook, suíte de testes automatizados nem CI de acessibilidade. O site é export estático e a publicação é via GitHub Pages ([workflow](../.github/workflows/deploy-pages.yml)).

## O que este repositório não é

- **Não é um framework de aplicação.** O design system entrega interface, não roteamento, estado ou autenticação.
- **Não é a implementação do portal `semec-digital`.** Os demos do site são réplicas visuais para documentação; a fonte de verdade da implementação de um produto é o repositório daquele produto.
- **Não absorve regras de negócio.** Nenhum componente conhece "contrato", "IPTU" ou "secretaria".

## Estrutura do repositório

```
/
├── apps/
│   └── docs/              Site de documentação (Next.js, export estático)
│       ├── app/           Rotas, layout, tokens do site, fontes, proto/
│       ├── components/    Casca da docs (docs/), demos e blocos de UI
│       ├── lib/           Helpers do site (navegação, clipboard, busca)
│       └── public/        Artefatos GERADOS para IA + proto.css
├── packages/
│   └── react/             Kit @semec/ds (tokens + componentes)
│       ├── src/           components/ + lib/ + skills/ + index.ts
│       ├── skills/        Skills canônicas semec-ds + semec-ds-lite
│       ├── scripts/       build-artifacts.mjs (pipeline único de artefatos IA)
│       ├── manifest.js    Fonte única de metadados/uso/prompt
│       └── tokens.css · pv-preset.ts
├── docs/                  Decisões: objetivo, arquitetura, ADRs, auditorias
├── legacy/                Somente README (conteúdo removido em 15/09/2026)
└── package.json           Raiz do workspace npm
```

### Quatro blocos, quatro papéis

| Bloco | Onde | Papel |
|---|---|---|
| **Design system** | `packages/react/` | O produto: tokens + componentes. |
| **Documentação de uso** | `apps/docs/` | O site que explica e demonstra o sistema. |
| **Artefatos para IA** | `apps/docs/public/` + `packages/react/manifest.js` | Consumo por agentes (manifest, llms, md por componente). |
| **Decisões** | `docs/` | Por que o sistema é assim: ADRs, arquitetura, auditorias, questões abertas. |

> Distinção que mais confunde quem chega: em `docs/`, **estado atual** é o que existe em código; **estado-alvo** é o que se pretende construir. Ver [docs/README.md](README.md).

## Como rodar

Requer Node >= 22. Na raiz:

```bash
npm install       # instala o workspace (apps/* e packages/*)
npm run dev       # site de docs em http://localhost:3000
npm run build     # gera artefatos de IA (prebuild) + export estático em apps/docs/out
npm run lint      # ESLint do site
npm run proto:css # compila o CSS isolado dos componentes (public/proto/proto.css)
```

Usar o kit num projeto novo:

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@semec/ds/react";

<Button variant="primary">Salvar</Button>
```

## Decisões estruturais

As decisões que definem este repositório estão nos [ADRs](adr/README.md). As principais, para quem chega agora:

- [ADR-016](adr/0016-conteudo-em-portugues-codigo-em-ingles.md) — conteúdo PT-BR, código EN.
- [ADR-012](adr/0012-tema-por-atributo-de-dados.md) — tema por `data-theme`.
- [ADR-014](adr/0014-wcag-21-aa-criterio-bloqueante.md) — WCAG 2.1 AA como critério bloqueante.
- [ADR-017](adr/0017-workspace-apps-packages.md) — workspace `apps/` + `packages/`.
- [ADR-018](adr/0018-pacote-componentes-ds-react.md) — registro histórico do pacote de componentes; o **nome vigente**, desde o [ADR-022](adr/0022-publicacao-npm-publico.md), é `@semec/ds`.
- [ADR-019](adr/0019-documentacao-no-site-storybook-adiado.md) — documentação no site, Storybook adiado.
- [ADR-020](adr/0020-artefatos-para-agentes.md) — artefatos para agentes como entrega oficial.
- [ADR-022](adr/0022-publicacao-npm-publico.md) — publicação no npm público e pacote unificado `@semec/ds` (substitui ADR-007 e ADR-021).
- [ADR-023](adr/0023-pipeline-unico-artefatos-ia.md) — pipeline único de artefatos de IA (`build-artifacts.mjs`) e skills canônicas.

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
