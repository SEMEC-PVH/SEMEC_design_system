---
title: "Input OTP"
code: "input-otp"
slug: "input-otp"
file: "src/components/input-otp.tsx"
category: "formularios"
variants: "composição: InputOTP · InputOTPGroup · InputOTPSlot · InputOTPSeparator · props: maxLength · disabled"
---

# Input OTP — `input-otp`

> Campo de código OTP com foco automático entre dígitos.

**Arquivo:** `src/components/input-otp.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/input-otp`

## Variantes

- **composição**: InputOTP · InputOTPGroup · InputOTPSlot · InputOTPSeparator
- **props**: maxLength · disabled

## Instalação (semec-ds/react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale semec-ds/react pelo registry)
# 2. Instale deps (ver packages/react/README.md)
npm i class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
  @radix-ui/react-toast @radix-ui/react-tooltip
```

```css
/* globals.css */
@import "tailwindcss";
@import "./base/tokens.css";
@import "./base/shadcn.css";
/* ou @config "./base/pv-preset.ts" */
```

## Uso

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "semec-ds/react";

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
Crie um input-otp (Input OTP) usando semec-ds/react (`src/components/input-otp.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: InputOTP · InputOTPGroup · InputOTPSlot · InputOTPSeparator · props: maxLength · disabled. Campo de código OTP com foco automático entre dígitos.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

interface InputOTPContextValue {
  slots: string[];
  activeSlot: number;
  handleSlotChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  focusSlot: (index: number) => void;
  maxLength: number;
  disabled?: boolean;
}

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null);

function useInputOTP() {
  const ctx = React.useContext(InputOTPContext);
  if (!ctx) throw new Error("InputOTP compound components must be used within <InputOTP>");
  return ctx;
}

interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, value, onChange, maxLength = 6, disabled, children, ...props }, ref) => {
    const [activeSlot, setActiveSlot] = React.useState(0);
    const slotsRef = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleSlotChange = React.useCallback(
      (index: number, char: string) => {
        if (disabled) return;
        const digits = value.split("");
        digits[index] = char;
        const next = digits.join("").slice(0, maxLength);
        onChange(next);
        if (char && index < maxLength - 1) {
          setActiveSlot(index + 1);
          slotsRef.current[index + 1]?.focus();
        }
      },
      [value, onChange, maxLength, disabled]
    );

    const handleKeyDown = React.useCallback(
      (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        if (e.key === "Backspace") {
          e.preventDefault();
          const digits = value.split("");
          if (digits[index]) {
            digits[index] = "";
            onChange(digits.join(""));
          } else if (index > 0) {
            digits[index - 1] = "";
            onChange(digits.join(""));
            setActiveSlot(index - 1);
            slotsRef.current[index - 1]?.focus();
          }
        } else if (e.key === "ArrowLeft" && index > 0) {
          e.preventDefault();
          setActiveSlot(index - 1);
          slotsRef.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < maxLength - 1) {
          e.preventDefault();
          setActiveSlot(index + 1);
          slotsRef.current[index + 1]?.focus();
        }
      },
      [value, onChange, maxLength, disabled]
    );

    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, maxLength);
        if (pasted) {
          onChange(pasted);
          const nextIndex = Math.min(pasted.length, maxLength - 1);
          setActiveSlot(nextIndex);
          slotsRef.current[nextIndex]?.focus();
        }
      },
      [onChange, maxLength, disabled]
    );

    const focusSlot = React.useCallback((index: number) => {
      setActiveSlot(index);
      slotsRef.current[index]?.focus();
    }, []);

    const contextValue: InputOTPContextValue = {
      slots: value.split(""),
      activeSlot,
      handleSlotChange,
      handleKeyDown,
      handlePaste,
      focusSlot,
      maxLength,
      disabled,
    };

    return (
      <InputOTPContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("flex items-center gap-2", className)}
          {...props}
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

interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
}

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ className, index, ...props }, ref) => {
    const { slots, activeSlot, handleSlotChange, handleKeyDown, handlePaste, focusSlot, disabled } =
      useInputOTP();
    const value = slots[index] || "";

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-md border border-input bg-background text-lg shadow-sm transition-colors duration-fast ease-standard",
          activeSlot === index && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <input
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          disabled={disabled}
          onChange={(e) => handleSlotChange(index, e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => focusSlot(index)}
          className="absolute inset-0 h-full w-full cursor-pointer bg-transparent text-center text-lg font-medium text-foreground caret-transparent outline-none"
          aria-label={`Dígito ${index + 1}`}
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
    className={cn("text-muted-foreground", className)}
    {...props}
  >
    &ndash;
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };

```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
