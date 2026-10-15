import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Breadcrumb,
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
} from "../src/index";

/**
 * Regressões de estilo da 4.0.1, conferidas pelas classes (o jsdom não faz
 * layout; o print em Chromium está no PR). Cada caso trava a classe que
 * resolve o defeito encontrado testando o pacote publicado como consumidor.
 */

const classes = (el: Element | null) => (el?.getAttribute("class") ?? "").split(/\s+/);

describe("FormField em grid de colunas", () => {
  it("a raiz alinha as linhas no topo (content-start), sem trocar o gap", () => {
    // Dois FormFields lado a lado, um com dica: a linha do grid estica o mais
    // curto, e sem `content-start` as linhas internas esticam e o campo desce.
    const { container } = render(
      <div className="grid md:grid-cols-2">
        <FormField label="Nome" hint="Como no documento.">
          <Input />
        </FormField>
        <FormField label="Município">
          <Input />
        </FormField>
      </div>
    );
    const fields = container.firstElementChild!.children;
    expect(fields).toHaveLength(2);
    for (const field of Array.from(fields)) {
      expect(classes(field)).toEqual(expect.arrayContaining(["grid", "content-start", "gap-1.5"]));
    }
  });

  it("className do consumidor continua mesclando com a raiz", () => {
    const { container } = render(
      <FormField label="Nome" className="gap-3">
        <Input />
      </FormField>
    );
    const root = classes(container.firstElementChild);
    expect(root).toEqual(expect.arrayContaining(["content-start", "gap-3"]));
    expect(root).not.toContain("gap-1.5");
  });
});

describe("fundo dos controles de entrada", () => {
  it("Combobox, DatePicker, InputOTP, Checkbox, RadioGroupItem e FileUpload usam bg-surface, como o Input", () => {
    const { container } = render(
      <>
        <Input aria-label="Nome" />
        <Combobox options={[{ value: "cpf", label: "CPF" }]} />
        <DatePicker aria-label="Vencimento" />
        <InputOTP maxLength={2} aria-label="Código">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
        <Checkbox aria-label="Aceito" />
        <RadioGroup aria-label="Tipo">
          <RadioGroupItem value="pf" aria-label="Pessoa física" />
        </RadioGroup>
        <FileUpload />
      </>
    );
    const controls = [
      screen.getByRole("textbox", { name: "Nome" }),
      container.querySelector('button[aria-haspopup]'),
      container.querySelector('input[type="date"]'),
      // O fundo do InputOTP fica na caixa do slot (pai do <input>).
      container.querySelector('input[inputmode="numeric"]')?.parentElement ?? null,
      screen.getByRole("checkbox", { name: "Aceito" }),
      screen.getByRole("radio", { name: "Pessoa física" }),
      container.querySelector('input[type="file"]')?.parentElement ?? null,
    ];
    for (const el of controls) {
      expect(el).not.toBeNull();
      expect(classes(el)).toContain("bg-surface");
      expect(classes(el)).not.toContain("bg-background");
    }
  });
});

describe("RadioGroup inválido", () => {
  it("o grupo recebe aria-invalid e os itens herdam a borda de erro pelo grupo nomeado", () => {
    render(
      <FormField label="Tipo de pessoa" error="Escolha uma opção.">
        <RadioGroup>
          <RadioGroupItem value="pf" aria-label="Pessoa física" />
          <RadioGroupItem value="pj" aria-label="Pessoa jurídica" />
        </RadioGroup>
      </FormField>
    );
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(classes(group)).toContain("group/radio-group");
    for (const radio of screen.getAllByRole("radio")) {
      expect(classes(radio)).toContain("group-aria-[invalid=true]/radio-group:border-destructive");
    }
  });
});

describe("Breadcrumb quebrando no mobile", () => {
  it("o separador fica no fim do item anterior, dentro do mesmo li, e oculto do leitor de tela", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Início", href: "/" },
          { label: "Serviços", href: "/servicos" },
          { label: "Matrícula" },
        ]}
      />
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    // Itens com separador: todos menos o último; o separador é o último filho.
    for (const li of items.slice(0, -1)) {
      const sep = li.lastElementChild;
      expect(sep?.tagName.toLowerCase()).toBe("svg");
      expect(sep).toHaveAttribute("aria-hidden", "true");
      expect(li.firstElementChild?.tagName.toLowerCase()).not.toBe("svg");
    }
    expect(items[2]!.querySelector("svg")).toBeNull();
    expect(screen.getByText("Matrícula")).toHaveAttribute("aria-current", "page");
    // Nome acessível de cada item continua sendo só o rótulo.
    expect(items.map((li) => li.textContent)).toEqual(["Início", "Serviços", "Matrícula"]);
  });
});
