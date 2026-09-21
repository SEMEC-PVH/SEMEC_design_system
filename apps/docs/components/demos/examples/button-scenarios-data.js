export const buttonFormFooterUsage = `import { Button } from "semec-ds/react";

<div className="flex flex-wrap gap-3">
  <Button>Enviar requerimento</Button>
  <Button variant="outline">Salvar rascunho</Button>
  <Button variant="ghost">Cancelar</Button>
</div>`;

export const buttonDestructiveUsage = `import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "semec-ds/react";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Excluir requerimento</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Excluir requerimento 2026.042?</DialogTitle>
      <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
      <DialogClose asChild><Button variant="destructive">Excluir</Button></DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

export const buttonLoadingUsage = `import { Button } from "semec-ds/react";
import { Loader2, Send } from "lucide-react";

<Button disabled={loading}>
  {loading ? (<><Loader2 className="animate-spin" /> Enviando…</>) : (<><Send /> Enviar requerimento</>)}
</Button>`;

export const buttonAsLinkUsage = `import { Button } from "semec-ds/react";

<Button asChild><a href="/iptu">Ver situação do IPTU</a></Button>
<Button asChild variant="outline"><a href="/iptu/2via">Emitir segunda via</a></Button>`;

export const buttonToolbarUsage = `import { Button } from "semec-ds/react";
import { Download, Plus, Printer } from "lucide-react";

<div className="flex flex-wrap gap-2">
  <Button size="sm"><Plus /> Novo requerimento</Button>
  <Button size="sm" variant="outline"><Download /> Exportar CSV</Button>
  <Button size="sm" variant="ghost"><Printer /> Imprimir</Button>
</div>`;

export const iconToolbarUsage = `import { IconButton, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "semec-ds/react";
import { Download, Pencil, Trash2 } from "lucide-react";

<TooltipProvider>
  <div className="flex gap-2">
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton label="Editar requerimento"><Pencil /></IconButton>
      </TooltipTrigger>
      <TooltipContent>Editar</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton label="Baixar carnê"><Download /></IconButton>
      </TooltipTrigger>
      <TooltipContent>Baixar</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton label="Excluir requerimento" variant="destructive"><Trash2 /></IconButton>
      </TooltipTrigger>
      <TooltipContent>Excluir</TooltipContent>
    </Tooltip>
  </div>
</TooltipProvider>`;

export const linkInlineUsage = `import { Link } from "semec-ds/react";

<p>
  Para contestar o lançamento, consulte a{" "}
  <Link href="/iptu">guia do IPTU 2026</Link> e o{" "}
  <Link href="/recurso" variant="onSurface">prazo de recurso</Link>.{" "}
  <Link href="/ajuda" variant="muted">Saiba mais aqui</Link>.
</p>`;

export const linkListUsage = `import { Link } from "semec-ds/react";

<nav aria-label="Links úteis">
  <Link href="/servicos">Acessar serviços online</Link>
  <Link href="/protocolo" variant="onSurface">Acompanhar protocolo</Link>
  <Link href="/atendimento" variant="muted">Central de atendimento</Link>
</nav>`;