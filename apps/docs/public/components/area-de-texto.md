---
title: "Área de texto"
code: "textarea"
slug: "area-de-texto"
file: "src/components/textarea.tsx"
category: "formularios"
variants: "estados: padrão · inválido · disabled"
---

# Área de texto — `textarea`

> Campo multilinha com as mesmas variantes visuais do campo de texto.

**Arquivo:** `src/components/textarea.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/area-de-texto`

## Variantes

- **estados**: padrão · inválido · disabled

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
import { Textarea } from "@semec/ds/react";

<Textarea rows={4} placeholder="Descreva a demanda" />
```

## Prompt para IA

```text
Crie um textarea (Área de texto) usando @semec/ds/react (`src/components/textarea.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: estados: padrão · inválido · disabled. Campo multilinha com as mesmas variantes visuais do campo de texto.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
