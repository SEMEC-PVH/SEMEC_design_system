import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "../src/index";

/**
 * Promessa do manifest (sidebar): o item da página atual expõe
 * `aria-current="page"` via `isActive` (TST-37, #56). Antes deste arquivo a
 * suíte só importava a Sidebar; remover o `aria-current` de
 * `SidebarMenuButton`/`SidebarMenuSubButton` deixava tudo verde.
 */
function Navegacao({ ativo, subAtivo }: { ativo?: "painel" | "matriculas"; subAtivo?: "novas" | "rematriculas" }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Módulos</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={ativo === "painel"}>
                  <a href="/painel">Painel</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={ativo === "matriculas"}>Matrículas</SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="/matriculas/novas" isActive={subAtivo === "novas"}>
                      Novas matrículas
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="/matriculas/rematriculas" isActive={subAtivo === "rematriculas"}>
                      Rematrículas
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

describe("Sidebar: página atual (TST-37)", () => {
  it('SidebarMenuButton com isActive expõe aria-current="page" (também com asChild)', () => {
    const { rerender } = render(<Navegacao ativo="painel" />);
    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Matrículas" })).not.toHaveAttribute("aria-current");

    rerender(<Navegacao ativo="matriculas" />);
    expect(screen.getByRole("button", { name: "Matrículas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Painel" })).not.toHaveAttribute("aria-current");
  });

  it('SidebarMenuSubButton com isActive expõe aria-current="page" só no subitem atual', () => {
    render(<Navegacao ativo="matriculas" subAtivo="rematriculas" />);
    expect(screen.getByRole("link", { name: "Rematrículas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Novas matrículas" })).not.toHaveAttribute("aria-current");
  });

  it("sem isActive nenhum item anuncia página atual", () => {
    const { container } = render(<Navegacao />);
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
  });
});

describe("Sidebar: inert no DOM (INT-B1-02, React 18 e 19)", () => {
  it("recolhe e reabre offcanvas, respeita inert explícito e mantém o ref externo", () => {
    const ref = React.createRef<HTMLDivElement>();
    const view = (open: boolean, inert?: boolean) => (
      <React.StrictMode>
        <SidebarProvider open={open}>
          <Sidebar ref={ref} inert={inert}><button>Item</button></Sidebar>
        </SidebarProvider>
      </React.StrictMode>
    );
    const { container, rerender } = render(view(false));
    const panel = container.querySelector("nav")!;
    expect(panel.inert).toBe(true);
    expect(ref.current).toBe(panel.parentElement);
    rerender(view(true));
    expect(panel.inert).toBe(false);
    rerender(view(true, true));
    expect(panel.inert).toBe(true);
    rerender(view(false, false));
    expect(panel.inert).toBe(false);
    rerender(view(false));
    expect(panel.inert).toBe(true);
  });

  it.each(["none", "icon"] as const)("sincroniza inert em %s sem tornar o modo ícone inerte ao recolher", (collapsible) => {
    const ref = vi.fn();
    const view = (inert?: boolean) => (
      <SidebarProvider open={false}>
        <Sidebar collapsible={collapsible} ref={ref} inert={inert}><button>Item</button></Sidebar>
      </SidebarProvider>
    );
    const { container, rerender, unmount } = render(view());
    const panel = container.querySelector("nav")!;
    expect(panel.inert).toBe(false);
    expect(ref).toHaveBeenLastCalledWith(collapsible === "none" ? panel : panel.parentElement);
    rerender(view(true));
    expect(panel.inert).toBe(true);
    rerender(view(false));
    expect(panel.inert).toBe(false);
    unmount();
    expect(ref.mock.lastCall?.[0]).toBeNull();
  });

  it("aplica inert na gaveta mobile inclusive ao remontar e preserva o ref", () => {
    const original = window.matchMedia;
    const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...original(query), matches: true,
    }));
    try {
      const ref = React.createRef<HTMLDivElement>();
      const view = (inert: boolean) => (
        <SidebarProvider>
          <SidebarTrigger />
          <Sidebar ref={ref} inert={inert}><button>Item</button></Sidebar>
        </SidebarProvider>
      );
      const { rerender, unmount } = render(view(true));
      fireEvent.click(screen.getByRole("button", { name: "Alternar barra lateral" }));
      expect(ref.current).toBe(screen.getByRole("dialog", { hidden: true }));
      expect(ref.current?.inert).toBe(true);
      rerender(view(false));
      expect(ref.current?.inert).toBe(false);
      fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));
      expect(ref.current).toBeNull();
      rerender(view(true));
      fireEvent.click(screen.getByRole("button", { name: "Alternar barra lateral" }));
      expect(ref.current?.inert).toBe(true);
      unmount();
      expect(ref.current).toBeNull();
    } finally {
      media.mockRestore();
    }
  });
});
