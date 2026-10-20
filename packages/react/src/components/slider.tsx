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
    // O preenchimento SVG não depende dos atributos style bloqueados no SSR.
    // O Radix continua responsável pelo estado, teclado e inputs do formulário.
    const [uncontrolledValue, setUncontrolledValue] = React.useState(props.defaultValue ?? [0]);
    const values = props.value ?? uncontrolledValue;
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const percentages = values.map((value) => max > min ? Math.min(100, Math.max(0, (value - min) / (max - min) * 100)) : 0);
    const start = percentages.length > 1 ? Math.min(...percentages) : 0;
    const end = percentages.length ? Math.max(...percentages) : 0;
    const vertical = props.orientation === "vertical";
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
        onValueChange={(value) => {
          setUncontrolledValue(value);
          props.onValueChange?.(value);
        }}
        data-semec-slider=""
        id={field.id ?? props.id}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <svg
            aria-hidden="true"
            focusable="false"
            data-inverted={props.inverted || undefined}
            className={cn(
              "absolute inset-0 h-full w-full",
              vertical
                ? "data-[inverted=true]:-scale-y-100"
                : "data-[inverted=true]:-scale-x-100 rtl:-scale-x-100 rtl:data-[inverted=true]:scale-x-100"
            )}
          >
            <rect
              x={vertical ? 0 : `${start}%`}
              y={vertical ? `${100 - end}%` : 0}
              width={vertical ? "100%" : `${end - start}%`}
              height={vertical ? `${end - start}%` : "100%"}
              className="fill-primary"
            />
          </svg>
        </SliderPrimitive.Track>
        {Array.from({ length: count }, (_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            aria-label={thumbLabel(index)}
            aria-labelledby={getAriaLabel ? undefined : ariaLabelledBy}
            aria-describedby={field["aria-describedby"] ?? ariaDescribedBy}
            aria-invalid={field["aria-invalid"] ?? ariaInvalid}
            // TST-22: o ::after parte da caixa de padding (16px, dentro da borda
            // de 2px). `-inset-3` dava 40×40; `-inset-3.5` dá 16 + 2×14 = 44×44.
            className="relative block h-5 w-5 rounded-full after:absolute after:-inset-3.5 after:content-[''] after:rounded-full border-2 border-primary bg-background shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-[invalid=true]:border-destructive"
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
