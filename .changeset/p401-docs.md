---
"@semec/ds": patch
---

Corrige a documentação de instalação e uso, a partir de testes com a 4.0.0 em apps novos (Next 16 e Vite 8):

- **`lucide-react` é peer, não dependência.** O README e a skill diziam que vinha automaticamente. O comando de instalação passa a ser `npm install @semec/ds lucide-react`, com a explicação: o npm 7+ instala peer ausente sozinho, o pnpm só com `auto-install-peers=true` e o Yarn (clássico e Berry) nunca. Os peers obrigatórios ficam listados (`react`, `react-dom`, `tailwindcss`, `lucide-react`).
- **`zod`**: o peer opcional é `^3.23.0 || ^4.0.0`, não `^3.23`.
- **Vite**: passo do `@tailwindcss/vite` (`npm i -D tailwindcss @tailwindcss/vite`, `tailwindcss()` no `vite.config`) e as linhas do kit em `src/index.css`, trocando o CSS do template.
- **Next (`create-next-app`)**: apagar os estilos do template no `globals.css` (`body`, `:root`, `@theme inline`, `@media (prefers-color-scheme: dark)`), que ficam fora de camada e vencem o `@layer base` do `tokens.css` (o app ficava com Arial e as cores do template), e o `next/font` Geist do `layout.tsx`. O `@tailwindcss/turbopack` do `create-next-app` 16.4 funciona igual ao `@tailwindcss/postcss`.
- **CSS não sofre poda**: o `@source` varre o `dist` inteiro, então o CSS do kit é um custo fixo (~68 kB, ~12 kB com gzip); o JS é podado.
- **axe na CI do app**: nova seção "Acessibilidade" no README explica a EXC-01 (`aria-hidden-focus` com `Select`, `DropdownMenu` ou `NavigationMenu` abertos) e como desligar só essa regra, só nesse estado, sem `exclude`.
- **Lite**: o `llms.txt` da lite não repete mais a linha da skill e cita o `fonts.css`; a skill e o `llms.txt` explicam o uso sem Tailwind (num `<link>`, `node_modules/@semec/ds/dist/react/tokens.css` e `fonts.css`; os subpaths `lite/*.css` só resolvem em bundler).
- As skills `semec-ds` e `semec-ds-lite` passam a dizer a versão do pacote para a qual foram geradas (preenchida pelo build a partir do `package.json`).
