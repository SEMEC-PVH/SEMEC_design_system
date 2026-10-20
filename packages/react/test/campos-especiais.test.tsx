import { createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DatePicker,
  FileUpload,
  FormField,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../src/index";
import { severeViolations } from "./axe";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DatePicker", () => {
  it("<input type=date> com valor ISO e botão \"Abrir calendário\" de 44px", () => {
    render(<DatePicker aria-label="Vencimento" defaultValue="2026-08-31" />);
    const campo = screen.getByLabelText("Vencimento");
    expect(campo).toHaveAttribute("type", "date");
    expect(campo).toHaveValue("2026-08-31");
    expect(screen.getByRole("button", { name: "Abrir calendário" })).toHaveClass("size-11");
  });

  it("o botão foca o campo e chama showPicker(); se showPicker lançar, só foca", async () => {
    const showPicker = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", { value: showPicker, configurable: true });
    const user = userEvent.setup();
    render(<DatePicker aria-label="Vencimento" />);
    await user.click(screen.getByRole("button", { name: "Abrir calendário" }));
    expect(screen.getByLabelText("Vencimento")).toHaveFocus();
    expect(showPicker).toHaveBeenCalledTimes(1);

    showPicker.mockImplementation(() => {
      throw new DOMException("NotAllowedError");
    });
    screen.getByLabelText("Vencimento").blur();
    await user.click(screen.getByRole("button", { name: "Abrir calendário" }));
    expect(screen.getByLabelText("Vencimento")).toHaveFocus();
    // @ts-expect-error limpeza do polyfill de teste
    delete HTMLInputElement.prototype.showPicker;
  });

  it("labels.openCalendar sobrescreve o nome do botão", () => {
    render(<DatePicker aria-label="Início" labels={{ openCalendar: "Escolher a data de início" }} />);
    expect(screen.getByRole("button", { name: "Escolher a data de início" })).toBeInTheDocument();
  });

  it("disabled e readOnly desabilitam o botão", () => {
    const { rerender } = render(<DatePicker aria-label="Data" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByLabelText("Data")).toBeDisabled();
    rerender(<DatePicker aria-label="Data" readOnly />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("controlado: onValueChange recebe o ISO e \"\" ao limpar", () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Data" value="2026-08-31" onValueChange={onValueChange} />);
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-09-01" } });
    expect(onValueChange).toHaveBeenLastCalledWith("2026-09-01");
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "" } });
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("min, max, name e required vão para o input nativo (FormData com ISO)", () => {
    render(
      <form data-testid="f">
        <DatePicker aria-label="Data" name="vencimento" min="2026-01-01" max="2026-12-31" required defaultValue="2026-08-31" />
      </form>
    );
    const campo = screen.getByLabelText("Data");
    expect(campo).toHaveAttribute("min", "2026-01-01");
    expect(campo).toHaveAttribute("max", "2026-12-31");
    expect(campo).toBeRequired();
    expect(new FormData(screen.getByTestId("f") as HTMLFormElement).get("vencimento")).toBe("2026-08-31");
  });

  it("dentro de FormField: rótulo, dica \"dd/mm/aaaa\" e erro ligados", () => {
    const { rerender } = render(
      <FormField label="Data de vencimento" hint="dd/mm/aaaa">
        <DatePicker />
      </FormField>
    );
    const campo = screen.getByLabelText("Data de vencimento");
    expect(campo).toHaveAccessibleDescription("dd/mm/aaaa");
    rerender(
      <FormField label="Data de vencimento" hint="dd/mm/aaaa" error="Informe uma data até 31/12/2026.">
        <DatePicker />
      </FormField>
    );
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Informe uma data até 31/12/2026.");
  });

  it("Tab passa pelo campo e depois pelo botão", async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Data" />);
    await user.tab();
    expect(screen.getByLabelText("Data")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Abrir calendário" })).toHaveFocus();
  });

  it("zero serious/critical (válido e inválido)", async () => {
    render(
      <main>
        <FormField label="Início">
          <DatePicker />
        </FormField>
        <FormField label="Fim" error="Data inválida">
          <DatePicker />
        </FormField>
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

function Codigo(props: Partial<React.ComponentProps<typeof InputOTP>>) {
  return (
    <InputOTP maxLength={6} {...props}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}

const digito = (n: number, total = 6) => screen.getByRole("textbox", { name: `Dígito ${n} de ${total}` });

describe("InputOTP", () => {
  it("grupo \"Código de verificação\" e dígitos \"Dígito N de 6\" (PT-BR padrão)", () => {
    render(<Codigo />);
    expect(screen.getByRole("group", { name: "Código de verificação" })).toBeInTheDocument();
    for (const n of [1, 2, 3, 4, 5, 6]) expect(digito(n)).toBeInTheDocument();
  });

  it("labels sobrescreve grupo e dígitos; aria-label do consumidor nomeia o grupo", () => {
    const { rerender } = render(
      <Codigo labels={{ group: "Código do SMS", slot: (i, t) => `Posição ${i + 1}/${t}` }} />
    );
    expect(screen.getByRole("group", { name: "Código do SMS" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Posição 1/6" })).toBeInTheDocument();
    rerender(<Codigo aria-label="Token do aplicativo" />);
    expect(screen.getByRole("group", { name: "Token do aplicativo" })).toBeInTheDocument();
  });

  it("1º dígito com autocomplete=one-time-code; todos com inputMode numérico e 44px", () => {
    render(<Codigo />);
    expect(digito(1)).toHaveAttribute("autocomplete", "one-time-code");
    expect(digito(2)).toHaveAttribute("autocomplete", "off");
    for (const n of [1, 6]) {
      expect(digito(n)).toHaveAttribute("inputmode", "numeric");
      expect(digito(n).parentElement).toHaveClass("h-11", "w-11");
    }
  });

  it("digitar avança o foco; letras são ignoradas", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Codigo onValueChange={onValueChange} />);
    await user.click(digito(1));
    await user.keyboard("1a2");
    expect(digito(1)).toHaveValue("1");
    expect(digito(2)).toHaveValue("2");
    expect(digito(3)).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("12");
  });

  it("Backspace apaga o dígito; no slot vazio volta e apaga o anterior", async () => {
    const user = userEvent.setup();
    render(<Codigo defaultValue="123" />);
    await user.click(digito(3));
    await user.keyboard("{Backspace}");
    expect(digito(3)).toHaveValue("");
    expect(digito(3)).toHaveFocus();
    await user.keyboard("{Backspace}");
    expect(digito(2)).toHaveValue("");
    expect(digito(2)).toHaveFocus();
  });

  it("setas esquerda/direita movem entre os dígitos; Delete apaga sem mover", async () => {
    const user = userEvent.setup();
    render(<Codigo defaultValue="123456" />);
    await user.click(digito(3));
    await user.keyboard("{ArrowRight}");
    expect(digito(4)).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(digito(2)).toHaveFocus();
    await user.keyboard("{Delete}");
    expect(digito(2)).toHaveValue("");
    expect(digito(2)).toHaveFocus();
  });

  it("colar o código completo preenche tudo a partir do 1º dígito (só números)", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Codigo onValueChange={onValueChange} />);
    await user.click(digito(3));
    await user.paste("12-34 56");
    expect(onValueChange).toHaveBeenLastCalledWith("123456");
    expect(digito(1)).toHaveValue("1");
    expect(digito(6)).toHaveValue("6");
    expect(digito(6)).toHaveFocus();
  });

  it("colar texto sem dígitos não muda nada", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Codigo onValueChange={onValueChange} />);
    await user.click(digito(1));
    await user.paste("abc");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disabled: dígitos desabilitados e fora do Tab", async () => {
    const user = userEvent.setup();
    render(<Codigo disabled />);
    expect(digito(1)).toBeDisabled();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it("o separador visual é aria-hidden", () => {
    const { container } = render(<Codigo />);
    expect(container.querySelector("[role=separator]")).toHaveAttribute("aria-hidden", "true");
  });

  it("zero serious/critical (vazio, preenchido e inválido)", async () => {
    render(
      <main>
        <Codigo />
        <Codigo defaultValue="123456" invalid aria-label="Outro código" />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

const arquivo = (nome: string, tamanho: number, tipo: string) => {
  const f = new File(["x"], nome, { type: tipo });
  Object.defineProperty(f, "size", { value: tamanho });
  return f;
};

function soltar(alvo: Element, files: File[]) {
  const evento = createEvent.drop(alvo);
  Object.defineProperty(evento, "dataTransfer", { value: { files } });
  fireEvent(alvo, evento);
}

describe("FileUpload", () => {
  it("com required, o rótulo mostra o * como o FormField (NEXT42-06)", () => {
    const { rerender } = render(<FileUpload label="Documentos" required />);
    expect(screen.getByText("Documentos").closest("label")).toHaveTextContent("Documentos *");
    expect(screen.getByLabelText(/Documentos/)).toBeRequired();
    // Também pelo atalho inputProps.required.
    rerender(<FileUpload label="Documentos" inputProps={{ required: true }} />);
    expect(screen.getByText("Documentos").closest("label")).toHaveTextContent("Documentos *");
    rerender(<FileUpload label="Documentos" />);
    expect(screen.getByText("Documentos").closest("label")).toHaveTextContent(/^Documentos$/);
  });

  it("label nomeia o input de arquivo; textos PT-BR da zona; hint descreve", () => {
    render(<FileUpload label="Documento de identidade" hint="PDF ou imagem, até 5 MB" />);
    const input = screen.getByLabelText("Documento de identidade");
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAccessibleDescription("PDF ou imagem, até 5 MB");
    expect(screen.getByText(/Arraste um arquivo ou/)).toBeInTheDocument();
    expect(screen.getByText("clique para escolher")).toBeInTheDocument();
  });

  it("sem label nem FormField, o input se chama \"Escolher arquivo\"", () => {
    const { container } = render(<FileUpload />);
    expect(container.querySelector("input[type=file]")).toHaveAccessibleName("Escolher arquivo");
  });

  it("o input entra no Tab (sr-only, não display:none)", async () => {
    render(<FileUpload label="Anexo" />);
    await userEvent.setup().tab();
    expect(screen.getByLabelText("Anexo")).toHaveFocus();
  });

  it("soltar arquivo aceito: lista o nome e chama onValueChange", () => {
    const onValueChange = vi.fn();
    const { container } = render(<FileUpload label="Anexo" accept=".pdf" onValueChange={onValueChange} />);
    const zona = container.querySelector(".border-dashed")!;
    const pdf = arquivo("rg.pdf", 2048, "application/pdf");
    soltar(zona, [pdf]);
    expect(onValueChange).toHaveBeenCalledWith([pdf]);
    expect(screen.getByText("rg.pdf")).toBeInTheDocument();
  });

  it("tipo não aceito: erro PT-BR numa região polite ligada ao input", () => {
    const { container } = render(<FileUpload label="Anexo" accept=".pdf" />);
    soltar(container.querySelector(".border-dashed")!, [arquivo("foto.exe", 10, "application/x-msdownload")]);
    const erro = screen.getByText("Tipo de arquivo não permitido.");
    expect(erro).toHaveAttribute("aria-live", "polite");
    const input = screen.getByLabelText("Anexo");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Tipo de arquivo não permitido.");
  });

  it("labels sobrescreve invalidType, tooLarge, dropzone e chooseFile", () => {
    const { container } = render(
      <FileUpload
        accept=".pdf"
        maxSize={1024}
        labels={{
          invalidType: "Envie só PDF.",
          tooLarge: (max) => `Máximo de ${max}.`,
          dropzone: "Solte aqui ou",
          dropzoneAction: "procure",
          chooseFile: "Anexar comprovante",
        }}
      />
    );
    expect(container.querySelector("input[type=file]")).toHaveAccessibleName("Anexar comprovante");
    expect(screen.getByText("procure")).toBeInTheDocument();
    const zona = container.querySelector(".border-dashed")!;
    soltar(zona, [arquivo("a.txt", 10, "text/plain")]);
    expect(screen.getByText("Envie só PDF.")).toBeInTheDocument();
    soltar(zona, [arquivo("a.pdf", 4096, "application/pdf")]);
    expect(screen.getByText(/^Máximo de /)).toBeInTheDocument();
  });

  it("multiple={false} fica só com o 1º arquivo", () => {
    const onValueChange = vi.fn();
    const { container } = render(<FileUpload label="Anexo" multiple={false} onValueChange={onValueChange} />);
    const a = arquivo("a.pdf", 10, "application/pdf");
    const b = arquivo("b.pdf", 10, "application/pdf");
    soltar(container.querySelector(".border-dashed")!, [a, b]);
    expect(onValueChange).toHaveBeenCalledWith([a]);
    expect(screen.getByLabelText("Anexo")).not.toHaveAttribute("multiple");
  });

  it("com erro: zero serious/critical", async () => {
    const { container } = render(
      <main>
        <FileUpload label="Anexo" accept=".pdf" hint="Só PDF" />
      </main>
    );
    soltar(container.querySelector(".border-dashed")!, [arquivo("x.exe", 10, "application/x-msdownload")]);
    await waitFor(() => expect(screen.getByText("Tipo de arquivo não permitido.")).toBeInTheDocument());
    expect(await severeViolations()).toEqual([]);
  });

  // TST-F2-08 / TST-13 (#54): formatBytes usava toFixed(1) com ponto decimal
  // ("5.0 MB", "1.5 MB"). A régua do kit (PT-BR, ADR-016) pede vírgula decimal.
  it("TST-F2-08: o limite de tamanho sai com vírgula decimal (PT-BR)", () => {
    const { container } = render(<FileUpload label="Anexo" maxSize={5 * 1024 * 1024} />);
    soltar(container.querySelector(".border-dashed")!, [arquivo("grande.pdf", 6 * 1024 * 1024, "application/pdf")]);
    expect(screen.getByText(/^Arquivo excede o limite de /)).toHaveTextContent(
      /^Arquivo excede o limite de 5(,0)? MB\.$/
    );
  });

  it("TST-F2-08: o tamanho do arquivo na lista sai com vírgula decimal (PT-BR)", () => {
    const { container } = render(<FileUpload label="Anexo" />);
    soltar(container.querySelector(".border-dashed")!, [arquivo("rg.pdf", 1.5 * 1024 * 1024, "application/pdf")]);
    expect(screen.getByText(/MB$/)).toHaveTextContent("1,5 MB");
  });

  it("TST-13: KB também sai com vírgula decimal e bytes ficam inteiros", () => {
    const { container } = render(<FileUpload label="Anexo" multiple />);
    soltar(container.querySelector(".border-dashed")!, [
      arquivo("foto.png", 2.5 * 1024, "image/png"),
      arquivo("nota.txt", 512, "text/plain"),
    ]);
    expect(screen.getByText(/KB$/)).toHaveTextContent("2,5 KB");
    expect(screen.getByText(/ B$/)).toHaveTextContent("512 B");
  });
});
