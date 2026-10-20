"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";

const toggleVariants: VariantFunction<{
  variant: "default" | "outline";
  size: "sm" | "md" | "lg";
}> = cva(
  // TST-03: o estado ligado não pode depender de um cinza quase igual ao fundo
  // (antes `bg-accent`, 1,01:1). Ligado = fundo `tint` + contorno de 2px em
  // `primary` (borda + inset-ring de 1px), texto `foreground`:
  //   primary × background (pv-gray-50) 5,00:1 · × surface (branco) 5,42:1
  //   · × tint 4,89:1 · foreground × tint 14,24:1 (mínimo 3:1 / 4,5:1).
  // Contra o estado solto: na variante `default` o solto não tem contorno, e a
  // borda primary fica sobre a superfície (5,00:1 / 5,42:1). Na `outline` a
  // borda solta é `input` (pv-gray-400, 1,44:1 contra primary), por isso o
  // inset-ring: o pixel interno passa de superfície a primary (5,00:1 / 5,42:1).
  // Hover solto: borda `border-strong` (3,49:1 / 3,77:1) na `default` e
  // `foreground` na `outline`; hover ligado escurece para `primary-hover`.
  "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-tint data-[state=on]:text-foreground data-[state=on]:inset-ring data-[state=on]:inset-ring-primary data-[state=on]:hover:border-primary-hover data-[state=on]:hover:inset-ring-primary-hover",
  {
    variants: {
      variant: {
        default: "border-transparent bg-transparent hover:border-border-strong",
        outline: "border-input bg-transparent hover:border-foreground",
      },
      size: {
        // AUD-10: `md` (padrão) e `lg` têm 44px. `sm` mantém o visual de 36px,
        // com área clicável estendida a 44×44px por pseudo-elemento.
        sm: "h-9 px-3 relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2",
        md: "h-11 min-w-11 px-3",
        lg: "h-12 min-w-12 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
