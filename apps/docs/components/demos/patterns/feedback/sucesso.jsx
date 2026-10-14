"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Toaster,
  useToast,
} from "semec-ds/react";

function ConteudoSucesso() {
  const { toast } = useToast();

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

    </div>
  );
}

// Padrão oficial: <Toaster /> uma vez (no app, fica no layout raiz) + useToast() para disparar.
export function SucessoDemo() {
  return (
    <>
      <ConteudoSucesso />
      <Toaster />
    </>
  );
}
