import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { FormField, InputMask, applyInputMask } from "../src/index";
import { severeViolations } from "./axe";

describe("applyInputMask", () => {
  it.each([
    ["cpf", "12345678901", "123.456.789-01", "12345678901"],
    ["cpf", "123.456.789-01", "123.456.789-01", "12345678901"],
    ["cpf", "1234", "123.4", "1234"],
    ["cpf", "123", "123", "123"],
    ["cnpj", "12345678000195", "12.345.678/0001-95", "12345678000195"],
    ["cep", "76801000", "76801-000", "76801000"],
    ["data", "15102026", "15/10/2026", "15102026"],
    ["telefone", "6932160000", "(69) 3216-0000", "6932160000"],
    ["telefone", "69992160000", "(69) 99216-0000", "69992160000"],
    ["telefone", "(69) 3216-0000", "(69) 3216-0000", "6932160000"],
    ["telefone-fixo", "69321600009", "(69) 3216-0000", "6932160000"],
    ["celular", "69 9 9216 0000", "(69) 99216-0000", "69992160000"],
    ["cpf", "abc", "", ""],
    ["AAA-9*99", "abc1d23", "abc-1d23", "abc1d23"],
    ["AAA-9*99", "ABC-1D23", "ABC-1D23", "ABC1D23"],
    ["AAA-9*99", "1abc", "abc", "abc"],
  ])("%s: %s → %s", (mask, value, masked, raw) => {
    expect(applyInputMask(value, mask)).toEqual({ masked, raw });
  });
});

describe("InputMask (AUD-36)", () => {
  function setup(props: Partial<React.ComponentProps<typeof InputMask>> = {}) {
    const onValueChange = vi.fn();
    render(
      <main>
        <FormField label="CPF">
          <InputMask mask="cpf" onValueChange={onValueChange} {...props} />
        </FormField>
      </main>
    );
    return {
      user: userEvent.setup(),
      input: screen.getByLabelText("CPF") as HTMLInputElement,
      onValueChange,
    };
  }

  it("formata ao digitar e entrega masked e raw", async () => {
    const { user, input, onValueChange } = setup();
    await user.type(input, "12345678901");
    expect(input).toHaveValue("123.456.789-01");
    expect(onValueChange).toHaveBeenLastCalledWith("123.456.789-01", "12345678901");
    expect(input.selectionStart).toBe(input.value.length);
  });

  it("ignora caracteres fora da máscara", async () => {
    const { user, input } = setup();
    await user.type(input, "12a3b4");
    expect(input).toHaveValue("123.4");
  });

  it("inputMode vem da máscara e pode ser sobrescrito", () => {
    const { input } = setup();
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("type", "text");
  });

  it("telefone usa inputMode tel e alterna fixo/celular", async () => {
    render(<InputMask aria-label="Telefone" mask="telefone" />);
    const input = screen.getByLabelText("Telefone") as HTMLInputElement;
    expect(input).toHaveAttribute("inputmode", "tel");
    const user = userEvent.setup();
    await user.type(input, "6932160000");
    expect(input).toHaveValue("(69) 3216-0000");
    // 11º dígito: passa a celular.
    await user.type(input, "1");
    expect(input).toHaveValue("(69) 32160-0001");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("(69) 3216-0000");
  });

  it("colar valor com outra pontuação funciona", async () => {
    const { user, input, onValueChange } = setup();
    await user.click(input);
    await user.paste("123 456 789/01");
    expect(input).toHaveValue("123.456.789-01");
    expect(onValueChange).toHaveBeenLastCalledWith("123.456.789-01", "12345678901");
  });

  it("apagar do fim remove dígito e literal pendurado", async () => {
    const { user, input, onValueChange } = setup({ defaultValue: "1234" });
    expect(input).toHaveValue("123.4");
    await user.click(input);
    await user.keyboard("{End}{Backspace}");
    expect(input).toHaveValue("123");
    expect(onValueChange).toHaveBeenLastCalledWith("123", "123");
  });

  it("o cursor não pula ao digitar no meio", async () => {
    const { user, input } = setup({ defaultValue: "12356789" });
    expect(input).toHaveValue("123.567.89");
    // Cursor depois de "123." (posição 4): digita o 4 que faltou.
    await user.click(input);
    input.setSelectionRange(4, 4);
    await user.keyboard("4");
    expect(input).toHaveValue("123.456.789");
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
  });

  it("o cursor não pula ao apagar no meio", async () => {
    const { user, input } = setup({ defaultValue: "12345678901" });
    await user.click(input);
    // Cursor depois do "5" (posição 6): apaga o 5.
    input.setSelectionRange(6, 6);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("123.467.890-1");
    expect(input.selectionStart).toBe(5);
  });

  it("modo controlado formata o value recebido", () => {
    function Controlado() {
      const [cpf, setCpf] = React.useState("12345678901");
      return (
        <>
          <InputMask aria-label="CPF controlado" mask="cpf" value={cpf} onValueChange={(_m, raw) => setCpf(raw)} />
          <output>{cpf}</output>
        </>
      );
    }
    render(<Controlado />);
    const input = screen.getByLabelText("CPF controlado");
    expect(input).toHaveValue("123.456.789-01");
    fireEvent.change(input, { target: { value: "98765432100" } });
    expect(input).toHaveValue("987.654.321-00");
    expect(screen.getByRole("status")).toHaveTextContent("98765432100");
  });

  it("axe sem violações serious/critical", async () => {
    setup({ defaultValue: "12345678901" });
    expect(await severeViolations()).toEqual([]);
  });
});
