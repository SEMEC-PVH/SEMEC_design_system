---
"@semec/ds": minor
---

Empacotamento, tipos e testes do `@semec/ds` (onda 2 da auditoria, Refs #34).

- **Tipos em `node16`/`nodenext` (AUD-40):** os `.d.ts` de `dist/react` agora usam especificadores relativos com extensão `.js`; `import { Button } from "@semec/ds/react"` deixa de dar TS2305 em projetos com `moduleResolution: "nodenext"`. Continua funcionando com `bundler`. Os `.d.ts.map` deixaram de ser publicados (apontavam para `src/`, que saiu do tarball).
- **Dependências (AUD-44):** `tailwind-merge` 2 → 3 (entende a sintaxe do Tailwind v4: `cn("p-4 p-(--space-2)")` resolve para `p-(--space-2)`), com `extendTailwindMerge` para os utilitários de token (`text-display`, `p-space-N`, `shadow-elevation-N`, `duration-fast`...). Peer `zod` aceita `^3.23.0 || ^4.0.0` (validação testada nas duas). Novo peer `tailwindcss ^4.0.0`.
- **`lucide-react` como peer (AUD-59):** sai de `dependencies` e vira peer `>=0.468.0 <2`, sem cópia duplicada no app. npm 7+ e pnpm 8+ instalam o peer sozinhos; com Yarn, instale `lucide-react` se o app ainda não tiver.
- **Tarball (AUD-65):** inclui `LICENSE` e `CHANGELOG.md`; deixa de levar `src/`, `manifest.js` e `server.js` da raiz (nenhum era alcançável pelos `exports`; as cópias usadas estão em `dist/`). 251 → 132 arquivos, 314,7 kB → 265,3 kB. Novos exports: `./package.json`, `./react/fonts.css`, `./react/fonts/*` e `./lite/fonts.css`. `engines.node >=22`.
- **Testes (AUD-45):** primeira suíte Vitest + Testing Library + axe (`npm test`), com render de cada componente do manifest, teclado em Dialog, Tabs, Accordion, Select e DropdownMenu e axe nas camadas abertas; o gate passa a auditar as camadas abertas no Chromium (EXC-01 só em Select e DropdownMenu).
