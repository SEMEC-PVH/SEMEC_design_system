import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Heading,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  ScrollArea,
  Slider,
  Tabs,
  TabsList,
  TabsTrigger,
  Toggle,
} from "../src/index";

/**
 * Onda 1 da bateria de 16/10/2026 (TST-03, 05, 08, 09, 16, 21, 22, 26, 29).
 * O jsdom não faz layout: os casos travam a classe que resolve o defeito e,
 * no Toggle, calculam o contraste a partir dos valores do `tokens.css`.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const tokensCss = fs.readFileSync(path.resolve(here, "../tokens.css"), "utf8");
const classes = (el: Element | null) => (el?.getAttribute("class") ?? "").split(/\s+/);

/** Resolve `--nome` seguindo `var(--outro)` até um hex (primeira definição = tema claro). */
function tokenHex(name: string): string {
  const m = new RegExp(`${name.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+);`).exec(tokensCss);
  if (!m) throw new Error(`token ${name} não encontrado`);
  const value = m[1].trim();
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  if (ref) return tokenHex(ref[1]);
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${name} = ${value} não é hex`);
  return value;
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Cor do utilitário `prefixo<cor>` com o modificador dado (ex.: `data-[state=on]:bg-`). */
function utilColor(list: string[], prefix: string) {
  const cls = list.find((c) => c.startsWith(prefix) && !c.slice(prefix.length).includes(":"));
  if (!cls) return undefined;
  return tokenHex(`--color-${cls.slice(prefix.length)}`);
}

describe("TST-03: Toggle ligado distinguível do solto", () => {
  const superficies = { background: tokenHex("--bg"), surface: tokenHex("--surface") };

  it.each(["default", "outline"] as const)(
    "variante %s: contorno primary ≥ 3:1 contra a superfície e texto ≥ 4,5:1 no fundo ligado",
    (variant) => {
      render(
        <Toggle aria-label="Filtrar pendentes" variant={variant} defaultPressed>
          Pendentes
        </Toggle>
      );
      const botao = screen.getByRole("button", { name: "Filtrar pendentes" });
      expect(botao).toHaveAttribute("data-state", "on");
      const list = classes(botao);

      const fundo = utilColor(list, "data-[state=on]:bg-");
      const borda = utilColor(list, "data-[state=on]:border-");
      const texto = utilColor(list, "data-[state=on]:text-");
      expect(fundo, "fundo do estado ligado").toBeDefined();
      expect(borda, "borda do estado ligado").toBeDefined();
      expect(texto, "texto do estado ligado").toBeDefined();

      for (const [nome, sup] of Object.entries(superficies)) {
        expect(contrast(borda!, sup), `borda × ${nome}`).toBeGreaterThanOrEqual(3);
      }
      expect(contrast(borda!, fundo!), "borda × fundo ligado").toBeGreaterThanOrEqual(3);
      expect(contrast(texto!, fundo!), "texto × fundo ligado").toBeGreaterThanOrEqual(4.5);
    }
  );

  it("outline: a borda solta (input) é próxima do primary, então o ligado ganha inset-ring primary", () => {
    render(<Toggle aria-label="Negrito" variant="outline" defaultPressed />);
    const list = classes(screen.getByRole("button", { name: "Negrito" }));
    expect(contrast(tokenHex("--color-input"), tokenHex("--color-primary"))).toBeLessThan(3);
    expect(list).toEqual(
      expect.arrayContaining(["data-[state=on]:inset-ring", "data-[state=on]:inset-ring-primary"])
    );
  });

  it("hover solto perceptível: borda border-strong (≥ 3:1) na variante default", () => {
    render(<Toggle aria-label="Negrito" />);
    const list = classes(screen.getByRole("button", { name: "Negrito" }));
    const hover = utilColor(list, "hover:border-");
    expect(hover).toBeDefined();
    expect(contrast(hover!, tokenHex("--bg"))).toBeGreaterThanOrEqual(3);
    expect(list).not.toContain("hover:bg-muted");
  });
});

describe("TST-05: ScrollArea alcançável pelo teclado", () => {
  it("com conteúdo focável a viewport não vira parada extra de Tab", () => {
    render(
      <ScrollArea className="h-24">
        <a href="#a">Primeiro link</a>
      </ScrollArea>
    );
    const viewport = screen.getByText("Primeiro link").closest("[data-radix-scroll-area-viewport]");
    expect(viewport).not.toHaveAttribute("tabindex");
  });

  it("texto puro: Tab chega à viewport, que tem anel de foco visível", async () => {
    render(
      <ScrollArea className="h-24" viewportProps={{ "aria-label": "Termos de uso" }}>
        <p>Texto longo</p>
      </ScrollArea>
    );
    await userEvent.setup().tab();
    const viewport = screen.getByText("Texto longo").closest("[data-radix-scroll-area-viewport]");
    expect(viewport).toHaveFocus();
    expect(viewport).toHaveAttribute("aria-label", "Termos de uso");
    expect(classes(viewport)).toEqual(
      expect.arrayContaining(["focus-visible:ring-2", "focus-visible:ring-inset", "focus-visible:ring-ring"])
    );
  });

  it("focusable={false} desliga e focusable força mesmo com link dentro", () => {
    const { rerender } = render(
      <ScrollArea focusable={false}>
        <p>Só texto</p>
      </ScrollArea>
    );
    const vp = () => screen.getByText(/texto|link/i).closest("[data-radix-scroll-area-viewport]");
    expect(vp()).not.toHaveAttribute("tabindex");
    rerender(
      <ScrollArea focusable>
        <a href="#b">Um link</a>
      </ScrollArea>
    );
    expect(vp()).toHaveAttribute("tabindex", "0");
  });
});
