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
