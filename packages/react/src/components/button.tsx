import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:
          "bg-success text-white hover:bg-success/90 focus-visible:ring-success/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // AUD-10: o visual compacto (36px) é mantido, mas a área clicável é
        // estendida a 44×44px por um pseudo-elemento centralizado.
        sm: "h-9 px-4 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Ação em andamento (AUD-63): mostra um Spinner decorativo, aplica
   * `aria-busy="true"` e `aria-disabled="true"` e ignora cliques (inclusive o
   * envio do formulário). O botão continua focalizável: o foco não se perde
   * durante o carregamento. O nome acessível segue sendo o texto do botão.
   */
  loading?: boolean;
  /**
   * Texto visível durante o `loading` (ex.: "Enviando…"), no lugar dos
   * `children`. Sem ele, o texto original permanece.
   */
  loadingText?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const handleClick = loading
      ? (event: React.MouseEvent<HTMLButtonElement>) => {
          // aria-disabled não bloqueia a ativação: o bloqueio é aqui.
          event.preventDefault();
        }
      : onClick;
    const content =
      loading && !asChild ? (
        <>
          <Spinner decorative />
          {loadingText ?? children}
        </>
      ) : (
        children
      );
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "cursor-progress"
        )}
        ref={ref}
        {...props}
        aria-busy={loading ? true : props["aria-busy"]}
        aria-disabled={loading ? true : props["aria-disabled"]}
        onClick={handleClick}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };