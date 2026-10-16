---
"@semec/ds": patch
---

Correções da validação da 4.2.0 como consumidor (Next 16, Vite 8, WebKit/Firefox e migração do semec-digital):

- **Barrel com nomes explícitos (NEXT42-01).** `dist/react/index.js` deixa de usar `export *` e reexporta cada componente por nome. Num Server Component do Next 16 (Turbopack), `import { Heading, NavigationMenu } from "@semec/ds/react"` levava ao cliente todos os módulos `"use client"` do kit (+77 kB gzip medidos); agora custa o mesmo que o subpath. Com `next build --webpack`, use o subpath ou `experimental.optimizePackageImports: ["@semec/ds/react"]` (README, passo 5). `npm run test:dist` confere o barrel (`check-barrel`).
- **HeaderNav quebra linha (NEXT42-02 / V42-VITE-01, WCAG 1.4.10).** Com 4 links curtos, o `<nav>` estourava 320 px e a página rolava na horizontal (scrollWidth 395 para 320 na bancada). Agora tem `flex-wrap`: os links descem para uma segunda linha. Mudança visual só quando os links não cabem.
- **FooterLink com alvo de 44 px (NEXT42-05).** Um link curto ("IPTU") ficava com 30×44 de área de toque. Ganha o mesmo `::after` de no mínimo 44 px de largura do Breadcrumb, só abaixo de `sm`; o layout não muda.
- **Painel do NavigationMenu na largura do link mais longo (V42-VITE-03).** Com o exemplo da doc (`NavigationMenuContent className="p-2"`), o painel encolhia e cada link quebrava em 2 linhas (141×55), no desktop e no mobile. O conteúdo passa a `w-max`, limitado a `calc(100vw - 2rem)`. Mudança visual: o painel fica mais largo e os links voltam a 1 linha (44 px).
