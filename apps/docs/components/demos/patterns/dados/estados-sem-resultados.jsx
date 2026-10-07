"use client";

import { useState } from "react";
import { Badge, Button, EmptyState, Label, Switch } from "semec-ds/react";
import { Inbox } from "lucide-react";

const RESULTADOS = [
  { id: "2026.0421", requerente: "Ana Beatriz Lima", servico: "Reforma de fachada" },
  { id: "2026.0444", requerente: "Rogério Alves", servico: "Reforma interna" },
  { id: "2026.0470", requerente: "Eduardo Campos", servico: "Reforma interna" },
];

const BUSCA = "reforma";

export function EstadoVazioDemo() {
  const [semResultados, setSemResultados] = useState(true);

  function limparBusca() {
    setSemResultados(false);
  }

  return (
    <div className="w-full max-w-xl space-y-4 text-left">
      <div className="flex items-center gap-2">
        <Switch
          id="ev-vazio"
          checked={semResultados}
          onCheckedChange={setSemResultados}
          aria-describedby="ev-vazio-ajuda"
        />
        <Label htmlFor="ev-vazio" className="text-sm">
          Simular busca sem resultados
        </Label>
      </div>
      <p id="ev-vazio-ajuda" className="text-xs text-muted-foreground">
        Alterna entre a lista com correspondências e o estado vazio de &quot;{BUSCA}&quot;.
      </p>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {semResultados
          ? `Nenhum resultado para "${BUSCA}".`
          : `${RESULTADOS.length} resultados para "${BUSCA}".`}
      </p>

      {semResultados ? (
        <EmptyState
          icon={<Inbox />}
          title={`Nenhum resultado para "${BUSCA}"`}
          description="Confira a ortografia, remova filtros ativos ou tente outro termo — por exemplo, o número do protocolo ou o nome do requerente."
          action={
            <Button variant="outline" onClick={limparBusca}>
              Limpar busca
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {RESULTADOS.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">Protocolo {r.id}</p>
                <p className="text-sm text-foreground">
                  {r.requerente} · {r.servico}
                </p>
              </div>
              <Badge variant="info">Correspondência</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
