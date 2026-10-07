"use client";

import { useState } from "react";
import {
  Button,
  FormField,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Switch,
} from "semec-ds/react";

/**
 * Agrupamento semântico: dois <fieldset> com <legend> visível — dados do
 * requerente (FormField + Input) e preferências (FormField + RadioGroup +
 * Switch). A ordem de foco segue a ordem visual dos grupos.
 */
export function AgrupamentoDemo() {
  const [valores, setValores] = useState({ nome: "", email: "" });
  const [canal, setCanal] = useState("presencial");
  const [avisos, setAvisos] = useState(true);
  const [status, setStatus] = useState("");

  function aoEnviar(event) {
    event.preventDefault();
    const canalLabel = canal === "presencial" ? "atendimento presencial" : "atendimento por telefone";
    setStatus(
      "Preferências salvas: " +
        canalLabel +
        (avisos ? ", avisos por e-mail ativados" : ", sem avisos por e-mail") +
        "."
    );
  }

  return (
    <div className="w-full max-w-[560px] p-4 text-left">
      <form onSubmit={aoEnviar} noValidate className="space-y-5">
        <fieldset className="rounded-lg border border-border bg-surface p-4">
          <legend className="bg-surface px-1 text-sm font-semibold text-foreground">
            Dados do requerente
          </legend>
          <div className="space-y-4">
            <FormField
              id="ag-nome-campo"
              label="Nome completo"
              htmlFor="ag-nome"
              required
              hint="Como no documento."
            >
              <Input
                id="ag-nome"
                value={valores.nome}
                onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
                aria-describedby="ag-nome-campo-hint"
              />
            </FormField>
            <FormField
              id="ag-email-campo"
              label="E-mail"
              htmlFor="ag-email"
              hint="Recebe a confirmação do atendimento."
            >
              <Input
                id="ag-email"
                type="email"
                value={valores.email}
                onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
                aria-describedby="ag-email-campo-hint"
              />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-border bg-surface p-4">
          <legend className="bg-surface px-1 text-sm font-semibold text-foreground">
            Preferências de atendimento
          </legend>
          <div className="space-y-4">
            <FormField id="ag-canal-campo" label="Canal preferido" htmlFor="ag-canal">
              <RadioGroup id="ag-canal" value={canal} onValueChange={setCanal}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="presencial" id="ag-canal-presencial" />
                  <Label htmlFor="ag-canal-presencial">Presencial</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="telefone" id="ag-canal-telefone" />
                  <Label htmlFor="ag-canal-telefone">Por telefone</Label>
                </div>
              </RadioGroup>
            </FormField>

            <div className="flex items-center gap-2">
              <Switch id="ag-avisos" checked={avisos} onCheckedChange={setAvisos} />
              <Label htmlFor="ag-avisos">Receber avisos por e-mail</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Estado dos avisos: {avisos ? "ativado" : "desativado"}.
            </p>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Salvar preferências</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        </div>
      </form>
    </div>
  );
}
