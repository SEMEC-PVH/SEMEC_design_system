"use client";

import { Alert, AlertDescription, AlertTitle } from "semec-ds/react";

export function AvisoDemo() {
  return (
    <div className="w-full max-w-xl space-y-3 p-4 text-left">
      <Alert variant="warning">
        <AlertTitle>Manutenção programada</AlertTitle>
        <AlertDescription>
          A emissão de guias ficará fora do ar no sábado, das 22h às 2h, para atualização do
          sistema. Nesse período, salve um rascunho e tente mais tarde.
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTitle>Atendimento apenas com agendamento</AlertTitle>
        <AlertDescription>
          Neste mês os balcões atendem com hora marcada. Agende pelo portal ou ligue 156.
        </AlertDescription>
      </Alert>
    </div>
  );
}
