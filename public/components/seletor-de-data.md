---
title: "Seletor de data"
code: "date-picker"
slug: "seletor-de-data"
file: "base/components/date-picker.tsx"
category: "formularios"
variants: "props: nativo HTML (min · max · disabled) + variantes visuais do campo"
---

# Seletor de data — `date-picker`

> Data com `<input type="date">` nativo — sem biblioteca de calendário.

**Arquivo:** `base/components/date-picker.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/seletor-de-data`

## Variantes

- **props**: nativo HTML (min · max · disabled) + variantes visuais do campo

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
import { DatePicker } from "@semec/base";

<DatePicker defaultValue="2026-08-31" />
```

## Prompt para IA

```text
Crie um date-picker (Seletor de data) usando @semec/base (`base/components/date-picker.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: nativo HTML (min · max · disabled) + variantes visuais do campo. Data com `<input type="date">` nativo — sem biblioteca de calendário.
```

## Fonte

```tsx
import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "../lib/utils";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Campo de data. Usa o `<input type="date">` nativo (sem biblioteca de
 * calendário), estilizado com os tokens do sistema. Valor ISO (`YYYY-MM-DD`).
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, value, onChange, disabled, ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
          className
        )}
        {...props}
      />
      <CalendarIcon
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
