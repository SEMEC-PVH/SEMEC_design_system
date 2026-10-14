import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "default" | "inline";
}

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title,
      description,
      icon,
      action,
      onRetry,
      retryLabel = "Tentar novamente",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const isInline = variant === "inline";

    const defaultIcon = (
      <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
    );

    const renderAction = () => {
      if (action) return action;
      if (onRetry) {
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        );
      }
      return null;
    };

    if (isInline) {
      return (
        <div
          ref={ref}
          role="alert"
          aria-live="assertive"
          className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive-surface px-4 py-3 text-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {icon ?? defaultIcon}
            </div>
            <div className="space-y-0.5 text-left">
              <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
              {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {renderAction() ? (
            <div className="shrink-0 self-end sm:self-center">{renderAction()}</div>
          ) : null}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive-surface/40 px-6 py-12 text-center",
          className
        )}
        {...props}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-surface text-destructive [&>svg]:h-6 [&>svg]:w-6">
          {icon ?? <AlertCircle aria-hidden="true" />}
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {renderAction() ? <div className="mt-2">{renderAction()}</div> : null}
      </div>
    );
  }
);
ErrorState.displayName = "ErrorState";

export { ErrorState };
