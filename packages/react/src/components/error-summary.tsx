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
  /**
   * Foca o resumo quando ele aparece (de 0 para N erros) e a cada troca de
   * `focusKey`. Mudanças só na lista de erros (validação ao vivo) não movem o
   * foco. Padrão: `true`.
   */
  autoFocus?: boolean;
  /**
   * Valor que muda a cada envio (ex.: `formState.submitCount`) para devolver o
   * foco ao resumo mesmo quando os erros continuam os mesmos.
   */
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

    // Foco só quando o resumo aparece (0 → N erros) ou quando o `focusKey`
    // muda (novo envio). Mudar só a contagem — a validação ao vivo do RHF ou
    // do Formik revalida a cada tecla — não pode tirar o foco do campo em que
    // a pessoa digita (WCAG 3.2.2; TST-01).
    const prevCount = React.useRef(0);
    const prevFocusKey = React.useRef<unknown>(focusKey);
    const count = errors.length;
    React.useEffect(() => {
      const apareceu = prevCount.current === 0 && count > 0;
      const novoEnvio = !Object.is(prevFocusKey.current, focusKey);
      prevCount.current = count;
      prevFocusKey.current = focusKey;
      if (autoFocus && count > 0 && (apareceu || novoEnvio)) {
        internalRef.current?.focus();
      }
    }, [autoFocus, count, focusKey]);

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
