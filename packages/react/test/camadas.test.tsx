import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../src/index";
import { severeViolations } from "./axe";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Tooltip", () => {
  function Dica({ delay = 0 }: { delay?: number }) {
    return (
      <TooltipProvider delayDuration={delay}>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton label="Ajuda">?</IconButton>
          </TooltipTrigger>
          <TooltipContent>Explica o campo ao lado</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  it("abre no foco do teclado, com role=tooltip, e descreve o gatilho", async () => {
    const user = userEvent.setup();
    render(<Dica />);
    await user.tab();
    const gatilho = screen.getByRole("button", { name: "Ajuda" });
    expect(gatilho).toHaveFocus();
    const dica = await screen.findByRole("tooltip");
    expect(dica).toHaveTextContent("Explica o campo ao lado");
    expect(gatilho).toHaveAccessibleDescription("Explica o campo ao lado");
  });

  it("Esc fecha a dica sem tirar o foco do gatilho (WCAG 1.4.13)", async () => {
    const user = userEvent.setup();
    render(<Dica />);
    await user.tab();
    await screen.findByRole("tooltip");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Ajuda" })).toHaveFocus();
  });

  // O fechamento ao sair do ponteiro depende da área de tolerância do Radix
  // (geometria), que o jsdom não calcula; aqui só a abertura no hover.
  it("abre no hover", async () => {
    const user = userEvent.setup();
    render(<Dica />);
    await user.hover(screen.getByRole("button", { name: "Ajuda" }));
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
  });

  it("sem TooltipProvider o Tooltip lança erro (o SemecProvider não inclui o provider)", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <Tooltip>
          <TooltipTrigger>Ajuda</TooltipTrigger>
          <TooltipContent>Texto</TooltipContent>
        </Tooltip>
      )
    ).toThrow(/TooltipProvider/);
  });

  it("o nome do gatilho continua sendo o rótulo, não o texto da dica", async () => {
    const user = userEvent.setup();
    render(<Dica />);
    await user.tab();
    await screen.findByRole("tooltip");
    expect(screen.getByRole("button", { name: "Ajuda" })).toBeInTheDocument();
  });

  it("aberto: zero serious/critical", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <Dica />
      </main>
    );
    await user.tab();
    await screen.findByRole("tooltip");
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Popover", () => {
  function Filtros(props: { open?: boolean; onOpenChange?: (o: boolean) => void }) {
    return (
      <>
        <Popover {...props}>
          <PopoverTrigger asChild>
            <Button variant="outline">Filtros</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Filtros">
            <label>
              Ano <input />
            </label>
          </PopoverContent>
        </Popover>
        <button type="button">Fora</button>
      </>
    );
  }

  it("gatilho com aria-haspopup=dialog e aria-expanded; abre role=dialog nomeado e move o foco", async () => {
    const user = userEvent.setup();
    render(<Filtros />);
    const gatilho = screen.getByRole("button", { name: "Filtros" });
    expect(gatilho).toHaveAttribute("aria-haspopup", "dialog");
    expect(gatilho).toHaveAttribute("aria-expanded", "false");
    await user.click(gatilho);
    const dialogo = await screen.findByRole("dialog", { name: "Filtros" });
    expect(gatilho).toHaveAttribute("aria-expanded", "true");
    expect(gatilho).toHaveAttribute("aria-controls", dialogo.id);
    await waitFor(() => expect(within(dialogo).getByRole("textbox", { name: "Ano" })).toHaveFocus());
  });

  it("Esc fecha e devolve o foco ao gatilho", async () => {
    const user = userEvent.setup();
    render(<Filtros />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveFocus();
  });

  it("clique fora fecha", async () => {
    const user = userEvent.setup();
    render(<Filtros />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Fora" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("controlado: open + onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Filtros open={false} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<Filtros open onOpenChange={onOpenChange} />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("aberto: zero serious/critical", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <Filtros />
      </main>
    );
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await screen.findByRole("dialog");
    expect(await severeViolations()).toEqual([]);
  });
});

type Painel = "sheet" | "drawer";

const pecas = {
  sheet: {
    Root: Sheet,
    Trigger: SheetTrigger,
    Content: SheetContent,
    Header: SheetHeader,
    Title: SheetTitle,
    Description: SheetDescription,
    Footer: SheetFooter,
    Close: SheetClose,
  },
  drawer: {
    Root: Drawer,
    Trigger: DrawerTrigger,
    Content: DrawerContent,
    Header: DrawerHeader,
    Title: DrawerTitle,
    Description: DrawerDescription,
    Footer: DrawerFooter,
    Close: DrawerClose,
  },
} as const;

