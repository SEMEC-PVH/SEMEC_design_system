import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Calendar,
  Combobox,
  FormField,
  Input,
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from "../src/index";

/**
 * Combobox, Calendar, Sidebar, AlertDialog e FormField estão sendo alterados
 * em paralelo na onda 2 da auditoria. Estes testes fixam só o comportamento
 * ATUAL que deve continuar valendo (contrato mínimo); onde o padrão APG vai
 * mudar o papel/estrutura (ex.: AlertDialog com role="alertdialog", Combobox
 * com role="combobox"), as consultas aceitam os dois para não travar o merge.
 * O integrador deve apertar estes testes depois do merge (ver relatório).
 */

describe("AlertDialog (comportamento atual)", () => {
  it("abre pelo gatilho com título e descrição, prende o foco e Cancelar fecha devolvendo o foco", async () => {
    const onAction = vi.fn();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Excluir registro</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onAction}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Excluir registro" });
    await user.click(trigger);

    // Hoje: role="dialog" (Dialog do Radix). Alvo APG: role="alertdialog".
    const dialog = await waitFor(
      () => screen.queryByRole("alertdialog") ?? screen.getByRole("dialog")
    );
    expect(dialog).toHaveAccessibleName("Excluir registro?");
    expect(dialog).toHaveAccessibleDescription("Esta ação não pode ser desfeita.");
    expect(dialog.contains(document.activeElement)).toBe(true);

    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onAction).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });
});

describe("Combobox (comportamento atual)", () => {
  const options = [
    { value: "pvh", label: "Porto Velho" },
    { value: "jpr", label: "Ji-Paraná" },
    { value: "ari", label: "Ariquemes" },
  ];

  function getTrigger() {
    // Hoje é um <button aria-label>; alvo APG: role="combobox".
    return screen.queryAllByRole("combobox")[0] ?? screen.getByRole("button", { name: "Município" });
  }

  it("abre o listbox, filtra pela busca e escolher uma opção chama onChange e fecha", async () => {
    const onChange = vi.fn();
    render(<Combobox ariaLabel="Município" options={options} onChange={onChange} />);
    const user = userEvent.setup();
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    const listbox = await screen.findByRole("listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(listbox).getAllByRole("option")).toHaveLength(3);

    await user.type(screen.getByRole("textbox"), "ji");
    await waitFor(() => expect(within(listbox).getAllByRole("option")).toHaveLength(1));

    await user.click(within(listbox).getByRole("option", { name: "Ji-Paraná" }));
    expect(onChange).toHaveBeenCalledWith("jpr");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  });

  it("marca a opção do value com aria-selected", async () => {
    render(<Combobox ariaLabel="Município" options={options} value="ari" />);
    const user = userEvent.setup();
    expect(getTrigger()).toHaveTextContent("Ariquemes");
    await user.click(getTrigger());
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "Ariquemes" })).toHaveAttribute("aria-selected", "true");
    expect(within(listbox).getByRole("option", { name: "Porto Velho" })).toHaveAttribute("aria-selected", "false");
  });

  it("mostra a mensagem de vazio quando a busca não acha nada", async () => {
    render(<Combobox ariaLabel="Município" options={options} emptyMessage="Nada encontrado." />);
    const user = userEvent.setup();
    await user.click(getTrigger());
    await screen.findByRole("listbox");
    await user.type(screen.getByRole("textbox"), "zzz");
    expect(await screen.findByText("Nada encontrado.")).toBeInTheDocument();
  });
});

describe("Calendar (comportamento atual)", () => {
  it("navega entre meses pelos botões rotulados e escolhe um dia", async () => {
    const onChange = vi.fn();
    render(<Calendar value={new Date(2026, 9, 14)} onChange={onChange} />);
    const user = userEvent.setup();
    expect(screen.getByText("Outubro 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(screen.getByText("Novembro 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mês anterior" }));
    await user.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(screen.getByText("Setembro 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo mês" }));
    await user.click(screen.getByRole("button", { name: /^20\b/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const picked: Date = onChange.mock.calls[0]![0];
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([2026, 9, 20]);
  });

  it("dias fora de min/max ficam desabilitados e não disparam onChange", async () => {
    const onChange = vi.fn();
    render(<Calendar value={new Date(2026, 9, 14)} min="2026-10-10" max="2026-10-20" onChange={onChange} />);
    expect(screen.getByRole("button", { name: /^5\b/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^25\b/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^15\b/ })).toBeEnabled();
  });
});

describe("Sidebar (comportamento atual)", () => {
  it("o SidebarTrigger alterna o estado expanded/collapsed (clique e Ctrl+B)", async () => {
    const { container } = render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Navegação</SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );
    const user = userEvent.setup();
    const state = () => container.querySelector("[data-side]")?.getAttribute("data-state");
    expect(state()).toBe("expanded");

    await user.click(screen.getByRole("button", { name: "Alternar barra lateral" }));
    expect(state()).toBe("collapsed");

    await user.keyboard("{Control>}b{/Control}");
    expect(state()).toBe("expanded");
  });
});

describe("FormField (comportamento atual)", () => {
  it("o rótulo nomeia o campo e o asterisco marca obrigatório", () => {
    render(
      <FormField label="CPF" htmlFor="cpf" required>
        <Input id="cpf" />
      </FormField>
    );
    expect(screen.getByRole("textbox", { name: /CPF/ })).toHaveAttribute("id", "cpf");
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("mostra a dica sem erro e, com erro, troca a dica por uma mensagem role=alert", () => {
    const { rerender } = render(
      <FormField label="CPF" htmlFor="cpf" id="campo-cpf" hint="Só números">
        <Input id="cpf" />
      </FormField>
    );
    expect(screen.getByText("Só números")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();

    rerender(
      <FormField label="CPF" htmlFor="cpf" id="campo-cpf" hint="Só números" error="CPF inválido">
        <Input id="cpf" />
      </FormField>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("CPF inválido");
    expect(screen.queryByText("Só números")).toBeNull();
  });
});
