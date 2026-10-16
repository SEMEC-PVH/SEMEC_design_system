---
title: "Menu de seleção"
code: "select"
slug: "menu-de-selecao"
file: "src/components/select.tsx"
category: "formularios"
variants: "composição: Select · SelectTrigger · SelectValue · SelectContent · SelectItem · contrato: Select: value · defaultValue · onValueChange · name · required · disabled — SelectTrigger: id · invalid"
---

# Menu de seleção — `select`

> Seleção fechada com gatilho, conteúdo e itens compostos. O contrato de formulário fica na raiz (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, API Radix) e no gatilho (`id`, `invalid`).

**Arquivo:** `src/components/select.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/menu-de-selecao`

## Variantes

- **composição**: Select · SelectTrigger · SelectValue · SelectContent · SelectItem
- **contrato**: Select: value · defaultValue · onValueChange · name · required · disabled — SelectTrigger: id · invalid

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers zod.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@semec/ds/react";

<Select defaultValue="pbh">
  <SelectTrigger aria-label="Município"><SelectValue placeholder="Município" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="pbh">Porto Velho</SelectItem>
    <SelectItem value="riob">Rio Branco</SelectItem>
  </SelectContent>
</Select>

// Dentro de FormField, o SelectTrigger recebe id, aria-describedby e aria-invalid
<FormField label="Município" error={erro}>
  <Select name="municipio" value={municipio} onValueChange={setMunicipio}>
    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="pbh">Porto Velho</SelectItem>
    </SelectContent>
  </Select>
</FormField>
```

## Prompt para IA

```text
Use o componente `Select` (Menu de seleção) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Seleção fechada com gatilho, conteúdo e itens compostos. O contrato de formulário fica na raiz (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, API Radix) e no gatilho (`id`, `invalid`). API e variantes: composição: Select · SelectTrigger · SelectValue · SelectContent · SelectItem · contrato: Select: value · defaultValue · onValueChange · name · required · disabled — SelectTrigger: id · invalid. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    /**
     * Contrato de formulário (ADR-015): `true` vira `aria-invalid="true"` e o
     * estilo de erro. Fica no gatilho; `value`/`onValueChange`/`name`/`required`
     * ficam no `Select` (raiz Radix).
     */
    invalid?: boolean;
  }
>(({ className, children, invalid, ...props }, ref) => {
  // Dentro de um FormField: id, aria-describedby, aria-invalid e aria-required.
  const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
  return (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground shadow-elevation-1 placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive [&>span]:line-clamp-1 [&>span]:truncate [&>span]:text-left",
      className
    )}
    {...props}
    {...field}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" aria-hidden="true" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" aria-hidden="true" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-elevation-2 data-[state=open]:animate-in data-[state=closed]:animate-out",
        position === "popper" &&
          "w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1.5",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex min-h-11 w-full cursor-default select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none whitespace-normal leading-relaxed focus:bg-tint focus:text-foreground focus:ring-2 focus:ring-inset focus:ring-ring data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
