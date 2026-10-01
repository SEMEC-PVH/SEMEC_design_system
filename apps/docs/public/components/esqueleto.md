---
title: "Esqueleto"
code: "skeleton"
slug: "esqueleto"
file: "src/components/skeleton.tsx"
category: "feedback"
variants: "—"
---

# Esqueleto — `skeleton`

> Placeholder pulsante de carregamento.

**Arquivo:** `src/components/skeleton.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/esqueleto`

## Variantes

_Sem variantes_

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Skeleton } from "@semec/ds/react";

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[180px]" />
```

## Prompt para IA

```text
Crie um skeleton (Esqueleto) usando @semec/ds/react (`src/components/skeleton.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Placeholder pulsante de carregamento.
```

## Fonte

```tsx
import { cn } from "../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
