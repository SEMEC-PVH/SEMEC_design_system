"use client";

import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  FormField,
  Input,
  Textarea,
} from "semec-ds/react";

const INICIAL = { titulo: "", descricao: "" };

/**
 * Prevenção de perda de dados: enquanto houver alterações não salvas, o
 * botão "Voltar" abre um AlertDialog de confirmação. O foco inicial vai para
 * "Continuar editando" (o cancelar), e só a ação explícita descarta o que o
 * usuário digitou.
 */
export function PrevencaoPerdaDemo() {
  const [valores, setValores] = useState(INICIAL);
  const [rascunho, setRascunho] = useState(INICIAL);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [status, setStatus] = useState("");
  const cancelarRef = useRef(null);

  const sujo = valores.titulo !== rascunho.titulo || valores.descricao !== rascunho.descricao;

  function alterar(campo, valor) {
    setStatus("");
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  function salvarRascunho() {
    setRascunho(valores);
    setStatus("Rascunho salvo — nada será perdido ao sair.");
  }

  function sair() {
    if (sujo) {
      setDialogAberto(true);
      return;
    }
    setStatus("Saída confirmada — não havia alterações pendentes.");
  }

  function descartar() {
    setValores(rascunho);
    setStatus("Alterações não salvas descartadas.");
  }

  return (
    <div className="w-full max-w-[520px] space-y-4 p-4 text-left">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          salvarRascunho();
        }}
        noValidate
        className="space-y-4"
      >
        <FormField id="pd-titulo-campo" label="Título da demanda" htmlFor="pd-titulo" required>
          <Input
            id="pd-titulo"
            required
            value={valores.titulo}
            onChange={(e) => alterar("titulo", e.target.value)}
          />
        </FormField>

        <FormField
          id="pd-descricao-campo"
          label="Descrição"
          htmlFor="pd-descricao"
          hint="Explique o que precisa ser resolvido."
        >
          <Textarea
            id="pd-descricao"
            rows={3}
            value={valores.descricao}
            onChange={(e) => alterar("descricao", e.target.value)}
            aria-describedby="pd-descricao-campo-hint"
          />
        </FormField>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={sair}>
            Voltar
          </Button>
          <Button type="submit">Salvar rascunho</Button>
        </div>

        <p role="status" className="text-sm text-muted-foreground">
          {status ||
            (sujo
              ? "Alterações não salvas — salve um rascunho antes de sair."
              : "Nenhuma alteração pendente.")}
        </p>
      </form>

      <AlertDialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelarRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você digitou dados que ainda não foram salvos. Descartar apaga o
              conteúdo preenchido desde o último rascunho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelarRef}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={descartar}
            >
              Descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
