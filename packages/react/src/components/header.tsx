"use client";

import * as React from "react";

import { cn } from "../lib/utils";

const Header = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex w-full max-w-full flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6",
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
  /**
   * Destino do link da marca. Padrão: `/`. Passe `""` (ou `null`) para
   * renderizar a marca sem link (ex.: já na página inicial).
   */
  href?: string | null;
  orgName?: string;
  serviceName?: string;
  /**
   * Logo do órgão (ex.: `<img src="/logo.svg" alt="Prefeitura de Porto Velho" />`).
   * Sem logo, aparece um placeholder decorativo e um aviso no console em
   * desenvolvimento.
   */
  logo?: React.ReactNode;
  /**
   * Corta o nome em uma linha com reticências. Padrão: `false` — o nome quebra
   * linha no mobile para não esconder o serviço.
   */
  truncate?: boolean;
  /** Texto para leitor de tela anexado ao link. Padrão: "ir para o início". */
  homeLabel?: string;
}

const HeaderBrand = React.forwardRef<HTMLElement, HeaderBrandProps>(
  (
    {
      className,
      href = "/",
      orgName = "SEMEC",
      serviceName = "Nome do serviço",
      logo,
      truncate = false,
      homeLabel = "ir para o início",
      children,
      ...props
    },
    ref
  ) => {
    const hasLogo = logo !== undefined && logo !== null;

    React.useEffect(() => {
      if (hasLogo) return;
      let isDev = false;
      try {
        // Bundlers substituem `process.env.NODE_ENV` estaticamente; sem
        // bundler (e sem `process`), o acesso lança e o aviso é omitido.
        isDev = process.env.NODE_ENV !== "production";
      } catch {
        isDev = false;
      }
      if (isDev) {
        console.warn(
          "[@semec/ds] HeaderBrand sem `logo`: exibindo placeholder decorativo. Passe o logo do órgão com texto alternativo (ex.: <img alt=\"Prefeitura de Porto Velho\" />)."
        );
      }
    }, [hasLogo]);

    const content = (
      <>
        {hasLogo ? (
          logo
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-[90px] shrink-0 items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-alt text-xs font-medium text-muted-foreground"
          >
            Logo
          </span>
        )}
        {/* Espaços em texto: num contêiner flex não aparecem na tela, mas
            separam as palavras no nome acessível do link (TST-12). */}{" "}
        <span aria-hidden="true" className="h-7 w-px shrink-0 bg-border" />{" "}
        {children ?? (
          <span
            className={cn(
              "min-w-0 text-base font-bold leading-snug text-brand-hero",
              truncate ? "truncate" : "break-words"
            )}
          >
            {/* O "|" é só visual; os espaços separam os nomes (TST-12). */}
            {orgName}{" "}
            <span aria-hidden="true" className="font-normal text-muted-foreground">
              |
            </span>{" "}
            <span className="font-semibold text-foreground">{serviceName}</span>
          </span>
        )}
      </>
    );

    const rootClass = cn(
      "flex min-h-11 min-w-0 items-center gap-3 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    );

    if (href) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={rootClass} {...props}>
          {content}{" "}
          <span className="sr-only">— {homeLabel}</span>
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
