import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, ...props }, ref) => (
    <nav ref={ref} aria-label="Trilha de navegação" className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          // O separador vem no fim do item anterior (dentro do mesmo `li`, que
          // não quebra entre texto e separador): quando a trilha quebra no
          // mobile, a linha nova começa pelo item, nunca por um "›" solto.
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-4">
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-medium text-foreground")}>
                  {item.label}
                </span>
              ) : (
                // Alvo de 44 px no mobile (TST-10): a altura vem do layout
                // (`max-sm:min-h-11`, a trilha fica mais alta só abaixo de
                // `sm`); a largura mínima vem de um ::after centralizado, que
                // não empurra os vizinhos. No desktop, o link segue do tamanho
                // do texto.
                <a
                  href={item.href}
                  className="relative inline-flex items-center transition-colors duration-fast ease-standard hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background max-sm:min-h-11 max-sm:after:absolute max-sm:after:inset-y-0 max-sm:after:left-1/2 max-sm:after:w-full max-sm:after:min-w-11 max-sm:after:-translate-x-1/2"
                >
                  {item.label}
                </a>
              )}
              {!isLast ? (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 opacity-50"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  )
);
Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };