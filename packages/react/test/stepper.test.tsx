import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Stepper } from "../src/index";
import { severeViolations } from "./axe";

const etapas = [
  { label: "Dados do estudante" },
  { label: "Documentos", description: "RG e CPF" },
  { label: "Revisão e envio" },
];

describe("Stepper (AUD-36)", () => {
  it("é uma lista ordenada com a etapa atual em aria-current=step", () => {
    render(<Stepper steps={etapas} currentStep={1} />);
    const list = screen.getByRole("list", { name: "Etapas do processo" });
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[2]).not.toHaveAttribute("aria-current");
  });

  it("diz a situação de cada etapa em texto, não só pela cor", () => {
    render(<Stepper steps={etapas} currentStep={1} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Etapa 1 de 3: Dados do estudante, concluída");
    expect(items[1]).toHaveTextContent("Etapa 2 de 3: Documentos, etapa atual");
    expect(items[2]).toHaveTextContent("Etapa 3 de 3: Revisão e envio, pendente");
  });

  it("sem onStepClick não há botões", () => {
    render(<Stepper steps={etapas} currentStep={1} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("com onStepClick, concluídas e atual são botões navegáveis por teclado", async () => {
    const onStepClick = vi.fn();
    const user = userEvent.setup();
    render(<Stepper steps={etapas} currentStep={1} onStepClick={onStepClick} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[1]).toHaveAttribute("aria-current", "step");

    await user.tab();
    expect(buttons[0]).toHaveFocus();
    expect(buttons[0]).toHaveAccessibleName("Etapa 1 de 3: Dados do estudante, concluída");
    await user.keyboard("{Enter}");
    expect(onStepClick).toHaveBeenLastCalledWith(0);

    await user.tab();
    expect(buttons[1]).toHaveFocus();
    await user.keyboard(" ");
    expect(onStepClick).toHaveBeenLastCalledWith(1);
  });

  it("isStepClickable e labels são sobrescrevíveis", () => {
    render(
      <Stepper
        steps={etapas}
        currentStep={0}
        onStepClick={() => {}}
        isStepClickable={() => true}
        labels={{ list: "Progresso da matrícula", upcoming: "a fazer" }}
      />
    );
    expect(screen.getByRole("list", { name: "Progresso da matrícula" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getAllByRole("listitem")[2]).toHaveTextContent("a fazer");
  });

  it("axe sem violações serious/critical", async () => {
    render(
      <main>
        <Stepper steps={etapas} currentStep={1} />
        <Stepper steps={etapas} currentStep={2} onStepClick={() => {}} aria-label="Etapas clicáveis" />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});
