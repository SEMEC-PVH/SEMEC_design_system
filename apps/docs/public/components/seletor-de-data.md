---
title: "Seletor de data"
code: "date-picker"
slug: "seletor-de-data"
file: "src/components/date-picker.tsx"
category: "formularios"
variants: "props: nativo HTML (min · max · disabled · name · required · onChange(evento)) + value · defaultValue · onValueChange(ISO) · invalid · labels.openCalendar · mudou na 4.0: onChange é o evento nativo do <input> (até a 3.x recebia a string); para o valor, use onValueChange"
---

# Seletor de data — `date-picker`

> Data com `<input type="date">` nativo — sem biblioteca de calendário. Um só indicador: botão "Abrir calendário" de 44px que chama `showPicker()` (o indicador nativo fica oculto; no Firefox, fica só o nativo).

**Arquivo:** `src/components/date-picker.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/seletor-de-data`

## Variantes

- **props**: nativo HTML (min · max · disabled · name · required · onChange(evento)) + value · defaultValue · onValueChange(ISO) · invalid · labels.openCalendar
- **mudou na 4.0**: onChange é o evento nativo do <input> (até a 3.x recebia a string); para o valor, use onValueChange

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
import { DatePicker, FormField } from "@semec/ds/react";

<FormField label="Data de vencimento" hint="dd/mm/aaaa">
  <DatePicker id="vencimento" name="vencimento" defaultValue="2026-08-31" />
</FormField>

// Controlado: onValueChange recebe o ISO (AAAA-MM-DD)
<FormField label="Data de início" error={erroData}>
  <DatePicker value={inicio} onValueChange={setInicio} />
</FormField>
```

## Prompt para IA

```text
Use o componente `DatePicker` (Seletor de data) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Data com `<input type="date">` nativo — sem biblioteca de calendário. Um só indicador: botão "Abrir calendário" de 44px que chama `showPicker()` (o indicador nativo fica oculto; no Firefox, fica só o nativo). API e variantes: props: nativo HTML (min · max · disabled · name · required · onChange(evento)) + value · defaultValue · onValueChange(ISO) · invalid · labels.openCalendar · mudou na 4.0: onChange é o evento nativo do <input> (até a 3.x recebia a string); para o valor, use onValueChange. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
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
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value"> {
  /** Valor ISO (`AAAA-MM-DD`), modo controlado. Para não controlado, use `defaultValue`. */
  value?: string;
  /** Recebe o valor ISO (`AAAA-MM-DD`, ou `""` ao limpar) a cada mudança (ADR-015). */
  onValueChange?: (value: string) => void;
  /**
   * Evento nativo do `<input type="date">`, como em `Input`/`Textarea`. Até a
   * 3.x recebia o valor (string); desde a 4.0 recebe o evento (AUD-35). Para o
   * valor já extraído, use `onValueChange`.
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** `true` vira `aria-invalid="true"` e o estilo de erro. Dentro de FormField, vence o estado dele. */
  invalid?: boolean;
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
  (
    { className, value, onChange, onValueChange, invalid, disabled, readOnly, labels, ...props },
    ref
  ) => {
    const text = { ...defaultLabels, ...labels };
    const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
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
          onChange={(e) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          className={cn(
            "flex h-11 w-full appearance-none rounded-md border border-input bg-surface px-3 py-2 pr-12 text-sm text-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive [&::-webkit-calendar-picker-indicator]:hidden",
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

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
