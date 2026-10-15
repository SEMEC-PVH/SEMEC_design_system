---
title: "Calendário"
code: "calendar"
slug: "calendario"
file: "src/components/calendar.tsx"
category: "formularios"
variants: "props: value · onValueChange · min · max (AAAA-MM-DD, data local) · disabled · labels?: Partial<{ previousMonth, nextMonth }> · removidas na 4.0: onChange(date) → use onValueChange · a11y: role=grid rotulado pelo mês (aria-live=polite) · roving tabindex · aria-selected · aria-current=date no dia de hoje · aria-disabled fora de min/max · nome '14 de outubro de 2026' · teclado: ←/→ dia · ↑/↓ semana · Home/End início/fim da semana · PageUp/PageDown mês · Shift+PageUp/PageDown ano · Enter/Espaço seleciona"
---

# Calendário — `calendar`

> Calendário mensal no padrão APG de grade de datas: uma parada de Tab na grade, setas, Home/End, PageUp/PageDown e nomes completos em PT-BR. Células e botões de 44px.

**Arquivo:** `src/components/calendar.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/calendario`

## Variantes

- **props**: value · onValueChange · min · max (AAAA-MM-DD, data local) · disabled · labels?: Partial<{ previousMonth, nextMonth }>
- **removidas na 4.0**: onChange(date) → use onValueChange
- **a11y**: role=grid rotulado pelo mês (aria-live=polite) · roving tabindex · aria-selected · aria-current=date no dia de hoje · aria-disabled fora de min/max · nome "14 de outubro de 2026"
- **teclado**: ←/→ dia · ↑/↓ semana · Home/End início/fim da semana · PageUp/PageDown mês · Shift+PageUp/PageDown ano · Enter/Espaço seleciona

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Calendar } from "@semec/ds/react";

<Calendar value={data} onValueChange={setData} />

<Calendar value={data} onValueChange={setData} min="2026-01-01" max="2026-12-31" />
```

## Prompt para IA

```text
Use o componente `Calendar` (Calendário) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Calendário mensal no padrão APG de grade de datas: uma parada de Tab na grade, setas, Home/End, PageUp/PageDown e nomes completos em PT-BR. Células e botões de 44px. API e variantes: props: value · onValueChange · min · max (AAAA-MM-DD, data local) · disabled · labels?: Partial<{ previousMonth, nextMonth }> · removidas na 4.0: onChange(date) → use onValueChange · a11y: role=grid rotulado pelo mês (aria-live=polite) · roving tabindex · aria-selected · aria-current=date no dia de hoje · aria-disabled fora de min/max · nome "14 de outubro de 2026" · teclado: ←/→ dia · ↑/↓ semana · Home/End início/fim da semana · PageUp/PageDown mês · Shift+PageUp/PageDown ano · Enter/Espaço seleciona. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { reportRemovedOnChange } from "../lib/removed-prop";
import { cn } from "../lib/utils";

const LOCALE = "pt-BR";

const WEEKDAYS = [
  { short: "Dom", long: "domingo" },
  { short: "Seg", long: "segunda-feira" },
  { short: "Ter", long: "terça-feira" },
  { short: "Qua", long: "quarta-feira" },
  { short: "Qui", long: "quinta-feira" },
  { short: "Sex", long: "sexta-feira" },
  { short: "Sáb", long: "sábado" },
];

const dayFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
});

/** Textos anunciados pelo Calendar. Todos têm padrão em PT-BR. */
export interface CalendarLabels {
  /** Nome do botão que volta um mês. Padrão: "Mês anterior". */
  previousMonth: string;
  /** Nome do botão que avança um mês. Padrão: "Próximo mês". */
  nextMonth: string;
}

const DEFAULT_LABELS: CalendarLabels = {
  previousMonth: "Mês anterior",
  nextMonth: "Próximo mês",
};

/**
 * Tipo impossível de satisfazer, com nome que explica o erro: o `onChange`
 * saiu na 4.0 (AUD-35). Com `never`, o `tsc` dizia só "not assignable to type
 * 'undefined'"; com este tipo, a mensagem cita o `onValueChange`.
 */
interface OnChangeRemovidoUseOnValueChange {
  readonly "onChange saiu na 4.0: use onValueChange": never;
}

export interface CalendarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: Date | null;
  /** Recebe a data escolhida (contrato de formulário, ADR-015). */
  onValueChange?: (date: Date) => void;
  /**
   * Removido na 4.0 (AUD-35): use `onValueChange`. O Calendar não tem
   * `onChange` próprio nem repassa `onChange` ao DOM; o tipo recusa a prop
   * e, em JavaScript, um handler passado aqui é descartado e nunca é chamado
   * (com um `console.error` único em desenvolvimento).
   */
  onChange?: OnChangeRemovidoUseOnValueChange;
  disabled?: boolean;
  /** Data mínima selecionável (`AAAA-MM-DD`). */
  min?: string;
  /** Data máxima selecionável (`AAAA-MM-DD`). */
  max?: string;
  /** Sobrescreve os textos anunciados (AUD-31). */
  labels?: Partial<CalendarLabels>;
}

