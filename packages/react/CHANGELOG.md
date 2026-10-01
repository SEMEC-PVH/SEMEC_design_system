# @semec/ds

## 3.0.0

### Major Changes

- Schemas Zod saem do entry principal: use `@semec/ds/react/validacao` (`cpfSchema`, `cnpjSchema`, `cpfCnpjSchema`, `emailSchema`, `cepSchema`). O main (`@semec/ds/react`) não importa mais `zod`; o peer opcional passa a ser verdadeiro (SEM-782).
- Build com `splitting: true` (ESM por módulo) para poda de árvore em apps que importam poucas peças.
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
