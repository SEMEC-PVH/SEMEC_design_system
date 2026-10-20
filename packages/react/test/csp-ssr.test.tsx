import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Progress, Slider } from "../src/index";

describe("preenchimento sem atributos style (INT-B2-02)", () => {
  it("Progress já envia a proporção correta no SSR", () => {
    const html = renderToString(<Progress value={3} max={4} aria-label="Etapas" />);
    expect(html).toContain('width="75%"');
    expect(html).not.toContain('style=');
    expect(html).toContain('aria-valuenow="3"');
  });

  it("Slider envia o intervalo relativo a min/max no SSR", () => {
    const html = renderToString(<Slider min={10} max={50} defaultValue={[20, 40]} aria-label="Faixa" />);
    expect(html).toContain('x="25%"');
    expect(html).toContain('width="50%"');
  });

  it("Slider controlado acompanha as props e avisa alterações por teclado", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container, rerender } = render(<Slider value={[20]} onValueChange={onValueChange} aria-label="Volume" />);
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith([21]);
    expect(container.querySelector("rect")).toHaveAttribute("width", "20%");
    rerender(<Slider value={[60]} onValueChange={onValueChange} aria-label="Volume" />);
    expect(container.querySelector("rect")).toHaveAttribute("width", "60%");
  });

  it("Slider não controlado mantém preenchimento, valor acessível e valor do formulário juntos", async () => {
    const user = userEvent.setup();
    const { container } = render(<form><Slider defaultValue={[20]} name="volume" aria-label="Volume" /></form>);
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(container.querySelector("rect")).toHaveAttribute("width", "21%");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "21");
    expect(new FormData(container.querySelector("form")!).get("volume")).toBe("21");
  });

  it("Slider vertical preserva a proporção do intervalo e a inversão", () => {
    const { container } = render(<Slider orientation="vertical" inverted defaultValue={[20, 70]} aria-label="Faixa" />);
    expect(container.querySelector("svg")).toHaveAttribute("data-inverted", "true");
    expect(container.querySelector("rect")).toHaveAttribute("y", "30%");
    expect(container.querySelector("rect")).toHaveAttribute("height", "50%");
  });
});
