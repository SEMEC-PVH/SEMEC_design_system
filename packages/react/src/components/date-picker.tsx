"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

export interface DatePickerLabels {
  /** Nome acessível do botão que abre o calendário. Padrão: "Abrir calendário". */
  openCalendar: string;
}

const defaultLabels: DatePickerLabels = {
  openCalendar: "Abrir calendário",
};

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  /** Textos fixos (PT-BR por padrão). */
  labels?: Partial<DatePickerLabels>;
}

/**
 * Campo de data. Usa o `<input type="date">` nativo (sem biblioteca de
 * calendário), estilizado com os tokens do sistema. Valor ISO (`YYYY-MM-DD`).
 *
 * Um único indicador: o ícone do kit é um botão de 44px que chama
 * `showPicker()` (com recuo para foco no campo), e o indicador nativo do
 * WebKit/Blink fica escondido. No Firefox, que não deixa esconder o botão
 * nativo, o ícone do kit sai e fica só o nativo.
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, value, onChange, disabled, readOnly, labels, ...props }, ref) => {
    const text = { ...defaultLabels, ...labels };
    const field = useFormFieldControl(props, { supportsRequired: true });
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = React.useCallback(
      (el: HTMLInputElement | null) => {
        inputRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref]
    );

    const openPicker = () => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      try {
        // showPicker exige gesto do usuário e pode falhar (iframe de outra
        // origem, navegador antigo); nesse caso o foco no campo já basta.
        input.showPicker?.();
      } catch {
        /* recuo: o campo já está focado */
      }
    };

    return (
      <div className="relative">
        <input
          ref={setRefs}
          type="date"
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-12 text-sm text-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive [&::-webkit-calendar-picker-indicator]:hidden",
            className
          )}
          {...props}
          {...field}
        />
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || readOnly}
          aria-label={text.openCalendar}
          className="absolute right-0 top-0 inline-flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 supports-[-moz-appearance:none]:hidden"
        >
          <CalendarIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
