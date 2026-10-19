"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Recebe o valor (string) a cada mudança, junto com o `onChange` nativo, que
   * continua recebendo o evento (contrato de formulário, ADR-015).
   */
  onValueChange?: (value: string) => void;
  /** `true` vira `aria-invalid="true"` e o estilo de erro. Dentro de FormField, vence o estado dele. */
  invalid?: boolean;
}

/** Campo multilinha. Dentro de um `FormField`, recebe `id`, `aria-describedby` e `aria-invalid`. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, onValueChange, ...props }, ref) => {
    const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
    const { onChange } = props;
    const handleChange =
      onChange || onValueChange
        ? (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange?.(event);
            onValueChange?.(event.target.value);
          }
        : undefined;
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-surface px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
        {...field}
        onChange={handleChange}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
