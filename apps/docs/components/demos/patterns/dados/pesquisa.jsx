"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "semec-ds/react";
import { Search } from "lucide-react";

const REGISTROS = [
  { protocolo: "2026.0412", requerente: "Maria de Souza", servico: "IPTU 2026", status: "Em análise" },
  { protocolo: "2026.0418", requerente: "João Pereira", servico: "Alvará de funcionamento", status: "Deferido" },
  { protocolo: "2026.0421", requerente: "Ana Beatriz Lima", servico: "Reforma de fachada", status: "Indeferido" },
  { protocolo: "2026.0430", requerente: "Carlos Mendes", servico: "IPTU 2026", status: "Em análise" },
  { protocolo: "2026.0437", requerente: "Fernanda Dias", servico: "Cadastro de fornecedor", status: "Deferido" },
  { protocolo: "2026.0444", requerente: "Rogério Alves", servico: "Reforma interna", status: "Em análise" },
  { protocolo: "2026.0451", requerente: "Patrícia Nunes", servico: "IPTU 2026", status: "Deferido" },
  { protocolo: "2026.0459", requerente: "Sérgio Ramos", servico: "Alvará sanitário", status: "Indeferido" },
];

const STATUS_VARIANT = { "Em análise": "warning", Deferido: "success", Indeferido: "danger" };

/** Minúsculas e sem acentos — busca tolerante a "iptu" vs "IPTU" e "reforma" vs "reformá". */
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Destaca o trecho encontrado com <mark>, sem depender de cor (fundo + texto). */
function Destaque({ texto, termo }) {
  if (!termo) return texto;
  const alvo = normalizar(termo);
  const base = normalizar(texto);
  if (!alvo || !base.includes(alvo)) return texto;

  const pedacos = [];
  let inicio = 0;
  let pos = base.indexOf(alvo);
  while (pos !== -1) {
    if (pos > inicio) pedacos.push(texto.slice(inicio, pos));
    pedacos.push(
      <mark key={pos} className="rounded-sm bg-warning/30 px-0.5 text-foreground">
        {texto.slice(pos, pos + termo.length)}
      </mark>
    );
    inicio = pos + termo.length;
    pos = base.indexOf(alvo, inicio);
  }
  if (inicio < texto.length) pedacos.push(texto.slice(inicio));
  return pedacos;
}

export function PesquisaDemo() {
  const [termo, setTermo] = useState("");
  const busca = termo.trim();

  const resultados = useMemo(() => {
    if (!busca) return REGISTROS;
    const alvo = normalizar(busca);
    return REGISTROS.filter((r) =>
      normalizar(`${r.protocolo} ${r.requerente} ${r.servico}`).includes(alvo)
    );
  }, [busca]);

  return (
    <div className="w-full max-w-2xl space-y-4 text-left">
      <div>
        <label htmlFor="ps-busca" className="mb-1 block text-xs font-medium text-muted-foreground">
          Buscar protocolo
        </label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="ps-busca"
            className="pl-9"
            placeholder="Número, requerente ou serviço"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {busca
          ? `${resultados.length} de ${REGISTROS.length} protocolos encontrados para "${busca}"`
          : `${REGISTROS.length} protocolos listados`}
      </p>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Requerente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum protocolo corresponde a &quot;{busca}&quot;. Tente outro termo ou limpe a busca.
                </TableCell>
              </TableRow>
            ) : (
              resultados.map((r) => (
                <TableRow key={r.protocolo}>
                  <TableCell className="font-mono text-xs">
                    <Destaque texto={r.protocolo} termo={busca} />
                  </TableCell>
                  <TableCell>
                    <Destaque texto={r.requerente} termo={busca} />
                  </TableCell>
                  <TableCell>
                    <Destaque texto={r.servico} termo={busca} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
