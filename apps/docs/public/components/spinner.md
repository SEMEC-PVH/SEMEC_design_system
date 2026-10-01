---
title: "Spinner"
code: "spinner"
slug: "spinner"
file: "src/components/spinner.tsx"
category: "feedback"
variants: "—"
---

# Spinner — `spinner`

> Indicador de carregamento inline.

**Arquivo:** `src/components/spinner.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/spinner`

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
import { Spinner } from "@semec/ds/react";

<Spinner />
<p className="text-muted-foreground">Carregando dados…</p>
```

## Prompt para IA

```text
Crie um spinner (Spinner) usando @semec/ds/react (`src/components/spinner.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Indicador de carregamento inline.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="status"
    aria-label="Carregando"
    className={cn("inline-flex items-center justify-center", className)}
    {...props}
  >
    <svg
      className="h-5 w-5 animate-spin text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span className="sr-only">Carregando</span>
  </div>
));
Spinner.displayName = "Spinner";

export { Spinner };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
