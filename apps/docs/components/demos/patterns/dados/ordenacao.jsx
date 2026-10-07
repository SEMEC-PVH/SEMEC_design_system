"use client";

import { useMemo, useState } from "react";
import { DataTable } from "semec-ds/react";

const COLUNAS = [
  { key: "protocolo", header: "Protocolo", sortable: true },
  { key: "requerente", header: "Requerente", sortable: true },
  { key: "servico", header: "Serviço" },
  { key: "valor", header: "Valor", sortable: true, className: "text-right" },
];

const DADOS = [
  { protocolo: "2026.0412", requerente: "Maria de Souza", servico: "IPTU 2026", valor: 1280 },
  { protocolo: "2026.0418", requerente: "João Pereira", servico: "Alvará", valor: 640 },
  { protocolo: "2026.0421", requerente: "Ana Beatriz Lima", servico: "Reforma", valor: 3150 },
  { protocolo: "2026.0430", requerente: "Carlos Mendes", servico: "Alvará", valor: 890 },
  { protocolo: "2026.0437", requerente: "Fernanda Dias", servico: "Cadastro", valor: 450 },
  { protocolo: "2026.0444", requerente: "Rogério Alves", servico: "Reforma", valor: 2270 },
  { protocolo: "2026.0451", requerente: "Patrícia Nunes", servico: "IPTU 2026", valor: 1740 },
  { protocolo: "2026.0459", requerente: "Sérgio Ramos", servico: "Alvará", valor: 520 },
];

const ORDENACAO_PADRAO = { chave: "protocolo", direcao: "asc" };

export function OrdenacaoDemo() {
  const [sortKey, setSortKey] = useState(ORDENACAO_PADRAO.chave);
  const [sortDir, setSortDir] = useState(ORDENACAO_PADRAO.direcao);

  function aoOrdenar(chave) {
    if (sortKey === chave) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(chave);
      setSortDir("asc");
    }
  }

  const ordenados = useMemo(() => {
    const lista = [...DADOS];
    lista.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return lista;
  }, [sortKey, sortDir]);

  const colunaAtiva = COLUNAS.find((c) => c.key === sortKey);

  return (
    <div className="w-full max-w-2xl space-y-3 text-left">
      <DataTable
        columns={COLUNAS}
        data={ordenados}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={aoOrdenar}
        caption="Protocolos de 2026 — use o botão do cabeçalho para ordenar."
      />
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        Ordenado por {colunaAtiva ? colunaAtiva.header : sortKey},{" "}
        {sortDir === "asc" ? "crescente" : "decrescente"} — {ordenados.length} registros.
      </p>
    </div>
  );
}
