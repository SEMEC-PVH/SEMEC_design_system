---
title: "Spinner"
code: "spinner"
slug: "spinner"
file: "src/components/spinner.tsx"
category: "feedback"
variants: "label: texto anunciado (padrão 'Carregando')"
---

# Spinner — `spinner`

> Indicador de carregamento inline (role=status).

**Arquivo:** `src/components/spinner.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/spinner`

## Variantes

- **label**: texto anunciado (padrão "Carregando")

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
import { Spinner } from "@semec/ds/react";

<Spinner label="Carregando protocolos" />
<p className="text-muted-foreground">Carregando dados…</p>
```

## Prompt para IA

```text
Use o componente `Spinner` (Spinner) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Indicador de carregamento inline (role=status). API e variantes: label: texto anunciado (padrão "Carregando"). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Texto anunciado por leitor de tela. Padrão: "Carregando". */
  label?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, label = "Carregando", ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label={label}
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
      <span className="sr-only">{label}</span>
    </div>
  )
);
Spinner.displayName = "Spinner";

export { Spinner };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
