import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Calendar,
  Checkbox,
  Combobox,
  DatePicker,
  FileUpload,
  FormField,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Textarea,
} from "../src/index";
import { severeViolations } from "./axe";

/**
 * Contrato único de formulário (ADR-015, emenda de 15/10/2026, AUD-35):
 * `value`/`defaultValue`, `onValueChange(value)`, `name`, `id`, `invalid`,
 * `disabled`, `required`. A API antiga (`onChange(value)`) segue funcionando
 * até a 4.0, com aviso em desenvolvimento.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

const formData = (form: HTMLFormElement) => Object.fromEntries(new FormData(form).entries());

describe("onValueChange", () => {
  it("Input: onValueChange recebe a string e o onChange nativo continua recebendo o evento", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(<Input aria-label="Nome" onChange={onChange} onValueChange={onValueChange} />);
    await userEvent.setup().type(screen.getByRole("textbox", { name: "Nome" }), "Ana");
    expect(onValueChange).toHaveBeenLastCalledWith("Ana");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange.mock.calls[0][0]).toHaveProperty("target");
  });

  it("Input: sem onChange nem onValueChange, não injeta handler (controlado só-leitura continua avisando)", () => {
    render(<Input aria-label="Nome" defaultValue="x" />);
    expect(screen.getByRole("textbox")).toHaveValue("x");
  });

  it("Textarea: onValueChange recebe a string", async () => {
    const onValueChange = vi.fn();
    render(<Textarea aria-label="Observações" onValueChange={onValueChange} />);
    await userEvent.setup().type(screen.getByRole("textbox", { name: "Observações" }), "ok");
    expect(onValueChange).toHaveBeenLastCalledWith("ok");
  });

  it("DatePicker: onValueChange recebe o ISO; onChange(value) obsoleto continua e avisa uma vez", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <DatePicker aria-label="Vencimento" onValueChange={onValueChange} onChange={onChange} />
    );
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-10-15" } });
    expect(onValueChange).toHaveBeenCalledWith("2026-10-15");
    expect(onChange).toHaveBeenCalledWith("2026-10-15");
    rerender(<DatePicker aria-label="Vencimento" onValueChange={onValueChange} onChange={onChange} />);
    const avisos = warn.mock.calls.filter(([msg]) => String(msg).includes("DatePicker"));
    expect(avisos).toHaveLength(1);
    expect(String(avisos[0][0])).toContain("onValueChange");
  });

  it("Combobox: onValueChange recebe o valor da opção; onChange obsoleto continua", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <FormField label="Município">
        <Combobox
          options={[{ value: "pvh", label: "Porto Velho" }]}
          onValueChange={onValueChange}
          onChange={onChange}
        />
      </FormField>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Município/ }));
    await user.click(within(await screen.findByRole("listbox")).getByRole("option", { name: "Porto Velho" }));
    expect(onValueChange).toHaveBeenCalledWith("pvh");
    expect(onChange).toHaveBeenCalledWith("pvh");
  });

  it("InputOTP: onValueChange recebe os dígitos; defaultValue preenche no modo não controlado", async () => {
    const onValueChange = vi.fn();
    render(
      <InputOTP maxLength={4} defaultValue="12" onValueChange={onValueChange}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    );
    expect(screen.getByRole("textbox", { name: "Dígito 1 de 4" })).toHaveValue("1");
    await userEvent.setup().type(screen.getByRole("textbox", { name: "Dígito 3 de 4" }), "3");
    expect(onValueChange).toHaveBeenLastCalledWith("123");
  });

  it("FileUpload: onValueChange recebe os arquivos; onChange(files) obsoleto continua", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(<FileUpload label="Anexo" onValueChange={onValueChange} onChange={onChange} />);
    const file = new File(["%PDF"], "rg.pdf", { type: "application/pdf" });
    await userEvent.setup().upload(screen.getByLabelText("Anexo"), file);
    expect(onValueChange).toHaveBeenCalledWith([file]);
    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it("FileUpload: disabled não aceita arquivo", async () => {
    const onValueChange = vi.fn();
    render(<FileUpload label="Anexo" disabled onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Anexo");
    expect(input).toBeDisabled();
    fireEvent.change(input, { target: { files: [new File(["x"], "a.pdf")] } });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Calendar: onValueChange recebe a data escolhida", async () => {
    const onValueChange = vi.fn();
    render(<Calendar value={new Date(2026, 9, 14)} onValueChange={onValueChange} />);
    await userEvent.setup().click(screen.getByRole("gridcell", { name: /^15 de outubro de 2026/ }));
    const picked: Date = onValueChange.mock.calls.at(-1)![0];
    expect(picked.getDate()).toBe(15);
  });
});

describe("invalid → aria-invalid", () => {
  it.each([
    ["Input", <Input key="i" aria-label="Campo" invalid />, "textbox"],
    ["Textarea", <Textarea key="t" aria-label="Campo" invalid />, "textbox"],
    ["Checkbox", <Checkbox key="c" aria-label="Campo" invalid />, "checkbox"],
    ["Switch", <Switch key="s" aria-label="Campo" invalid />, "switch"],
    [
      "RadioGroup",
      <RadioGroup key="r" aria-label="Campo" invalid>
        <RadioGroupItem value="a" aria-label="A" />
      </RadioGroup>,
      "radiogroup",
    ],
    [
      "SelectTrigger",
      <Select key="sel">
        <SelectTrigger aria-label="Campo" invalid>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
      "combobox",
    ],
    ["Slider", <Slider key="sl" aria-label="Campo" defaultValue={[10]} invalid />, "slider"],
  ] as const)("%s", (_name, element, role) => {
    render(element);
    expect(screen.getByRole(role, { name: "Campo" })).toHaveAttribute("aria-invalid", "true");
  });

  it("DatePicker", () => {
    const { container } = render(<DatePicker aria-label="Data" invalid />);
    expect(container.querySelector('input[type="date"]')).toHaveAttribute("aria-invalid", "true");
  });

  it("Combobox (no gatilho)", () => {
    render(<Combobox aria-labelledby="rot" options={[]} invalid />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-invalid", "true");
  });

  it("InputOTP (em cada dígito) e required → aria-required", () => {
    render(
      <InputOTP maxLength={2} invalid required>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>
    );
    for (const slot of screen.getAllByRole("textbox")) {
      expect(slot).toHaveAttribute("aria-invalid", "true");
      expect(slot).toHaveAttribute("aria-required", "true");
    }
  });

  it("FileUpload (sem mensagem)", () => {
    render(<FileUpload label="Anexo" invalid />);
    expect(screen.getByLabelText("Anexo")).toHaveAttribute("aria-invalid", "true");
  });

  it("invalid={false} não gera atributo; sem invalid, nada muda", () => {
    render(
      <>
        <Input aria-label="A" invalid={false} />
        <Input aria-label="B" />
      </>
    );
    expect(screen.getByRole("textbox", { name: "A" })).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("textbox", { name: "B" })).not.toHaveAttribute("aria-invalid");
  });

  it("FormField invalid (sem mensagem) marca o filho pelo contexto", () => {
    render(
      <FormField label="CPF" invalid>
        <Input />
      </FormField>
    );
    expect(screen.getByRole("textbox", { name: "CPF" })).toHaveAttribute("aria-invalid", "true");
  });

  it("invalid explícito vence o FormField; aria-invalid explícito vence os dois", () => {
    render(
      <>
        <FormField label="A" error="Erro">
          <Input invalid={false} />
        </FormField>
        <FormField label="B">
          <Input invalid aria-invalid="grammar" />
        </FormField>
      </>
    );
    expect(screen.getByRole("textbox", { name: "A" })).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("textbox", { name: "B" })).toHaveAttribute("aria-invalid", "grammar");
  });

  it("formulário com controles inválidos não tem violação serious/critical (axe)", async () => {
    render(
      <main>
        <FormField label="Nome" error="Informe o nome.">
          <Input />
        </FormField>
        <FormField label="Município" invalid>
          <Combobox options={[{ value: "pvh", label: "Porto Velho" }]} />
        </FormField>
        <FormField label="Código" invalid>
          <InputOTP maxLength={2}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
            </InputOTPGroup>
          </InputOTP>
        </FormField>
        <FileUpload label="Anexo" invalid />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("name no envio de <form> nativo (FormData)", () => {
  it("Combobox envia o valor escolhido pelo input oculto", async () => {
    const { container } = render(
      <form>
        <FormField label="Município">
          <Combobox name="municipio" options={[{ value: "pvh", label: "Porto Velho" }]} />
        </FormField>
      </form>
    );
    const form = container.querySelector("form")!;
    expect(formData(form)).toEqual({ municipio: "" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Município/ }));
    await user.click(within(await screen.findByRole("listbox")).getByRole("option", { name: "Porto Velho" }));
    await waitFor(() => expect(formData(form)).toEqual({ municipio: "pvh" }));
  });

  it("Combobox com defaultValue já vai no FormData", () => {
    const { container } = render(
      <form>
        <Combobox aria-labelledby="x" name="uf" defaultValue="ro" options={[{ value: "ro", label: "Rondônia" }]} />
      </form>
    );
    expect(formData(container.querySelector("form")!)).toEqual({ uf: "ro" });
  });

  it("InputOTP envia o código pelo input oculto", async () => {
    const { container } = render(
      <form>
        <InputOTP name="codigo" maxLength={4}>
          <InputOTPGroup>
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </form>
    );
    const form = container.querySelector("form")!;
    // Os dígitos visíveis não têm name: só o código inteiro vai no envio.
    expect(formData(form)).toEqual({ codigo: "" });
    await userEvent.setup().type(screen.getByRole("textbox", { name: "Dígito 1 de 4" }), "4821");
    expect(formData(form)).toEqual({ codigo: "4821" });
  });

  it("InputOTP controlado envia o value do pai", () => {
    const { container } = render(
      <form>
        <InputOTP name="codigo" value="99" maxLength={2}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      </form>
    );
    expect(formData(container.querySelector("form")!)).toEqual({ codigo: "99" });
  });

  it("FileUpload repassa name e required ao input de arquivo", () => {
    render(<FileUpload label="Anexo" name="anexo" required />);
    const input = screen.getByLabelText("Anexo");
    expect(input).toHaveAttribute("name", "anexo");
    expect(input).toBeRequired();
  });
});
