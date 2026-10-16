import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  FormField,
  Label,
  Slider,
  Switch,
  Textarea,
  Toggle,
} from "../src/index";
import { severeViolations } from "./axe";

const formData = (form: HTMLFormElement) => Array.from(new FormData(form).entries());

describe("Toggle", () => {
  it("é um botão com aria-pressed; clique, Enter e Espaço alternam (não controlado)", async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="Negrito">B</Toggle>);
    const t = screen.getByRole("button", { name: "Negrito" });
    expect(t).toHaveAttribute("aria-pressed", "false");
    await user.click(t);
    expect(t).toHaveAttribute("aria-pressed", "true");
    expect(t).toHaveAttribute("data-state", "on");
    await user.keyboard("{Enter}");
    expect(t).toHaveAttribute("aria-pressed", "false");
    await user.keyboard(" ");
    expect(t).toHaveAttribute("aria-pressed", "true");
  });

  it("controlado: pressed + onPressedChange", async () => {
    const onPressedChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Toggle aria-label="Itálico" pressed={false} onPressedChange={onPressedChange} />
    );
    await user.click(screen.getByRole("button"));
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    rerender(<Toggle aria-label="Itálico" pressed onPressedChange={onPressedChange} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("disabled não alterna e sai do Tab", async () => {
    const onPressedChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle aria-label="Sublinhado" disabled onPressedChange={onPressedChange} />);
    await user.click(screen.getByRole("button"));
    expect(onPressedChange).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole("button")).not.toHaveFocus();
  });

  it("alvo de 44px nos três tamanhos (sm estende a área por ::after)", () => {
    const { rerender } = render(<Toggle aria-label="A" />);
    expect(screen.getByRole("button")).toHaveClass("h-11", "min-w-11");
    rerender(<Toggle aria-label="A" size="lg" />);
    expect(screen.getByRole("button")).toHaveClass("h-12", "min-w-12");
    rerender(<Toggle aria-label="A" size="sm" />);
    expect(screen.getByRole("button")).toHaveClass("after:min-h-11", "after:min-w-11");
  });

  it("não é controle de formulário: não envia valor no <form>", () => {
    render(
      <form data-testid="f">
        <Toggle aria-label="Negrito" defaultPressed />
      </form>
    );
    expect(formData(screen.getByTestId("f") as HTMLFormElement)).toEqual([]);
  });

  it("ligado e desligado: zero serious/critical", async () => {
    render(
      <main>
        <Toggle aria-label="Negrito" defaultPressed />
        <Toggle aria-label="Itálico" variant="outline" />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Switch", () => {
  it("role=switch nomeado pelo Label; clique e Espaço alternam aria-checked", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch id="alertas" />
        <Label htmlFor="alertas">Receber alertas</Label>
      </>
    );
    const s = screen.getByRole("switch", { name: "Receber alertas" });
    expect(s).toHaveAttribute("aria-checked", "false");
    await user.click(s);
    expect(s).toHaveAttribute("aria-checked", "true");
    await user.keyboard(" ");
    expect(s).toHaveAttribute("aria-checked", "false");
  });

  it("clicar no Label alterna", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch id="sms" />
        <Label htmlFor="sms">SMS</Label>
      </>
    );
    await user.click(screen.getByText("SMS"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("controlado: checked + onCheckedChange", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Switch aria-label="E-mail" checked={false} onCheckedChange={onCheckedChange} />
    );
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    rerender(<Switch aria-label="E-mail" checked onCheckedChange={onCheckedChange} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("não controlado: defaultChecked define o estado inicial", () => {
    render(<Switch aria-label="E-mail" defaultChecked />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("name e value vão no FormData só quando ligado", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="f">
        <Switch aria-label="Alertas" name="alertas" value="sim" />
      </form>
    );
    const form = screen.getByTestId("f") as HTMLFormElement;
    expect(formData(form)).toEqual([]);
    await user.click(screen.getByRole("switch"));
    expect(formData(form)).toEqual([["alertas", "sim"]]);
  });

  it("disabled não alterna; dentro de FormField recebe aria-required e describedby", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch aria-label="Bloqueado" disabled />
        <FormField label="Aceito os termos" hint="Obrigatório para continuar" required>
          <Switch />
        </FormField>
      </>
    );
    await user.click(screen.getByRole("switch", { name: "Bloqueado" }));
    expect(screen.getByRole("switch", { name: "Bloqueado" })).toHaveAttribute("aria-checked", "false");
    const comCampo = screen.getByRole("switch", { name: /Aceito os termos/ });
    expect(comCampo).toHaveAttribute("aria-required", "true");
    expect(comCampo).toHaveAccessibleDescription("Obrigatório para continuar");
  });

  it("alvo de toque: 44px de largura e área estendida a 44px de altura", () => {
    render(<Switch aria-label="X" />);
    expect(screen.getByRole("switch")).toHaveClass("w-11", "before:-inset-y-2.5");
  });

  it("ligado, desligado e inválido: zero serious/critical", async () => {
    render(
      <main>
        <Switch aria-label="Um" defaultChecked />
        <Switch aria-label="Dois" />
        <Switch aria-label="Três" invalid />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Slider", () => {
  it("o aria-label vai para o polegar (role=slider) com min/max/now", () => {
    render(<Slider defaultValue={[50]} max={100} step={1} aria-label="Raio de busca em km" />);
    const s = screen.getByRole("slider", { name: "Raio de busca em km" });
    expect(s).toHaveAttribute("aria-valuemin", "0");
    expect(s).toHaveAttribute("aria-valuemax", "100");
    expect(s).toHaveAttribute("aria-valuenow", "50");
  });

  it("teclado APG: setas ±step, PageUp/PageDown ±10%, Home/End nos limites", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Slider defaultValue={[50]} max={100} step={1} aria-label="Raio" onValueChange={onValueChange} />);
    const s = screen.getByRole("slider");
    s.focus();
    await user.keyboard("{ArrowRight}");
    expect(s).toHaveAttribute("aria-valuenow", "51");
    expect(onValueChange).toHaveBeenLastCalledWith([51]);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(s).toHaveAttribute("aria-valuenow", "49");
    await user.keyboard("{ArrowUp}");
    expect(s).toHaveAttribute("aria-valuenow", "50");
    await user.keyboard("{PageUp}");
    expect(s).toHaveAttribute("aria-valuenow", "60");
    await user.keyboard("{PageDown}");
    expect(s).toHaveAttribute("aria-valuenow", "50");
    await user.keyboard("{End}");
    expect(s).toHaveAttribute("aria-valuenow", "100");
    await user.keyboard("{Home}");
    expect(s).toHaveAttribute("aria-valuenow", "0");
  });

  it("controlado: o polegar reflete o value do pai", async () => {
    function Controlado() {
      const [v, setV] = React.useState([10]);
      return (
        <>
          <Slider value={v} onValueChange={setV} max={20} aria-label="Quantidade" />
          <output>{v[0]}</output>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Controlado />);
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("11");
  });

  it("dois polegares: \"Faixa de preço (1 de 2)\" e \"(2 de 2)\"; getAriaLabel dá nomes próprios", () => {
    const { rerender } = render(<Slider defaultValue={[100, 500]} max={1000} step={10} aria-label="Faixa de preço" />);
    expect(screen.getByRole("slider", { name: "Faixa de preço (1 de 2)" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Faixa de preço (2 de 2)" })).toBeInTheDocument();
    rerender(
      <Slider
        defaultValue={[100, 500]}
        max={1000}
        getAriaLabel={(i) => (i === 0 ? "Valor mínimo" : "Valor máximo")}
      />
    );
    expect(screen.getByRole("slider", { name: "Valor mínimo" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Valor máximo" })).toBeInTheDocument();
  });

  it("dentro de FormField: o rótulo nomeia o polegar e invalid vira aria-invalid", () => {
    render(
      <FormField label="Distância máxima" error="Escolha um valor">
        <Slider defaultValue={[5]} max={10} />
      </FormField>
    );
    const s = screen.getByRole("slider", { name: "Distância máxima" });
    expect(s).toHaveAttribute("aria-invalid", "true");
    expect(s).toHaveAccessibleDescription("Escolha um valor");
  });

  it("name envia o valor no <form> (com [] quando há 2 polegares)", () => {
    render(
      <form data-testid="f">
        <Slider name="raio" defaultValue={[30]} aria-label="Raio" />
        <Slider name="faixa" defaultValue={[10, 90]} aria-label="Faixa" />
      </form>
    );
    expect(formData(screen.getByTestId("f") as HTMLFormElement)).toEqual([
      ["raio", "30"],
      ["faixa[]", "10"],
      ["faixa[]", "90"],
    ]);
  });

  it("disabled: o polegar não responde ao teclado", async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[5]} max={10} aria-label="Nível" disabled />);
    const s = screen.getByRole("slider");
    s.focus();
    await user.keyboard("{ArrowRight}");
    expect(s).toHaveAttribute("aria-valuenow", "5");
  });

  it("zero serious/critical (1 e 2 polegares, inválido)", async () => {
    render(
      <main>
        <Slider defaultValue={[50]} aria-label="Raio" />
        <Slider defaultValue={[10, 90]} aria-label="Faixa" invalid />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Textarea", () => {
  it("dentro de FormField: rótulo e dica ligados; com erro, o erro descreve e invalid vira aria-invalid", () => {
    const { rerender } = render(
      <FormField label="Descreva a demanda" hint="Até 500 caracteres">
        <Textarea rows={4} />
      </FormField>
    );
    const t = screen.getByRole("textbox", { name: "Descreva a demanda" });
    expect(t.tagName).toBe("TEXTAREA");
    expect(t).toHaveAccessibleDescription("Até 500 caracteres");
    rerender(
      <FormField label="Descreva a demanda" hint="Até 500 caracteres" error="Descreva em até 500 caracteres.">
        <Textarea rows={4} />
      </FormField>
    );
    expect(t).toHaveAttribute("aria-invalid", "true");
    expect(t).toHaveAccessibleDescription("Descreva em até 500 caracteres.");
  });

  it("controlado: value + onValueChange; não controlado: defaultValue", async () => {
    function Controlado() {
      const [v, setV] = React.useState("");
      return <Textarea aria-label="Obs" value={v} onValueChange={(x) => setV(x.toUpperCase())} />;
    }
    const user = userEvent.setup();
    const { unmount } = render(<Controlado />);
    await user.type(screen.getByRole("textbox"), "abc");
    expect(screen.getByRole("textbox")).toHaveValue("ABC");
    unmount();
    render(<Textarea aria-label="Obs" defaultValue="inicial" />);
    expect(screen.getByRole("textbox")).toHaveValue("inicial");
  });

  it("Enter quebra linha (não envia o form) e name vai no FormData", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const user = userEvent.setup();
    render(
      <form data-testid="f" onSubmit={onSubmit}>
        <Textarea aria-label="Obs" name="obs" />
      </form>
    );
    await user.type(screen.getByRole("textbox"), "linha 1{Enter}linha 2");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(formData(screen.getByTestId("f") as HTMLFormElement)).toEqual([["obs", "linha 1\nlinha 2"]]);
  });

  it("required vira aria-required no FormField; disabled bloqueia digitação", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FormField label="Justificativa" required>
          <Textarea />
        </FormField>
        <Textarea aria-label="Travado" disabled />
      </>
    );
    expect(screen.getByRole("textbox", { name: /Justificativa/ })).toBeRequired();
    await user.type(screen.getByRole("textbox", { name: "Travado" }), "x");
    expect(screen.getByRole("textbox", { name: "Travado" })).toHaveValue("");
  });

  it("encaminha o ref e o onChange nativo recebe o evento", () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    const onChange = vi.fn();
    render(<Textarea ref={ref} aria-label="Obs" onChange={onChange} />);
    fireEvent.change(ref.current!, { target: { value: "x" } });
    expect(onChange.mock.calls[0]![0]).toHaveProperty("target", ref.current);
  });
});

describe("Accordion", () => {
  function Faq(props: React.ComponentProps<typeof Accordion>) {
    return (
      <Accordion {...props}>
        <AccordionItem value="a">
          <AccordionTrigger>Como emitir o boleto?</AccordionTrigger>
          <AccordionContent>Acesse o portal.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Qual o prazo?</AccordionTrigger>
          <AccordionContent>Até 31/08/2026.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  it("cada gatilho é um botão dentro de um heading, com aria-expanded e aria-controls para a região", async () => {
    const user = userEvent.setup();
    render(<Faq type="single" collapsible />);
    const gatilho = screen.getByRole("button", { name: "Como emitir o boleto?" });
    expect(gatilho.parentElement?.tagName).toMatch(/^H\d$/);
    expect(gatilho).toHaveAttribute("aria-expanded", "false");
    await user.click(gatilho);
    expect(gatilho).toHaveAttribute("aria-expanded", "true");
    const regiao = document.getElementById(gatilho.getAttribute("aria-controls")!);
    expect(regiao).toHaveTextContent("Acesse o portal.");
    expect(regiao).toHaveAttribute("role", "region");
    expect(regiao).toHaveAttribute("aria-labelledby", gatilho.id);
  });

  it("single: abrir um fecha o outro; collapsible permite fechar o aberto", async () => {
    const user = userEvent.setup();
    render(<Faq type="single" collapsible defaultValue="a" />);
    const a = screen.getByRole("button", { name: "Como emitir o boleto?" });
    const b = screen.getByRole("button", { name: "Qual o prazo?" });
    expect(a).toHaveAttribute("aria-expanded", "true");
    await user.click(b);
    expect(a).toHaveAttribute("aria-expanded", "false");
    expect(b).toHaveAttribute("aria-expanded", "true");
    await user.click(b);
    expect(b).toHaveAttribute("aria-expanded", "false");
  });

  it("multiple: vários abertos ao mesmo tempo; onValueChange recebe a lista", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Faq type="multiple" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Como emitir o boleto?" }));
    await user.click(screen.getByRole("button", { name: "Qual o prazo?" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("Home/End levam ao primeiro/último gatilho", async () => {
    const user = userEvent.setup();
    render(<Faq type="single" collapsible />);
    screen.getByRole("button", { name: "Como emitir o boleto?" }).focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Qual o prazo?" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "Como emitir o boleto?" })).toHaveFocus();
  });

  it("aberto: zero serious/critical", async () => {
    render(
      <main>
        <Faq type="single" collapsible defaultValue="a" />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});
