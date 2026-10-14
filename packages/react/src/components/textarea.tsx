import * as React from "react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/** Campo multilinha. Dentro de um `FormField`, recebe `id`, `aria-describedby` e `aria-invalid`. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const field = useFormFieldControl(props, { supportsRequired: true });
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
        {...field}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
