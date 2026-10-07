/**
 * Registro dos exemplos visuais dos padrões de feedback.
 * Chave = rota (`/padroes/feedback/<slug>`). Dados puros: sem "use client".
 */

export const feedbackPatterns = {
  "feedback/sucesso": {
    label: "Banner de sucesso",
    desc: "Alerta em linha para o que acabou de acontecer mais notificação temporária.",
    filename: "SucessoDemo.jsx",
    prompt:
      "Crie feedback de sucesso usando @semec/ds/react: Alert variant success em linha e Toast temporário disparado pela ação, com anúncio em aria-live.",
    usage: `import { Alert, AlertDescription, AlertTitle, Button, Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, useToast } from "@semec/ds/react";

function Sucesso() {
  const { toasts, toast } = useToast();
  return (
    <ToastProvider>
      <Alert variant="success"><AlertTitle>Requerimento protocolado</AlertTitle><AlertDescription>Protocolo 2026.042 gerado com sucesso.</AlertDescription></Alert>
      <Button onClick={() => toast({ variant: "success", title: "Rascunho salvo" })}>Salvar alterações</Button>
      {toasts.map(({ id, title, description, variant, ...rest }) => (
        <Toast key={id} variant={variant} {...rest}><ToastTitle>{title}</ToastTitle><ToastDescription>{description}</ToastDescription><ToastClose /></Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}`,
  },
  "feedback/aviso": {
    label: "Banner de aviso",
    desc: "Atenção sem erro: manutenção programada com o horário previsto.",
    filename: "AvisoDemo.jsx",
    prompt:
      "Crie banners de aviso usando @semec/ds/react (Alert variant warning e default): título, descrição e ícone automático por variante.",
    usage: `import { Alert, AlertDescription, AlertTitle } from "@semec/ds/react";

<Alert variant="warning">
  <AlertTitle>Manutenção programada</AlertTitle>
  <AlertDescription>A emissão de guias ficará fora do ar no sábado, das 22h às 2h.</AlertDescription>
</Alert>

<Alert>
  <AlertTitle>Atendimento apenas com agendamento</AlertTitle>
  <AlertDescription>Neste mês os balcões atendem com hora marcada.</AlertDescription>
</Alert>`,
  },
  "feedback/erro": {
    label: "Banner de erro",
    desc: "O que falhou, por quê e o que fazer agora — com ação de tentar novamente.",
    filename: "ErroDemo.jsx",
    prompt:
      "Crie feedback de erro usando @semec/ds/react: Alert variant destructive, campo inválido com aria-invalid e botão de tentar novamente com estado de carregamento.",
    usage: `import { Alert, AlertDescription, AlertTitle, Button, Input, Label } from "@semec/ds/react";

<Label htmlFor="erro-email">E-mail para receber o comprovante</Label>
<Input id="erro-email" type="email" defaultValue="maria@prefeitura" aria-invalid="true" aria-describedby="erro-email-ajuda" />
<p id="erro-email-ajuda" className="text-xs text-destructive">Informe um e-mail válido, ex.: maria@prefeitura.gov.br.</p>

<Alert variant="destructive">
  <AlertTitle>Não foi possível enviar a solicitação</AlertTitle>
  <AlertDescription>O servidor de protocolos não respondeu em 30 s (erro 504).</AlertDescription>
  <span className="mt-2 block">
    <Button type="button" size="sm" variant="outline" onClick={tentarNovamente}>Tentar novamente</Button>
  </span>
</Alert>`,
  },
  "feedback/carregamento": {
    label: "Spinner de carregamento",
    desc: "Botão que entra em envio com spinner, rótulo progressivo e foco preservado.",
    filename: "CarregamentoDemo.jsx",
    prompt:
      "Crie um carregamento usando @semec/ds/react (Spinner): botão disabled durante o envio, texto de progresso e status em aria-live para leitor de tela.",
    usage: `import { Button, Spinner } from "@semec/ds/react";

function enviar() {
  setEnviando(true);
  setMensagem("Enviando o formulário…");
  setTimeout(() => setMensagem("Validando os anexos…"), 900);
  setTimeout(() => setMensagem("Registrando o protocolo…"), 1800);
  setTimeout(() => { setMensagem("Formulário enviado — protocolo 2026.042 gerado."); setEnviando(false); }, 2700);
}

<Button onClick={enviar} disabled={enviando}>
  {enviando && <Spinner className="h-4 w-4" aria-hidden="true" />}
  {enviando ? "Enviando…" : "Enviar"}
</Button>
<p role="status">{mensagem}</p>`,
  },
  "feedback/progresso": {
    label: "Barra de progresso",
    desc: "Percentual e etapa descrita enquanto a tarefa roda; pára em 100% e pode reiniciar.",
    filename: "ProgressoDemo.jsx",
    prompt:
      "Crie uma barra de progresso usando @semec/ds/react (Progress): valor determinado, texto com etapa e percentual em aria-valuetext, parada em 100% e reinício.",
    usage: `import { useEffect, useState } from "react";
import { Button, Progress } from "@semec/ds/react";

const [valor, setValor] = useState(0);
useEffect(() => {
  if (valor >= 100) return;
  const id = setInterval(() => setValor((atual) => Math.min(100, atual + 4)), 150);
  return () => clearInterval(id);
}, [valor]);

const etapa = Math.min(4, Math.floor(valor / 25) + 1);
const texto = "Etapa " + etapa + " de 4 — " + valor + "%";
<Progress value={valor} aria-valuetext={texto} />
<p>{texto}</p>
<Button size="sm" variant="outline" onClick={() => setValor(0)}>Reiniciar</Button>`,
  },
  "feedback/processamento": {
    label: "Estado de processamento",
    desc: "Operação em segundo plano: a lista mostra skeleton e o usuário segue navegando.",
    filename: "ProcessamentoDemo.jsx",
    prompt:
      "Crie um estado de processamento em segundo plano usando @semec/ds/react (Skeleton, Spinner, Button): carregamento não bloqueante com status em aria-live.",
    usage: `import { Alert, AlertDescription, AlertTitle, Button, Skeleton, Spinner } from "@semec/ds/react";

<div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
  <Spinner className="h-4 w-4" aria-hidden="true" />
  Importando 240 registros em segundo plano…
</div>
<ul className="space-y-3 rounded-lg border border-border bg-surface p-3">
  <li><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-40" /></li>
  …
</ul>
<Button variant="outline" onClick={atualizar}>Atualizar lista</Button>
<Alert variant="success">
  <AlertTitle>Importação concluída</AlertTitle>
  <AlertDescription>240 registros adicionados. A lista já está atualizada.</AlertDescription>
</Alert>`,
  },
  "feedback/confirmacao": {
    label: "Diálogo de confirmação",
    desc: "Confirmação obrigatória antes de excluir, com cancelar em destaque.",
    filename: "ConfirmacaoDemo.jsx",
    prompt:
      "Crie um diálogo de confirmação destrutiva usando @semec/ds/react (AlertDialog): AlertDialogAction com estilo destructive, foco inicial no Cancelar e descrição do que será perdido.",
    usage: `import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Button } from "@semec/ds/react";

<Button size="sm" variant="destructive" aria-label={"Excluir protocolo " + item.id} onClick={() => { setPendente(item); setAberto(true); }}>Excluir</Button>
<AlertDialog open={aberto} onOpenChange={setAberto}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir o protocolo {pendente.id}?</AlertDialogTitle>
      <AlertDialogDescription>{pendente.servico} e os anexos serão removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={excluir}>Excluir protocolo</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  },
  "feedback/sessao-expirada": {
    label: "Tela de sessão expirada",
    desc: "Sessão encerrada por tempo limite: motivo, prazo e caminho para entrar de novo.",
    filename: "SessaoExpiradaDemo.jsx",
    prompt:
      "Crie a tela de sessão expirada usando @semec/ds/react (Dialog): diálogo não dispensável sem X, aviso com aria-live, prazo da sessão e ação principal para reautenticar.",
    usage: `import { Alert, AlertDescription, AlertTitle, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@semec/ds/react";

<Dialog open={aberto} onOpenChange={alterarAbertura}>
  <DialogTrigger asChild><Button>Simular expiração de sessão</Button></DialogTrigger>
  {/* não dispensável: sem X, sem clique fora, sem Esc */}
  <DialogContent className="[&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} onOpenAutoFocus={(e) => { e.preventDefault(); entrarRef.current?.focus(); }}>
    <DialogHeader><DialogTitle>Sessão expirada</DialogTitle><DialogDescription>Sua sessão encerrou após 30 minutos de inatividade.</DialogDescription></DialogHeader>
    <Alert variant="warning"><AlertTitle>Trabalho em risco</AlertTitle><AlertDescription>O rascunho não salvo será perdido.</AlertDescription></Alert>
    <p>Tempo restante para reautenticar: {minutos}:{segundos}</p>
    <DialogFooter>
      <Button variant="outline" onClick={salvarRascunho}>Salvar rascunho</Button>
      <Button ref={entrarRef} onClick={entrarNovamente}>Entrar novamente</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
  },
  "feedback/indisponibilidade": {
    label: "Tela de indisponibilidade",
    desc: "Serviço fora do ar com previsão de retorno e tentativa de novo.",
    filename: "IndisponibilidadeDemo.jsx",
    prompt:
      "Crie a tela de indisponibilidade usando @semec/ds/react (EmptyState, Alert): mensagem com tempo estimado, contato de suporte e botão de retry com estado.",
    usage: `import { Alert, AlertDescription, AlertTitle, Button, EmptyState, Link, Spinner } from "@semec/ds/react";
import { ServerOff } from "lucide-react";

<Alert variant="warning">
  <AlertTitle>Serviço fora do ar</AlertTitle>
  <AlertDescription>Indisponível desde as 14h20. Previsão de retorno: hoje, às 18h.</AlertDescription>
</Alert>
<EmptyState
  icon={<ServerOff />}
  title="Não foi possível carregar os dados"
  description="Tente novamente em instantes ou use um dos canais de suporte abaixo."
  action={<Button onClick={tentarNovamente} disabled={tentando}>{tentando && <Spinner className="h-4 w-4" aria-hidden="true" />} {tentando ? "Tentando…" : "Tentar novamente"}</Button>}
/>
<p role="status">{mensagem}</p>
<p>Suporte: <Link href="tel:166">166</Link> · <Link href="mailto:suporte@prefeitura.gov.br">suporte@prefeitura.gov.br</Link></p>`,
  },
};
