# @semec/ds

## 3.0.0

> **Errata (registrada em 14/10/2026, auditoria AUD-11, #25).** O item "Build com `splitting: true` (ESM por módulo) para poda de árvore" desta versão **não corresponde ao que foi publicado**. O texto original foi mantido, riscado, logo abaixo. Estado real da 3.0.0 (que continua valendo na 3.1.0):
>
> - O `dist/react/index.js` é **um bundle único** (sem chunks por módulo). Importar uma só peça, como `maskCPF`, carrega o kit inteiro. Não há poda de árvore por componente.
> - O `dist` **não tem a diretiva `"use client"`**: importar `@semec/ds/react` num Server Component (Next.js App Router) falha.
> - **O que fazer:** no Next App Router, importe o kit só em arquivos `"use client"` (componentes e providers, como `<Toaster />`). Em Vite/SPA nada muda.
> - **Correção técnica:** saída por módulo e `"use client"` por componente estão planejados para uma versão futura (AUD-20).

### Major Changes

- Schemas Zod saem do entry principal: use `@semec/ds/react/validacao` (`cpfSchema`, `cnpjSchema`, `cpfCnpjSchema`, `emailSchema`, `cepSchema`). O main (`@semec/ds/react`) não importa mais `zod`; o peer opcional passa a ser verdadeiro (SEM-782).
- ~~Build com `splitting: true` (ESM por módulo) para poda de árvore em apps que importam poucas peças.~~ **Não entregue na 3.0.0 — ver errata acima.**
- `tokens.css`: cor padrão de borda (`border-color: var(--color-border)` na camada base) — tabela e `Badge outline` deixam de sair com borda `currentColor` (SEM-781).
- `tokens.css`: `@media (prefers-reduced-motion: reduce)` global (SEM-784).
- `tokens.css`: token `--color-border-strong` (classes `border-border-strong` em Header/FileUpload) e utilitários `slide-in-from-*`/`slide-out-to-*` com fração e percentual arbitrário (SEM-786).
- Sheet e Drawer animam o painel (`animate-in`/`animate-out` + fade), não só o overlay (SEM-786).
- Sidebar mobile: papel de diálogo (`role="dialog"`, `aria-modal`), foco no painel, Esc fecha, trava do `body`, largura `SIDEBAR_WIDTH_MOBILE` (SEM-785).
- Documentação CSS: config recomendada inclui `@source` para o Tailwind v4 varrer as classes do pacote (SEM-783).

### Migration

```diff
- import { cpfSchema } from "@semec/ds/react";
+ import { cpfSchema } from "@semec/ds/react/validacao";
```

Helpers puros (`validateCPF`, `validateCNPJ`, `validateEmail`) e masks continuam no main.

## 2.1.0

### Minor Changes

- Pipeline único de artefatos de IA (`build-artifacts.mjs`) e skills canônicas `semec-ds` / `semec-ds-lite` (ADR-023). Novos subpath exports para as skills; aliases `ds-semec-skill` mantidos para compatibilidade.

## 2.0.0

> **Errata (registrada em 14/10/2026, auditoria AUD-43).** A 2.0.0 removeu tokens, o tema escuro e o `shadcn.css` **sem depreciação prévia, sem lista e sem guia de migração**, embora o [ADR-013](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0013-politica-de-depreciacao-duas-minors.md) (aviso por duas minors antes da remoção) estivesse Aceito desde 20/08/2026. A lista abaixo foi levantada comparando os tarballs publicados 1.1.0 e 2.0.0 (`dist/react/tokens.css` e `exports`). Nenhum export JavaScript de `@semec/ds/react` foi removido.
>
> **23 tokens removidos de `tokens.css`** (13 primitivos L0 e os 10 utilitários `--color-pv-*` correspondentes no `@theme`). Primitivo não é para uso direto; o substituto é o token semântico (L1) do papel:
>
> | Removido (1.1.0) | Utilitário removido | Use no lugar |
> |---|---|---|
> | `--pv-blue-100`, `--pv-blue-200`, `--pv-blue-300` | `bg-pv-blue-100` | superfície colorida: `--tint` (`bg-tint`) ou `--feedback-info-surface` (`bg-info-surface`) |
> | `--pv-blue-400` | — | foco: `--focus-ring` (`ring-ring`); ação: `--action-primary` (`bg-primary`) |
> | `--pv-blue-900`, `--pv-blue-950` | `bg-pv-blue-900`, `bg-pv-blue-950` | texto forte: `--fg` / `--text-strong` (`text-foreground`); marca: `--brand-hero` (`bg-brand-hero`) |
> | `--pv-green-500` | `bg-pv-green-500` | sucesso: `--feedback-success` (`text-success`, `bg-success`) e `--feedback-success-surface` (`bg-success-surface`) |
> | `--pv-red-400`, `--pv-red-500`, `--pv-red-600`, `--pv-red-800` | `bg-pv-red-400`, `bg-pv-red-500`, `bg-pv-red-600`, `bg-pv-red-800` | perigo: `--feedback-danger` (`bg-destructive`, `text-destructive`) e `--feedback-danger-surface` (`bg-destructive-surface`) |
> | `--pv-yellow-400`, `--pv-yellow-500` | `bg-pv-yellow-400`, `bg-pv-yellow-500` | aviso: `--feedback-warning` (`text-warning`) e `--feedback-warning-surface` (`bg-warning-surface`) |
>
> Atenção: o `main` (próxima minor) reintroduz `--pv-blue-900` e `--pv-green-500` para o toast de sucesso, **com outros valores** (`#1e3a5f` → `#26325B` e `#86c95b` → `#82C353`). Quem ainda usa esses nomes vindos da 1.1.0 verá cores diferentes; use os semânticos da tabela.
>
> **Tema escuro removido.** O bloco `[data-theme="dark"]` do `tokens.css` (ADR-012) saiu sem substituto: o pacote passa a ser só tema claro. `data-theme="dark"` na `<html>` não tem mais efeito.
>
> **`shadcn.css` removido**, com os exports `@semec/ds/react/shadcn.css` e `@semec/ds/lite/shadcn.css`. As variáveis HSL do shadcn (`--background`, `--primary`, `--muted-foreground`…) não existem mais; use `tokens.css`, cujo `@theme` expõe os utilitários equivalentes (`bg-background`, `bg-primary`, `text-muted-foreground`…).
>
> **Política a partir de agora.** Remoções só saem em major e depois de pelo menos duas minors de aviso (ADR-013). O que já está anunciado para sair na 4.0 fica em "Depreciações anunciadas", no [CONTRIBUTING.md](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/CONTRIBUTING.md#depreciações-anunciadas).

### Major Changes

- Remove o dark theme dos tokens CSS (`tokens.css`) e enxarga os primitivos; `@theme inline` expandido.
- Remove o export `@semec/ds/react/shadcn.css` (e o arquivo `shadcn.css` do pacote).
- Externaliza `zod` do bundle: passa a peerDependency opcional; adiciona `get-nonce` como dependência.
- Adiciona `SemecProvider` com suporte a nonce CSP (SEM-752).
- Unifica os pipelines de artefatos de IA num só gerador (`build-artifacts.mjs`) e define skills canônicas `semec-ds` (full) e `semec-ds-lite` (SEM-699).
- Corrige a11y e CSS v4 em Toaster, Progress e Sidebar (SEM-746/749/750).
- Corrige bugs de tokens, sidebar e a11y (SEM-743 a SEM-751).
- Adiciona CSS estático de scrollbar para viewport do Select e doc CSP (SEM-752).

## 1.1.0

### Minor Changes

- a7f90da: Melhorias e ciência de uso
- Corrige grid responsivo, remove TOC da página quem-somos e automatiza publicação npm
