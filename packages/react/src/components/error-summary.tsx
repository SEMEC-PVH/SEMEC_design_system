"use client";

import * as React from "react";

import { cn } from "../lib/utils";

export interface ErrorSummaryItem {
  /** `id` do campo com erro (ou `name`, como recuo). */
  id: string;
  message: string;
}

export interface ErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  errors?: ErrorSummaryItem[];
  autoFocus?: boolean;
  focusKey?: unknown;
}

// Primeiro elemento focável dentro do alvo (input hidden não conta).
const FOCUSABLE =
  'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])';

const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  (
    { title = "Há um problema", errors = [], autoFocus = true, focusKey, className, id, ...props },
    ref
  ) => {
    const internalRef = React.useRef<HTMLDivElement | null>(null);
    const generatedId = React.useId();
    const titleId = `${id ?? generatedId}-title`;

    const setRefs = React.useCallback(
      (el: HTMLDivElement | null) => {
        internalRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref]
    );

    React.useEffect(() => {
      if (autoFocus && errors.length > 0) {
        internalRef.current?.focus();
      }
    }, [autoFocus, errors.length, focusKey]);

    if (errors.length === 0) return null;

    function irParaCampo(event: React.MouseEvent<HTMLAnchorElement>, alvoId: string) {
      const doc = event.currentTarget.ownerDocument;
      const alvo =
        doc.getElementById(alvoId) ??
        doc.querySelector(`[name="${CSS.escape(alvoId)}"]:not([type="hidden"])`);
      if (!alvo) return;

      event.preventDefault();

      const focavel = alvo.matches(FOCUSABLE)
        ? alvo
        : alvo.querySelector(FOCUSABLE) ?? alvo;

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
        ref={setRefs}
        id={id}
        role="alert"
        tabIndex={-1}
        aria-labelledby={titleId}
        className={cn(
          "border-2 border-l-[3px] border-destructive rounded-md bg-destructive/5 p-4 px-6",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
          className
        )}
        {...props}
      >
        <h2
          id={titleId}
          className="text-xl font-semibold text-destructive mb-3"
        >
          {title}
        </h2>

        <ul className="space-y-2 ml-0 pl-6 text-base">
          {errors.map((erro, index) => (
            <li key={erro.id || index}>
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
