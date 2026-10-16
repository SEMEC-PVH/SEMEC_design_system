---
title: "Diálogo de alerta"
code: "alert-dialog"
slug: "dialogo-de-alerta"
file: "src/components/alert-dialog.tsx"
category: "feedback"
variants: "composição: AlertDialog · AlertDialogTrigger · AlertDialogContent · AlertDialogHeader · AlertDialogTitle · AlertDialogDescription · AlertDialogFooter · AlertDialogAction · AlertDialogCancel · variant (Action/Cancel): as do Button; padrão primary (Action) e outline (Cancel), 44px · regras: inclua sempre AlertDialogCancel (recebe o foco inicial) · Esc fecha · para validar antes de fechar, controle open e use event.preventDefault() no onClick do Action · deprecadas: modal (AlertDialog) · onPointerDownOutside · onInteractOutside (AlertDialogContent): ignoradas desde a 3.1.0; anunciadas na 4.0, saem na 5.0"
---

# Diálogo de alerta — `alert-dialog`

> Confirmação perigosa. Força decisão (ação/cancelar) antes de prosseguir: role="alertdialog", sempre modal, não fecha por clique fora e abre com o foco no Cancelar.

**Arquivo:** `src/components/alert-dialog.tsx` | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/dialogo-de-alerta/

## Variantes

- **composição**: AlertDialog · AlertDialogTrigger · AlertDialogContent · AlertDialogHeader · AlertDialogTitle · AlertDialogDescription · AlertDialogFooter · AlertDialogAction · AlertDialogCancel
- **variant (Action/Cancel)**: as do Button; padrão primary (Action) e outline (Cancel), 44px
- **regras**: inclua sempre AlertDialogCancel (recebe o foco inicial) · Esc fecha · para validar antes de fechar, controle open e use event.preventDefault() no onClick do Action
- **deprecadas**: modal (AlertDialog) · onPointerDownOutside · onInteractOutside (AlertDialogContent): ignoradas desde a 3.1.0; anunciadas na 4.0, saem na 5.0

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers zod.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 8 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.0.1 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.1.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, Button } from "@semec/ds/react";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir requerimento?</AlertDialogTitle>
      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// Validar antes de fechar (ação assíncrona): controle open e impeça o fechamento automático
<AlertDialog open={aberto} onOpenChange={setAberto}>
  <AlertDialogContent>
    …
    <AlertDialogAction
      variant="destructive"
      onClick={async (e) => { e.preventDefault(); await excluir(); setAberto(false); }}
    >Excluir</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

## Prompt para IA

```text
Use o componente `AlertDialog` (Diálogo de alerta) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Confirmação perigosa. Força decisão (ação/cancelar) antes de prosseguir: role="alertdialog", sempre modal, não fecha por clique fora e abre com o foco no Cancelar. API e variantes: composição: AlertDialog · AlertDialogTrigger · AlertDialogContent · AlertDialogHeader · AlertDialogTitle · AlertDialogDescription · AlertDialogFooter · AlertDialogAction · AlertDialogCancel · variant (Action/Cancel): as do Button; padrão primary (Action) e outline (Cancel), 44px · regras: inclua sempre AlertDialogCancel (recebe o foco inicial) · Esc fecha · para validar antes de fechar, controle open e use event.preventDefault() no onClick do Action · deprecadas: modal (AlertDialog) · onPointerDownOutside · onInteractOutside (AlertDialogContent): ignoradas desde a 3.1.0; anunciadas na 4.0, saem na 5.0. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type * as DialogPrimitive from "@radix-ui/react-dialog";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

// AlertDialog sobre o primitivo próprio do Radix (AUD-34): role="alertdialog",
// sempre modal, não fecha por clique fora e abre com o foco no Cancelar.
// Os tipos aceitam as props herdadas da versão anterior (sobre react-dialog)
// para não quebrar a API pública; as que não fazem sentido aqui são ignoradas.

export interface AlertDialogProps extends AlertDialogPrimitive.AlertDialogProps {
  /**
   * @deprecated Ignorado: o AlertDialog é sempre modal. Mantido só por
   * compatibilidade com a versão anterior; sai na 5.0 (anunciado na 4.0).
   */
  modal?: boolean;
}

const AlertDialog = ({ modal: _modal, ...props }: AlertDialogProps) => (
  <AlertDialogPrimitive.Root {...props} />
);
AlertDialog.displayName = "AlertDialog";

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

export interface AlertDialogContentProps
  extends AlertDialogPrimitive.AlertDialogContentProps {
  /**
   * @deprecated Ignorado: o AlertDialog não fecha por clique fora. Mantido só
   * por compatibilidade com a versão anterior; sai na 5.0 (anunciado na 4.0).
   */
  onPointerDownOutside?: DialogPrimitive.DialogContentProps["onPointerDownOutside"];
  /**
   * @deprecated Ignorado: o AlertDialog não fecha por interação fora. Mantido
   * só por compatibilidade com a versão anterior; sai na 5.0 (anunciado na 4.0).
   */
  onInteractOutside?: DialogPrimitive.DialogContentProps["onInteractOutside"];
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(
  (
    {
      className,
      children,
      onPointerDownOutside: _onPointerDownOutside,
      onInteractOutside: _onInteractOutside,
      ...props
    },
    ref
  ) => (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      {/* aria-modal: o AlertDialog é sempre modal (foco preso e fundo inerte).
          Sem o atributo, leitores de tela e o axe não reconhecem o role="alertdialog"
          como modal e tratam o fundo aria-hidden como focável (aria-hidden-focus). */}
      <AlertDialogPrimitive.Content
        ref={ref}
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-elevation-3 ring-1 ring-foreground/5 duration-base ease-standard data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
);
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

type AlertDialogButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export interface AlertDialogActionProps
  extends AlertDialogPrimitive.AlertDialogActionProps {
  /** Variante visual do botão (a mesma do `Button`). Padrão: "primary". */
  variant?: AlertDialogButtonVariant;
}

/**
 * Confirma e fecha o diálogo. Para validar antes de fechar (ex.: chamada
 * assíncrona), controle `open` no `AlertDialog` e chame
 * `event.preventDefault()` no `onClick`.
 */
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  AlertDialogActionProps
>(({ className, variant = "primary", ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants({ variant, size: "md" }), className)}
    {...props}
  />
));
AlertDialogAction.displayName = "AlertDialogAction";

export interface AlertDialogCancelProps
  extends AlertDialogPrimitive.AlertDialogCancelProps {
  /** Variante visual do botão (a mesma do `Button`). Padrão: "outline". */
  variant?: AlertDialogButtonVariant;
}

/** Fecha sem confirmar. Recebe o foco quando o diálogo abre: inclua-o sempre. */
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  AlertDialogCancelProps
>(({ className, variant = "outline", ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant, size: "md" }), className)}
    {...props}
  />
));
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
