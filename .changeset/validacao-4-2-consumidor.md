---
"@semec/ds": patch
---

Correções da validação da 4.2.0 como consumidor (Next 16, Vite 8, WebKit/Firefox e migração do semec-digital):

- **Barrel com nomes explícitos (NEXT42-01).** `dist/react/index.js` deixa de usar `export *` e reexporta cada componente por nome. Num Server Component do Next 16 (Turbopack), `import { Heading, NavigationMenu } from "@semec/ds/react"` levava ao cliente todos os módulos `"use client"` do kit (+77 kB gzip medidos); agora custa o mesmo que o subpath. Com `next build --webpack`, use o subpath ou `experimental.optimizePackageImports: ["@semec/ds/react"]` (README, passo 5). `npm run test:dist` confere o barrel (`check-barrel`).
