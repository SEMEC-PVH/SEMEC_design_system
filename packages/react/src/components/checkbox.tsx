"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  /** Contrato de formulário (ADR-015): `true` vira `aria-invalid="true"` e o estilo de erro. */
  invalid?: boolean;
  }
>(({ className, invalid, ...props }, ref) => {
  // Dentro de um FormField: id, aria-describedby, aria-invalid e aria-required.
  const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
  return (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border border-input bg-surface shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
    {...field}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };