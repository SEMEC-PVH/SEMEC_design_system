import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "../lib/utils";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Campo de data. Usa o `<input type="date">` nativo (sem biblioteca de
 * calendário), estilizado com os tokens do sistema. Valor ISO (`YYYY-MM-DD`).
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, value, onChange, disabled, ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
          className
        )}
        {...props}
      />
      <CalendarIcon
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
);
DatePicker.displayName = "DatePicker";

export { DatePicker };