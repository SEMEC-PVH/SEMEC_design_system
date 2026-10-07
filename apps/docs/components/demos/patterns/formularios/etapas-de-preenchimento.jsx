"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FormField,
  Input,
  Progress,
  Textarea,
} from "semec-ds/react";

const PASSOS = ["Dados pessoais", "Contato", "Revisão"];

/**
 * Formulário em 3 etapas: barra de progresso + passos numerados, validação
 * por passo (foco no campo com erro), voltar sem perder dados, revisão final
 * e confirmação. A troca de etapa é anunciada por role="status" e o foco vai
 * para o título da nova etapa.
 */
export function EtapasDemo() {
  const [passo, setPasso] = useState(0);
  const [valores, setValores] = useState({ nome: "", email: "", obs: "" });
  const [erros, setErros] = useState({});
  const [enviado, setEnviado] = useState(false);
  const tituloRef = useRef(null);
  const confirmacaoRef = useRef(null);
  const moverFoco = useRef(null);

  // Foco depois da renderização: título da nova etapa, ou campo com erro
  // (assim aria-describedby já aponta para a mensagem exibida).
  useEffect(() => {
    if (enviado) {
      confirmacaoRef.current?.focus();
      return;
    }
    if (moverFoco.current) {
      const alvo = moverFoco.current;
      moverFoco.current = null;
      if (alvo === "titulo") tituloRef.current?.focus();
      else document.getElementById(alvo)?.focus();
    }
  }, [enviado, erros]);

  function errosDoPasso() {
    const encontrados = {};
    if (passo === 0 && valores.nome.trim().length < 3) {
      encontrados["et-nome"] = "Informe o nome completo, com ao menos 3 letras.";
    }
    if (passo === 1 && !valores.email.includes("@")) {
      encontrados["et-email"] = "Informe um e-mail válido, com @.";
    }
    return encontrados;
  }

  function avancar() {
    const encontrados = errosDoPasso();
    if (Object.keys(encontrados).length > 0) {
      moverFoco.current = Object.keys(encontrados)[0];
      setErros(encontrados);
      return;
    }
    moverFoco.current = "titulo";
    setErros({});
    setPasso((atual) => Math.min(atual + 1, PASSOS.length - 1));
  }

  function voltar() {
    moverFoco.current = "titulo";
    setErros({});
    setPasso((atual) => Math.max(atual - 1, 0));
  }

  function aoSubmeter(event) {
    event.preventDefault();
    if (passo < PASSOS.length - 1) avancar();
    else setEnviado(true);
  }

  function reiniciar() {
    moverFoco.current = "titulo";
    setValores({ nome: "", email: "", obs: "" });
    setErros({});
    setPasso(0);
    setEnviado(false);
  }

  const progresso = Math.round(((passo + 1) / PASSOS.length) * 100);

  if (enviado) {
    return (
      <div className="w-full max-w-[560px] space-y-4 p-4 text-left">
        <Alert
          ref={confirmacaoRef}
          tabIndex={-1}
          variant="success"
          className="focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
        >
          <AlertTitle>Solicitação enviada</AlertTitle>
          <AlertDescription>
            A resposta chega em {valores.email || "seu e-mail"} em até 5 dias úteis.
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" onClick={reiniciar}>
          Preencher novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[560px] space-y-5 p-4 text-left">
      <div className="space-y-2">
        <p role="status" className="text-sm font-medium text-foreground">
          Etapa {passo + 1} de {PASSOS.length} — {PASSOS[passo]}
        </p>
        <Progress value={progresso} aria-label="Progresso do formulário" />
        <ol className="flex flex-wrap gap-2">
          {PASSOS.map((titulo, i) => (
            <li
              key={titulo}
              aria-current={i === passo ? "step" : undefined}
              className={
                i === passo
                  ? "rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground"
                  : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              }
            >
              {i + 1}. {titulo}
              {i < passo ? " — concluída" : i === passo ? " — etapa atual" : ""}
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={aoSubmeter} noValidate className="space-y-5">
        <h3
          ref={tituloRef}
          tabIndex={-1}
          className="text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
        >
          {PASSOS[passo]}
        </h3>

        {passo === 0 && (
          <div className="space-y-4">
            <FormField
              id="et-nome-campo"
              label="Nome completo"
              htmlFor="et-nome"
              required
              error={erros["et-nome"]}
            >
              <Input
                id="et-nome"
                value={valores.nome}
                onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
                aria-invalid={erros["et-nome"] ? true : undefined}
                aria-describedby={erros["et-nome"] ? "et-nome-campo-error" : undefined}
              />
            </FormField>
            <FormField
              id="et-obs-campo"
              label="Observações"
              htmlFor="et-obs"
              hint="Opcional. Máx. 300 caracteres."
            >
              <Textarea
                id="et-obs"
                rows={3}
                maxLength={300}
                value={valores.obs}
                onChange={(e) => setValores((v) => ({ ...v, obs: e.target.value }))}
                aria-describedby="et-obs-campo-hint"
              />
            </FormField>
          </div>
        )}

        {passo === 1 && (
          <FormField
            id="et-email-campo"
            label="E-mail para retorno"
            htmlFor="et-email"
            required
            hint="Usado para avisar sobre o andamento."
            error={erros["et-email"]}
          >
            <Input
              id="et-email"
              type="email"
              value={valores.email}
              onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
              aria-invalid={erros["et-email"] ? true : undefined}
              aria-describedby={
                erros["et-email"] ? "et-email-campo-error" : "et-email-campo-hint"
              }
            />
          </FormField>
        )}

        {passo === 2 && (
          <dl className="space-y-2 rounded-lg border border-border bg-surface p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nome completo</dt>
              <dd className="text-foreground">{valores.nome || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">E-mail para retorno</dt>
              <dd className="text-foreground">{valores.email || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Observações</dt>
              <dd className="text-foreground">{valores.obs || "—"}</dd>
            </div>
          </dl>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={voltar} disabled={passo === 0}>
            Voltar
          </Button>
          <Button type="submit">
            {passo === PASSOS.length - 1 ? "Enviar solicitação" : "Avançar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
