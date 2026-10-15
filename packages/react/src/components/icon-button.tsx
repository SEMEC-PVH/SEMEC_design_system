import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "./button";

const iconButtonVariants = cva("", {
  variants: {
    variant: {
      primary: "",
      secondary: "",
      outline: "",
      ghost: "",
      destructive: "",
      link: "",
    },
  },
  defaultVariants: { variant: "outline" },
});

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string;
  /**
   * Ação em andamento: troca o ícone por um Spinner decorativo e repassa
   * `loading` ao `Button` (`aria-busy`, `aria-disabled`, clique bloqueado,
   * foco mantido). O nome acessível continua sendo `label`.
   */
  loading?: boolean;
}

/**
 * Botão representado apenas por ícone. O rótulo acessível é obrigatório
 * (`label`) — sem ele, leitores de tela anunciam um botão vazio.
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, label, variant = "outline", type = "button", loading = false, children, ...props },
    ref
  ) => (
    <Button
      ref={ref}
      type={type}
      size="icon"
      variant={variant}
      aria-label={label}
      title={label}
      className={className}
      loading={loading}
      {...props}
    >
      {loading ? null : children}
    </Button>
  )
);
IconButton.displayName = "IconButton";

export { IconButton };