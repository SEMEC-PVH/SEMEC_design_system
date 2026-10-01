import * as React from "react";

import { cn } from "../lib/utils";

const Header = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex w-full max-w-full items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
);
Header.displayName = "Header";

export interface HeaderBrandProps extends React.HTMLAttributes<HTMLElement> {
  href?: string;
  orgName?: string;
  serviceName?: string;
  logo?: React.ReactNode;
}

const HeaderBrand = React.forwardRef<HTMLElement, HeaderBrandProps>(
  (
    {
      className,
      href = "/",
      orgName = "SEMEC",
      serviceName = "Nome do serviço",
      logo,
      children,
      ...props
    },
    ref
  ) => {
    const content = (
      <>
        {logo ?? (
          <span
            role="img"
            aria-label="Logo do órgão"
            className="inline-flex h-9 w-[90px] shrink-0 items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-alt text-xs font-medium text-muted-foreground"
          >
            Logo
          </span>
        )}
        <span aria-hidden="true" className="h-7 w-px shrink-0 bg-border" />
        {children ?? (
          <span className="truncate text-base font-bold leading-normal text-brand-hero">
            {orgName}
            <span
              aria-hidden="true"
              className="mx-1 font-normal text-muted-foreground"
            >
              |
            </span>
            <span className="font-semibold text-foreground">{serviceName}</span>
          </span>
        )}
      </>
    );

    const rootClass = cn(
      "flex min-w-0 items-center gap-3 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    );

    if (href) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={rootClass} {...props}>
          {content}
          <span className="sr-only">— ir para o início</span>
        </a>
      );
    }

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className={rootClass} {...props}>
        {content}
      </div>
    );
  }
);
HeaderBrand.displayName = "HeaderBrand";

const HeaderNav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Principal"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </nav>
  )
);
HeaderNav.displayName = "HeaderNav";

export interface HeaderNavLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  current?: boolean;
}

const HeaderNavLink = React.forwardRef<HTMLAnchorElement, HeaderNavLinkProps>(
  ({ className, current, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground no-underline transition-colors duration-fast ease-standard hover:text-brand-hero focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        current && "font-semibold text-brand-hero",
        className
      )}
      {...props}
    />
  )
);
HeaderNavLink.displayName = "HeaderNavLink";

export { Header, HeaderBrand, HeaderNav, HeaderNavLink };
