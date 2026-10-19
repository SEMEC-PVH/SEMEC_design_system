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
   * Foca o resumo automaticamente. Com `focusKey`, o foco vem **só** quando o
   * `focusKey` muda (inclusive na montagem, se for um valor ainda não focado
   * naquele formulário). Sem `focusKey`, foca quando o resumo aparece (de 0
   * para N erros). Mudanças só na lista de erros (validação ao vivo) nunca
   * movem o foco. Padrão: `true`.
   */
  autoFocus?: boolean;
  /**
   * Valor que muda a cada envio inválido (ex.: `tentativa`, somada no callback
   * de envio inválido do `handleSubmit`). É o único gatilho de foco quando
   * informado: o resumo que some e volta durante a digitação (0 → N erros) não
   * rouba o foco do campo (WCAG 3.2.2; TST-01). O último valor focado fica
   * guardado no `<form>` (ou no elemento pai) e sobrevive à desmontagem, então
   * a renderização condicional (`erros.length > 0 && <ErrorSummary … />`)
   * também funciona.
   */
  focusKey?: unknown;
}

// Último `focusKey` visto por âncora (o `<form>` ou o pai do resumo). Fica fora
// do componente porque a receita monta o resumo só quando há erros: sem isso,
// cada remontagem (0 → N erros na validação ao vivo) pareceria um envio novo.
const focusKeyPorAncora = new WeakMap<Element, unknown>();

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

    // Gatilhos de foco (WCAG 3.2.2; TST-01, #48). Mudar só a contagem — a
    // validação ao vivo do RHF ou do Formik revalida a cada tecla — nunca tira
    // o foco do campo em que a pessoa digita.
    // - Com `focusKey`: foca só quando ele difere do último valor visto naquela
    //   âncora. O resumo que some e volta com o mesmo `focusKey` não foca.
    // - Sem `focusKey`: foca na transição de 0 para N erros (comportamento
    //   legado; com validação ao vivo, passe `focusKey`).
    const prevCount = React.useRef(0);
    const ultimaChave = React.useRef<{ valor: unknown } | null>(null);
    const count = errors.length;
    const temFocusKey = focusKey !== undefined;
    React.useEffect(() => {
      const el = internalRef.current;
      let deveFocar = false;
      if (temFocusKey) {
        // A chave só é consumida com erros na tela: no Formik o `submitCount`
        // muda antes de os erros chegarem, e o foco espera por eles.
        if (count > 0) {
          const ancora = el?.closest("form") ?? el?.parentElement ?? null;
          const vista =
            ancora && focusKeyPorAncora.has(ancora)
              ? { valor: focusKeyPorAncora.get(ancora) }
              : ultimaChave.current;
          deveFocar = vista === null || !Object.is(vista.valor, focusKey);
          ultimaChave.current = { valor: focusKey };
          if (ancora) focusKeyPorAncora.set(ancora, focusKey);
        }
      } else {
        deveFocar = prevCount.current === 0 && count > 0;
      }
      prevCount.current = count;

      if (autoFocus && deveFocar) el?.focus();
    }, [autoFocus, count, focusKey, temFocusKey]);

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
