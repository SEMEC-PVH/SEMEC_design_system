import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";
import { ButtonLoadingIndicator } from "./button-loading";

const buttonVariants: VariantFunction<{
  variant: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "link";
  size: "sm" | "md" | "lg" | "icon";
}> = cva(
  "inline-flex items-center justify-center gap-2 text-center text-balance rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
        // TST-21: altura mínima (`min-h-*`) em vez de fixa e sem
        // `whitespace-nowrap`: o rótulo longo quebra em linhas (balanceadas por
        // `text-balance`) em vez de gerar rolagem horizontal. O `py-*` só conta
        // quando há quebra; numa linha a altura segue 36/44/48px, como antes.
        sm: "min-h-9 px-4 py-1.5 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2",
        md: "min-h-11 px-5 py-2 text-sm",
        lg: "min-h-12 px-6 py-2 text-base",
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
    // O elemento é o mesmo com e sem loading (sem remontar: o foco fica).
    // O bloqueio do clique mora no ButtonLoadingIndicator ("use client"),
    // para o Button seguir renderizando no servidor; o onClick de quem usa
    // não é repassado enquanto carrega.
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), loading && "cursor-progress")}
        ref={ref}
        onClick={loading ? undefined : onClick}
        {...props}
        aria-busy={loading ? true : props["aria-busy"]}
        aria-disabled={loading ? true : props["aria-disabled"]}
      >
        {!loading ? (
          children
        ) : asChild ? (
          [
            <ButtonLoadingIndicator key="loading" />,
            // O Slot mesclaria o onClick do filho (ex.: <a onClick>): durante o
            // loading ele também não é repassado.
            <Slottable key="child">
              {React.isValidElement<{ onClick?: unknown }>(children)
                ? React.cloneElement(children, { onClick: undefined })
                : children}
            </Slottable>,
          ]
        ) : (
          <>
            <ButtonLoadingIndicator />
            {loadingText ?? children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };