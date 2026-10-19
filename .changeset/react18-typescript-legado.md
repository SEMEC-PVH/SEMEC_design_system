---
"@semec/ds": minor
---

Adiciona suporte a React e React DOM 18.3, além da versão 19. A Sidebar recolhida aplica `inert` diretamente no DOM, impedindo foco no conteúdo oculto também no React 18, e sincroniza a propriedade nos modos fixo e mobile.

Adiciona resolução dos subpaths tipados em TypeScript `moduleResolution: "node"` (node10), preservando os tipos das variantes e a compatibilidade com `bundler` e `nodenext`. Documenta a exigência de `esModuleInterop` ao usar Zod 4 nesse modo e o aviso de desenvolvimento do NavigationMenu com React 18.