function PainelDoc({
  tipo,
  closeLabel,
  side,
}: {
  tipo: Painel;
  closeLabel?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const P = pecas[tipo];
  return (
    <P.Root>
      <P.Trigger asChild>
        <Button variant="outline">Abrir filtros</Button>
      </P.Trigger>
      <P.Content side={side} closeLabel={closeLabel}>
        <P.Header>
          <P.Title>Filtros</P.Title>
          <P.Description>Refine sua busca.</P.Description>
        </P.Header>
        <label>
          Bairro <input />
        </label>
        <P.Footer>
          <P.Close asChild>
            <Button>Aplicar</Button>
          </P.Close>
        </P.Footer>
      </P.Content>
    </P.Root>
  );
}

describe.each(["sheet", "drawer"] as const)("%s (Sheet/Drawer)", (tipo) => {
  it("abre um role=dialog modal nomeado pelo título e descrito pela descrição", async () => {
    const user = userEvent.setup();
    render(<PainelDoc tipo={tipo} />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    const dialogo = await screen.findByRole("dialog", { name: "Filtros" });
    expect(dialogo).toHaveAccessibleDescription("Refine sua busca.");
    expect(dialogo.contains(document.activeElement)).toBe(true);
  });

  it("X de 44px chamado \"Fechar\" por padrão; closeLabel sobrescreve", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PainelDoc tipo={tipo} />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    const x = await screen.findByRole("button", { name: "Fechar" });
    expect(x).toHaveClass("size-11");
    unmount();
    render(<PainelDoc tipo={tipo} closeLabel="Fechar filtros" />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    expect(await screen.findByRole("button", { name: "Fechar filtros" })).toBeInTheDocument();
  });

  it("Tab fica preso no painel", async () => {
    const user = userEvent.setup();
    render(<PainelDoc tipo={tipo} />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    const dialogo = await screen.findByRole("dialog");
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialogo.contains(document.activeElement)).toBe(true);
    }
  });

  it("Esc, o X e o Close (Aplicar) fecham e devolvem o foco ao gatilho", async () => {
    const user = userEvent.setup();
    render(<PainelDoc tipo={tipo} />);
    const gatilho = screen.getByRole("button", { name: "Abrir filtros" });
    for (const fechar of [
      () => user.keyboard("{Escape}"),
      () => user.click(screen.getByRole("button", { name: "Fechar" })),
      () => user.click(screen.getByRole("button", { name: "Aplicar" })),
    ]) {
      await user.click(gatilho);
      await screen.findByRole("dialog");
      await fechar();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(gatilho).toHaveFocus();
    }
  });

  it("side aplica a variante de posição e rola por dentro (overflow-y-auto)", async () => {
    const user = userEvent.setup();
    render(<PainelDoc tipo={tipo} side="left" />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveClass("left-0", "overflow-y-auto");
  });

  it("aberto: zero serious/critical", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <PainelDoc tipo={tipo} />
      </main>
    );
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    await screen.findByRole("dialog");
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Sheet/Drawer: lados padrão", () => {
  it("Sheet abre à direita e Drawer embaixo", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PainelDoc tipo="sheet" />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    expect(await screen.findByRole("dialog")).toHaveClass("right-0");
    unmount();
    render(<PainelDoc tipo="drawer" />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros" }));
    expect(await screen.findByRole("dialog")).toHaveClass("bottom-0");
  });
});

describe("Sheet controlado sem gatilho (receita do manifest)", () => {
  /** Cópia fiel do exemplo `FiltrosControlados` do manifest (sheet.md). */
  function FiltrosControlados() {
    const [aberto, setAberto] = React.useState(false);
    const origemRef = React.useRef<HTMLButtonElement>(null);
    return (
      <>
        <Button ref={origemRef} onClick={() => setAberto(true)}>
          Filtros
        </Button>
        <Sheet open={aberto} onOpenChange={setAberto}>
          <SheetContent
            closeLabel="Fechar filtros"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              origemRef.current?.focus();
            }}
          >
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  it("onCloseAutoFocus devolve o foco à origem", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<FiltrosControlados />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await screen.findByRole("dialog", { name: "Filtros" });
    await user.click(screen.getByRole("button", { name: "Fechar filtros" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveFocus();
  });

  it("sem SheetDescription, o diálogo não aponta aria-describedby para um id inexistente", async () => {
    const user = userEvent.setup();
    render(<FiltrosControlados />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialogo = await screen.findByRole("dialog");
    const ids = (dialogo.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    for (const id of ids) expect(document.getElementById(id)).not.toBeNull();
  });
});
