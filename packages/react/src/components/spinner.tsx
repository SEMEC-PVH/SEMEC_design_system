import * as React from "react";

import { cn } from "../lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Texto anunciado por leitor de tela. Padrão: "Carregando". */
  label?: string;
  /**
   * Só visual: sem `role="status"`, sem `aria-label` e sem texto `sr-only`
   * (raiz `<span aria-hidden="true">`). Use quando outro elemento já comunica
   * o carregamento, como o `Button` com `loading` (o nome do botão não ganha
   * "Carregando"). Padrão: `false`.
   */
  decorative?: boolean;
}

const spinnerIcon = (
  <svg
    className="h-5 w-5 animate-spin text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, label = "Carregando", decorative = false, ...props }, ref) => {
    if (decorative) {
      // <span>: conteúdo fraseado, válido dentro de <button>.
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          aria-hidden="true"
          className={cn("inline-flex items-center justify-center", className)}
          {...props}
        >
          {spinnerIcon}
        </span>
      );
    }
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        {spinnerIcon}
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
