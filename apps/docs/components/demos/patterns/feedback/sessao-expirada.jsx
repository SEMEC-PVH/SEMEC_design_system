"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "semec-ds/react";

const SEGUNDOS_INICIAIS = 120;

export function SessaoExpiradaDemo() {
  const [aberto, setAberto] = useState(false);
  const [restante, setRestante] = useState(SEGUNDOS_INICIAIS);
  const [mensagem, setMensagem] = useState("");
  const entrarRef = useRef(null);

  useEffect(() => {
    if (!aberto || restante <= 0) return;
    const id = setInterval(() => setRestante((valor) => Math.max(0, valor - 1)), 1000);
    return () => clearInterval(id);
  }, [aberto, restante]);

  function alterarAbertura(proximo) {
    if (proximo) {
      setRestante(SEGUNDOS_INICIAIS);
      setMensagem("");
    }
    setAberto(proximo);
  }

  function salvarRascunho() {
    setAberto(false);
    setMensagem("Rascunho salvo. Entre novamente quando quiser para continuar de onde parou.");
  }

  function entrarNovamente() {
    setAberto(false);
    setMensagem("Redirecionando para a tela de login…");
  }

  const minutos = String(Math.floor(restante / 60)).padStart(2, "0");
  const segundos = String(restante % 60).padStart(2, "0");

  return (
    <div className="w-full max-w-xl space-y-4 p-4 text-left">
      <Dialog open={aberto} onOpenChange={alterarAbertura}>
        <DialogTrigger asChild>
          <Button>Simular expiração de sessão</Button>
        </DialogTrigger>

        <DialogContent
          className="[&>button]:hidden"
          onInteractOutside={(evento) => evento.preventDefault()}
          onEscapeKeyDown={(evento) => evento.preventDefault()}
          onOpenAutoFocus={(evento) => {
            evento.preventDefault();
            entrarRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Sessão expirada</DialogTitle>
            <DialogDescription>
              Sua sessão encerrou após 30 minutos de inatividade.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="warning">
            <AlertTitle>Trabalho em risco</AlertTitle>
            <AlertDescription>
              O rascunho não salvo será perdido. Entre novamente para continuar de onde parou.
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Tempo restante para reautenticar sem perder o rascunho:{" "}
            <span className="font-medium text-foreground">
              {minutos}:{segundos}
            </span>
          </p>

          {restante === 0 && (
            <p className="text-sm text-destructive">
              Tempo esgotado — o rascunho será descartado.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={salvarRascunho}>
              Salvar rascunho
            </Button>
            <Button ref={entrarRef} onClick={entrarNovamente}>
              Entrar novamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p role="status" className="text-sm text-muted-foreground">
        {mensagem}
      </p>
    </div>
  );
}
