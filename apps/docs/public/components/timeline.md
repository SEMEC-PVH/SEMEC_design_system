---
title: "Linha do tempo"
code: "timeline"
slug: "timeline"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/timeline.tsx"
category: "conteudo-dados"
variants: "composição: Timeline · TimelineItem · TimelineSeparator · TimelineDot · TimelineConnector · TimelineContent · TimelineTitle · TimelineDescription · dot variant: default · success · warning · destructive · info · props: TimelineDot srLabel · TimelineTitle as (padrão div) · a11y: ol/li · srLabel com o status por item · conector border-strong (3,77:1)"
---

# Linha do tempo — `timeline`

> Sequência temporal em lista ordenada (ol/li), com pontos, conectores visíveis e conteúdo. O status vai em texto (srLabel), não só na cor.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/timeline.tsx) | **Categoria:** Conteúdo e dados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/timeline/

## Variantes

- **composição**: Timeline · TimelineItem · TimelineSeparator · TimelineDot · TimelineConnector · TimelineContent · TimelineTitle · TimelineDescription
- **dot variant**: default · success · warning · destructive · info
- **props**: TimelineDot srLabel · TimelineTitle as (padrão div)
- **a11y**: ol/li · srLabel com o status por item · conector border-strong (3,77:1)

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers@^5 zod@^4.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.1. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent, TimelineTitle, TimelineDescription } from "@semec/ds/react";

<Timeline>
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot variant="success" srLabel="Concluído" />
      <TimelineConnector />
    </TimelineSeparator>
    <TimelineContent>
      <TimelineTitle>Protocolo recebido</TimelineTitle>
      <TimelineDescription>12/08/2026 às 14:30</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot srLabel="Em andamento" />
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
Use o componente `Timeline` (Linha do tempo) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Sequência temporal em lista ordenada (ol/li), com pontos, conectores visíveis e conteúdo. O status vai em texto (srLabel), não só na cor. API e variantes: composição: Timeline · TimelineItem · TimelineSeparator · TimelineDot · TimelineConnector · TimelineContent · TimelineTitle · TimelineDescription · dot variant: default · success · warning · destructive · info · props: TimelineDot srLabel · TimelineTitle as (padrão div) · a11y: ol/li · srLabel com o status por item · conector border-strong (3,77:1). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
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
      className={cn("text-sm font-medium text-foreground leading-tight mb-1", className)}
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

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
