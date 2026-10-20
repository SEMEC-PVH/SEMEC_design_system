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
 * `disabled`, `required`. Na 4.0 o `onChange(value)` da 3.x saiu: `Calendar`,
 * `Combobox`, `InputOTP` e `FileUpload` não chamam mais um `onChange`, e no
 * `DatePicker` ele é o evento nativo do `<input>`.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

/** O onChange removido gera um único console.error em desenvolvimento, mesmo com vários renders. */
function expectRemovedOnChangeError(error: ReturnType<typeof vi.spyOn>, component: string) {
  const calls = error.mock.calls.filter(([msg]) => String(msg).includes(`${component}: onChange`));
  expect(calls).toHaveLength(1);
  expect(String(calls[0]![0])).toContain("onChange foi removido na 4.0; use onValueChange (ver guia de migração");
}

const formData = (form: HTMLFormElement) => Object.fromEntries(new FormData(form).entries());

describe("onChange removido na 4.0: erro único só em desenvolvimento", () => {
  it("não reporta em produção nem repete o mesmo componente", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const env = process.env.NODE_ENV;
    vi.resetModules();
    try {
      process.env.NODE_ENV = "production";
      const prod = await import("../src/lib/removed-prop");
      prod.reportRemovedOnChange("Combobox");
      expect(error).not.toHaveBeenCalled();
      process.env.NODE_ENV = "development";
      prod.reportRemovedOnChange("Combobox");
      prod.reportRemovedOnChange("Combobox");
      expect(error).toHaveBeenCalledTimes(1);
    } finally {
      process.env.NODE_ENV = env;
      vi.resetModules();
    }
  });
});

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

  it("DatePicker: onValueChange recebe o ISO e onChange recebe o evento nativo (4.0), sem aviso", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker aria-label="Vencimento" onValueChange={onValueChange} onChange={onChange} />
    );
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-10-15" } });
    expect(onValueChange).toHaveBeenCalledWith("2026-10-15");
    expect(onChange).toHaveBeenCalledTimes(1);
    const event = onChange.mock.calls[0]![0];
    expect(typeof event).not.toBe("string");
    expect(event).toHaveProperty("type", "change");
    expect(event.target).toBe(input);
    expect(event.target.value).toBe("2026-10-15");
    expect(warn).not.toHaveBeenCalled();
  });

  it("DatePicker: só o onChange nativo (sem onValueChange) também funciona", () => {
    const onChange = vi.fn((e: { target: HTMLInputElement }) => e.target.value);
    const { container } = render(<DatePicker aria-label="Vencimento" onChange={onChange} />);
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-01-02" } });
    expect(onChange).toHaveReturnedWith("2026-01-02");
  });

  it("Combobox: onValueChange recebe o valor da opção; o onChange da 3.x não é mais chamado (4.0)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <FormField label="Município">
        <Combobox
          options={[{ value: "pvh", label: "Porto Velho" }]}
          onValueChange={onValueChange}
          {...({ onChange } as unknown as object)}
        />
      </FormField>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Município/ }));
    await user.click(within(await screen.findByRole("listbox")).getByRole("option", { name: "Porto Velho" }));
    expect(onValueChange).toHaveBeenCalledWith("pvh");
    expect(onChange).not.toHaveBeenCalled();
    expectRemovedOnChangeError(error, "Combobox");
    expect(warn).not.toHaveBeenCalled();
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

  it("InputOTP: o onChange(value) da 3.x não é mais chamado (4.0), nem com o evento dos dígitos", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <InputOTP maxLength={4} onValueChange={onValueChange} {...({ onChange } as unknown as object)}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    );
    await userEvent.setup().type(screen.getByRole("textbox", { name: "Dígito 1 de 4" }), "7");
    expect(onValueChange).toHaveBeenLastCalledWith("7");
    expect(onChange).not.toHaveBeenCalled();
    expectRemovedOnChangeError(error, "InputOTP");
    expect(warn).not.toHaveBeenCalled();
  });

  it("Calendar: o onChange(date) da 3.x não é mais chamado (4.0)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <Calendar
        value={new Date(2026, 9, 14)}
        onValueChange={onValueChange}
        {...({ onChange } as unknown as object)}
      />
    );
    await userEvent.setup().click(screen.getByRole("gridcell", { name: "15 de outubro de 2026" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expectRemovedOnChangeError(error, "Calendar");
  });

  it("FileUpload: onValueChange recebe os arquivos; o onChange(files) da 3.x não é mais chamado (4.0)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <FileUpload label="Anexo" onValueChange={onValueChange} {...({ onChange } as unknown as object)} />
    );
    const file = new File(["%PDF"], "rg.pdf", { type: "application/pdf" });
    await userEvent.setup().upload(screen.getByLabelText("Anexo"), file);
    expect(onValueChange).toHaveBeenCalledWith([file]);
    // Nem com os arquivos, nem com o evento do <input type="file"> que borbulha.
    expect(onChange).not.toHaveBeenCalled();
    expectRemovedOnChangeError(error, "FileUpload");
    expect(warn).not.toHaveBeenCalled();
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
    const input = screen.getByLabelText("Anexo *");
    expect(input).toHaveAttribute("name", "anexo");
    expect(input).toBeRequired();
  });
});

