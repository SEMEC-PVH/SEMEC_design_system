---
title: "Seletor de data"
code: "date-picker"
slug: "seletor-de-data"
file: "src/components/date-picker.tsx"
category: "formularios"
variants: "props: nativo HTML (min · max · disabled) + variantes visuais do campo"
---

# Seletor de data — `date-picker`

> Data com `<input type="date">` nativo — sem biblioteca de calendário.

**Arquivo:** `src/components/date-picker.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/seletor-de-data`

## Variantes

- **props**: nativo HTML (min · max · disabled) + variantes visuais do campo

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
import { DatePicker } from "@semec/ds/react";

<DatePicker defaultValue="2026-08-31" />
```

## Prompt para IA

```text
Crie um date-picker (Seletor de data) usando @semec/ds/react (`src/components/date-picker.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: nativo HTML (min · max · disabled) + variantes visuais do campo. Data com `<input type="date">` nativo — sem biblioteca de calendário.
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
