import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

/** Nível semântico de título (h1–h6). */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Elemento aceito pela prop `as` dos títulos do kit (AlertTitle, CardTitle,
 * TimelineTitle, `titleAs` de EmptyState/ErrorState/SectionHeader/FooterSection).
 * `div` e `p` servem para rótulos que não devem entrar no sumário de títulos.
 */
export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "p";

const headingVariants = cva("text-foreground", {
  variants: {
    size: {
      1: "text-2xl font-bold leading-tight tracking-tight",
      2: "text-xl font-bold leading-snug",
      3: "text-lg font-semibold leading-snug",
      4: "text-base font-semibold leading-normal",
      5: "text-sm font-semibold leading-normal",
      6: "text-xs font-semibold uppercase leading-normal tracking-wide",
    },
  },
  defaultVariants: {
    size: 2,
  },
});

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Nível semântico: define o elemento `h1`–`h6`. Padrão: 2. */
  level?: HeadingLevel;
  /**
   * Tamanho visual na escala do kit, independente do nível. Padrão: igual a
   * `level`. Use para manter a ordem dos títulos sem mudar o visual.
   */
  size?: HeadingLevel;
}

/**
 * Título semântico com a escala tipográfica do kit. O nível (`level`) segue a
 * estrutura da página; o tamanho (`size`) segue o visual.
 */
const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, size, ...props }, ref) => {
    const Tag = `h${level}` as const;
    return (
      <Tag
        ref={ref}
        className={cn(headingVariants({ size: size ?? level }), className)}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

export { Heading, headingVariants };
