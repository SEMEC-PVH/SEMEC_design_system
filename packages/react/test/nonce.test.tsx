import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SemecProvider } from "../src/index";

describe("nonce dos viewports (INT-B2-08)", () => {
  it.each([undefined, "explicito"])("SelectContent recebe o nonce pelo portal, override=%s", async (nonce) => {
    const user = userEvent.setup();
    render(
      <SemecProvider nonce="herdado">
        <Select>
          <SelectTrigger aria-label="Escola"><SelectValue /></SelectTrigger>
          <SelectContent nonce={nonce}><SelectItem value="a">Escola A</SelectItem></SelectContent>
        </Select>
      </SemecProvider>
    );
    await user.click(screen.getByRole("combobox"));
    const viewport = document.querySelector("[data-radix-select-viewport]");
    expect(viewport?.previousElementSibling).toHaveAttribute("nonce", nonce ?? "herdado");
  });

  it("ScrollArea herda no SSR e respeita os dois overrides explícitos", () => {
    const html = renderToString(
      <SemecProvider nonce="externo">
        <ScrollArea>Herdado</ScrollArea>
        <ScrollArea nonce="explicito">Explícito</ScrollArea>
        <ScrollArea nonce="ignorado" viewportProps={{ nonce: "viewport" }}>Viewport</ScrollArea>
        <SemecProvider nonce="interno"><ScrollArea>Interno</ScrollArea></SemecProvider>
      </SemecProvider>
    );
    const document = new DOMParser().parseFromString(html, "text/html");
    expect([...document.querySelectorAll("style")].map((style) => style.nonce)).toEqual([
      "externo", "explicito", "viewport", "interno",
    ]);
  });

  it("atualiza o nonce herdado sem depender de efeitos", () => {
    const tree = (nonce: string) => <SemecProvider nonce={nonce}><ScrollArea>Texto</ScrollArea></SemecProvider>;
    const { container, rerender } = render(tree("primeiro"));
    rerender(tree("segundo"));
    expect(container.querySelector("style")).toHaveAttribute("nonce", "segundo");
  });
});
