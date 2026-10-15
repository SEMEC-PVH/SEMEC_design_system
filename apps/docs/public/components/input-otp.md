---
title: "Input OTP"
code: "input-otp"
slug: "input-otp"
file: "src/components/input-otp.tsx"
category: "formularios"
variants: "composição: InputOTP · InputOTPGroup · InputOTPSlot · InputOTPSeparator · props: maxLength · disabled · labels (group · slot(index, total))"
---

# Input OTP — `input-otp`

> Campo de código OTP com foco automático entre dígitos.

**Arquivo:** `src/components/input-otp.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/input-otp`

## Variantes

- **composição**: InputOTP · InputOTPGroup · InputOTPSlot · InputOTPSeparator
- **props**: maxLength · disabled · labels (group · slot(index, total))

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@semec/ds/react";

<InputOTP value={code} onChange={setCode} maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

## Prompt para IA

```text
Use o componente `InputOTP` (Input OTP) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Campo de código OTP com foco automático entre dígitos. API e variantes: composição: InputOTP · InputOTPGroup · InputOTPSlot · InputOTPSeparator · props: maxLength · disabled · labels (group · slot(index, total)). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

interface InputOTPContextValue {
  slots: string[];
  handleSlotChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (index: number, e: React.ClipboardEvent<HTMLInputElement>) => void;
  registerSlot: (index: number, el: HTMLInputElement | null) => void;
  maxLength: number;
  disabled?: boolean;
  invalid?: boolean;
  labels: InputOTPLabels;
}

export interface InputOTPLabels {
  /** Nome do grupo quando não há `aria-label`/`aria-labelledby`. Padrão: "Código de verificação". */
  group: string;
  /** Nome de cada dígito. Padrão: `Dígito ${index + 1} de ${total}`. */
  slot: (index: number, total: number) => string;
}

const defaultLabels: InputOTPLabels = {
  group: "Código de verificação",
  slot: (index, total) => `Dígito ${index + 1} de ${total}`,
};

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null);

function useInputOTP() {
  const ctx = React.useContext(InputOTPContext);
  if (!ctx) throw new Error("InputOTP compound components must be used within <InputOTP>");
  return ctx;
}

export interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Valor controlado. Sem ele, o componente guarda o estado sozinho. */
  value?: string;
  /**
   * Recebe os dígitos preenchidos concatenados, sem lacunas: com "1" no slot 1
   * e "6" no slot 6, o valor emitido é "16" (a tela mantém as posições).
   */
  onChange?: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  /** Textos fixos (PT-BR por padrão). */
  labels?: Partial<InputOTPLabels>;
}

// Array de tamanho fixo: cada posição é um slot, mesmo vazio.
// Evita que "1" no slot 1 e "6" no slot 6 virem "16" ao reconstruir o valor.
const toSlots = (str: string, length: number) =>
  Array.from({ length }, (_, i) => str[i] ?? "");

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, value, onChange, maxLength = 6, disabled, labels, children, ...props }, ref) => {
    const isControlled = value !== undefined;
    const slotsRef = React.useRef<(HTMLInputElement | null)[]>([]);
    const [internalSlots, setSlots] = React.useState<string[]>(() =>
      toSlots(value ?? "", maxLength)
    );

    // Modo controlado: a tela reflete sempre o `value` do pai. O array interno
    // só é usado enquanto o pai aceitar o que foi emitido (value === join), o
    // que preserva a posição de dígitos digitados fora de ordem na tela.
    // Se o pai recusar, truncar ou resetar o valor, vale o `value`.
    const internalValue = internalSlots.join("");
    const slots =
      isControlled && value !== internalValue
        ? toSlots(value, maxLength)
        : internalSlots.length === maxLength
          ? internalSlots
          : toSlots(internalValue, maxLength);

    const focusSlot = React.useCallback((index: number) => {
      const el = slotsRef.current[index];
      el?.focus();
      el?.select();
    }, []);

    const commit = React.useCallback(
      (next: string[]) => {
        setSlots(next);
        onChange?.(next.join(""));
      },
      [onChange]
    );

    const fillFrom = React.useCallback(
      (start: number, digits: string) => {
        const next = [...slots];
        const chars = digits.slice(0, maxLength - start).split("");
        chars.forEach((char, i) => {
          next[start + i] = char;
        });
        commit(next);
        focusSlot(Math.min(start + chars.length, maxLength - 1));
      },
      [slots, maxLength, commit, focusSlot]
    );

    const handleSlotChange = React.useCallback(
      (index: number, raw: string) => {
        if (disabled) return;
        const digits = raw.replace(/\D/g, "");
        if (digits.length > 1) {
          // Dígito digitado sobre um slot já preenchido sem seleção: fica o novo.
          const current = slots[index];
          if (digits.length === 2 && current && digits.includes(current)) {
            fillFrom(index, digits.replace(current, ""));
            return;
          }
          // Autopreenchimento (autocomplete="one-time-code"): distribui pelos slots.
          fillFrom(digits.length >= maxLength ? 0 : index, digits);
          return;
        }
        const next = [...slots];
        next[index] = digits;
        commit(next);
        if (digits && index < maxLength - 1) focusSlot(index + 1);
      },
      [disabled, slots, maxLength, commit, fillFrom, focusSlot]
    );

    const handleKeyDown = React.useCallback(
      (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        if (e.key === "Backspace") {
          e.preventDefault();
          const next = [...slots];
          if (next[index]) {
            next[index] = "";
            commit(next);
          } else if (index > 0) {
            next[index - 1] = "";
            commit(next);
            focusSlot(index - 1);
          }
        } else if (e.key === "Delete") {
          e.preventDefault();
          if (slots[index]) {
            const next = [...slots];
            next[index] = "";
            commit(next);
          }
        } else if (e.key === "ArrowLeft" && index > 0) {
          e.preventDefault();
          focusSlot(index - 1);
        } else if (e.key === "ArrowRight" && index < maxLength - 1) {
          e.preventDefault();
          focusSlot(index + 1);
        }
      },
      [disabled, slots, maxLength, commit, focusSlot]
    );

    const handlePaste = React.useCallback(
      (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
        if (!pasted) return;
        // Código completo começa no primeiro slot; trecho parcial, no slot focado.
        fillFrom(pasted.length >= maxLength ? 0 : index, pasted);
      },
      [disabled, maxLength, fillFrom]
    );

    const registerSlot = React.useCallback((index: number, el: HTMLInputElement | null) => {
      slotsRef.current[index] = el;
    }, []);

    // Dentro de um FormField: o grupo (div) não é rotulável por <label for>,
    // então recebe aria-labelledby do rótulo, mais describedby/invalid.
    const field = useFormFieldControl(props, { labelable: false });
    const text = { ...defaultLabels, ...labels };
    const invalid = field["aria-invalid"] ?? props["aria-invalid"];

    const contextValue: InputOTPContextValue = {
      slots,
      handleSlotChange,
      handleKeyDown,
      handlePaste,
      registerSlot,
      maxLength,
      disabled,
      invalid: invalid === true || invalid === "true",
      labels: text,
    };

    // Grupo rotulado: o consumidor pode passar aria-label/aria-labelledby.
    const hasLabel =
      props["aria-label"] !== undefined ||
      (field["aria-labelledby"] ?? props["aria-labelledby"]) !== undefined;

    return (
      <InputOTPContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="group"
          aria-label={hasLabel ? undefined : text.group}
          className={cn("flex items-center gap-2", className)}
          {...props}
          {...field}
        >
          {children}
        </div>
      </InputOTPContext.Provider>
    );
  }
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
));
InputOTPGroup.displayName = "InputOTPGroup";

export interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
}

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ className, index, ...props }, ref) => {
    const {
      slots,
      handleSlotChange,
      handleKeyDown,
      handlePaste,
      registerSlot,
      maxLength,
      disabled,
      invalid,
      labels,
    } = useInputOTP();
    const value = slots[index] || "";
    const inputRef = React.useCallback(
      (el: HTMLInputElement | null) => registerSlot(index, el),
      [registerSlot, index]
    );

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md border border-input bg-background text-lg font-medium text-foreground shadow-elevation-1 transition-colors duration-fast ease-standard focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          disabled && "opacity-50 cursor-not-allowed",
          invalid && "border-destructive",
          className
        )}
        {...props}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          value={value}
          disabled={disabled}
          onChange={(e) => handleSlotChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.currentTarget.select()}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[inherit] border-0 bg-transparent text-center text-lg font-medium text-foreground caret-transparent outline-none"
          aria-label={labels.slot(index, maxLength)}
          aria-invalid={invalid || undefined}
        />
        <span aria-hidden="true" className="pointer-events-none">
          {value || ""}
        </span>
      </div>
    );
  }
);
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-hidden="true"
    className={cn("px-1 text-lg font-medium text-muted-foreground", className)}
    {...props}
  >
    –
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
