import { describe, expect, it } from "vitest";

import { cn } from "../src/index";

/** tailwind-merge 3 entende a sintaxe do Tailwind v4 usada com tokens (AUD-44). */
describe("cn (clsx + tailwind-merge 3)", () => {
  it("resolve conflito com valor de token na sintaxe v4 `(--var)`", () => {
    expect(cn("p-4 p-(--space-2)")).toBe("p-(--space-2)");
    expect(cn("bg-primary", "bg-(--pv-blue-700)")).toBe("bg-(--pv-blue-700)");
    expect(cn("rounded-md", "rounded-(--radius-lg)")).toBe("rounded-(--radius-lg)");
  });

  it("mantém utilitários de grupos diferentes e o último do mesmo grupo", () => {
    expect(cn("text-sm", "text-primary")).toBe("text-sm text-primary");
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("shadow-elevation-1", "shadow-elevation-2")).toBe("shadow-elevation-2");
  });

  it("conhece os utilitários de token do tokens.css (extendTailwindMerge)", () => {
    // font-size × cor: os dois ficam
    expect(cn("text-display", "text-primary")).toBe("text-display text-primary");
    expect(cn("text-display", "text-text-muted")).toBe("text-display text-text-muted");
    // tamanho × tamanho / cor × cor: o último vence
    expect(cn("text-sm", "text-display")).toBe("text-display");
    expect(cn("text-text-muted", "text-text-strong")).toBe("text-text-strong");
    expect(cn("text-text-secondary", "text-text-on-brand")).toBe("text-text-on-brand");
    expect(cn("bg-card", "bg-surface-sunken")).toBe("bg-surface-sunken");
    expect(cn("ring-2 ring-ring", "ring-ring-inverse")).toBe("ring-2 ring-ring-inverse");
    // espaçamento por token deduplica com a escala numérica
    expect(cn("p-4", "p-space-2")).toBe("p-space-2");
    expect(cn("gap-space-6", "gap-2")).toBe("gap-2");
    expect(cn("px-space-3 py-space-1", "px-space-12")).toBe("py-space-1 px-space-12");
    expect(cn("m-space-0", "m-space-16")).toBe("m-space-16");
    // sombras, duração e easing do tema
    expect(cn("shadow-sm", "shadow-elevation-2")).toBe("shadow-elevation-2");
    expect(cn("duration-fast", "duration-slow")).toBe("duration-slow");
    expect(cn("ease-linear", "ease-standard")).toBe("ease-standard");
  });

  it("aceita condicionais do clsx", () => {
    expect(cn("a", false && "b", undefined, ["c", { d: true, e: false }])).toBe("a c d");
  });
});
