import DataTableDemo from "@/components/demos/DataTableDemo";

export const metadata = { title: "Tabela de dados" };

export default function DataTablePage() {
  return (
    <>
      <h1>Tabela de dados</h1>
      <p className="subtitle">
        Tabela genérica com ordenação visual, paginação e empty state.
      </p>

      <h3>Demonstração</h3>
      <p>
        Clique nos cabeçalhos ordenáveis para alternar a direção. A paginação
        navega entre páginas de dados.
      </p>
      <div className="preview">
        <DataTableDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Para exibir listas de dados tabulares com ordenação e paginação. Ideal
        para listas de registros, relatórios e resultados de busca.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Para dados simples sem necessidade de ordenação, use{" "}
        <code>Table</code>. Para listas com muitas colunas ou filtros
        avançados, considere um componente dedicado.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          Tabela semântica com <code>role=&quot;table&quot;</code> e headers
          com <code>scope=&quot;col&quot;</code>.
        </li>
        <li>
          Paginação com <code>role=&quot;navigation&quot;</code> e{" "}
          <code>aria-label=&quot;Paginação&quot;</code>.
        </li>
        <li>
          Colunas ordenáveis indicam direção com <code>aria-sort</code>.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`import { DataTable } from "semec-ds/react";

const columns = [
  { key: "nome", header: "Nome", sortable: true },
  { key: "status", header: "Status" },
];

<DataTable
  columns={columns}
  data={registros}
  sortKey={sortField}
  sortDir={sortDir}
  onSort={handleSort}
  page={pagina}
  pageCount={totalPaginas}
  onPageChange={setPagina}
/>`}</code>
      </pre>
    </>
  );
}
