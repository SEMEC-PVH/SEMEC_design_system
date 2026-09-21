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

## Instalação (@semec/ds/react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale @semec/ds/react pelo registry)
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
import { Switch, Label } from "semec-ds/react";

<div className="flex items-center gap-2">
  <Switch id="alertas" defaultChecked />
  <Label htmlFor="alertas">Receber alertas</Label>
</div>
```

## Prompt para IA

```text
Crie um switch (Interruptor) usando semec-ds/react (`src/components/switch.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: estados: off · on (checked) · disabled · inválido. Interruptor on/off para ativação imediata.
```

## Fonte

```tsx
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "../lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
