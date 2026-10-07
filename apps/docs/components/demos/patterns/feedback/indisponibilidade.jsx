"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  EmptyState,
  Link,
  Spinner,
} from "semec-ds/react";
import { ServerOff } from "lucide-react";

export function IndisponibilidadeDemo() {
  const [tentando, setTentando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function tentarNovamente() {
    setMensagem("");
    setTentando(true);
    setTimeout(() => {
      setTentando(false);
      setMensagem("Ainda não foi possível conectar. Nova tentativa automática em 30 s.");
    }, 1400);
  }

  return (
    <div className="w-full max-w-xl space-y-4 p-4 text-left">
      <Alert variant="warning">
        <AlertTitle>Serviço fora do ar</AlertTitle>
        <AlertDescription>
          A emissão de guias está indisponível desde as 14h20. Previsão de retorno: hoje, às 18h.
        </AlertDescription>
      </Alert>

      <EmptyState
        icon={<ServerOff />}
        title="Não foi possível carregar os dados"
        description="Tente novamente em instantes. Se precisar agora, use um dos canais de suporte abaixo."
        action={
          <Button onClick={tentarNovamente} disabled={tentando}>
            {tentando && <Spinner className="h-4 w-4" aria-hidden="true" />}
            {tentando ? "Tentando…" : "Tentar novamente"}
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground">
        Suporte: <Link href="tel:166">166</Link> (WhatsApp e telefone) ·{" "}
        <Link href="mailto:suporte@prefeitura.gov.br">suporte@prefeitura.gov.br</Link>
      </p>

      <p role="status" className="text-sm text-muted-foreground">
        {mensagem}
      </p>
    </div>
  );
}
