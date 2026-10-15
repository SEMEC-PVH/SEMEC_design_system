"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/** Campo de texto. Dentro de um `FormField`, recebe `id`, `aria-describedby` e `aria-invalid`. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const field = useFormFieldControl(props, { supportsRequired: true });
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
        {...field}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
