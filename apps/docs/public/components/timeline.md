---
title: "Linha do tempo"
code: "timeline"
slug: "timeline"
file: "src/components/timeline.tsx"
category: "conteudo-dados"
variants: "composição: Timeline · TimelineItem · TimelineSeparator · TimelineDot · TimelineConnector · TimelineContent · TimelineTitle · TimelineDescription · dot variant: default · success · warning · destructive · info"
---

# Linha do tempo — `timeline`

> Sequência temporal com dots, conectores e conteúdo.

**Arquivo:** `src/components/timeline.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/timeline`

## Variantes

- **composição**: Timeline · TimelineItem · TimelineSeparator · TimelineDot · TimelineConnector · TimelineContent · TimelineTitle · TimelineDescription
- **dot variant**: default · success · warning · destructive · info

## Instalação (@semec/ds/react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale @semec/ds/react pelo registry)
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
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent, TimelineTitle, TimelineDescription } from "semec-ds/react";

<Timeline>
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot variant="success" />
      <TimelineConnector />
    </TimelineSeparator>
    <TimelineContent>
      <TimelineTitle>Protocolo recebido</TimelineTitle>
      <TimelineDescription>12/08/2026 às 14:30</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot />
    </TimelineSeparator>
    <TimelineContent>
      <TimelineTitle>Em análise</TimelineTitle>
      <TimelineDescription>Aguardando parecer</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

## Prompt para IA

```text
Crie um timeline (Linha do tempo) usando semec-ds/react (`src/components/timeline.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: Timeline · TimelineItem · TimelineSeparator · TimelineDot · TimelineConnector · TimelineContent · TimelineTitle · TimelineDescription · dot variant: default · success · warning · destructive · info. Sequência temporal com dots, conectores e conteúdo.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex flex-col gap-0", className)}
    {...props}
  />
));
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex gap-4 pb-8 last:pb-0", className)}
    {...props}
  />
));
TimelineItem.displayName = "TimelineItem";

const TimelineSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex flex-col items-center", className)}
    {...props}
  />
));
TimelineSeparator.displayName = "TimelineSeparator";

const TimelineDot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "success" | "warning" | "destructive" | "info" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-10 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background",
      variant === "default" && "bg-primary",
      variant === "success" && "bg-success",
      variant === "warning" && "bg-warning",
      variant === "destructive" && "bg-destructive",
      variant === "info" && "bg-info",
      className
    )}
    {...props}
  />
));
TimelineDot.displayName = "TimelineDot";

const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute left-[5px] top-3 h-full w-px bg-border", className)}
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
    className={cn("flex-1 pt-0", className)}
    {...props}
  />
));
TimelineContent.displayName = "TimelineContent";

const TimelineTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium text-foreground leading-none mb-1", className)}
    {...props}
  />
));
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

```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
