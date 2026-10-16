---
"@semec/ds": minor
---

Depreciação (TST-34b, #57; ADR-013): `digits` (exportado por `@semec/ds/react` e `@semec/ds/react/validacao`) e o subpath `@semec/ds/react/server` (`dsPackageRootResolve`) ganham `@deprecated` no JSDoc e um `console.warn` único em desenvolvimento (`process.env.NODE_ENV !== "production"`; nada em produção), e **saem na 5.0**. O resultado das funções não muda nesta versão. Os dois entram na tabela de depreciações anunciadas do CONTRIBUTING.md, na SKILL e no README.

- `digits(valor)`: troque por `valor.replace(/\D/g, "")` no seu código.
- `@semec/ds/react/server`: é uso interno do monorepo e só lança erro fora dele; não há substituto no pacote.
