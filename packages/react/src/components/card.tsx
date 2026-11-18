import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { HeadingTag } from "./heading";

const cardVariants = cva(
  "rounded-lg shadow-elevation-1 transition-colors duration-fast ease-standard",
  {
    variants: {
      variant: {
        default:
          "border border-border bg-card text-card-foreground ring-1 ring-foreground/5",
        "solid-brand":
          "border-transparent bg-primary text-primary-foreground ring-0",
        "solid-success":
          "border-transparent bg-feedback-success text-text-on-brand ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Variação do cartão:
   * - `default` (padrão): fundo de superfície com borda sutil e sombra.
   * - `solid-brand`: fundo sólido azul institucional (--action-primary) com alto contraste (WCAG AA).
   * - `solid-success`: fundo sólido verde sucesso (--feedback-success) com alto contraste (WCAG AA).
   */
  variant?: "default" | "solid-brand" | "solid-success";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Elemento do título. Padrão: `div` (mantém o comportamento anterior e não
   * entra no sumário de títulos). Passe `h2`/`h3` conforme a hierarquia da
   * página quando o cartão representar uma seção.
   */
  as?: HeadingTag;
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const FormHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-b border-border bg-surface-alt px-6 py-4 rounded-t-lg",
      className
    )}
    {...props}
  />
));
FormHeader.displayName = "FormHeader";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  /** Elemento do título. Padrão: `h2`. */
  titleAs?: HeadingTag;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, badge, titleAs: TitleTag = "h2", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("pb-2 border-b border-border mb-6", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <TitleTag className="text-xl font-bold text-text-brand uppercase tracking-wide">
          {title}
        </TitleTag>
        {badge}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  )
);
SectionHeader.displayName = "SectionHeader";

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  FormHeader,
  SectionHeader,
};