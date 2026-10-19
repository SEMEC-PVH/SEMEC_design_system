---
title: "Etapas"
code: "stepper"
slug: "etapas"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/stepper.tsx"
category: "navegacao"
variants: "orientation: horizontal (padrão; empilha abaixo de 768px) · vertical · estados: concluída (check) · atual (borda e texto em negrito) · pendente; sempre com texto sr-only · interação: onStepClick(index) · isStepClickable(index, status) (padrão: concluídas e atual) · labels: list · position(n, total) · complete · current · upcoming"
---

# Etapas — `stepper`

> Etapas de um processo (ex.: requerimento em 3 passos) numa lista ordenada. A etapa atual tem `aria-current="step"` e cada etapa diz em texto (para leitor de tela) se está concluída, atual ou pendente, não só pela cor. Horizontal a partir de 768px e empilhado em telas estreitas. Com `onStepClick`, as etapas concluídas e a atual viram botões de 44px.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/stepper.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/etapas/

## Variantes

- **orientation**: horizontal (padrão; empilha abaixo de 768px) · vertical
- **estados**: concluída (check) · atual (borda e texto em negrito) · pendente; sempre com texto sr-only
- **interação**: onStepClick(index) · isStepClickable(index, status) (padrão: concluídas e atual)
- **labels**: list · position(n, total) · complete · current · upcoming

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

> Não publicado: este conteúdo vem do repositório e inclui 3 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.3.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Stepper } from "@semec/ds/react";

const etapas = [
  { label: "Dados do estudante" },
  { label: "Documentos", description: "RG, CPF e comprovante de residência" },
  { label: "Revisão e envio" },
];

<Stepper steps={etapas} currentStep={1} />

// Voltar a uma etapa já preenchida
<Stepper steps={etapas} currentStep={2} onStepClick={(i) => setEtapa(i)} />
```

## Prompt para IA

```text
Use o componente `Stepper` (Etapas) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Etapas de um processo (ex.: requerimento em 3 passos) numa lista ordenada. A etapa atual tem `aria-current="step"` e cada etapa diz em texto (para leitor de tela) se está concluída, atual ou pendente, não só pela cor. Horizontal a partir de 768px e empilhado em telas estreitas. Com `onStepClick`, as etapas concluídas e a atual viram botões de 44px. API e variantes: orientation: horizontal (padrão; empilha abaixo de 768px) · vertical · estados: concluída (check) · atual (borda e texto em negrito) · pendente; sempre com texto sr-only · interação: onStepClick(index) · isStepClickable(index, status) (padrão: concluídas e atual) · labels: list · position(n, total) · complete · current · upcoming. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "../lib/utils";

/** Situação de uma etapa: anterior à atual, a atual ou posterior. */
export type StepperStepStatus = "complete" | "current" | "upcoming";

export interface StepperStep {
  /** Nome curto da etapa (ex.: "Dados do estudante"). */
  label: string;
  /** Linha de apoio abaixo do nome. */
  description?: string;
}

export interface StepperLabels {
  /** Nome acessível da lista. Padrão: "Etapas do processo". */
  list: string;
  /** Posição da etapa. Padrão: "Etapa 1 de 3". */
  position: (step: number, total: number) => string;
  /** Situação "concluída" (texto para leitor de tela). */
  complete: string;
  /** Situação "atual" (texto para leitor de tela). */
  current: string;
  /** Situação "pendente" (texto para leitor de tela). */
  upcoming: string;
}

const defaultLabels: StepperLabels = {
  list: "Etapas do processo",
  position: (step, total) => `Etapa ${step} de ${total}`,
  complete: "concluída",
  current: "etapa atual",
  upcoming: "pendente",
};

