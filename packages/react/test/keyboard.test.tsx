import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../src/index";

/** Interação de teclado dos padrões APG que o kit herda do Radix (AUD-45). */

describe("Dialog (teclado)", () => {
  function setup() {
    render(
      <main>
        <button type="button">Antes</button>
        <Dialog>
          <DialogTrigger>Editar dados</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar dados</DialogTitle>
              <DialogDescription>Altere os campos e salve.</DialogDescription>
            </DialogHeader>
            <input aria-label="Nome" />
            <button type="button">Salvar</button>
          </DialogContent>
        </Dialog>
      </main>
    );
    return userEvent.setup();
  }

  it("Enter abre, o foco entra no diálogo e o Tab fica preso nele", async () => {
    const user = setup();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Editar dados" })).toHaveFocus();

    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "Editar dados" });
    expect(dialog).toHaveAccessibleDescription("Altere os campos e salve.");
    expect(dialog.contains(document.activeElement)).toBe(true);

    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("Esc fecha e devolve o foco ao gatilho", async () => {
    const user = setup();
    const trigger = screen.getByRole("button", { name: "Editar dados" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

describe("Tabs (teclado)", () => {
  function setup() {
    render(
      <Tabs defaultValue="dados">
        <TabsList aria-label="Seções do cadastro">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="dados">Painel de dados</TabsContent>
        <TabsContent value="endereco">Painel de endereço</TabsContent>
        <TabsContent value="documentos">Painel de documentos</TabsContent>
      </Tabs>
    );
    return userEvent.setup();
  }

  it("setas, Home e End movem o foco e ativam a aba (ativação automática)", async () => {
    const user = setup();
    await user.tab();
    const [dados, endereco, documentos] = screen.getAllByRole("tab");
    expect(dados).toHaveFocus();
    expect(dados).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(endereco).toHaveFocus();
    expect(endereco).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Painel de endereço");

    await user.keyboard("{End}");
    expect(documentos).toHaveFocus();
    expect(documentos).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(dados).toHaveFocus(); // circula

    await user.keyboard("{Home}");
    expect(dados).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Painel de dados");
  });

  it("Tab sai da lista de abas para o painel (roving tabindex)", async () => {
    const user = setup();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("tabpanel")).toHaveFocus();
  });
});

describe("Accordion (teclado)", () => {
  function setup() {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Quem pode se matricular?</AccordionTrigger>
          <AccordionContent>Crianças de 4 a 17 anos.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Quais documentos levar?</AccordionTrigger>
          <AccordionContent>Certidão e comprovante de endereço.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    return userEvent.setup();
  }

  it("Enter e Espaço alternam o item; setas movem entre os cabeçalhos", async () => {
    const user = setup();
    await user.tab();
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Enter}");
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Quem pode se matricular?" })).toHaveTextContent(
      "Crianças de 4 a 17 anos."
    );

    await user.keyboard("{ArrowDown}");
    expect(second).toHaveFocus();

    await user.keyboard(" ");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false"); // type="single"

    await user.keyboard("{ArrowUp}");
    expect(first).toHaveFocus();
  });
});

describe("Select (teclado)", () => {
  it("Enter abre o listbox, setas navegam, Enter escolhe e o foco volta ao gatilho", async () => {
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="Município">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pvh">Porto Velho</SelectItem>
          <SelectItem value="jpr">Ji-Paraná</SelectItem>
        </SelectContent>
      </Select>
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole("combobox", { name: "Município" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    trigger.focus();
    await user.keyboard("{Enter}");
    const listbox = await screen.findByRole("listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(listbox).getAllByRole("option")).toHaveLength(2);

    await waitFor(() => expect(listbox.contains(document.activeElement)).toBe(true));
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });
});

describe("DropdownMenu (teclado)", () => {
  it("Enter abre o menu com foco no 1º item, setas navegam e Esc fecha devolvendo o foco", async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Opções</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Editar</DropdownMenuItem>
          <DropdownMenuItem>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Opções" });
    trigger.focus();
    await user.keyboard("{Enter}");

    const menu = await screen.findByRole("menu");
    const [editar, excluir] = within(menu).getAllByRole("menuitem");
    await waitFor(() => expect(editar).toHaveFocus());

    await user.keyboard("{ArrowDown}");
    expect(excluir).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(trigger).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("Enter num item dispara onSelect e fecha o menu", async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Opções</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Editar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Opções" }).focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Editar" })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });
});
