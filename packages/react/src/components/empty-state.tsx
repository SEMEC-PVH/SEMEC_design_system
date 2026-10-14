import * as React from "react";

import { cn } from "../lib/utils";
import type { HeadingTag } from "./heading";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /**
   * Elemento do título. Padrão: `h3` (comportamento anterior). Ajuste ao
   * nível da página para não pular níveis (ex.: `h2` logo abaixo do `h1`).
   */
  titleAs?: HeadingTag;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, titleAs: TitleTag = "h3", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-alt/50 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:h-6 [&>svg]:w-6"
        >
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <TitleTag className="text-lg font-semibold text-foreground">{title}</TitleTag>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

export { EmptyState };