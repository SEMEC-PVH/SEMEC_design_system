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
} from "semec-ds/react";

const PROTOCOLOS = [
  { id: "2026.042", servico: "IPTU — 2ª via", data: "12/08/2026" },
  { id: "2026.043", servico: "Alvará de funcionamento", data: "15/08/2026" },
  { id: "2026.044", servico: "Cadastro de contribuinte", data: "20/08/2026" },
];

export function ConfirmacaoDemo() {
  const [protocolos, setProtocolos] = useState(PROTOCOLOS);
  const [pendente, setPendente] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const listaRef = useRef(null);

  function confirmarExclusao() {
    const alvo = pendente;
    setProtocolos((atual) => atual.filter((item) => item.id !== alvo.id));
    setMensagem(`Protocolo ${alvo.id} excluído.`);
    setAberto(false);
    // devolve o foco para a lista: o botão que abriu o diálogo não existe mais
    requestAnimationFrame(() => listaRef.current?.focus());
  }

  function restaurar() {
    setProtocolos(PROTOCOLOS);
    setMensagem("Lista restaurada com os 3 protocolos.");
  }

  return (
    <div className="w-full max-w-xl space-y-4 p-4 text-left">
      <ul
        ref={listaRef}
        tabIndex={-1}
        className="space-y-2 rounded-lg border border-border bg-surface p-3"
      >
        {protocolos.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm">
              <span className="font-medium text-foreground">{item.servico}</span>
              <span className="text-muted-foreground">
                {" "}
                · protocolo {item.id} · {item.data}
              </span>
            </span>
            <Button
              size="sm"
              variant="destructive"
              aria-label={`Excluir protocolo ${item.id}`}
              onClick={() => {
                setPendente(item);
                setMensagem("");
                setAberto(true);
              }}
            >
              Excluir
            </Button>
          </li>
        ))}
      </ul>

      {protocolos.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Nenhum protocolo aberto.</p>
          <Button size="sm" variant="outline" onClick={restaurar}>
            Restaurar lista
          </Button>
        </div>
      )}

      <p role="status" className="text-sm text-muted-foreground">
        {mensagem}
      </p>

      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o protocolo {pendente?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendente?.servico} e os anexos serão removidos permanentemente. Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmarExclusao}
            >
              Excluir protocolo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
