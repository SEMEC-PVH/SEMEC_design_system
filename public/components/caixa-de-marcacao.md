---
title: "Caixa de marcação"
code: "checkbox"
slug: "caixa-de-marcacao"
file: "base/components/checkbox.tsx"
category: "formularios"
variants: "estados: desmarcado · marcado (checked) · indeterminado · disabled"
---

# Caixa de marcação — `checkbox`

> Caixa de marcação com estado indeterminado.

**Arquivo:** `base/components/checkbox.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/caixa-de-marcacao`

## Variantes

- **estados**: desmarcado · marcado (checked) · indeterminado · disabled

## Instalação (kit @semec/base)

```bash
# 1. Copie base/ para seu projeto
# 2. Instale deps (ver base/README.md)
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
import { Checkbox, Label } from "@semec/base";

<div className="flex items-center gap-2">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Aceito os termos</Label>
</div>
```

## Prompt para IA

```text
Crie um checkbox (Caixa de marcação) usando @semec/base (`base/components/checkbox.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: estados: desmarcado · marcado (checked) · indeterminado · disabled. Caixa de marcação com estado indeterminado.
```

## Fonte

```tsx
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "../lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-sm border border-input shadow-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
