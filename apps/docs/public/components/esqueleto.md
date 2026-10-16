---
title: "Esqueleto"
code: "skeleton"
slug: "esqueleto"
file: "src/components/skeleton.tsx"
category: "feedback"
variants: "a11y: aria-hidden=true (padrão) · aria-busy no contêiner"
---

# Esqueleto — `skeleton`

> Placeholder pulsante de carregamento, decorativo (aria-hidden). Fundo `surface-sunken`. Anuncie o carregamento no contêiner com aria-busy e um texto ou Spinner.

**Arquivo:** `src/components/skeleton.tsx` | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/esqueleto/

## Variantes

- **a11y**: aria-hidden=true (padrão) · aria-busy no contêiner

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers zod.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 4 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.0.1 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.1.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Skeleton } from "@semec/ds/react";

<div aria-busy="true">
  <p className="sr-only">Carregando protocolos…</p>
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

## Prompt para IA

```text
Use o componente `Skeleton` (Esqueleto) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Placeholder pulsante de carregamento, decorativo (aria-hidden). Fundo `surface-sunken`. Anuncie o carregamento no contêiner com aria-busy e um texto ou Spinner. API e variantes: a11y: aria-hidden=true (padrão) · aria-busy no contêiner. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Placeholder pulsante de carregamento. É decorativo (`aria-hidden` por
 * padrão): anuncie o carregamento no contêiner com `aria-busy="true"` e um
 * texto ou `Spinner` com `role="status"`.
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
