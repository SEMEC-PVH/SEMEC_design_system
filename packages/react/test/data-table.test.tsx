import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { Button, DataTable, type SortDirection } from "../src/index";
import { severeViolations } from "./axe";

/**
 * DataTable (manifest `data-table`, tabela-de-dados.md): ordenação por botão
 * com aria-sort; linha focável e ativável por Enter/Espaço quando há
 * onRowClick; paginação com alvos de 44px; labels sobrescrevíveis.
 */

type Registro = { nome: string; status: string; valor: string };

const registros: Registro[] = [
  { nome: "Ana", status: "Aberto", valor: "R$ 1.234,56" },
  { nome: "Bruno", status: "Deferido", valor: "R$ 89,90" },
];

const colunas = [
  { key: "nome", header: "Nome", sortable: true },
  { key: "status", header: "Status" },
  { key: "valor", header: "Valor", sortable: true },
];

/** Consumidor típico: alterna asc → desc → asc na mesma coluna. */
function Ordenavel() {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDirection>(null);
  return (
    <DataTable
      caption="Protocolos do contribuinte"
      columns={colunas}
      data={registros}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={(key) => {
        setSortDir(sortKey === key && sortDir === "asc" ? "desc" : "asc");
        setSortKey(key);
      }}
    />
  );
}

