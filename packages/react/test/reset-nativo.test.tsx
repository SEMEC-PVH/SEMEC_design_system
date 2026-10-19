import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox, RadioGroup, RadioGroupItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../src/index";

// INT-D-04: caracteriza o contrato atual. O callback público do Radix não
// informa a origem (reset ou interação); suprimir valores vazios suprimiria
// alterações legítimas. Não interceptamos eventos do formulário consumidor.
describe("reset nativo dos controles Radix (INT-D-04)", () => {
  it.each([true, false])("notifica os valores iniciais, controlado=%s", async (controlled) => {
    const user = userEvent.setup();
    const changes = { select: vi.fn(), radio: vi.fn(), checkbox: vi.fn() };
    function Form() {
      const [select, setSelect] = React.useState("");
      const [radio, setRadio] = React.useState("");
      const [checked, setChecked] = React.useState(false);
      return (
        <form aria-label="Formulário">
          <Select value={controlled ? select : undefined} defaultValue="" onValueChange={(value) => { changes.select(value); setSelect(value); }}>
            <SelectTrigger aria-label="Escola"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="a">Escola A</SelectItem></SelectContent>
          </Select>
          <RadioGroup value={controlled ? radio : undefined} defaultValue="" onValueChange={(value) => { changes.radio(value); setRadio(value); }} aria-label="Turno">
            <RadioGroupItem value="manha" aria-label="Manhã" />
          </RadioGroup>
          <Checkbox checked={controlled ? checked : undefined} defaultChecked={false} onCheckedChange={(value) => { changes.checkbox(value); setChecked(value === true); }} aria-label="Aceite" />
        </form>
      );
    }
    render(<Form />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Escola A" }));
    await user.click(screen.getByRole("radio"));
    await user.click(screen.getByRole("checkbox"));
    for (const callback of Object.values(changes)) callback.mockClear();
    fireEvent.reset(screen.getByRole("form"));
    expect(changes.select).toHaveBeenCalledWith("");
    expect(changes.radio).toHaveBeenCalledWith("");
    expect(changes.checkbox).toHaveBeenCalledWith(false);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("radio")).not.toBeChecked();
  });
});
