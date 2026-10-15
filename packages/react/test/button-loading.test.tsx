import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Download } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Button, IconButton, Spinner } from "../src/index";
import { severeViolations } from "./axe";

/** AUD-63: Button `loading` com aria-disabled (foco mantido) e Spinner decorativo. */

describe("Spinner", () => {
  it("sem `decorative` continua com role=status e nome", () => {
    render(<Spinner label="Carregando protocolos" />);
    const status = screen.getByRole("status", { name: "Carregando protocolos" });
    expect(status.tagName).toBe("DIV");
    expect(status).toHaveTextContent("Carregando protocolos");
  });

  it("`decorative` não tem role, nome nem texto, e fica fora da árvore acessível", () => {
    const { container } = render(<Spinner decorative data-testid="sp" />);
    const sp = screen.getByTestId("sp");
    expect(sp.tagName).toBe("SPAN");
    expect(sp).toHaveAttribute("aria-hidden", "true");
    expect(sp).not.toHaveAttribute("role");
    expect(sp).not.toHaveAttribute("aria-label");
    expect(container).toHaveTextContent("");
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Button loading", () => {
  it("mantém o texto como nome, sem \"Carregando\"", () => {
    render(<Button loading>Entrar</Button>);
    const button = screen.getByRole("button", { name: "Entrar" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button.querySelector("svg.animate-spin")).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("`loadingText` substitui o texto visível e vira o nome", () => {
    render(
      <Button loading loadingText="Entrando…">
        Entrar
      </Button>
    );
    expect(screen.getByRole("button", { name: "Entrando…" })).toBeInTheDocument();
  });

  it("bloqueia clique, Enter e Espaço sem perder o foco", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>
    );
    await user.tab();
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toHaveFocus();
    await user.click(button);
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
  });

  it("não envia o formulário durante o loading", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Enviar
        </Button>
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("o foco não sai quando o loading começa e o clique volta ao terminar", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onClick={onClick}>Enviar</Button>);
    const button = screen.getByRole("button", { name: "Enviar" });
    button.focus();
    rerender(
      <Button onClick={onClick} loading>
        Enviar
      </Button>
    );
    expect(button).toHaveFocus();
    rerender(<Button onClick={onClick}>Enviar</Button>);
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).not.toHaveAttribute("aria-disabled");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("sem `loading` o comportamento não muda (disabled nativo continua valendo)", () => {
    render(<Button disabled>Salvar</Button>);
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("axe sem violações serious/critical", async () => {
    render(
      <main>
        <Button loading>Entrar</Button>
        <Button loading loadingText="Enviando…">
          Enviar
        </Button>
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("IconButton loading", () => {
  it("troca o ícone pelo spinner e mantém o label como nome", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <IconButton label="Baixar carnê" loading onClick={onClick}>
        <Download data-testid="icone" />
      </IconButton>
    );
    const button = screen.getByRole("button", { name: "Baixar carnê" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByTestId("icone")).toBeNull();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(await severeViolations()).toEqual([]);
  });
});
