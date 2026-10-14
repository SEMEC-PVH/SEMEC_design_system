import * as React from "react";

import { cn } from "../lib/utils";
import type { HeadingTag } from "./heading";

/**
 * Linha do tempo como lista ordenada (`<ol>`); cada `TimelineItem` é um `<li>`.
 * O tipo do ref é `HTMLElement` para aceitar refs antigos de `div`.
 */
const Timeline = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref as React.Ref<HTMLOListElement>}
      className={cn("relative flex flex-col gap-0", className)}
      {...props}
    />
  )
);
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref as React.Ref<HTMLLIElement>}
      className={cn("group/timeline-item relative flex gap-4", className)}
      {...props}
    />
  )
);
TimelineItem.displayName = "TimelineItem";

const TimelineSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex shrink-0 flex-col items-center self-stretch", className)}
    {...props}
  />
));
TimelineSeparator.displayName = "TimelineSeparator";

export type TimelineDotVariant = "default" | "success" | "warning" | "destructive" | "info";

export interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TimelineDotVariant;
  /**
   * Status do item em texto para leitor de tela (ex.: "Concluído", "Pendente").
   * A cor do ponto sozinha não comunica o status (WCAG 1.4.1).
   */
  srLabel?: string;
}

const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  ({ className, variant = "default", srLabel, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-background",
        variant === "default" && "bg-primary",
        variant === "success" && "bg-success",
        variant === "warning" && "bg-warning",
        variant === "destructive" && "bg-destructive",
        variant === "info" && "bg-info",
        className
      )}
      {...props}
    >
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      {children}
    </div>
  )
);
TimelineDot.displayName = "TimelineDot";

/**
 * Conector vertical entre itens. Ocupa a altura restante do item
 * (`flex-1`), com `border-strong` (3,77:1 sobre `surface`). Omita no último item.
 */
const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn("my-1 min-h-6 w-0.5 flex-1 rounded-full bg-border-strong", className)}
    {...props}
  />
));
TimelineConnector.displayName = "TimelineConnector";

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0 flex-1 pb-8 pt-0 group-last/timeline-item:pb-0", className)}
    {...props}
  />
));
TimelineContent.displayName = "TimelineContent";

export interface TimelineTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elemento do título. Padrão: `div` (comportamento anterior). */
  as?: HeadingTag;
}

const TimelineTitle = React.forwardRef<HTMLDivElement, TimelineTitleProps>(
  ({ className, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("text-sm font-medium text-foreground leading-none mb-1", className)}
      {...props}
    />
  )
);
TimelineTitle.displayName = "TimelineTitle";

const TimelineDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
TimelineDescription.displayName = "TimelineDescription";

export {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineTitle,
  TimelineDescription,
};
