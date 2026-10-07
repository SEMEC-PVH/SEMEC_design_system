"use client";

import { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
} from "semec-ds/react";
import { Download } from "lucide-react";
import { usePreviewPortalContainer } from "@/components/docs/PreviewFrame";

const FORMATOS = [
  { id: "csv", nome: "CSV", detalhe: "Planilha simples, 8 protocolos" },
  { id: "xlsx", nome: "XLSX", detalhe: "Planilha com colunas formatadas" },
  { id: "pdf", nome: "PDF", detalhe: "Relatório com cabeçalho e filtros" },
];

export function ExportacaoDemo() {
  const portalContainer = usePreviewPortalContainer();
  const [estado, setEstado] = useState("ocioso"); // ocioso | gerando | pronto
  const [formato, setFormato] = useState(null);

  function gerar(id) {
    setFormato(id);
    setEstado("gerando");
    setTimeout(() => setEstado("pronto"), 1500);
  }

  const nomeArquivo = formato ? `relatorio-protocolos.${formato}` : "";

  const statusTexto =
    estado === "ocioso"
      ? "Escolha um formato: os 8 protocolos filtrados serão exportados."
      : estado === "gerando"
        ? `Gerando arquivo ${nomeArquivo}…`
        : `Arquivo ${nomeArquivo} pronto para baixar.`;

  return (
    <div className="w-full max-w-md space-y-3 text-left">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download aria-hidden="true" />
              Exportar dados
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent portalContainer={portalContainer} align="start">
            <DropdownMenuLabel>Formato do arquivo</DropdownMenuLabel>
            {FORMATOS.map((f) => (
              <DropdownMenuItem
                key={f.id}
                disabled={estado === "gerando"}
                onSelect={() => gerar(f.id)}
              >
                <span className="font-medium">{f.nome}</span>
                <span className="ml-2 text-xs text-muted-foreground">{f.detalhe}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={estado !== "pronto"}>
              Baixar arquivo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {estado === "gerando" && <Spinner className="h-5 w-5" />}
      </div>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {statusTexto}
      </p>
    </div>
  );
}