describe("FileUpload: input.files acompanha a lista (D1)", () => {
  // O jsdom não tem DataTransfer nem deixa montar FileList: aqui um DataTransfer
  // mínimo e um `files` gravável no próprio input conferem a sincronização.
  // O envio real (FormData + checkValidity) roda no Chromium, em
  // scripts/gate/check-form-submit.mjs.
  class FakeDataTransfer {
    private list: File[] = [];
    items = { add: (file: File) => void this.list.push(file) };
    get files() {
      return this.list as unknown as FileList;
    }
  }

  function writableFiles(input: HTMLElement) {
    let store: File[] = [];
    Object.defineProperty(input, "files", {
      configurable: true,
      get: () => store,
      set: (v: File[]) => {
        store = Array.from(v);
      },
    });
    return {
      get names() {
        return store.map((f) => f.name);
      },
      pick(files: File[]) {
        store = files;
        fireEvent.change(input);
      },
    };
  }

  const pdf = (name: string) => new File(["%PDF"], name, { type: "application/pdf" });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aceito fica no input; recusado não substitui o aceito", () => {
    vi.stubGlobal("DataTransfer", FakeDataTransfer);
    render(<FileUpload label="Doc" name="doc" accept=".pdf" />);
    const files = writableFiles(screen.getByLabelText("Doc"));
    files.pick([pdf("a.pdf")]);
    expect(files.names).toEqual(["a.pdf"]);
    files.pick([new File(["MZ"], "b.exe")]);
    expect(files.names).toEqual(["a.pdf"]);
    expect(screen.getByText("Tipo de arquivo não permitido.")).toBeInTheDocument();
  });

  it("controlado: o value do pai vai para o input (remover esvazia)", () => {
    vi.stubGlobal("DataTransfer", FakeDataTransfer);
    const { rerender } = render(<FileUpload label="Doc" value={[]} />);
    const files = writableFiles(screen.getByLabelText("Doc"));
    rerender(<FileUpload label="Doc" value={[pdf("x.pdf"), pdf("y.pdf")]} />);
    expect(files.names).toEqual(["x.pdf", "y.pdf"]);
    rerender(<FileUpload label="Doc" value={[]} />);
    expect(files.names).toEqual([]);
  });

  it("cancelar o seletor devolve a lista ao input", () => {
    vi.stubGlobal("DataTransfer", FakeDataTransfer);
    render(<FileUpload label="Doc" />);
    const input = screen.getByLabelText("Doc");
    const files = writableFiles(input);
    files.pick([pdf("a.pdf")]);
    input.files = new FakeDataTransfer().files; // como o clique que limpa o input
    expect(files.names).toEqual([]);
    fireEvent(input, new Event("cancel"));
    expect(files.names).toEqual(["a.pdf"]);
  });

  it("sem DataTransfer, degrada sem erro e mantém a lista", async () => {
    vi.stubGlobal("DataTransfer", undefined);
    render(<FileUpload label="Doc" />);
    await userEvent.setup().upload(screen.getByLabelText("Doc"), pdf("a.pdf"));
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
  });
});

describe("InputOTP.defaultValue (compatível com 3.1.0)", () => {
  it.each([
    ["string", "12", "1"],
    ["number", 34, "3"],
    ["array", ["5", "6"], "5"],
  ] as const)("aceita %s e normaliza para string", (_tipo, defaultValue, primeiro) => {
    render(
      <InputOTP maxLength={2} defaultValue={defaultValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>
    );
    expect(screen.getByRole("textbox", { name: "Dígito 1 de 2" })).toHaveValue(primeiro);
  });
});

describe("invalid={false} explícito não liga a mensagem de erro do FormField", () => {
  it("Input: sem aria-invalid e sem o erro no aria-describedby", () => {
    render(
      <FormField label="CPF" id="cpf" error="Informe o CPF.">
        <Input invalid={false} aria-describedby="extra" />
      </FormField>
    );
    const input = screen.getByRole("textbox", { name: "CPF" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute("aria-describedby", "extra");
  });

  it("Input: a dica continua ligada", () => {
    render(
      <FormField label="CPF" id="cpf" hint="Só números">
        <Input invalid={false} />
      </FormField>
    );
    expect(screen.getByRole("textbox", { name: "CPF" })).toHaveAttribute("aria-describedby", "cpf-hint");
  });

  it("FileUpload: idem", () => {
    render(
      <FormField label="Anexo" id="anexo" error="Envie o anexo.">
        <FileUpload invalid={false} />
      </FormField>
    );
    const input = screen.getByLabelText("Anexo");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.getAttribute("aria-describedby") ?? "").not.toContain("anexo-error");
  });
});
