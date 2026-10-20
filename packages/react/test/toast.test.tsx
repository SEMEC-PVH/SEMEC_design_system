import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, ToastAction, Toaster, useToast } from "../src/index";
import { severeViolations } from "./axe";

/**
 * Toast (manifest `toast`, notificacao.md): `<Toaster />` uma vez no root +
 * `useToast()`; textos PT-BR sobrescrevíveis (label · viewportLabel ·
 * closeLabel); X e ToastAction com 44px; variante `success` para confirmação.
 *
 * O estado do `useToast` é global ao módulo (como no shadcn): cada teste usa
 * títulos próprios e consulta só os seus avisos.
 */

type Disparo = Parameters<ReturnType<typeof useToast>["toast"]>[0];

function Disparador({ props, rotulo = "Disparar" }: { props: Disparo; rotulo?: string }) {
  const { toast } = useToast();
  return <Button onClick={() => toast(props)}>{rotulo}</Button>;
}

/** O `<li>` do aviso que contém o texto. */
const avisoCom = (texto: string) => screen.getByText(texto).closest("li") as HTMLElement;

describe("Toast", () => {
  it("o Toaster monta a região rotulada em PT-BR com o atalho F8", () => {
    render(<Toaster />);
    expect(screen.getByRole("region", { name: "Notificações (F8)" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveClass("pointer-events-none");
  });

  it("useToast() mostra título e descrição e o X se chama \"Fechar notificação\"", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Protocolo enviado", description: "Nº 2026/000123" }} />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    const aviso = avisoCom("Protocolo enviado");
    expect(aviso).toHaveClass("pointer-events-auto");
    expect(within(aviso).getByText("Nº 2026/000123")).toBeInTheDocument();
    expect(within(aviso).getByRole("button", { name: "Fechar notificação" })).toBeInTheDocument();
  });

  it("anuncia o aviso numa região viva com o prefixo PT-BR \"Notificação\"", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Matrícula confirmada" }} />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    await waitFor(() => {
      const anuncios = screen
        .getAllByRole("status")
        .filter((el) => (el.textContent ?? "").includes("Matrícula confirmada"));
      expect(anuncios.length).toBeGreaterThan(0);
      expect(anuncios[0]).toHaveAttribute("aria-live", "assertive");
      expect(anuncios[0]!.textContent).toMatch(/^Notificação/);
    });
  });

  it("label, viewportLabel e closeLabel sobrescrevem os textos", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Aviso sobrescrito" }} />
        <Toaster label="Aviso" viewportLabel="Avisos do sistema ({hotkey})" closeLabel="Dispensar aviso" />
      </>
    );
    expect(screen.getByRole("region", { name: "Avisos do sistema (F8)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    const aviso = avisoCom("Aviso sobrescrito");
    expect(within(aviso).getByRole("button", { name: "Dispensar aviso" })).toBeInTheDocument();
    await waitFor(() => {
      const anuncio = screen
        .getAllByRole("status")
        .find((el) => (el.textContent ?? "").includes("Aviso sobrescrito"));
      expect(anuncio?.textContent).toMatch(/^Aviso/);
      expect(anuncio?.textContent).not.toMatch(/^Notificação/);
    });
  });

  it("o X fecha o aviso", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Para fechar" }} />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    await user.click(within(avisoCom("Para fechar")).getByRole("button", { name: "Fechar notificação" }));
    await waitFor(() => expect(screen.queryByText("Para fechar")).not.toBeInTheDocument());
  });

  it("dismiss() devolvido por toast() fecha o aviso", async () => {
    let fechar: (() => void) | undefined;
    function Programatico() {
      const { toast } = useToast();
      return <Button onClick={() => (fechar = toast({ title: "Fecha sozinho" }).dismiss)}>Abrir</Button>;
    }
    const user = userEvent.setup();
    render(
      <>
        <Programatico />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    expect(screen.getByText("Fecha sozinho")).toBeInTheDocument();
    act(() => fechar?.());
    await waitFor(() => expect(screen.queryByText("Fecha sozinho")).not.toBeInTheDocument());
  });

  it("some sozinho depois de `duration`", async () => {
    render(
      <>
        <Disparador props={{ title: "Temporário", duration: 300 }} />
        <Toaster />
      </>
    );
    // fireEvent é síncrono: o aviso já está na tela antes de o timer correr.
    fireEvent.click(screen.getByRole("button", { name: "Disparar" }));
    expect(screen.getByText("Temporário")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Temporário")).not.toBeInTheDocument(), { timeout: 4000 });
  });

  it("Esc com o foco no aviso fecha o aviso", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Fecha no Esc" }} />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    avisoCom("Fecha no Esc").focus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Fecha no Esc")).not.toBeInTheDocument());
  });

  it("F8 leva o foco à região de notificações", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Atalho F8" }} />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    // user-event não mapeia o `code` de F8; o Radix escuta `event.code`.
    fireEvent.keyDown(document, { key: "F8", code: "F8" });
    const regiao = screen.getByRole("region", { name: "Notificações (F8)" });
    expect(regiao.contains(document.activeElement)).toBe(true);
  });

  it("empilha no máximo 3 avisos (o mais antigo sai)", async () => {
    const user = userEvent.setup();
    function Varios() {
      const { toast } = useToast();
      return (
        <Button
          onClick={() => {
            for (const n of [1, 2, 3, 4]) toast({ title: `Pilha ${n}` });
          }}
        >
          Quatro
        </Button>
      );
    }
    render(
      <>
        <Varios />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Quatro" }));
    expect(screen.queryByText("Pilha 1")).not.toBeInTheDocument();
    for (const n of [2, 3, 4]) expect(screen.getByText(`Pilha ${n}`)).toBeInTheDocument();
  });

  it("ToastAction recebe o altText e dispara o onClick; X e ação têm 44px (h-11/size-11)", async () => {
    const onDesfazer = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <Disparador
          props={{
            title: "Rascunho excluído",
            action: (
              <ToastAction altText="Desfazer a exclusão do rascunho" onClick={onDesfazer}>
                Desfazer
              </ToastAction>
            ),
          }}
        />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    const aviso = avisoCom("Rascunho excluído");
    const acao = within(aviso).getByRole("button", { name: "Desfazer" });
    expect(acao).toHaveClass("h-11");
    expect(within(aviso).getByRole("button", { name: "Fechar notificação" })).toHaveClass("size-11");
    await user.click(acao);
    expect(onDesfazer).toHaveBeenCalledTimes(1);
  });

  it("aberto (default, success, warning, destructive): zero serious/critical", async () => {
    const user = userEvent.setup();
    function Variantes() {
      const { toast } = useToast();
      return (
        <Button
          onClick={() => {
            toast({ variant: "success", title: "Sucesso axe" });
            toast({ variant: "warning", title: "Atenção axe" });
            toast({ variant: "destructive", title: "Erro axe", description: "Tente de novo." });
          }}
        >
          Variantes
        </Button>
      );
    }
    render(
      <main>
        <Variantes />
        <Toaster />
      </main>
    );
    await user.click(screen.getByRole("button", { name: "Variantes" }));
    expect(screen.getByText("Erro axe")).toBeInTheDocument();
    expect(await severeViolations()).toEqual([]);
  });

  // TST-F2-01 / TST-24 (#54): `toast({ onOpenChange })` é aceito pelo tipo
  // (ToastProps), mas o `toast()` sobrescrevia o handler com o seu próprio
  // (depois do `...props`), então o consumidor nunca era avisado do fechamento.
  it("TST-F2-01: onOpenChange passado a toast() é chamado ao fechar", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Com callback", onOpenChange }} />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    await user.click(within(avisoCom("Com callback")).getByRole("button", { name: "Fechar notificação" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("TST-24: com onOpenChange do consumidor, fechar ainda tira o aviso da tela", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <Disparador props={{ title: "Some ao fechar", onOpenChange }} />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    await user.click(within(avisoCom("Some ao fechar")).getByRole("button", { name: "Fechar notificação" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText("Some ao fechar")).not.toBeInTheDocument());
  });

  it("TST-24: update() com novo onOpenChange troca o do consumidor sem perder o interno", async () => {
    const primeiro = vi.fn();
    const segundo = vi.fn();
    const user = userEvent.setup();
    function Atualiza() {
      const { toast } = useToast();
      return (
        <Button
          onClick={() => {
            const t = toast({ title: "Atualizável", onOpenChange: primeiro });
            t.update({ id: t.id, title: "Atualizado", onOpenChange: segundo });
          }}
        >
          Disparar
        </Button>
      );
    }
    render(
      <>
        <Atualiza />
        <Toaster />
      </>
    );
    await user.click(screen.getByRole("button", { name: "Disparar" }));
    await user.click(within(avisoCom("Atualizado")).getByRole("button", { name: "Fechar notificação" }));
    expect(primeiro).not.toHaveBeenCalled();
    expect(segundo).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByText("Atualizado")).not.toBeInTheDocument());
  });
});
