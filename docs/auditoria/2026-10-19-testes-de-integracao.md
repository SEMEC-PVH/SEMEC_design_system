# Testes de integração do @semec/ds — consolidado (19/10/2026)

Pacote: `npm pack` da branch `fix/pendencias-4.2` (futura 4.2.1; o tarball diz 4.2.0 porque o changeset não foi aplicado).
Pergunta: qualquer sistema consegue implementar o design system?

Relatórios por frente (anexos, com passos e evidências): [A — sem React](2026-10-19-integracao/a-sem-react.md), [B1 — React fora do padrão](2026-10-19-integracao/b1-react-fora-do-padrao.md), [B2 — outros frameworks](2026-10-19-integracao/b2-outros-frameworks.md), [C — regressão Next/Vite](2026-10-19-integracao/c-regressao-next-vite.md), [D — agente de IA](2026-10-19-integracao/d-agente-ia.md). Os caminhos `C:\dev\semec-int\…` citados neles são da máquina onde os testes rodaram.

## Resposta curta

- **React 19 + Tailwind v4 (caminho oficial): sim, sem ressalva relevante.** Next 16, Vite 8, React Router 7, TanStack Start, Astro, Webpack 5 e pnpm estrito: build, hidratação, axe 0, teclado completo, 320–1280 px. Os 21 achados antigos não voltaram.
- **React fora do padrão: funciona em runtime, trava no empacotamento.** React 18 roda 48/48 componentes, mas o peer `^19` barra a instalação; `require`/CommonJS falha; Tailwind v3 e projetos sem Tailwind ficam sem estilo ou com buracos.
- **Sem React (PHP, Django/Flask, Vue, Angular, HTML): só os tokens.** Fontes, variáveis e foco funcionam, axe 0, mas não há receita nem CSS de componentes; o resultado é acessível e não parece o mesmo sistema (~70% de fidelidade visual).
- **Fora da web (mobile, Figma, back-end): não atende.** Não existe `tokens.json`/DTCG.
- **Agente de IA: bom em React (~95% certo de primeira), fraco fora dele** pela mesma falta de receitas.

## Matriz

| Sistema | Resultado | Bloqueio principal |
|---|---|---|
| Next 16 (Turbopack, webpack, export) | ✅ | — |
| Vite + React 19 | ✅ | — |
| React Router 7 SSR · TanStack Start · Astro (ilha) | ✅ | template do RR7 sobrescreve fonte/dark (B2-07) |
| Webpack 5 puro | ✅ | — |
| pnpm estrito | ✅ | — |
| Parcel 2 | ⚠️ | exige `packageExports: true`, não documentado (B2-06) |
| Monorepo / Astro com `@source` literal | ⚠️ | caminho errado falha em silêncio (B2-05) |
| Yarn 4 PnP | ❌ | `@source` não acha o pacote (B2-04) |
| CSP estrita com SSR | ❌ | `style` do Radix bloqueado; Toast cobre o cabeçalho (B2-01/02/03/08) |
| React 18 | ⚠️ | peer `^19`; `inert` da Sidebar (B1-01/02) |
| Tailwind v3 | ⚠️ | preset incompleto, 89 classes faltando (B1-04/05) |
| React sem Tailwind | ❌ | sem CSS pré-compilado (B1-06) |
| CommonJS / Jest | ❌ / ⚠️ | exports só `import` (B1-07/08) |
| TS `node10` / `node16`+CJS | ❌ / ⚠️ | (B1-09/10) |
| HTML puro, PHP, Flask, Vue, Angular | ⚠️ | tokens ok; sem receitas/CSS de componente (A-02/03/04, D-01) |
| CDN (unpkg/jsDelivr) | ⚠️ | só pelo caminho `dist/`, não documentado (A-12) |
| Mobile / Figma / back-end | ❌ | sem tokens em JSON (A-09) |

## Contagem (54 achados válidos)

| Frente | Alto | Médio | Baixo | Total |
|---|---|---|---|---|
| A sem React | 3 | 7 | 4 | 14 |
| B1 React fora do padrão | 4 | 4 | 3 | 11 |
| B2 frameworks | 2 | 4 | 2 | 8 |
| C regressão | 0 | 1 | 2 | 3 |
| D agente de IA | 1 | 7 | 10 | 18 |

