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
