"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  IconButton,
  Link,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@semec/ds/react";
import { Download, Loader2, Pencil, Plus, Printer, Send, Trash2 } from "lucide-react";

export function ButtonFormFooter() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted-foreground">
        Requisição de certidão · passo 3 de 4 preenchido
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button>Enviar requerimento</Button>
        <Button variant="outline">Salvar rascunho</Button>
        <Button variant="ghost">Cancelar</Button>
      </div>
    </div>
  );
}

export function ButtonDestructive() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive"><Trash2 /> Excluir requerimento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir requerimento 2026.042?</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Os anexos também serão removidos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <DialogClose asChild><Button variant="destructive">Excluir</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ButtonLoading() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        disabled={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2200);
        }}
      >
        {loading ? (<><Loader2 className="animate-spin" /> Enviando…</>) : (<><Send /> Enviar requerimento</>)}
      </Button>
      <p className="text-xs text-muted-foreground">
        Clique para ver o estado de carregamento — o botão desabilita enquanto processa.
      </p>
    </div>
  );
}

export function ButtonAsLink() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild><a href="#proto">Ver situação do IPTU</a></Button>
      <Button asChild variant="outline"><a href="#proto">Emitir segunda via</a></Button>
    </div>
  );
}

export function ButtonToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
      <p className="text-sm text-muted-foreground">12 requerimentos</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm"><Plus /> Novo requerimento</Button>
        <Button size="sm" variant="outline"><Download /> Exportar CSV</Button>
        <Button size="sm" variant="ghost"><Printer /> Imprimir</Button>
      </div>
    </div>
  );
}

export function IconToolbar() {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild><IconButton label="Editar requerimento"><Pencil /></IconButton></TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild><IconButton label="Baixar carnê"><Download /></IconButton></TooltipTrigger>
          <TooltipContent>Baixar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild><IconButton label="Excluir requerimento" variant="destructive"><Trash2 /></IconButton></TooltipTrigger>
          <TooltipContent>Excluir</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function LinkInline() {
  return (
    <p className="max-w-xl text-sm text-foreground">
      Para contestar o lançamento, consulte a{" "}
      <Link href="#proto">guia do IPTU 2026</Link> e o{" "}
      <Link href="#proto" variant="onSurface">prazo de recurso</Link>. Dúvidas sobre
      parcelamento? <Link href="#proto" variant="muted">Saiba mais aqui</Link>.
    </p>
  );
}

export function LinkList() {
  return (
    <nav aria-label="Links úteis" className="flex flex-col items-start gap-2">
      <Link href="#proto">Acessar serviços online</Link>
      <Link href="#proto" variant="onSurface">Acompanhar protocolo</Link>
      <Link href="#proto" variant="muted">Central de atendimento</Link>
      <Link href="#proto" variant="muted">Voltar ao topo</Link>
    </nav>
  );
}