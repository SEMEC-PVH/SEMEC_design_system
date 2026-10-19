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
 * Padrões ARIA dos componentes reescritos na onda 2 da auditoria (#34):
 * AlertDialog (AUD-34), Combobox (AUD-03, #17), Calendar (AUD-37),
 * Sidebar (AUD-09, #23) e FormField (AUD-21/AUD-22).
 */

describe("AlertDialog (AUD-34)", () => {
  it("é role=alertdialog modal, foca o Cancelar, prende o foco e Cancelar devolve o foco ao gatilho", async () => {
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

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Excluir registro?");
    expect(dialog).toHaveAccessibleDescription("Esta ação não pode ser desfeita.");
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toHaveFocus();

    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onAction).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it("Esc fecha e devolve o foco ao gatilho", async () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Arquivar</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Arquivar processo?</AlertDialogTitle>
          <AlertDialogDescription>Ele sai da lista de pendentes.</AlertDialogDescription>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction>Arquivar</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Arquivar" });
    await user.click(trigger);
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

describe("Combobox (AUD-03)", () => {
  const options = [
    { value: "pvh", label: "Porto Velho" },
    { value: "jpr", label: "Ji-Paraná" },
    { value: "ari", label: "Ariquemes" },
  ];

  function renderCombobox(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
    return render(
      <FormField label="Município" htmlFor="municipio">
        <Combobox id="municipio" name="municipio" options={options} placeholder="Selecione o município" {...props} />
      </FormField>
    );
  }

  it("o gatilho é nomeado pelo rótulo + texto visível (sem label-content-name-mismatch)", () => {
    renderCombobox();
    const trigger = screen.getByRole("button", { name: "Município Selecione o município" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-label");
  });

  it("abre com role=combobox + listbox, filtra, Enter seleciona, fecha e devolve o foco", async () => {
    const onValueChange = vi.fn();
    const { container } = renderCombobox({ onValueChange });
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /^Município/ });

    await user.click(trigger);
    const input = await screen.findByRole("combobox");
    const listbox = screen.getByRole("listbox");
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(within(listbox).getAllByRole("option")).toHaveLength(3);

    await user.type(input, "ji");
    await waitFor(() => expect(within(listbox).getAllByRole("option")).toHaveLength(1));
    const option = within(listbox).getByRole("option", { name: "Ji-Paraná" });
    expect(input).toHaveAttribute("aria-activedescendant", option.id);
    expect(option).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("jpr");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(trigger).toHaveFocus();
    expect(container.querySelector('input[type="hidden"][name="municipio"]')).toHaveValue("jpr");
  });

  it("setas movem a opção ativa e Esc fecha devolvendo o foco", async () => {
    renderCombobox();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /^Município/ });
    await user.click(trigger);
    const input = await screen.findByRole("combobox");
    const opts = within(screen.getByRole("listbox")).getAllByRole("option");

    await user.keyboard("{ArrowDown}");
    const active = input.getAttribute("aria-activedescendant");
    expect(opts.map((o) => o.id)).toContain(active);
    await user.keyboard("{End}");
    expect(input).toHaveAttribute("aria-activedescendant", opts[2]!.id);
    await user.keyboard("{Home}");
    expect(input).toHaveAttribute("aria-activedescendant", opts[0]!.id);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("anuncia quando a busca não acha nada", async () => {
    renderCombobox();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Município/ }));
    await user.type(await screen.findByRole("combobox"), "zzz");
    expect(await screen.findByRole("status")).toHaveTextContent("Nenhum resultado.");
  });
});

describe("Calendar (AUD-37)", () => {
  it("é uma grade com uma parada de Tab, setas movem o foco e Enter seleciona", async () => {
    const onValueChange = vi.fn();
    render(<Calendar value={new Date(2026, 9, 14)} onValueChange={onValueChange} />);
    const user = userEvent.setup();
    const grid = screen.getByRole("grid", { name: /outubro de 2026/i });
    const tabbable = grid.querySelectorAll('[tabindex="0"]');
    expect(tabbable).toHaveLength(1);
    const selected = within(grid).getByRole("gridcell", { name: "14 de outubro de 2026" });
    expect(selected).toHaveAttribute("aria-selected", "true");

    selected.focus();
    await user.keyboard("{ArrowRight}");
    expect(within(grid).getByRole("gridcell", { name: "15 de outubro de 2026" })).toHaveFocus();
    await user.keyboard("{Enter}");
    const picked: Date = onValueChange.mock.calls.at(-1)![0];
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([2026, 9, 15]);
  });

  it("os botões de mês trocam o mês da grade", async () => {
    render(<Calendar value={new Date(2026, 9, 14)} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(screen.getByRole("grid", { name: /novembro de 2026/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mês anterior" }));
    await user.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(screen.getByRole("grid", { name: /setembro de 2026/i })).toBeInTheDocument();
  });

  it("dias fora de min/max ficam aria-disabled e não disparam onValueChange", async () => {
    const onValueChange = vi.fn();
    render(<Calendar value={new Date(2026, 9, 14)} min="2026-10-10" max="2026-10-20" onValueChange={onValueChange} />);
    const user = userEvent.setup();
    const before = screen.getByRole("gridcell", { name: "5 de outubro de 2026" });
    expect(before).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("gridcell", { name: "25 de outubro de 2026" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("gridcell", { name: "15 de outubro de 2026" })).not.toHaveAttribute("aria-disabled");
    await user.click(before);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("Sidebar (AUD-09, AUD-32)", () => {
  it("o SidebarTrigger alterna o estado (clique e Ctrl+B) e expõe aria-expanded", async () => {
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
    const trigger = screen.getByRole("button", { name: "Alternar barra lateral" });
    expect(state()).toBe("expanded");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(state()).toBe("collapsed");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Control>}b{/Control}");
    expect(state()).toBe("expanded");
  });

  it("no desktop a barra é um landmark de navegação rotulado", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Navegação</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByRole("navigation", { name: "Menu lateral" })).toBeInTheDocument();
  });
});

describe("FormField (AUD-21, AUD-22)", () => {
  it("o rótulo nomeia o campo e o asterisco marca obrigatório", () => {
    render(
      <FormField label="CPF" htmlFor="cpf" required>
        <Input id="cpf" />
      </FormField>
    );
    expect(screen.getByRole("textbox", { name: /CPF/ })).toHaveAttribute("id", "cpf");
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("liga dica e erro ao controle sozinho, sem role=alert por padrão", () => {
    const { rerender } = render(
      <FormField label="CPF" hint="Só números">
        <Input />
      </FormField>
    );
    const input = screen.getByRole("textbox", { name: "CPF" });
    expect(input).toHaveAccessibleDescription("Só números");
    expect(input).not.toHaveAttribute("aria-invalid");

    rerender(
      <FormField label="CPF" hint="Só números" error="CPF inválido">
        <Input />
      </FormField>
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("CPF inválido");
    expect(screen.queryByText("Só números")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();

    rerender(
      <FormField label="CPF" error="CPF inválido" errorRole="alert">
        <Input />
      </FormField>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("CPF inválido");
  });

  it("o aria-describedby explícito do consumidor é somado, não substituído", () => {
    render(
      <>
        <p id="extra">Formato 000.000.000-00</p>
        <FormField label="CPF" error="CPF inválido">
          <Input aria-describedby="extra" />
        </FormField>
      </>
    );
    expect(screen.getByRole("textbox", { name: "CPF" })).toHaveAccessibleDescription(
      expect.stringContaining("Formato 000.000.000-00")
    );
  });
});