Nenhum bloqueante. Descartados como efeito do próprio teste (pacote gerado sem `changeset version`): INT-C-02 e o aviso "Não publicado" do INT-D — o aviso só aparece com changesets pendentes e o `version-packages` regenera os artefatos.

Achados repetidos entre frentes (contados uma vez na proposta abaixo): `@hookform/resolvers@6` quebra a receita (C-01 = D); falta receita/CSS de componente (A-02 = A-03 = D-01 = B1-06); `require` (A-11 ⊂ B1-07).

## Proposta de ondas

### Onda 0 — entra na 4.2.1 (patch, antes de publicar)

Correções de a11y e de doc, sem mudança de contrato.

1. **A-01** foco branco sobre fundo claro (1,08:1) com `bg-brand-hero` sem Tailwind — WCAG, ADR-014.
2. **B2-01** `ToastViewport` com `pointer-events-none` e `Toast` com `pointer-events-auto` (não depender do `style` do Radix).
3. **B2-02** regra estática no `tokens.css` para esconder o input nativo de apoio do Radix sob CSP.
4. **B2-08** nonce chegar ao `<style>` do Select (ou corrigir o JSDoc do `SemecProvider`).
5. **C-01** fixar `@hookform/resolvers@5 zod@4` no README, SKILL e `.md`.
6. README: Parcel (`packageExports`), Yarn PnP, tabela de `@source` com monorepo/Astro e a dica "~14 kB de CSS = `@source` errado", CSP com SSR e nonce fora do Next, `output: 'export'`, bloco React Router 7/Remix, Jest, CDN, onde fica a skill, ligar Select/Radio/Checkbox/FileUpload ao React Hook Form, Providers por subpath.
7. Pendências da regressão: DIG-04 (link aponta para `main`), DIG-05 (exemplos de Checkbox/Radio nos `.md`), C-04 (`orgName` padrão do HeaderBrand).
8. Artefatos: erros pequenos do D (`next/link` em `botoes.md`, import de `FormField` em `menu-de-selecao.md`, link relativo, `reset()` com Select/Radio/Checkbox, rolagem da tabela sem parada de Tab); `docs/arquitetura.md` diz "ESM+CJS" (B1-11).

### Onda 1 — 4.3.0 (minor, empacotamento e tokens portáveis)

1. Condição `default` no `exports` (resolve `require` no Node 22+); build CJS real só com ADR (risco de duas cópias).
2. `source.css` com `@source` relativo ao próprio pacote + `"preferUnplugged": true` — acaba com o caminho manual (B2-04/05).
3. `variables.css` só com variáveis, sem `@theme` e sem reset (A-05/07).
4. `tokens.json` DTCG gerado do CSS (A-09; protótipo em `a-sem-react/c5-node/gerar-dtcg.mjs`) e `dsTokens` completo (A-10).
5. Receitas de classes por componente geradas do `cva` na SKILL lite (A-02/03/04, D-01).
6. `pv-preset` alinhado ao `@theme` e caminho Tailwind v3 documentado (B1-04/05).
7. Peer `react ^18.3 || ^19` + correção do `inert` da Sidebar (B1-01/02).
8. `typesVersions` para TS `node10` (B1-09).

### Onda 2 — estrutural (decisão de produto)

| Item | Custo estimado |
|---|---|
| CSS de componentes compilado (`@semec/ds-css`, ADR-004) — atende sem React e sem Tailwind | 5–8 dias (10 primeiros) |
| Parciais oficiais Jinja / Blade / PHP | 2–3 dias |
| Pacote leve sem React/Radix como dependência | 1 dia |
| Saídas mobile e Figma do ADR-003 | 3–5 dias |
| Web Components (opcional) | 3–4 semanas |

## Issues

Label `integracao-2026-10`. Próprias (altos): #63, #64 (4.2.1); #65, #66, #67, #68, #69, #70, #71 (4.3.0). Épicos: #72 (onda 0, 4.2.1), #73 (onda 1, 4.3.0), #74 (onda 2, sem milestone).
