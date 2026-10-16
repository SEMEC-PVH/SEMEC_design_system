import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { createPortal } from "react-dom";
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

/**
 * Botão de ordenação da coluna, achado pelo papel: o cabeçalho (columnheader)
 * se chama só pelo nome da coluna e o botão é o único controle dentro dele
 * (TST-B4: não consultar pelo texto "Ordenar por …", que é descrição).
 */
function botaoDaColuna(nome: string) {
  const th = screen.getByRole("columnheader", { name: nome });
  return { th, botao: within(th).getByRole("button", { name: nome }) };
}

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

  it("a legenda visível fica fora da área rolável e continua nomeando a tabela (V42-VITE-05)", () => {
    render(<DataTable caption="Protocolos do contribuinte" columns={colunas} data={registros} />);
    const legenda = screen.getByText("Protocolos do contribuinte");
    // Dentro do overflow-auto ela tinha a largura da tabela e saía cortada no mobile.
    expect(legenda.closest(".overflow-auto")).toBeNull();
    expect(screen.getByRole("table")).toHaveAccessibleName("Protocolos do contribuinte");
  });

  it("aria-sort: none nas ordenáveis sem ordem, ausente nas não ordenáveis", () => {
    render(<DataTable columns={colunas} data={registros} />);
    const [nome, status, valor] = screen.getAllByRole("columnheader");
    expect(nome).toHaveAttribute("aria-sort", "none");
    expect(status).not.toHaveAttribute("aria-sort");
    expect(valor).toHaveAttribute("aria-sort", "none");
  });

  it("o botão de ordenação alterna ascending/descending pelo clique e pelo teclado", async () => {
    const user = userEvent.setup();
    render(<Ordenavel />);
    const { th, botao } = botaoDaColuna("Nome");
    expect(th).toHaveAttribute("aria-sort", "none");

    await user.click(botao);
    expect(th).toHaveAttribute("aria-sort", "ascending");

    botao.focus();
    await user.keyboard("{Enter}");
    expect(th).toHaveAttribute("aria-sort", "descending");

    await user.keyboard(" ");
    expect(th).toHaveAttribute("aria-sort", "ascending");

    // A outra coluna ordenável volta a "none".
    expect(botaoDaColuna("Valor").th).toHaveAttribute("aria-sort", "none");
  });

  it("onSort recebe a key da coluna", async () => {
    const onSort = vi.fn();
    render(<DataTable columns={colunas} data={registros} onSort={onSort} />);
    await userEvent.setup().click(botaoDaColuna("Valor").botao);
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
    expect(botaoDaColuna("Nome").botao).toHaveAccessibleDescription("Classificar por Nome");
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

  // TST-F2-04 (TST-11, corrigido): o keydown da linha já ignorava teclas vindas
  // de botões nas células, mas o `onClick` da <tr> não: o clique (do mouse ou o
  // sintético do Enter/Espaço) num botão da célula subia até a linha e
  // disparava onRowClick junto com a ação do botão.
  it("TST-F2-04: Enter num botão da célula não ativa a linha", async () => {
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

  it("TST-F2-04: clicar num botão da célula não ativa a linha", async () => {
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

  it("TST-11: link, input e o filho de um botão na célula também não ativam a linha", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={[
          { key: "nome", header: "Nome" },
          {
            key: "acoes",
            header: "Ações",
            render: () => (
              <>
                <a href="#detalhe">Detalhe</a>
                <input aria-label="Observação" />
                <button type="button">
                  <span>Arquivar</span>
                </button>
              </>
            ),
          },
        ]}
        data={[registros[0]!]}
        onRowClick={onRowClick}
      />
    );
    await user.click(screen.getByRole("link", { name: "Detalhe" }));
    await user.click(screen.getByRole("textbox", { name: "Observação" }));
    await user.click(screen.getByText("Arquivar"));
    expect(onRowClick).not.toHaveBeenCalled();
    // O texto comum da célula continua ativando a linha.
    await user.click(screen.getByText("Ana"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it("TST-11: clique num portal aberto pela célula (menu/diálogo) não ativa a linha", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={[
          {
            key: "acoes",
            header: "Ações",
            render: () => createPortal(<div>Item do menu</div>, document.body),
          },
        ]}
        data={[registros[0]!]}
        onRowClick={onRowClick}
      />
    );
    // O evento sobe pela árvore do React até a <tr>, mas o alvo não está na linha.
    fireEvent.click(screen.getByText("Item do menu"));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("TST-28: rowLabel dá nome à linha clicável; sem rowLabel, nada de aria-label", () => {
    const { rerender } = render(
      <DataTable
        columns={[{ key: "nome", header: "Nome" }]}
        data={registros}
        onRowClick={() => {}}
        rowLabel={(row) => `Abrir protocolo de ${row.nome}`}
      />
    );
    expect(screen.getByRole("row", { name: "Abrir protocolo de Ana" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("row", { name: "Abrir protocolo de Bruno" })).toBeInTheDocument();
    rerender(<DataTable columns={[{ key: "nome", header: "Nome" }]} data={registros} onRowClick={() => {}} />);
    for (const linha of screen.getAllByRole("row").slice(1)) expect(linha).not.toHaveAttribute("aria-label");
  });

  it("TST-10: botão de ordenação com alvo de 44px (min-h-11/min-w-11) dentro do cabeçalho h-11", () => {
    render(<DataTable columns={colunas} data={registros} />);
    const { th, botao } = botaoDaColuna("Nome");
    expect(th).toHaveClass("h-11");
    expect(botao).toHaveClass("min-h-11", "min-w-11");
  });

  it("TST-23: o rodapé da paginação empilha abaixo de sm e os botões não quebram o texto", () => {
    render(<DataTable columns={colunas} data={registros} page={1} pageCount={2} onPageChange={() => {}} />);
    const proximo = screen.getByRole("button", { name: "Próximo" });
    const grupo = proximo.parentElement!;
    const rodape = grupo.parentElement!;
    expect(rodape).toHaveClass("flex-col", "sm:flex-row", "sm:justify-between");
    expect(grupo).toHaveClass("flex-wrap");
    expect(proximo).toHaveClass("whitespace-nowrap", "shrink-0");
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

  // TST-F2-02 (TST-27, corrigido): o aria-label do botão ("Ordenar por Nome")
  // virava o nome do cabeçalho inteiro. No Chromium (árvore de acessibilidade via CDP) o
  // columnheader se chamava "Ordenar por Nome", e o leitor de tela repetia isso
  // como cabeçalho de cada célula da coluna. O jsdom (dom-accessibility-api)
  // calcula "Nome", então o teste verifica a causa: o aria-label do botão
  // diferente do texto da coluna. O padrão APG (Sortable Table) mantém só o nome
  // da coluna no botão e comunica a ordem por aria-sort.
  it("TST-F2-02: o botão de ordenação não troca o nome da coluna por \"Ordenar por …\"", () => {
    render(<DataTable columns={colunas} data={registros} />);
    const botao = screen.getByRole("button", { name: /Nome/ });
    expect(botao.getAttribute("aria-label") ?? "Nome").toBe("Nome");
  });

  it("TST-27: \"Ordenar por …\" vira a descrição do botão, fora do nome do cabeçalho", () => {
    render(<DataTable columns={colunas} data={registros} />);
    const { th, botao } = botaoDaColuna("Nome");
    expect(botao).toHaveAccessibleName("Nome");
    expect(botao).toHaveAccessibleDescription("Ordenar por Nome");
    expect(th).toHaveAccessibleName("Nome");
    expect(botaoDaColuna("Valor").botao).toHaveAccessibleDescription("Ordenar por Valor");
    // Uma descrição por coluna, com id único, invisível na tela.
    const ids = screen.getAllByRole("button").map((b) => b.getAttribute("aria-describedby"));
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getByText("Ordenar por Nome")).not.toBeVisible();
  });
});
