"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
  /** Contrato de formulário (ADR-015): `true` vira `aria-invalid="true"` e o estilo de erro. */
  invalid?: boolean;
  }
>(({ className, invalid, ...props }, ref) => {
  // Dentro de um FormField: o grupo (div) não é rotulável por <label for>,
  // então recebe aria-labelledby do rótulo, além de describedby/invalid/required.
  const field = useFormFieldControl(
    { ...props, invalid },
    { labelable: false, supportsRequired: true }
  );
  return (
    <RadioGroupPrimitive.Root
      className={cn("group/radio-group grid gap-2", className)}
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
  // O `aria-invalid` fica no grupo (radiogroup), não no item: o estilo de erro
  // vem do grupo nomeado `group/radio-group`, como no Checkbox inválido.
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-5 w-5 rounded-full border border-input bg-surface text-primary shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive group-aria-[invalid=true]/radio-group:border-destructive",
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