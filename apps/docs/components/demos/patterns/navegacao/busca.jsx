"use client";

import { useState } from "react";
import { Button, EmptyState, Input } from "semec-ds/react";
import { Search } from "lucide-react";

const SERVICOS = [
  { nome: "IPTU — segunda via do carnê", categoria: "Tributos", prazo: "imediato" },
  { nome: "Parcelamento de débitos", categoria: "Tributos", prazo: "até 5 dias úteis" },
  { nome: "Alvará de funcionamento", categoria: "Urbanismo", prazo: "10 dias úteis" },
  { nome: "Licença de obra", categoria: "Urbanismo", prazo: "15 dias úteis" },
  { nome: "Certidão negativa de débitos", categoria: "Documentos", prazo: "3 dias úteis" },
  { nome: "Cadastro de fornecedor", categoria: "Compras", prazo: "2 dias úteis" },
  { nome: "Agendamento de atendimento", categoria: "Atendimento", prazo: "imediato" },
  { nome: "Declaração de residência", categoria: "Documentos", prazo: "imediato" },
];

/** Busca tolerante a acentos e caixa alta: "iptu" encontra "IPTU". */
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Campo de busca que filtra a lista enquanto o usuário digita.
 * O total vai para uma região aria-live e, quando nada bate, o componente
 * EmptyState assume com motivo, sugestão e ação de limpar a busca.
 */
export function BuscaDemo() {
  const [termo, setTermo] = useState("");
  const busca = termo.trim();

  const resultados = busca
    ? SERVICOS.filter((servico) =>
        normalizar(`${servico.nome} ${servico.categoria}`).includes(normalizar(busca))
      )
    : SERVICOS;

  return (
    <div className="w-full max-w-2xl space-y-4 text-left">
      <div className="rounded-lg border border-border bg-surface p-4">
        <label htmlFor="nv-busca" className="mb-1 block text-xs font-medium text-muted-foreground">
          Buscar serviço
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="nv-busca"
            type="search"
            className="pl-9"
            placeholder="Ex.: iptu, alvará, certidão"
            value={termo}
            onChange={(event) => setTermo(event.target.value)}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Digite para filtrar a lista; o resultado é anunciado logo abaixo.
        </p>
      </div>

      <p role="status" aria-live="polite" className="text-sm font-medium text-foreground">
        {busca
          ? `${resultados.length} de ${SERVICOS.length} serviços encontrados para "${busca}"`
          : `${SERVICOS.length} serviços disponíveis`}
      </p>

      {resultados.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Nenhum serviço encontrado"
          description={`Nada corresponde a "${busca}". Tente "iptu", "alvará" ou "certidão".`}
          action={
            <Button variant="outline" onClick={() => setTermo("")}>
              Limpar busca
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {resultados.map((servico) => (
            <li key={servico.nome} className="rounded-md border border-border bg-surface px-3 py-2">
              <p className="text-sm font-medium text-foreground">{servico.nome}</p>
              <p className="text-xs text-muted-foreground">
                {servico.categoria} · Prazo: {servico.prazo}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
