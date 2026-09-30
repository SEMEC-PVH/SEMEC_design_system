# @semec/ds

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