describe("DataTable", () => {
  it("a caption nomeia a tabela e os cabeçalhos têm scope=col", () => {
    render(<DataTable caption="Protocolos do contribuinte" columns={colunas} data={registros} />);
    const tabela = screen.getByRole("table", { name: "Protocolos do contribuinte" });
    const cabecalhos = within(tabela).getAllByRole("columnheader");
    expect(cabecalhos).toHaveLength(3);
    for (const th of cabecalhos) expect(th).toHaveAttribute("scope", "col");
  });

  it("aria-sort: none nas ordenáveis sem ordem, ausente nas não ordenáveis", () => {
    render(<DataTable columns={colunas} data={registros} />);
    const [nome, status, valor] = screen.getAllByRole("columnheader");
    expect(nome).toHaveAttribute("aria-sort", "none");
    expect(status).not.toHaveAttribute("aria-sort");
    expect(valor).toHaveAttribute("aria-sort", "none");
  });

  it("o botão \"Ordenar por …\" alterna ascending/descending pelo clique e pelo teclado", async () => {
    const user = userEvent.setup();
    render(<Ordenavel />);
    const botao = screen.getByRole("button", { name: "Ordenar por Nome" });
    const th = botao.closest("th")!;

    await user.click(botao);
    expect(th).toHaveAttribute("aria-sort", "ascending");

    botao.focus();
    await user.keyboard("{Enter}");
    expect(th).toHaveAttribute("aria-sort", "descending");

    await user.keyboard(" ");
    expect(th).toHaveAttribute("aria-sort", "ascending");

    // A outra coluna ordenável volta a "none".
    expect(screen.getByRole("button", { name: "Ordenar por Valor" }).closest("th")).toHaveAttribute(
      "aria-sort",
      "none"
    );
  });

  it("onSort recebe a key da coluna", async () => {
    const onSort = vi.fn();
    render(<DataTable columns={colunas} data={registros} onSort={onSort} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Ordenar por Valor" }));
    expect(onSort).toHaveBeenCalledWith("valor");
  });

  it("sem dados: mensagem PT-BR padrão ocupando todas as colunas; emptyMessage sobrescreve", () => {
    const { rerender } = render(<DataTable columns={colunas} data={[]} />);
    const celula = screen.getByRole("cell", { name: "Nenhum registro encontrado." });
    expect(celula).toHaveAttribute("colspan", "3");
    rerender(<DataTable columns={colunas} data={[]} emptyMessage="Nenhum protocolo neste período." />);
    expect(screen.getByRole("cell", { name: "Nenhum protocolo neste período." })).toBeInTheDocument();
  });

  it("render personaliza a célula e mantém valores em R$ como vieram", () => {
    render(
      <DataTable
        columns={[
          { key: "nome", header: "Nome" },
          { key: "valor", header: "Valor" },
          { key: "acoes", header: "Ações", render: (row: Registro) => <Button variant="outline">Ver {row.nome}</Button> },
        ]}
        data={registros}
      />
    );
    expect(screen.getByRole("cell", { name: "R$ 1.234,56" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver Bruno" })).toBeInTheDocument();
  });

  it("paginação: \"Página X de Y\", Anterior/Próximo com 44px e limites desabilitados", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <DataTable columns={colunas} data={registros} page={1} pageCount={3} onPageChange={onPageChange} />
    );
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    const anterior = screen.getByRole("button", { name: "Anterior" });
    const proximo = screen.getByRole("button", { name: "Próximo" });
    expect(anterior).toBeDisabled();
    expect(anterior).toHaveClass("h-11");
    expect(proximo).toHaveClass("h-11");
    await user.click(proximo);
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    rerender(<DataTable columns={colunas} data={registros} page={3} pageCount={3} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Próximo" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it("paginação some com pageCount <= 1", () => {
    render(<DataTable columns={colunas} data={registros} page={1} pageCount={1} onPageChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "Próximo" })).not.toBeInTheDocument();
  });

  it("labels sobrescreve sortBy, pageOf, previous e next", () => {
    render(
      <DataTable
        columns={colunas}
        data={registros}
        page={2}
        pageCount={4}
        onPageChange={() => {}}
        labels={{
          sortBy: (h) => `Classificar por ${h}`,
          pageOf: (p, t) => `${p}/${t}`,
          previous: "Voltar",
          next: "Avançar",
        }}
      />
    );
    expect(screen.getByRole("button", { name: "Classificar por Nome" })).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeInTheDocument();
  });

  it("onRowClick: a linha entra no Tab e responde a clique, Enter e Espaço", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(<DataTable columns={[{ key: "nome", header: "Nome" }]} data={registros} onRowClick={onRowClick} />);
    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas[0]).toHaveAttribute("tabindex", "0");

    await user.tab();
    expect(linhas[0]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenLastCalledWith(registros[0], 0);

    await user.tab();
    expect(linhas[1]).toHaveFocus();
    await user.keyboard(" ");
    expect(onRowClick).toHaveBeenLastCalledWith(registros[1], 1);

    await user.click(within(linhas[0]!).getByText("Ana"));
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });

  it("sem onRowClick a linha não é focável", () => {
    render(<DataTable columns={[{ key: "nome", header: "Nome" }]} data={registros} />);
    expect(screen.getAllByRole("row")[1]).not.toHaveAttribute("tabindex");
  });

  it("Enter numa célula sem botão não chama onRowClick duas vezes (keydown só na própria linha)", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(<DataTable columns={[{ key: "nome", header: "Nome" }]} data={[registros[0]!]} onRowClick={onRowClick} />);
    screen.getAllByRole("row")[1]!.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  // TST-F2-04: o keydown da linha ignora teclas vindas de botões nas células
  // (data-table.tsx, handleRowKeyDown), mas o `onClick` da <tr> não: o clique
  // (do mouse ou o sintético do Enter/Espaço) num botão da célula sobe até a
  // linha e dispara onRowClick junto com a ação do botão.
  it.fails("TST-F2-04: Enter num botão da célula não ativa a linha", async () => {
    const onRowClick = vi.fn();
    const onVer = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={[{ key: "acoes", header: "Ações", render: () => <Button onClick={onVer}>Ver</Button> }]}
        data={[registros[0]!]}
        onRowClick={onRowClick}
      />
    );
    screen.getByRole("button", { name: "Ver" }).focus();
    await user.keyboard("{Enter}");
    expect(onVer).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it.fails("TST-F2-04: clicar num botão da célula não ativa a linha", async () => {
    const onRowClick = vi.fn();
    const onVer = vi.fn();
    render(
      <DataTable
        columns={[{ key: "acoes", header: "Ações", render: () => <Button onClick={onVer}>Ver</Button> }]}
        data={[registros[0]!]}
        onRowClick={onRowClick}
      />
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Ver" }));
    expect(onVer).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("rowKey é usado como key (sem aviso de key duplicada)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <DataTable
        columns={[{ key: "nome", header: "Nome" }]}
        data={registros}
        rowKey={(row) => String(row.nome)}
      />
    );
    expect(error.mock.calls.some(([m]) => String(m).includes("unique \"key\""))).toBe(false);
    error.mockRestore();
  });

  it("encaminha o ref para o contêiner", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<DataTable ref={ref} columns={colunas} data={registros} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("ordenada, paginada e com linha clicável: zero serious/critical", async () => {
    render(
      <main>
        <DataTable
          caption="Protocolos"
          columns={colunas}
          data={registros}
          sortKey="nome"
          sortDir="desc"
          onSort={() => {}}
          page={2}
          pageCount={3}
          onPageChange={() => {}}
          onRowClick={() => {}}
        />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });

  // TST-F2-02: o aria-label do botão ("Ordenar por Nome") vira o nome do
  // cabeçalho inteiro. No Chromium (árvore de acessibilidade via CDP) o
  // columnheader se chama "Ordenar por Nome", e o leitor de tela repete isso
  // como cabeçalho de cada célula da coluna. O jsdom (dom-accessibility-api)
  // calcula "Nome", então o teste verifica a causa: o aria-label do botão
  // diferente do texto da coluna. O padrão APG (Sortable Table) mantém só o nome
  // da coluna no botão e comunica a ordem por aria-sort.
  it.fails("TST-F2-02: o botão de ordenação não troca o nome da coluna por \"Ordenar por …\"", () => {
    render(<DataTable columns={colunas} data={registros} />);
    const botao = screen.getByRole("button", { name: /Nome/ });
    expect(botao.getAttribute("aria-label") ?? "Nome").toBe("Nome");
  });
});
