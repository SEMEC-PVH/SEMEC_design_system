"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  FormField,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  maskCPF,
  maskCNPJ,
  maskCEP,
  maskCurrency,
  validateEmail,
} from "@/base";

export function FormAdvanced() {
  const [tipo, setTipo] = useState("pf"); // pf | pj
  const [doc, setDoc] = useState("");
  const [cep, setCep] = useState("");
  const [valor, setValor] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [termos, setTermos] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const docMasked = tipo === "pf" ? maskCPF(doc) : maskCNPJ(doc);
  const emailError = touched.email && !validateEmail(email) ? "Informe um e-mail válido (ex: nome@semec.pvh.br)." : undefined;
  const nomeError = touched.nome && nome.trim().length < 3 ? "Informe o nome com ao menos 3 caracteres." : undefined;
  const docError = touched.doc && (tipo === "pf" ? doc.replace(/\D/g, "").length !== 11 : doc.replace(/\D/g, "").length !== 14) ? `Informe ${tipo === "pf" ? "CPF" : "CNPJ"} completo.` : undefined;
  const termosError = submitted && !termos ? "É necessário aceitar os termos para enviar." : undefined;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, nome: true, doc: true });
    setSubmitted(true);
    const hasError = !validateEmail(email) || nome.trim().length < 3 || (tipo === "pf" ? doc.replace(/\D/g, "").length !== 11 : doc.replace(/\D/g, "").length !== 14) || !termos;
    if (hasError) {
      document.getElementById("form-erros")?.focus();
      return;
    }
    alert(`Enviado: ${nome} · ${docMasked} · ${email} · ${valor}`);
  }

  const hasAnyError = emailError || nomeError || docError;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-xl">
      {/* Resumo erros a11y — padrão SEM-505 */}
      {hasAnyError || termosError ? (
        <div
          id="form-erros"
          tabIndex={-1}
          role="alert"
          aria-labelledby="form-erros-titulo"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 focus:outline-none focus:ring-2 focus:ring-destructive"
        >
          <h2 id="form-erros-titulo" className="text-sm font-semibold text-destructive">Corrija os campos destacados</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-destructive">
            {nomeError && <li><a href="#f-nome" className="underline">{nomeError}</a></li>}
            {emailError && <li><a href="#f-email" className="underline">{emailError}</a></li>}
            {docError && <li><a href="#f-doc" className="underline">{docError}</a></li>}
            {termosError && <li>{termosError}</li>}
          </ul>
        </div>
      ) : (
        <Alert>
          <AlertTitle>Campos com * são obrigatórios</AlertTitle>
          <AlertDescription>Dica, erro e label seguem ordem a11y: label → campo → hint → erro.</AlertDescription>
        </Alert>
      )}

      <FormField label="Tipo de cadastro" htmlFor="f-tipo" required>
        <RadioGroup id="f-tipo" value={tipo} onValueChange={(v) => { setTipo(v); setDoc(""); }} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="pf" id="f-pf" />
            <Label htmlFor="f-pf">Pessoa física (CPF)</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="pj" id="f-pj" />
            <Label htmlFor="f-pj">Pessoa jurídica (CNPJ)</Label>
          </div>
        </RadioGroup>
      </FormField>

      <FormField
        label={tipo === "pf" ? "CPF" : "CNPJ"}
        htmlFor="f-doc"
        required
        hint={tipo === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
        error={docError}
      >
        <Input
          id="f-doc"
          inputMode="numeric"
          placeholder={tipo === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
          value={docMasked}
          onChange={(e) => setDoc(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, doc: true }))}
          aria-invalid={!!docError}
          aria-describedby={docError ? "f-doc-error" : undefined}
        />
      </FormField>

      <FormField label="Nome completo" htmlFor="f-nome" required hint="Como no documento" error={nomeError}>
        <Input
          id="f-nome"
          placeholder="Ex: Maria Silva"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, nome: true }))}
          aria-invalid={!!nomeError}
        />
      </FormField>

      <FormField label="E-mail institucional" htmlFor="f-email" required hint="Usado para comprovante" error={emailError}>
        <Input
          id="f-email"
          type="email"
          placeholder="nome@semec.pvh.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, email: true }))}
          aria-invalid={!!emailError}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="CEP" htmlFor="f-cep" hint="00000-000">
          <Input id="f-cep" inputMode="numeric" placeholder="00000-000" value={maskCEP(cep)} onChange={(e) => setCep(e.target.value)} />
        </FormField>
        <FormField label="Valor estimado" htmlFor="f-valor" hint="Máscara moeda">
          <Input id="f-valor" inputMode="numeric" placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(maskCurrency(e.target.value))} />
        </FormField>
      </div>

      <FormField label="Município" htmlFor="f-municipio">
        <Select defaultValue="pbh">
          <SelectTrigger id="f-municipio" aria-label="Município"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pbh">Porto Velho</SelectItem>
            <SelectItem value="riob">Rio Branco</SelectItem>
            <SelectItem value="cv">Cruzeiro do Sul</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Descrição da demanda" htmlFor="f-msg" hint="Máx. 500 caracteres">
        <Textarea id="f-msg" rows={3} maxLength={500} placeholder="Descreva o objeto do contrato" value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        <p className="text-xs text-muted-foreground text-right">{mensagem.length}/500</p>
      </FormField>

      <div className="flex items-start gap-2">
        <Checkbox id="f-termos" checked={termos} onCheckedChange={(v) => setTermos(v === true)} aria-invalid={!!termosError} />
        <Label htmlFor="f-termos" className="leading-tight">Li e aceito os termos de uso *</Label>
      </div>
      {termosError && <p role="alert" className="text-xs text-destructive">{termosError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit">Enviar requerimento</Button>
        <Button type="button" variant="outline" onClick={() => { setDoc(""); setEmail(""); setNome(""); setMensagem(""); setTermos(false); setTouched({}); setSubmitted(false); }}>Limpar</Button>
      </div>
    </form>
  );
}

export const formAdvancedUsage = `import { FormField, Input, Select, Checkbox, Button, Alert } from "@semec/base";
import { FormAdvanced } from "@/components/demos/examples/form-advanced";

// Padrão completo: máscara CPF/CNPJ/CEP/moeda, validação, ErrorSummary a11y
<FormAdvanced />`;
