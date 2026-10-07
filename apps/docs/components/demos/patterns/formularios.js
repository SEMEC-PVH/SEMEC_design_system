/**
 * Registro dos exemplos visuais dos padrões de formulários.
 * Chave = rota (`/padroes/formularios/<slug>`). Dados puros: sem "use client".
 */

export const formulariosPatterns = {
  "formularios/textos-de-ajuda": {
    label: "Textos de ajuda",
    desc: "Dica sob o campo, sempre depois do rótulo e antes da mensagem de erro.",
    filename: "TextosDeAjudaDemo.jsx",
    prompt:
      "Crie campos com texto de ajuda usando @semec/ds/react (FormField): hint vinculado por aria-describedby e ordem rótulo → campo → dica → erro.",
    usage: `import { useState } from "react";
import { Button, FormField, Input } from "@semec/ds/react";
export function TextosDeAjuda() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); setErro(email.includes("@") ? "" : "Informe um e-mail válido."); }}>
      {/* ordem no DOM: rótulo → campo → dica → erro */}
      <FormField id="contato" label="E-mail" htmlFor="email" hint="Usado para enviar o comprovante." error={erro}>
        <Input id="email" type="email" value={email} aria-invalid={!!erro} onChange={(e) => setEmail(e.target.value)} aria-describedby={erro ? "contato-error" : "contato-hint"} />
      </FormField>
      <Button type="submit">Enviar</Button>
    </form>
  );
}`,
  },
  "formularios/campos-obrigatorios": {
    label: "Indicação de campos obrigatórios",
    desc: "Asterisco no rótulo e resumo de erros no topo com link para cada campo.",
    filename: "CamposObrigatoriosDemo.jsx",
    prompt:
      "Crie um formulário com campos obrigatórios usando @semec/ds/react: asterisco no label, required no input, legenda explicando o * e ErrorSummary com links para os campos e foco no resumo ao enviar.",
    usage: `import { useState } from "react";
import { Button, ErrorSummary, FormField, Input } from "@semec/ds/react";
export function CamposObrigatorios() {
  const [nome, setNome] = useState("");
  const [erros, setErros] = useState([]);
  const [tentativa, setTentativa] = useState(0);
  const enviar = (e) => { e.preventDefault(); setErros(nome.trim() ? [] : [{ id: "nome", message: "Informe o nome completo." }]); setTentativa((n) => n + 1); };
  return (
    <form noValidate onSubmit={enviar}>
      <p>Campos com <strong>*</strong> são obrigatórios.</p>
      <ErrorSummary errors={erros} focusKey={tentativa} />
      <FormField id="nome-f" label="Nome completo" htmlFor="nome" required error={erros[0]?.message}>
        <Input id="nome" required value={nome} aria-invalid={!!erros[0]} onChange={(e) => setNome(e.target.value)} />
      </FormField>
      <Button type="submit">Enviar</Button>
    </form>
  );
}`,
  },
  "formularios/agrupamento-de-informacoes": {
    label: "Agrupamento de seções",
    desc: "Campos organizados por tema em fieldset com legenda, não em caixas decorativas.",
    filename: "AgrupamentoDemo.jsx",
    prompt:
      "Crie um formulário agrupado em fieldset/legend usando @semec/ds/react (FormField, RadioGroup, Switch): seções temáticas com legenda visível e ordem de foco previsível.",
    usage: `import { Button, FormField, Input, Label, RadioGroup, RadioGroupItem, Switch } from "@semec/ds/react";
export function AgrupamentoDemo() {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Dados do requerente</legend>
        <FormField id="nome-f" label="Nome completo" htmlFor="nome" required><Input id="nome" /></FormField>
        <FormField id="email-f" label="E-mail" htmlFor="email" hint="Recebe a confirmação."><Input id="email" type="email" /></FormField>
      </fieldset>
      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Preferências de atendimento</legend>
        <FormField label="Canal preferido" htmlFor="canal">
          <RadioGroup id="canal" defaultValue="presencial">
            <div className="flex items-center gap-2"><RadioGroupItem value="presencial" id="c1" /><Label htmlFor="c1">Presencial</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="telefone" id="c2" /><Label htmlFor="c2">Por telefone</Label></div>
          </RadioGroup>
        </FormField>
        <div className="flex items-center gap-2"><Switch id="avisos" defaultChecked /><Label htmlFor="avisos">Receber avisos por e-mail</Label></div>
      </fieldset>
      <Button type="submit">Salvar preferências</Button>
    </form>
  );
}`,
  },
  "formularios/etapas-de-preenchimento": {
    label: "Formulário em etapas",
    desc: "Três passos com progresso, voltar/avançar e revisão antes do envio.",
    filename: "EtapasDemo.jsx",
    prompt:
      "Crie um formulário em etapas usando @semec/ds/react: barra de progresso com etapa atual, validação por passo, foco no primeiro erro e revisão final antes do envio.",
    usage: `import { useState } from "react";
import { Button, FormField, Input, Progress } from "@semec/ds/react";
export function EtapasDemo() {
  const [passo, setPasso] = useState(0);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const avancar = () => { if (passo === 0 && nome.trim().length < 3) { setErro("Informe o nome completo."); return; } setErro(""); passo === 2 ? setEnviado(true) : setPasso(passo + 1); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); avancar(); }}>
      <p role="status">Etapa {passo + 1} de 3 — {["Dados pessoais", "Contato", "Revisão"][passo]}</p>
      <Progress value={Math.round(((passo + 1) / 3) * 100)} aria-label="Progresso do formulário" />
      {enviado && <p role="status">Solicitação enviada — protocolo 2026.042.</p>}
      {passo === 0 && <FormField id="nome-f" label="Nome completo" htmlFor="nome" error={erro}><Input id="nome" value={nome} aria-invalid={!!erro} onChange={(e) => setNome(e.target.value)} aria-describedby={erro ? "nome-f-error" : undefined} /></FormField>}
      {passo === 2 && <p>Revisão: {nome || "—"}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setPasso((p) => Math.max(p - 1, 0))} disabled={passo === 0}>Voltar</Button>
        <Button type="submit">{passo === 2 ? "Enviar" : "Avançar"}</Button>
      </div>
    </form>
  );
}`,
  },
  "formularios/confirmacao-de-envio": {
    label: "Confirmação de envio",
    desc: "Comprovante com número de protocolo e ação para iniciar outra solicitação.",
    filename: "ConfirmacaoEnvioDemo.jsx",
    prompt:
      "Crie a confirmação de envio de formulário usando @semec/ds/react: Alert de sucesso com protocolo, mensagem em aria-live e botão para nova solicitação.",
    usage: `import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle, Button, FormField, Input } from "@semec/ds/react";
export function ConfirmacaoEnvio() {
  const [protocolo, setProtocolo] = useState("");
  const confirmacaoRef = useRef(null);
  useEffect(() => { if (protocolo) confirmacaoRef.current?.focus(); }, [protocolo]);
  if (protocolo) return (
    <div className="space-y-4">
      <Alert ref={confirmacaoRef} tabIndex={-1} variant="success" aria-live="polite">
        <AlertTitle>Solicitação enviada</AlertTitle>
        <AlertDescription>Protocolo {protocolo}. Resposta em até 5 dias úteis.</AlertDescription>
      </Alert>
      <Button type="button" variant="outline" onClick={() => setProtocolo("")}>Nova solicitação</Button>
    </div>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); setProtocolo("2026.042"); }}>
      <FormField id="assunto-f" label="Assunto" htmlFor="assunto" hint="Vira o comprovante."><Input id="assunto" /></FormField>
      <Button type="submit">Enviar solicitação</Button>
    </form>
  );
}`,
  },
  "formularios/prevencao-de-perda-de-dados": {
    label: "Aviso de perda de dados",
    desc: "Saída com alterações não salvas abre diálogo de confirmação antes de descartar.",
    filename: "PrevencaoPerdaDemo.jsx",
    prompt:
      "Crie a proteção contra perda de dados usando @semec/ds/react (AlertDialog): formulário sujo dispara confirmação ao sair, foco inicial no cancelar e ação explícita para descartar.",
    usage: `import { useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Button, FormField, Input } from "@semec/ds/react";
export function PrevencaoPerda() {
  const [titulo, setTitulo] = useState("");
  const [dialogo, setDialogo] = useState(false);
  const cancelarRef = useRef(null);
  const sujo = titulo !== "";
  const descartar = () => setTitulo("");
  return (
    <div className="space-y-4">
      <p role="status">{sujo ? "Alterações não salvas." : "Nenhuma alteração pendente."}</p>
      <FormField id="titulo-f" label="Título da demanda" htmlFor="titulo" required>
        <Input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </FormField>
      <Button type="button" variant="outline" onClick={() => sujo && setDialogo(true)}>Voltar</Button>
      <AlertDialog open={dialogo} onOpenChange={setDialogo}>
        <AlertDialogContent onOpenAutoFocus={(e) => { e.preventDefault(); cancelarRef.current?.focus(); }}>
          <AlertDialogHeader><AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>Os dados digitados serão perdidos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelarRef}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={descartar}>Descartar alterações</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}`,
  },
};
