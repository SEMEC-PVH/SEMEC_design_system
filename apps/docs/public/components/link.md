---
title: "Link"
code: "link"
slug: "link"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/link.tsx"
category: "acoes"
variants: "variant: primary · onSurface · muted · underline: true (padrão) · false (sublinha só no hover; use apenas em menus, rodapés e listas de navegação, nunca em texto corrido) · alvo de toque: abaixo de sm, área mínima de 44×44px por um ::after centralizado, sem mudar a altura da linha (ex.: link tel/mailto sozinho num parágrafo); no desktop o ::after não existe"
---

# Link — `link`

> Link tipográfico com variantes de cor, sublinhado por padrão (a cor sozinha não distingue o link do texto: 2,91:1, WCAG 1.4.1). `onSurface` para links sobre superfícies elevadas.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/link.tsx) | **Categoria:** Ações e links | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/link/

## Variantes

- **variant**: primary · onSurface · muted
- **underline**: true (padrão) · false (sublinha só no hover; use apenas em menus, rodapés e listas de navegação, nunca em texto corrido)
- **alvo de toque**: abaixo de sm, área mínima de 44×44px por um ::after centralizado, sem mudar a altura da linha (ex.: link tel/mailto sozinho num parágrafo); no desktop o ::after não existe

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers@^5 zod@^4.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 2 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.3.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Link } from "@semec/ds/react";

<p>Consulte o <Link href="/iptu">guia do IPTU 2026</Link> antes de emitir a guia.</p>
<Link href="/protocolo" variant="onSurface">Acompanhar protocolo</Link>
<Link href="/ajuda" variant="muted">Saiba mais sobre prazos</Link>

// Só em contexto de navegação, em que a posição já identifica o link:
<Link href="/servicos" underline={false}>Serviços</Link>
```

## Prompt para IA

```text
Use o componente `Link` (Link) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Link tipográfico com variantes de cor, sublinhado por padrão (a cor sozinha não distingue o link do texto: 2,91:1, WCAG 1.4.1). `onSurface` para links sobre superfícies elevadas. API e variantes: variant: primary · onSurface · muted · underline: true (padrão) · false (sublinha só no hover; use apenas em menus, rodapés e listas de navegação, nunca em texto corrido) · alvo de toque: abaixo de sm, área mínima de 44×44px por um ::after centralizado, sem mudar a altura da linha (ex.: link tel/mailto sozinho num parágrafo); no desktop o ::after não existe. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";

const linkVariants: VariantFunction<{
  variant: "primary" | "onSurface" | "muted";
  underline: boolean;
}> = cva(
  // TST-10: abaixo de `sm`, um ::after centralizado de no mínimo 44×44 amplia a
  // área de toque (mesmo recurso do Button sm) sem mudar a altura da linha do
  // texto: um link tel/mailto sozinho num parágrafo media 21 px. No desktop o
  // ::after não existe, para não roubar cliques do texto das linhas vizinhas.
  "relative inline-flex items-center gap-1 text-sm font-medium underline-offset-4 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-full max-sm:after:min-h-11 max-sm:after:w-full max-sm:after:min-w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2",
  {
    variants: {
      variant: {
        primary: "text-primary",
        onSurface: "text-foreground",
        muted: "text-muted-foreground hover:text-foreground",
      },
      /**
       * AUD-25: sublinhado por padrão. O `primary` tem só 2,91:1 contra o texto
       * comum, então a cor sozinha não identifica o link num parágrafo (WCAG 1.4.1).
       * `underline={false}` sublinha só no hover: use apenas em contextos em que
       * o link já é evidente pela posição (menu, rodapé, lista de navegação).
       */
      underline: {
        true: "underline",
        false: "no-underline hover:underline",
      },
    },
    defaultVariants: {
      variant: "primary",
      underline: true,
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, underline, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(linkVariants({ variant, underline, className }))}
      {...props}
    />
  )
);
Link.displayName = "Link";

export { Link, linkVariants };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
