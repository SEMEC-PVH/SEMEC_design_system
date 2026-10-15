---
title: "Interruptor"
code: "switch"
slug: "interruptor"
file: "src/components/switch.tsx"
category: "formularios"
variants: "estados: off · on (checked) · disabled · inválido"
---

# Interruptor — `switch`

> Interruptor on/off para ativação imediata.

**Arquivo:** `src/components/switch.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/interruptor`

## Variantes

- **estados**: off · on (checked) · disabled · inválido

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
import { Switch, Label } from "@semec/ds/react";

<div className="flex items-center gap-2">
  <Switch id="alertas" defaultChecked />
  <Label htmlFor="alertas">Receber alertas</Label>
</div>
```

## Prompt para IA

```text
Use o componente `Switch` (Interruptor) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Interruptor on/off para ativação imediata. API e variantes: estados: off · on (checked) · disabled · inválido. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  // Dentro de um FormField: id, aria-describedby, aria-invalid e aria-required.
  const field = useFormFieldControl(props, { supportsRequired: true });
  return (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-6 w-11 shrink-0 before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
    {...field}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-elevation-2 ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