export interface StepperProps
  extends Omit<React.OlHTMLAttributes<HTMLOListElement>, "children"> {
  /** Etapas, na ordem do processo. */
  steps: StepperStep[];
  /**
   * Índice (base 0) da etapa atual. As anteriores contam como concluídas e as
   * seguintes como pendentes. Use `steps.length` para marcar todas concluídas.
   */
  currentStep: number;
  /**
   * `horizontal` (padrão): em linha a partir de `md` (768px) e empilhado em
   * telas estreitas. `vertical`: sempre empilhado.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Torna as etapas clicáveis (botões de 44px). Recebe o índice (base 0).
   * Por padrão só as concluídas e a atual são clicáveis; ajuste com
   * `isStepClickable`.
   */
  onStepClick?: (index: number) => void;
  /** Decide quais etapas viram botão quando há `onStepClick`. */
  isStepClickable?: (index: number, status: StepperStepStatus) => boolean;
  /** Textos fixos (PT-BR por padrão). */
  labels?: Partial<StepperLabels>;
}

function statusOf(index: number, currentStep: number): StepperStepStatus {
  if (index < currentStep) return "complete";
  if (index === currentStep) return "current";
  return "upcoming";
}

const defaultIsStepClickable = (_index: number, status: StepperStepStatus) =>
  status !== "upcoming";

/**
 * Etapas de um processo (ex.: requerimento em três passos). Lista ordenada
 * (`ol`/`li`); a etapa atual tem `aria-current="step"` e a situação de cada
 * etapa é dita em texto (sr-only), não só pela cor. Com `onStepClick`, as
 * etapas permitidas viram botões.
 */
const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  (
    {
      className,
      steps,
      currentStep,
      orientation = "horizontal",
      onStepClick,
      isStepClickable = defaultIsStepClickable,
      labels,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const text = { ...defaultLabels, ...labels };
    const horizontal = orientation === "horizontal";
    const total = steps.length;

    return (
      <ol
        ref={ref}
        aria-label={props["aria-labelledby"] ? ariaLabel : (ariaLabel ?? text.list)}
        className={cn(
          "flex w-full flex-col gap-2",
          horizontal && "md:flex-row md:items-start md:gap-4",
          className
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const status = statusOf(index, currentStep);
          const isLast = index === total - 1;
          const clickable = Boolean(onStepClick) && isStepClickable(index, status);
          const statusText =
            status === "complete"
              ? text.complete
              : status === "current"
                ? text.current
                : text.upcoming;

          const indicator = (
            <span
              aria-hidden="true"
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                status === "complete" && "bg-primary text-primary-foreground",
                status === "current" &&
                  "border-2 border-primary bg-surface text-primary",
                status === "upcoming" &&
                  "border border-border-strong bg-surface text-muted-foreground"
              )}
            >
              {status === "complete" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
          );

          const body = (
            <>
              {indicator}
              <span className="flex min-w-0 flex-col text-left">
                <span className="sr-only">{`${text.position(index + 1, total)}:`}</span>{" "}
                <span
                  className={cn(
                    "text-sm leading-snug",
                    status === "current"
                      ? "font-semibold text-foreground"
                      : status === "complete"
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="sr-only">{`, ${statusText}`}</span>
                {step.description ? (
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                  </span>
                ) : null}
              </span>
            </>
          );

          const rowClasses = "flex min-h-11 items-start gap-3 py-1.5";

          return (
            <li
              key={index}
              aria-current={!clickable && status === "current" ? "step" : undefined}
              className={cn(
                "relative flex flex-col",
                horizontal && "md:flex-1 md:flex-row md:items-start md:gap-4",
                horizontal && isLast && "md:flex-none"
              )}
            >
              {clickable ? (
                <button
                  type="button"
                  aria-current={status === "current" ? "step" : undefined}
                  onClick={() => onStepClick?.(index)}
                  className={cn(
                    rowClasses,
                    "-mx-2 rounded-md px-2 transition-colors duration-fast ease-standard hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                >
                  {body}
                </button>
              ) : (
                <div className={rowClasses}>{body}</div>
              )}
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "ml-4 h-4 w-0.5 shrink-0",
                    horizontal && "md:ml-0 md:mt-5 md:h-0.5 md:w-auto md:min-w-4 md:flex-1",
                    status === "complete" ? "bg-primary" : "bg-border-strong"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }
);
Stepper.displayName = "Stepper";

export { Stepper };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
