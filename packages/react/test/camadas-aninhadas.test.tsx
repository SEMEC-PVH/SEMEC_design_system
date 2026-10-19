import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it } from "vitest";

import {
  Button,
  Combobox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../src/index";

/**
 * DIG-08: o kit 4.2 traz o @radix-ui/react-dialog 1.3 (via AlertDialog), com
 * outra cópia do react-dismissable-layer que a do DropdownMenu/Popover. Com
 * cópias diferentes, a pilha de camadas não é compartilhada: o Esc ou o clique
 * numa camada aninhada pode fechar também o Dialog de fora. Aqui o Esc fecha só
 * a camada de dentro, e escolher um item dentro do Dialog não o fecha.
 */
function Tela() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Filtro</DialogTitle>
        <DialogDescription>Escolha.</DialogDescription>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Ações</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Exportar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Combobox
          aria-label="Município"
          options={[
            { value: "pvh", label: "Porto Velho" },
            { value: "ari", label: "Ariquemes" },
          ]}
        />
      </DialogContent>
    </Dialog>
  );
}

describe("camadas aninhadas dentro do Dialog (DIG-08)", () => {
  it("Esc no DropdownMenu fecha só o menu", async () => {
    const user = userEvent.setup();
    render(<Tela />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(screen.getByRole("button", { name: "Ações" }));
    expect(await screen.findByRole("menuitem", { name: "Exportar" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(screen.getByRole("dialog", { name: "Filtro" })).toBeInTheDocument();
  });

  it("Esc e escolha no Combobox não fecham o Dialog", async () => {
    const user = userEvent.setup();
    render(<Tela />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(screen.getByRole("button", { name: /^Município/ }));
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(screen.getByRole("dialog", { name: "Filtro" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Município/ }));
    await user.click(await screen.findByRole("option", { name: "Ariquemes" }));
    expect(screen.getByRole("dialog", { name: "Filtro" })).toBeInTheDocument();
  });
});
