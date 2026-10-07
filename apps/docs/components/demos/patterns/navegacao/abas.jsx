"use client";

import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "semec-ds/react";

const RESUMO = [
  { termo: "Protocolo", valor: "2026.0412" },
  { termo: "Requerente", valor: "Maria de Souza" },
  { termo: "Serviço", valor: "IPTU 2026 — segunda via" },
  { termo: "Entrada", valor: "12/08/2026" },
];

const DEBITOS = [
  { parcela: "1ª parcela", vencimento: "30/09/2026", valor: "R$ 412,90", situacao: "Em aberto" },
  { parcela: "2ª parcela", vencimento: "30/10/2026", valor: "R$ 412,90", situacao: "Em aberto" },
  { parcela: "Taxa de emissão", vencimento: "12/08/2026", valor: "R$ 8,40", situacao: "Pago" },
];

const ANDAMENTO = [
  { data: "12/08/2026", texto: "Requerimento protocolado pelo portal." },
  { data: "14/08/2026", texto: "Documento de identidade anexado e conferido." },
  { data: "19/08/2026", texto: "Em análise na Secretaria de Finanças." },
];

/**
 * Abas com três visões do mesmo requerimento. O Radix cuida de
 * role=tablist/tab/tabpanel, aria-selected e da navegação por setas —
 * o conteúdo de cada painel continua no DOM, trocado sem sair da página.
 */
export function AbasDemo() {
  return (
    <div className="w-full max-w-2xl text-left">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Requerimento</p>
            <p className="text-sm font-semibold text-foreground">2026.0412 · IPTU 2026</p>
          </div>
          <Badge variant="warning">Em análise</Badge>
        </div>

        <Tabs defaultValue="resumo">
          <TabsList>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="debitos">Débitos</TabsTrigger>
            <TabsTrigger value="andamento">Andamento</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {RESUMO.map((campo) => (
                <div key={campo.termo} className="border-b border-border pb-2">
                  <dt className="text-xs text-muted-foreground">{campo.termo}</dt>
                  <dd className="text-sm font-medium text-foreground">{campo.valor}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>

          <TabsContent value="debitos">
            <ul className="space-y-2">
              {DEBITOS.map((debito) => (
                <li
                  key={debito.parcela}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">{debito.parcela}</span>
                  <span className="text-muted-foreground">
                    Vence em {debito.vencimento} · {debito.valor}
                  </span>
                  <Badge variant={debito.situacao === "Pago" ? "success" : "secondary"}>
                    {debito.situacao}
                  </Badge>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="andamento">
            <ol className="space-y-3 border-l border-border pl-4">
              {ANDAMENTO.map((evento) => (
                <li key={evento.data} className="relative">
                  <span className="block text-xs font-medium text-muted-foreground">{evento.data}</span>
                  <span className="block text-sm text-foreground">{evento.texto}</span>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
