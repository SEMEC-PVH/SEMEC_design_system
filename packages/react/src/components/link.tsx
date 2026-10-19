import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";

const linkVariants: VariantFunction<{
  variant: "primary" | "onSurface" | "muted";
  underline: boolean;
}> = cva(
  // TST-10: abaixo de `sm`, um ::after centralizado de no mínimo 44×44 amplia a
  // área de toque (mesmo recurso do Button sm) sem mudar a altura da linha do
  // texto: um link tel/mailto sozinho num parágrafo media 21 px. No desktop o
  // ::after não existe, para não roubar cliques do texto das linhas vizinhas.
  "relative inline-flex items-center gap-1 text-sm font-medium underline-offset-4 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-full max-sm:after:min-h-11 max-sm:after:w-full max-sm:after:min-w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2",
  {
    variants: {
      variant: {
        primary: "text-primary",
        onSurface: "text-foreground",
        muted: "text-muted-foreground hover:text-foreground",
      },
      /**
       * AUD-25: sublinhado por padrão. O `primary` tem só 2,91:1 contra o texto
       * comum, então a cor sozinha não identifica o link num parágrafo (WCAG 1.4.1).
       * `underline={false}` sublinha só no hover: use apenas em contextos em que
       * o link já é evidente pela posição (menu, rodapé, lista de navegação).
       */
      underline: {
        true: "underline",
        false: "no-underline hover:underline",
      },
    },
    defaultVariants: {
      variant: "primary",
      underline: true,
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, underline, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(linkVariants({ variant, underline, className }))}
      {...props}
    />
  )
);
Link.displayName = "Link";

export { Link, linkVariants };