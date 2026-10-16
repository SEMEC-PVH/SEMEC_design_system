import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Checkbox,
  ErrorSummary,
  FileUpload,
  FormField,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  RadioGroup,
  RadioGroupItem,
} from "../src/index";
import { severeViolations } from "./axe";

/**
 * ErrorSummary (manifest `error-summary`): role="alert", foco automático,
 * título ligado por id gerado, links para cada campo (`id`, ou `name` como
 * recuo), `focusKey` reforça o foco a cada envio.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

const erros = [
  { id: "cpf", message: "O CPF precisa ter 11 dígitos." },
  { id: "email", message: "O e-mail precisa conter @." },
];

describe("ErrorSummary", () => {
  it("role=alert nomeado pelo título padrão \"Há um problema\" (h2)", () => {
    render(<ErrorSummary errors={erros} />);
    const alerta = screen.getByRole("alert", { name: "Há um problema" });
    expect(within(alerta).getByRole("heading", { level: 2, name: "Há um problema" })).toBeInTheDocument();
  });

  it("title sobrescreve o título", () => {
    render(<ErrorSummary title="Corrija 2 campos" errors={erros} />);
    expect(screen.getByRole("alert", { name: "Corrija 2 campos" })).toBeInTheDocument();
  });

  it("sem erros não renderiza nada", () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("um link por erro, com href=#id e a mensagem como texto", () => {
    render(<ErrorSummary errors={erros} />);
    const links = within(screen.getByRole("alert")).getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["O CPF precisa ter 11 dígitos.", "#cpf"],
      ["O e-mail precisa conter @.", "#email"],
    ]);
  });

  it("recebe o foco ao aparecer (autoFocus padrão)", () => {
    render(<ErrorSummary errors={erros} />);
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveAttribute("tabindex", "-1");
  });

  it("autoFocus={false} não rouba o foco", () => {
    render(
      <>
        <input aria-label="Outro" autoFocus />
        <ErrorSummary errors={erros} autoFocus={false} />
      </>
    );
    expect(screen.getByRole("alert")).not.toHaveFocus();
  });

  it("focusKey novo devolve o foco ao resumo (novo envio com os mesmos erros)", () => {
    const { rerender } = render(
      <>
        <input aria-label="Campo" />
        <ErrorSummary errors={erros} focusKey={1} />
      </>
    );
    screen.getByRole("textbox", { name: "Campo" }).focus();
    rerender(
      <>
        <input aria-label="Campo" />
        <ErrorSummary errors={erros} focusKey={1} />
      </>
    );
    expect(screen.getByRole("textbox", { name: "Campo" })).toHaveFocus();
    rerender(
      <>
        <input aria-label="Campo" />
        <ErrorSummary errors={erros} focusKey={2} />
      </>
    );
    expect(screen.getByRole("alert")).toHaveFocus();
  });

  it("o link leva o foco ao campo pelo id (FormField + Input) e rola até ele", async () => {
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView");
    const user = userEvent.setup();
    render(
      <form>
        <ErrorSummary errors={[erros[0]!]} />
        <FormField label="CPF" error="O CPF precisa ter 11 dígitos.">
          <Input id="cpf" />
        </FormField>
      </form>
    );
    await user.click(screen.getByRole("link", { name: "O CPF precisa ter 11 dígitos." }));
    expect(screen.getByRole("textbox", { name: "CPF" })).toHaveFocus();
    expect(scroll).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
  });

  it("com prefers-reduced-motion a rolagem é instantânea", async () => {
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView");
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) => ({ matches: q.includes("reduce"), media: q }) as MediaQueryList
    );
    render(
      <>
        <ErrorSummary errors={[erros[0]!]} />
        <input id="cpf" aria-label="CPF" />
      </>
    );
    await userEvent.setup().click(screen.getByRole("link"));
    expect(scroll).toHaveBeenCalledWith({ block: "center", behavior: "auto" });
  });

  it("recuo por name: leva ao 1º rádio de um grupo sem id", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ErrorSummary errors={[{ id: "turno", message: "Escolha o turno." }]} />
        <fieldset>
          <legend>Turno</legend>
          <label>
            <input type="radio" name="turno" value="manha" /> Manhã
          </label>
          <label>
            <input type="radio" name="turno" value="tarde" /> Tarde
          </label>
        </fieldset>
      </>
    );
    await user.click(screen.getByRole("link", { name: "Escolha o turno." }));
    expect(screen.getByRole("radio", { name: "Manhã" })).toHaveFocus();
  });

  it("alvo que não é focável (contêiner) leva ao 1º controle dentro dele", async () => {
    render(
      <>
        <ErrorSummary errors={[{ id: "codigo", message: "Informe o código." }]} />
        <InputOTP id="codigo" maxLength={4}>
          <InputOTPGroup>
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </>
    );
    await userEvent.setup().click(screen.getByRole("link"));
    expect(screen.getByRole("textbox", { name: "Dígito 1 de 4" })).toHaveFocus();
  });

  it("funciona com Checkbox (botão Radix), RadioGroup e FileUpload", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ErrorSummary
          errors={[
            { id: "aceite", message: "Aceite os termos." },
            { id: "anexo", message: "Envie o anexo." },
          ]}
        />
        <Checkbox id="aceite" aria-label="Aceito os termos" />
        <FileUpload id="anexo" label="Anexo" />
      </>
    );
    await user.click(screen.getByRole("link", { name: "Aceite os termos." }));
    expect(screen.getByRole("checkbox", { name: "Aceito os termos" })).toHaveFocus();
    await user.click(screen.getByRole("link", { name: "Envie o anexo." }));
    expect(screen.getByLabelText("Anexo")).toHaveFocus();
  });

  it("alvo inexistente: não bloqueia a navegação padrão da âncora", () => {
    render(<ErrorSummary errors={[{ id: "nao-existe", message: "Erro solto." }]} />);
    const link = screen.getByRole("link", { name: "Erro solto." });
    const evento = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(false);
  });

  it("dois resumos na página não repetem o id do título", () => {
    render(
      <>
        <ErrorSummary errors={erros} />
        <ErrorSummary errors={erros} autoFocus={false} />
      </>
    );
    const [a, b] = screen.getAllByRole("alert");
    expect(a!.getAttribute("aria-labelledby")).not.toBe(b!.getAttribute("aria-labelledby"));
  });

  it("id do consumidor vira base do id do título", () => {
    render(<ErrorSummary id="resumo" errors={erros} />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-labelledby", "resumo-title");
    expect(document.getElementById("resumo-title")).toHaveTextContent("Há um problema");
  });

  it("encaminha o ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ErrorSummary ref={ref} errors={erros} />);
    expect(ref.current).toBe(screen.getByRole("alert"));
  });

  it("com campos inválidos: zero serious/critical", async () => {
    render(
      <main>
        <h1>Requerimento</h1>
        <ErrorSummary errors={erros} />
        <FormField label="CPF" error="O CPF precisa ter 11 dígitos.">
          <Input id="cpf" />
        </FormField>
        <FormField label="E-mail" error="O e-mail precisa conter @.">
          <Input id="email" />
        </FormField>
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });

  // O grupo do Radix (roving focus) tem tabindex=0 e redireciona o foco para a
  // opção marcada, que é a parada de Tab do grupo (APG Radio Group).
  it("link para um RadioGroup do kit com opção marcada foca a opção marcada", async () => {
    render(
      <>
        <ErrorSummary errors={[{ id: "turno", message: "Revise o turno." }]} />
        <RadioGroup id="turno" aria-label="Turno" defaultValue="tarde">
          <RadioGroupItem value="manha" aria-label="Manhã" />
          <RadioGroupItem value="tarde" aria-label="Tarde" />
        </RadioGroup>
      </>
    );
    await userEvent.setup().click(screen.getByRole("link"));
    expect(screen.getByRole("radio", { name: "Tarde" })).toHaveFocus();
  });

  // TST-01 (#48): depois de um envio inválido, a validação ao vivo (RHF,
  // Formik) revalida a cada tecla e a contagem de erros muda. O resumo não pode
  // roubar o foco do campo, senão as teclas seguintes se perdem: o celular
  // "69999998888" era gravado com 10 dígitos e passava como número fixo.
  describe("validação ao vivo depois do envio (TST-01)", () => {
    function validar(celular: string, nome: string) {
      const lista: { id: string; message: string }[] = [];
      if (!nome) lista.push({ id: "nome", message: "Informe o nome." });
      // Regras progressivas: cada faixa de dígitos muda a contagem de erros.
      if (celular.length < 2) lista.push({ id: "celular", message: "Informe o DDD." });
      if (celular.length < 6) lista.push({ id: "celular", message: "Informe o número." });
      if (celular.length < 11) lista.push({ id: "celular", message: "O celular precisa ter 11 dígitos." });
      if (celular.length % 2 === 1) lista.push({ id: "celular", message: "Revise o número." });
      return lista;
    }

    function Formulario({ onGravar }: { onGravar: (v: string) => void }) {
      const [celular, setCelular] = React.useState("");
      const [envios, setEnvios] = React.useState(0);
      const lista = envios > 0 ? validar(celular, "") : [];
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setEnvios((n) => n + 1);
            onGravar(celular);
          }}
        >
          <ErrorSummary errors={lista} focusKey={envios} />
          <FormField label="Celular">
            <Input
              id="celular"
              inputMode="numeric"
              value={celular}
              onChange={(e) => setCelular(e.target.value.replace(/\D/g, ""))}
            />
          </FormField>
          <button type="submit">Enviar</button>
        </form>
      );
    }

    it("digitar no campo não move o foco para o resumo e grava os 11 dígitos", async () => {
      const onGravar = vi.fn();
      const user = userEvent.setup();
      render(<Formulario onGravar={onGravar} />);
      await user.click(screen.getByRole("button", { name: "Enviar" }));
      expect(screen.getByRole("alert")).toHaveFocus();

      const campo = screen.getByRole("textbox", { name: "Celular" });
      await user.click(campo);
      await user.keyboard("69999998888");
      expect(campo).toHaveFocus();
      expect(campo).toHaveValue("69999998888");

      await user.click(screen.getByRole("button", { name: "Enviar" }));
      expect(onGravar).toHaveBeenLastCalledWith("69999998888");
    });

    it("só a contagem mudar não refoca; 0 → N erros e focusKey novo refocam", () => {
      const um = [erros[0]!];
      const { rerender } = render(
        <>
          <input aria-label="Campo" />
          <ErrorSummary errors={erros} focusKey={1} />
        </>
      );
      expect(screen.getByRole("alert")).toHaveFocus();
      const campo = screen.getByRole("textbox", { name: "Campo" });
      campo.focus();
      rerender(
        <>
          <input aria-label="Campo" />
          <ErrorSummary errors={um} focusKey={1} />
        </>
      );
      expect(campo).toHaveFocus();
      rerender(
        <>
          <input aria-label="Campo" />
          <ErrorSummary errors={erros} focusKey={1} />
        </>
      );
      expect(campo).toHaveFocus();
      // Some (0 erros) e volta: é um resumo novo na tela, então foca.
      rerender(
        <>
          <input aria-label="Campo" />
          <ErrorSummary errors={[]} focusKey={1} />
        </>
      );
      rerender(
        <>
          <input aria-label="Campo" />
          <ErrorSummary errors={um} focusKey={1} />
        </>
      );
      expect(screen.getByRole("alert")).toHaveFocus();
      campo.focus();
      rerender(
        <>
          <input aria-label="Campo" />
          <ErrorSummary errors={um} focusKey={2} />
        </>
      );
      expect(screen.getByRole("alert")).toHaveFocus();
    });
  });
});
