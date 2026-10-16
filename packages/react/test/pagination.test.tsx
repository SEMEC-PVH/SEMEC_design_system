import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "../src/index";
import { severeViolations } from "./axe";

/**
 * Pagination (manifest `pagination`, paginacao.md): role=navigation ·
 * aria-label=Paginação · aria-current=page · "Página N" nos números ·
 * aria-label em anterior/próxima · aria-hidden nos elipses · 44px ·
 * labels sobrescrevíveis · janela por siblingCount.
 */

/** Sequência visível: números e "…" na ordem. */
function sequencia(nav: HTMLElement) {
  return Array.from(nav.children)
    .slice(1, -1)
    .map((el) => el.textContent);
}

function Controlada({ pageCount = 10, inicial = 1 }: { pageCount?: number; inicial?: number }) {
  const [page, setPage] = React.useState(inicial);
  return <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />;
}

describe("Pagination", () => {
  it("é um <nav> nomeado \"Paginação\" com anterior/próxima e números em PT-BR", () => {
    render(<Pagination page={2} pageCount={5} onPageChange={() => {}} />);
    const nav = screen.getByRole("navigation", { name: "Paginação" });
    expect(within(nav).getByRole("button", { name: "Página anterior" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Próxima página" })).toBeInTheDocument();
    for (const n of [1, 2, 3, 4, 5]) {
      expect(within(nav).getByRole("button", { name: `Página ${n}` })).toBeInTheDocument();
    }
  });

  it("só a página atual tem aria-current=page", () => {
    render(<Pagination page={3} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Página 2" })).not.toHaveAttribute("aria-current");
  });

  it("anterior desabilitado na 1ª página e próxima na última", () => {
    const { rerender } = render(<Pagination page={1} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeEnabled();
    rerender(<Pagination page={5} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });

  it("onPageChange recebe a página; clicar na atual não dispara", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={3} pageCount={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "Página 3" }));
    expect(onPageChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Página 5" }));
    expect(onPageChange).toHaveBeenLastCalledWith(5);
    await user.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it("teclado: Tab percorre os botões e Enter/Espaço trocam a página", async () => {
    const user = userEvent.setup();
    render(<Controlada pageCount={5} />);
    await user.tab(); // anterior está desabilitado: o 1º Tab cai na Página 1
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveFocus();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute("aria-current", "page");
  });

  it("até 7 páginas mostra todas, sem elipse", () => {
    render(<Pagination page={4} pageCount={7} onPageChange={() => {}} />);
    expect(sequencia(screen.getByRole("navigation"))).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });

  it("janela com elipses no meio (siblingCount=1 padrão) e elipses aria-hidden", () => {
    render(<Pagination page={10} pageCount={20} onPageChange={() => {}} />);
    const nav = screen.getByRole("navigation");
    expect(sequencia(nav)).toEqual(["1", "…", "9", "10", "11", "…", "20"]);
    const elipses = Array.from(nav.querySelectorAll("span")).filter((s) => s.textContent === "…");
    expect(elipses).toHaveLength(2);
    for (const e of elipses) expect(e).toHaveAttribute("aria-hidden", "true");
  });

  it("siblingCount=2 alarga a janela", () => {
    render(<Pagination page={10} pageCount={20} siblingCount={2} onPageChange={() => {}} />);
    expect(sequencia(screen.getByRole("navigation"))).toEqual(["1", "…", "8", "9", "10", "11", "12", "…", "20"]);
  });

  it("nas pontas, só uma elipse", () => {
    const { rerender } = render(<Pagination page={1} pageCount={20} onPageChange={() => {}} />);
    expect(sequencia(screen.getByRole("navigation"))).toEqual(["1", "2", "…", "20"]);
    rerender(<Pagination page={20} pageCount={20} onPageChange={() => {}} />);
    expect(sequencia(screen.getByRole("navigation"))).toEqual(["1", "…", "19", "20"]);
  });

  it("labels sobrescreve navigation, previous, next e page(n)", () => {
    render(
      <Pagination
        page={1}
        pageCount={3}
        onPageChange={() => {}}
        labels={{
          navigation: "Paginação dos protocolos",
          previous: "Voltar",
          next: "Avançar",
          page: (n) => `Ir para a página ${n}`,
        }}
      />
    );
    const nav = screen.getByRole("navigation", { name: "Paginação dos protocolos" });
    expect(within(nav).getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Avançar" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Ir para a página 2" })).toBeInTheDocument();
  });

  it("labels parcial mantém os demais textos padrão", () => {
    render(<Pagination page={1} pageCount={3} onPageChange={() => {}} labels={{ next: "Avançar" }} />);
    expect(screen.getByRole("navigation", { name: "Paginação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeInTheDocument();
  });

  it("todos os botões têm alvo de 44px (h-11 + w-11/min-w-11)", () => {
    render(<Pagination page={2} pageCount={3} onPageChange={() => {}} />);
    for (const b of screen.getAllByRole("button")) {
      expect(b).toHaveClass("h-11");
      expect(b.className).toMatch(/(^|\s)(min-)?w-11(\s|$)/);
    }
  });

  it("zero serious/critical", async () => {
    render(
      <main>
        <Pagination page={10} pageCount={20} onPageChange={() => {}} />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });

  // TST-F2-03: `siblingCount` vira `Math.max(siblingCount, 1)` (pagination.tsx),
  // então 0 é ignorado em silêncio. O manifest só diz "janela por siblingCount".
  it.fails("TST-F2-03: siblingCount=0 mostra só a página atual entre as elipses", () => {
    render(<Pagination page={10} pageCount={20} siblingCount={0} onPageChange={() => {}} />);
    expect(sequencia(screen.getByRole("navigation"))).toEqual(["1", "…", "10", "…", "20"]);
  });
});
