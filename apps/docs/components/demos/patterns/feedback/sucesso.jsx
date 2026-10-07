"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToast,
} from "semec-ds/react";

function ConteudoSucesso() {
  const { toasts, toast } = useToast();

  return (
    <div className="w-full max-w-xl space-y-4 p-4 text-left">
      <Alert variant="success">
        <AlertTitle>Requerimento protocolado</AlertTitle>
        <AlertDescription>
          Protocolo 2026.042 gerado com sucesso. A resposta chega em até 5 dias úteis no e-mail
          informado.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() =>
            toast({
              variant: "success",
              title: "Rascunho salvo",
              description: "As alterações foram guardadas agora.",
            })
          }
        >
          Salvar alterações
        </Button>
        <span className="text-sm text-muted-foreground">
          A ação dispara uma notificação temporária.
        </span>
      </div>

      {toasts.map(({ id, title, description, variant, ...rest }) => (
        <Toast key={id} variant={variant} {...rest}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </div>
  );
}

export function SucessoDemo() {
  return (
    <ToastProvider>
      <ConteudoSucesso />
      <ToastViewport />
    </ToastProvider>
  );
}
