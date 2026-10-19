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
