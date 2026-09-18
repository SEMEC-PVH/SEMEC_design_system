import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: Date | null;
  onChange?: (date: Date) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, value, onChange, disabled, min, max, ...props }, ref) => {
    const today = new Date();
    const [viewDate, setViewDate] = React.useState(
      value ? new Date(value.getFullYear(), value.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const minDate = min ? new Date(min) : undefined;
    const maxDate = max ? new Date(max) : undefined;

    const isSelected = (day: number) => {
      if (!value) return false;
      return value.getFullYear() === year && value.getMonth() === month && value.getDate() === day;
    };

    const isToday = (day: number) => {
      return (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      );
    };

    const isDisabled = (day: number) => {
      if (disabled) return true;
      const date = new Date(year, month, day);
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    const handleSelect = (day: number) => {
      if (isDisabled(day)) return;
      onChange?.(new Date(year, month, day));
    };

    const prevMonth = () => {
      setViewDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
      setViewDate(new Date(year, month + 1, 1));
    };

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    return (
      <div
        ref={ref}
        className={cn("p-3", className)}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium text-foreground">
            {MONTHS[month]} {year}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelect(day)}
                disabled={isDisabled(day)}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected(day)
                    ? "bg-primary text-primary-foreground"
                    : isToday(day)
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  isDisabled(day) && "pointer-events-none opacity-50"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
Calendar.displayName = "Calendar";

export { Calendar };
