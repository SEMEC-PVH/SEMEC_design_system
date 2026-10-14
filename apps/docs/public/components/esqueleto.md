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

**Arquivo:** `src/components/skeleton.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/esqueleto`

## Variantes

- **a11y**: aria-hidden=true (padrão) · aria-busy no contêiner

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

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
