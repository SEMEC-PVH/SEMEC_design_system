import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

// A demo do site importa o kit pelo alias do Next (`semec-ds/react`); aqui ele
// aponta para o código-fonte do kit.
vi.mock("semec-ds/react", async () => await import("../src/index"));

// @ts-expect-error demo em JSX sem tipos, fora do pacote
import { TableAdvanced } from "../../../apps/docs/components/demos/examples/table-advanced.jsx";

/**
 * Demo "Tabela avançada" do site (TST-27, padrão do DataTable): o cabeçalho
 * ordenável se chama só pelo nome da coluna; "Ordenar por …" é a descrição do
 * botão e o sentido vem do `aria-sort`.
 */
describe("demo TableAdvanced (TST-27)", () => {
  it("cabeçalho e botão se chamam 'Objeto'; a instrução fica na descrição", () => {
    render(React.createElement(TableAdvanced));
    const cabecalho = screen.getByRole("columnheader", { name: "Objeto" });
    expect(cabecalho).toHaveAttribute("aria-sort", "ascending");
    const botao = screen.getByRole("button", { name: "Objeto" });
    expect(botao).toHaveAccessibleDescription("Ordenar por objeto");
  });
});
