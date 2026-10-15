---
title: "Botão de opção"
code: "radio-group"
slug: "botao-de-opcao"
file: "src/components/radio-group.tsx"
category: "formularios"
variants: "composição: RadioGroup · RadioGroupItem + Label"
---

# Botão de opção — `radio-group`

> Escolha única entre duas ou mais opções.

**Arquivo:** `src/components/radio-group.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/botao-de-opcao`

## Variantes

- **composição**: RadioGroup · RadioGroupItem + Label

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
import { RadioGroup, RadioGroupItem, Label } from "@semec/ds/react";

<RadioGroup defaultValue="pessoa-fisica">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="pessoa-fisica" id="pf" />
    <Label htmlFor="pf">Pessoa física</Label>
  </div>
</RadioGroup>
```

## Prompt para IA

```text
Use o componente `RadioGroup` (Botão de opção) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Escolha única entre duas ou mais opções. API e variantes: composição: RadioGroup · RadioGroupItem + Label. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Dentro de um FormField: o grupo (div) não é rotulável por <label for>,
  // então recebe aria-labelledby do rótulo, além de describedby/invalid/required.
  const field = useFormFieldControl(props, { labelable: false, supportsRequired: true });
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      {...field}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-5 w-5 rounded-full border border-input text-primary shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-3 w-3 fill-current" aria-hidden="true" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
