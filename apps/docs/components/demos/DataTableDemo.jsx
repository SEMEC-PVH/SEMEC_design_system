"use client";

import { useState } from "react";
import { DataTable } from "semec-ds/react";

const columns = [
  { key: "nome", header: "Nome", sortable: true },
  { key: "email", header: "E-mail" },
  { key: "status", header: "Status", sortable: true },
];

const data = [
  { nome: "João Silva", email: "joao@email.com", status: "Ativo" },
  { nome: "Maria Santos", email: "maria@email.com", status: "Pendente" },
  { nome: "Pedro Lima", email: "pedro@email.com", status: "Inativo" },
  { nome: "Ana Oliveira", email: "ana@email.com", status: "Ativo" },
  { nome: "Carlos Souza", email: "carlos@email.com", status: "Pendente" },
  { nome: "Lucia Ferreira", email: "lucia@email.com", status: "Ativo" },
  { nome: "Roberto Alves", email: "roberto@email.com", status: "Inativo" },
  { nome: "Fernanda Costa", email: "fernanda@email.com", status: "Ativo" },
  { nome: "Marcos Ribeiro", email: "marcos@email.com", status: "Pendente" },
];

export default function DataTableDemo() {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={handleSort}
      page={page}
      pageCount={3}
      onPageChange={setPage}
    />
  );
}
