---
title: "Combobox"
code: "combobox"
slug: "combobox"
file: "src/components/combobox.tsx"
category: "formularios"
variants: "props: options · value · onChange · placeholder · emptyMessage · disabled"
---

# Combobox — `combobox`

> Campo com busca e lista filtrada. Opções via `options`.

**Arquivo:** `src/components/combobox.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/combobox`

## Variantes

- **props**: options · value · onChange · placeholder · emptyMessage · disabled

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
import { Combobox } from "semec-ds/react";

<Combobox
  options={[{ value: "cnpj", label: "CNPJ" }, { value: "cpf", label: "CPF" }]}
  value={valor}
  onChange={setValor}
/>
```

## Prompt para IA

```text
Crie um combobox (Combobox) usando semec-ds/react (`src/components/combobox.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: options · value · onChange · placeholder · emptyMessage · disabled. Campo com busca e lista filtrada. Opções via `options`.
```

## Fonte

```tsx
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "../lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Selecione…",
      emptyMessage = "Nenhum resultado.",
      disabled,
      ariaLabel = "Selecionar",
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");

    const selected = options.find((o) => o.value === value);
    const filtered = React.useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, query]);

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={open}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-border bg-popover text-popover-foreground shadow-elevation-2 outline-none data-[state=open]:animate-in"
          >
            <div className="border-b border-border p-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                aria-label={`Buscar em ${ariaLabel}`}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1" role="listbox" aria-label={ariaLabel}>
              {filtered.length > 0 ? (
                filtered.map((option) => {
                  const active = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange?.(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active && "bg-accent text-accent-foreground"
                      )}
                    >
                      {option.label}
                      {active ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
Combobox.displayName = "Combobox";

export { Combobox };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
