---
title: "Slider"
code: "slider"
slug: "slider"
file: "src/components/slider.tsx"
category: "formularios"
variants: "contrato: value · defaultValue · onValueChange(number[]) · name · id · invalid · disabled"
---

# Slider — `slider`

> Controle deslizante para faixas de valor. Contrato de formulário pela API Radix (`value`/`defaultValue`/`onValueChange` com `number[]`, `name`); `invalid` vira `aria-invalid` nos polegares.

**Arquivo:** `src/components/slider.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/slider`

## Variantes

- **contrato**: value · defaultValue · onValueChange(number[]) · name · id · invalid · disabled

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
import { Slider } from "@semec/ds/react";

// Nome acessível obrigatório: aria-label (ou aria-labelledby) vai para o polegar
<Slider defaultValue={[50]} max={100} step={1} aria-label="Raio de busca em km" />

// Faixa com 2 polegares: anunciados como "Faixa de preço (1 de 2)" e "(2 de 2)"; use getAriaLabel(i) para nomes próprios
<Slider defaultValue={[100, 500]} max={1000} step={10} aria-label="Faixa de preço" />
```

## Prompt para IA

```text
Use o componente `Slider` (Slider) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Controle deslizante para faixas de valor. Contrato de formulário pela API Radix (`value`/`defaultValue`/`onValueChange` com `number[]`, `name`); `invalid` vira `aria-invalid` nos polegares. API e variantes: contrato: value · defaultValue · onValueChange(number[]) · name · id · invalid · disabled. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /**
   * Nome acessível de cada polegar (`role="slider"`). Útil com vários polegares,
   * ex.: `(i) => (i === 0 ? "Valor mínimo" : "Valor máximo")`.
   * Sem ela, `aria-label`/`aria-labelledby` do Slider vão para os polegares.
   */
  getAriaLabel?: (index: number) => string;
  /** Contrato de formulário (ADR-015): `true` vira `aria-invalid="true"` nos polegares. */
  invalid?: boolean;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledByProp,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      getAriaLabel,
      invalid,
      ...props
    },
    ref
  ) => {
    // Dentro de um FormField: o polegar (span role="slider") não é rotulável por
    // <label for>, então recebe aria-labelledby do rótulo, mais describedby/invalid.
    const field = useFormFieldControl(
      {
        id: props.id,
        "aria-label": ariaLabel ?? (getAriaLabel ? "" : undefined),
        "aria-labelledby": ariaLabelledByProp,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
        invalid,
      },
      { labelable: false }
    );
    const ariaLabelledBy = field["aria-labelledby"] ?? ariaLabelledByProp;
    // Um polegar por valor (range com 2 valores = 2 polegares).
    const count = Math.max((props.value ?? props.defaultValue ?? [0]).length, 1);

    const thumbLabel = (index: number) => {
      if (getAriaLabel) return getAriaLabel(index);
      if (ariaLabelledBy || !ariaLabel) return undefined;
      return count > 1 ? `${ariaLabel} (${index + 1} de ${count})` : ariaLabel;
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
        id={field.id ?? props.id}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {Array.from({ length: count }, (_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            aria-label={thumbLabel(index)}
            aria-labelledby={getAriaLabel ? undefined : ariaLabelledBy}
            aria-describedby={field["aria-describedby"] ?? ariaDescribedBy}
            aria-invalid={field["aria-invalid"] ?? ariaInvalid}
            className="relative block h-5 w-5 rounded-full after:absolute after:-inset-3 after:content-[''] after:rounded-full border-2 border-primary bg-background shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-[invalid=true]:border-destructive"
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