/** Lê `AAAA-MM-DD` como data local (o `new Date("AAAA-MM-DD")` usa UTC e erra um dia no Brasil). */
function parseDateString(input?: string): Date | undefined {
  if (!input) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a?: Date | null, b?: Date | null) {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Soma meses mantendo o dia, limitado ao último dia do mês de destino. */
function addMonths(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const navButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

/**
 * Calendário mensal no padrão APG "date picker grid": uma única parada de
 * `Tab` na grade (roving tabindex), setas movem por dia/semana, `Home`/`End`
 * vão ao início/fim da semana, `PageUp`/`PageDown` trocam o mês
 * (`Shift` + `PageUp`/`PageDown` trocam o ano) e `Enter`/`Espaço` selecionam.
 */
const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, value, onChange: _removedOnChange, onValueChange, disabled, min, max, labels, ...props }, ref) => {
    // onChange saiu na 4.0 (AUD-35): descartado, com erro único em dev.
    if (_removedOnChange !== undefined) reportRemovedOnChange("Calendar");
    const text = { ...DEFAULT_LABELS, ...labels };
    const headingId = React.useId();
    const today = startOfDay(new Date());

    const minDate = parseDateString(min);
    const maxDate = parseDateString(max);

    const [focusedDate, setFocusedDate] = React.useState<Date>(() =>
      value ? startOfDay(value) : today
    );
    const gridRef = React.useRef<HTMLTableElement>(null);
    const shouldFocusRef = React.useRef(false);

    // Valor controlado de fora: leva a grade até a data escolhida.
    const valueKey = value ? startOfDay(value).getTime() : null;
    React.useEffect(() => {
      if (valueKey !== null) setFocusedDate(new Date(valueKey));
    }, [valueKey]);

    const year = focusedDate.getFullYear();
    const month = focusedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    React.useEffect(() => {
      if (!shouldFocusRef.current) return;
      shouldFocusRef.current = false;
      const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]');
      cell?.focus();
    }, [focusedDate]);

    const isDisabled = (date: Date) => {
      if (disabled) return true;
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    const select = (date: Date) => {
      if (isDisabled(date)) return;
      onValueChange?.(date);
    };

    const moveFocus = (date: Date) => {
      shouldFocusRef.current = true;
      setFocusedDate(date);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
      let next: Date | null = null;
      switch (event.key) {
        case "ArrowLeft":
          next = addDays(focusedDate, -1);
          break;
        case "ArrowRight":
          next = addDays(focusedDate, 1);
          break;
        case "ArrowUp":
          next = addDays(focusedDate, -7);
          break;
        case "ArrowDown":
          next = addDays(focusedDate, 7);
          break;
        case "Home":
          next = addDays(focusedDate, -focusedDate.getDay());
          break;
        case "End":
          next = addDays(focusedDate, 6 - focusedDate.getDay());
          break;
        case "PageUp":
          next = addMonths(focusedDate, event.shiftKey ? -12 : -1);
          break;
        case "PageDown":
          next = addMonths(focusedDate, event.shiftKey ? 12 : 1);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          select(focusedDate);
          return;
        default:
          return;
      }
      event.preventDefault();
      moveFocus(next);
    };

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return (
      <div ref={ref} className={cn("p-3", className)} {...props}>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFocusedDate(addMonths(focusedDate, -1))}
            className={navButtonClass}
            aria-label={text.previousMonth}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div
            id={headingId}
            aria-live="polite"
            aria-atomic="true"
            className="text-sm font-medium text-foreground"
          >
            {capitalize(monthFormatter.format(new Date(year, month, 1)))}
          </div>
          <button
            type="button"
            onClick={() => setFocusedDate(addMonths(focusedDate, 1))}
            className={navButtonClass}
            aria-label={text.nextMonth}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <table
          ref={gridRef}
          role="grid"
          aria-labelledby={headingId}
          aria-disabled={disabled || undefined}
          onKeyDown={handleKeyDown}
          className="border-separate border-spacing-0"
        >
          <thead>
            <tr>
              {WEEKDAYS.map((day) => (
                <th
                  key={day.short}
                  scope="col"
                  abbr={day.long}
                  className="h-8 w-11 p-0 text-xs font-medium text-muted-foreground"
                >
                  {day.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, w) => (
              <tr key={w}>
                {week.map((date, i) => {
                  if (!date) return <td key={`empty-${w}-${i}`} className="p-0" />;
                  const selected = isSameDay(date, value);
                  const isToday = isSameDay(date, today);
                  const off = isDisabled(date);
                  const focusable = isSameDay(date, focusedDate);
                  return (
                    <td
                      key={date.getDate()}
                      // Explícito: nem toda árvore de acessibilidade deriva gridcell do
                      // <td> dentro de role="grid", e aria-selected só vale em gridcell.
                      role="gridcell"
                      tabIndex={focusable ? 0 : -1}
                      aria-selected={selected}
                      aria-current={isToday ? "date" : undefined}
                      aria-disabled={off || undefined}
                      aria-label={dayFormatter.format(date)}
                      onClick={() => {
                        setFocusedDate(date);
                        select(date);
                      }}
                      className={cn(
                        "h-11 w-11 cursor-pointer select-none rounded-md p-0 text-center align-middle text-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "bg-primary font-semibold text-primary-foreground"
                          : isToday
                            ? "bg-accent font-semibold text-accent-foreground underline underline-offset-4"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        off && "cursor-default opacity-50 hover:bg-transparent"
                      )}
                    >
                      {date.getDate()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);
Calendar.displayName = "Calendar";

export { Calendar };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
