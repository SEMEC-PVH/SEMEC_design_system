---
title: "Notificação"
code: "toast"
slug: "notificacao"
file: "src/components/toast.tsx"
category: "feedback"
variants: "variant: default · success (verde SEMEC #82C353, texto #26325B, 12px, Poppins) · warning · destructive · uso: <Toaster /> uma vez no root do app + useToast() em formulários, botões de ação e fluxos assíncronos · Toaster: label · viewportLabel · closeLabel (textos PT-BR sobrescrevíveis) · alvos: X e ToastAction com 44px"
---

# Notificação — `toast`

> Notificação temporária flutuante disparada com `useToast()` e viewport empilhável. Padrão oficial para confirmação de envio de formulários e ações com a variante `success`.

**Arquivo:** `src/components/toast.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/notificacao`

## Variantes

- **variant**: default · success (verde SEMEC #82C353, texto #26325B, 12px, Poppins) · warning · destructive
- **uso**: <Toaster /> uma vez no root do app + useToast() em formulários, botões de ação e fluxos assíncronos
- **Toaster**: label · viewportLabel · closeLabel (textos PT-BR sobrescrevíveis)
- **alvos**: X e ToastAction com 44px

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Toaster, useToast, Button } from "@semec/ds/react";

// Dispare de qualquer componente com useToast():
function Acao() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ variant: "success", title: "Protocolo enviado" })}>Enviar</Button>;
}

// Monte <Toaster /> UMA vez no root do app (ex.: app/layout.tsx).
// Não use ToastProvider/ToastViewport soltos: sem o Toaster nenhum toast aparece.
<Acao />
<Toaster />
```

## Prompt para IA

```text
Use o componente `Toaster` (Notificação) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Notificação temporária flutuante disparada com `useToast()` e viewport empilhável. Padrão oficial para confirmação de envio de formulários e ações com a variante `success`. API e variantes: variant: default · success (verde SEMEC #82C353, texto #26325B, 12px, Poppins) · warning · destructive · uso: <Toaster /> uma vez no root do app + useToast() em formulários, botões de ação e fluxos assíncronos · Toaster: label · viewportLabel · closeLabel (textos PT-BR sobrescrevíveis) · alvos: X e ToastAction com 44px. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "../lib/utils";

// Rótulos PT-BR padrão (ADR-016). Os padrões do Radix são em inglês
// ("Notification", "Notifications ({hotkey})") e seriam lidos pelo leitor de tela.
const TOAST_LABEL = "Notificação";
const TOAST_VIEWPORT_LABEL = "Notificações ({hotkey})";
const TOAST_CLOSE_LABEL = "Fechar notificação";

const ToastProvider = ({
  label = TOAST_LABEL,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Provider>) => (
  <ToastPrimitives.Provider label={label} {...props} />
);
ToastProvider.displayName = ToastPrimitives.Provider.displayName;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, label = TOAST_VIEWPORT_LABEL, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    label={label}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:top-4 sm:right-4 md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[12px] border border-border bg-card p-4 text-card-foreground shadow-elevation-2 font-sans transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        success:
          "border-none bg-success-emphasis text-success-emphasis-foreground px-5 py-4 [&_[toast-close]]:text-success-emphasis-foreground [&_[toast-close]]:hover:bg-success-emphasis-foreground/10",
        warning: "border-warning/40 bg-warning-surface text-foreground",
        destructive: "border-destructive/40 bg-destructive-surface text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-border bg-transparent px-4 text-sm font-medium transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className
    )}
    toast-close=""
    aria-label={TOAST_CLOSE_LABEL}
    {...props}
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-base font-bold leading-tight", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm font-normal leading-[1.4] opacity-95", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;
const genId = () => `${count++}`;

type ActionType = typeof actionTypes;

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE_TOAST":
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((t) => addToRemoveQueue(t.id));
      }
      return { toasts: state.toasts.map((t) => (t.id === toastId || toastId === undefined ? { ...t, open: false } : t)) };
    }
    case "REMOVE_TOAST":
      return { toasts: action.toastId === undefined ? [] : state.toasts.filter((t) => t.id !== action.toastId) };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();
  const update = (props: ToasterToast) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export interface ToasterProps {
  /** Prefixo anunciado pelo leitor de tela em cada aviso. Padrão: "Notificação". */
  label?: string;
  /** Nome da região de avisos; `{hotkey}` vira o atalho (F8). Padrão: "Notificações ({hotkey})". */
  viewportLabel?: string;
  /** Nome acessível do botão de fechar. Padrão: "Fechar notificação". */
  closeLabel?: string;
}

function Toaster({
  label = TOAST_LABEL,
  viewportLabel = TOAST_VIEWPORT_LABEL,
  closeLabel = TOAST_CLOSE_LABEL,
}: ToasterProps = {}) {
  const { toasts } = useToast();

  return (
    <ToastProvider label={label}>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose aria-label={closeLabel} />
        </Toast>
      ))}
      <ToastViewport label={viewportLabel} />
    </ToastProvider>
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
  useToast,
};
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
