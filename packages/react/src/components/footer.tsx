import * as React from "react";

import { cn } from "../lib/utils";
import type { HeadingTag } from "./heading";

/**
 * Rodapé institucional. Renderiza `<footer>`, que é o landmark `contentinfo`
 * quando fica fora de `<main>`, `<article>`, `<aside>`, `<nav>` e `<section>`.
 * Use um único rodapé por página, como irmão do `<main>`.
 */
const Footer = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <footer
      ref={ref}
      className={cn(
        "w-full border-t border-border bg-surface px-4 py-8 text-sm text-foreground sm:px-6",
        className
      )}
      {...props}
    />
  )
);
Footer.displayName = "Footer";

/** Grade das seções do rodapé (1 coluna no mobile, até 4 no desktop). */
const FooterContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("grid gap-8 sm:grid-cols-2 lg:grid-cols-4", className)}
    {...props}
  />
));
FooterContent.displayName = "FooterContent";

export interface FooterSectionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Título da seção. */
  title?: React.ReactNode;
  /** Elemento do título. Padrão: `h2` (o rodapé fica no nível das seções da página). */
  titleAs?: HeadingTag;
}

const FooterSection = React.forwardRef<HTMLDivElement, FooterSectionProps>(
  ({ className, title, titleAs: TitleTag = "h2", children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
      {title ? (
        <TitleTag className="text-sm font-semibold uppercase tracking-wide text-brand-hero">
          {title}
        </TitleTag>
      ) : null}
      {children}
    </div>
  )
);
FooterSection.displayName = "FooterSection";

/**
 * Lista de links de uma seção do rodapé. Cada filho é envolvido em `<li>`
 * automaticamente (passe `FooterLink` ou qualquer elemento).
 */
const FooterLinks = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, children, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-col", className)} {...props}>
    {React.Children.map(children, (child) =>
      child === null || child === undefined || child === false ? null : (
        <li>{child}</li>
      )
    )}
  </ul>
));
FooterLinks.displayName = "FooterLinks";

const FooterLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "inline-flex min-h-11 items-center rounded-sm text-sm text-foreground underline underline-offset-4 transition-colors duration-fast ease-standard hover:text-brand-hero focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    )}
    {...props}
  />
));
FooterLink.displayName = "FooterLink";

/** Faixa final: direitos, endereço, CNPJ, versão. */
const FooterBottom = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-8 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
      className
    )}
    {...props}
  />
));
FooterBottom.displayName = "FooterBottom";

export {
  Footer,
  FooterContent,
  FooterSection,
  FooterLinks,
  FooterLink,
  FooterBottom,
};
