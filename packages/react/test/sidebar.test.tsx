import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

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
