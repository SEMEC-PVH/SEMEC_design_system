---
title: "Caixa de marcação"
code: "checkbox"
slug: "caixa-de-marcacao"
file: "src/components/checkbox.tsx"
category: "formularios"
variants: "estados: desmarcado · marcado (checked) · indeterminado · disabled"
---

# Caixa de marcação — `checkbox`

> Caixa de marcação com estado indeterminado.

**Arquivo:** `src/components/checkbox.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/caixa-de-marcacao`

## Variantes

- **estados**: desmarcado · marcado (checked) · indeterminado · disabled

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
import { Checkbox, Label } from "@semec/ds/react";

<div className="flex items-center gap-2">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Aceito os termos</Label>
</div>
```

## Prompt para IA

```text
Use o componente `Checkbox` (Caixa de marcação) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Caixa de marcação com estado indeterminado. API e variantes: estados: desmarcado · marcado (checked) · indeterminado · disabled. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Dentro de um FormField: id, aria-describedby, aria-invalid e aria-required.
  const field = useFormFieldControl(props, { supportsRequired: true });
  return (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border border-input shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
    {...field}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
