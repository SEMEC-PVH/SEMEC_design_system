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

## Instalação (@semec/ds-react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale @semec/ds-react pelo registry)
# 2. Instale deps (ver packages/react/README.md)
npm i class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
  @radix-ui/react-toast @radix-ui/react-tooltip
```

```css
/* globals.css */
@import "tailwindcss";
@import "./base/tokens.css";
@import "./base/shadcn.css";
/* ou @config "./base/pv-preset.ts" */
```

## Uso

```tsx
import { Textarea } from "@semec/ds-react";

<Textarea rows={4} placeholder="Descreva a demanda" />
```

## Prompt para IA

```text
Crie um textarea (Área de texto) usando @semec/ds-react (`src/components/textarea.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: estados: padrão · inválido · disabled. Campo multilinha com as mesmas variantes visuais do campo de texto.
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
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30",
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

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
