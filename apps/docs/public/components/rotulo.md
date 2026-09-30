---
title: "Rótulo"
code: "label"
slug: "rotulo"
file: "src/components/label.tsx"
category: "formularios"
variants: "—"
---

# Rótulo — `label`

> Rótulo acessível vinculado ao campo.

**Arquivo:** `src/components/label.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/rotulo`

## Variantes

_Sem variantes_

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@config "@semec/ds/react/pv-preset";
```

## Uso

```tsx
import { Label, Input } from "@semec/ds/react";

<Label htmlFor="nome">Nome</Label>
<Input id="nome" />
```

## Prompt para IA

```text
Crie um label (Rótulo) usando @semec/ds/react (`src/components/label.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Rótulo acessível vinculado ao campo.
```

## Fonte

```tsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "../lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
