import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormField, PasswordInput } from "../src/index";
import { severeViolations } from "./axe";

describe("PasswordInput (AUD-36)", () => {
  function setup(props: React.ComponentProps<typeof PasswordInput> = {}) {
    render(
      <main>
        <FormField label="Senha" hint="Mínimo de 8 caracteres">
          <PasswordInput autoComplete="current-password" {...props} />
        </FormField>
      </main>
    );
    return {
      user: userEvent.setup(),
      input: screen.getByLabelText("Senha") as HTMLInputElement,
      toggle: screen.getByRole("button", { name: "Mostrar senha" }),
    };
  }

  it("começa oculto, com rótulo do FormField, autoComplete e aria-controls", () => {
    const { input, toggle } = setup();
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    expect(input).toHaveAccessibleDescription("Mínimo de 8 caracteres");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("aria-controls", input.id);
    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle.className).toContain("h-11");
    expect(toggle.className).toContain("w-11");
  });

  it("Tab chega ao botão; Enter e Espaço alternam sem tirar o foco", async () => {
    const { user, input, toggle } = setup();
    await user.tab();
    expect(input).toHaveFocus();
    await user.keyboard("segredo1");
    await user.tab();
    expect(toggle).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAccessibleName("Mostrar senha");
    expect(toggle).toHaveFocus();
    expect(input).toHaveValue("segredo1");

    await user.keyboard(" ");
    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("repassa props do Input e aceita modo controlado e labels", async () => {
    const onVisibleChange = vi.fn();
    const onChange = vi.fn();
    render(
      <PasswordInput
        aria-label="Nova senha"
        autoComplete="new-password"
        visible
        onVisibleChange={onVisibleChange}
        onChange={onChange}
        labels={{ show: "Exibir senha" }}
        required
      />
    );
    const user = userEvent.setup();
    const input = screen.getByLabelText("Nova senha");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toBeRequired();
    await user.type(input, "a");
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Exibir senha" }));
    expect(onVisibleChange).toHaveBeenCalledWith(false);
    // Controlado: o estado só muda pela prop.
    expect(input).toHaveAttribute("type", "text");
  });

  it("desabilitado desabilita também o botão", () => {
    render(<PasswordInput aria-label="Senha" disabled />);
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeDisabled();
  });

  it("axe sem violações serious/critical", async () => {
    setup();
    expect(await severeViolations()).toEqual([]);
  });
});
