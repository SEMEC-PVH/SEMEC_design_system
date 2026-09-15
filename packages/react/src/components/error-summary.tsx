"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

import { cn } from "../lib/utils";

interface ErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  errors?: Array<{ id: string; message: string }>;
  autoFocus?: boolean;
  focusKey?: unknown;
}

const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  ({ title = "Há um problema", errors = [], autoFocus = true, focusKey, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    useEffect(() => {
      if (autoFocus && errors.length > 0) {
        resolvedRef.current?.focus();
      }
    }, [autoFocus, errors.length, focusKey, resolvedRef]);

    if (errors.length === 0) return null;

    function irParaCampo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
      const alvo =
        document.getElementById(id) ??
        document.querySelector(`[name="${id}"]`);
      if (!alvo) return;

      event.preventDefault();

      const focavel = alvo.matches("input, select, textarea, button")
        ? alvo
        : alvo.querySelector("input, select, textarea, button") ?? alvo;

      (focavel as HTMLElement).focus({ preventScroll: true });

      const menosMovimento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      focavel.scrollIntoView({
        block: "center",
        behavior: menosMovimento ? "auto" : "smooth",
      });
    }

    return (
      <div
        ref={resolvedRef}
        role="alert"
        tabIndex={-1}
        aria-labelledby="ds-error-summary-title"
        className={cn(
          "border-2 border-l-[3px] border-destructive rounded-md bg-destructive/5 p-4 px-6 mb-6",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
          className
        )}
        {...props}
      >
        <h2
          id="ds-error-summary-title"
          className="text-xl font-semibold text-destructive mb-3"
        >
          {title}
        </h2>

        <ul className="space-y-2 ml-0 pl-6 text-base">
          {errors.map((erro) => (
            <li key={erro.id}>
              <a
                href={`#${erro.id}`}
                onClick={(event) => irParaCampo(event, erro.id)}
                className="text-destructive font-medium underline underline-offset-[0.2em] hover:decoration-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 rounded-sm"
              >
                {erro.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);
ErrorSummary.displayName = "ErrorSummary";

export { ErrorSummary };
