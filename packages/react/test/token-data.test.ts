import { describe, expect, it } from "vitest";
// @ts-expect-error Script de build ESM sem declaração TypeScript.
import { tokenData } from "../scripts/token-data.mjs";

describe("parser de tokens", () => {
  it("resolve aliases em cadeia, ignora comentários e não inclui @theme", () => {
    const data = tokenData(`/* :root { --ignorado: 1; } */
      :root { --pv-radius-md: 8px; --radius-md: var(--pv-radius-md); --radius-copy: var(--radius-md); }
      @theme { --radius-xl: 12px; }`);
    expect(data.tokens).toEqual({ "pv-radius-md": "8px", "radius-md": "8px", "radius-copy": "8px" });
    expect(data.dtcg.L1["radius-copy"].$value).toBe("{L1.radius-md}");
  });

  it.each([
    [":root { --radius-a: var(--radius-b); --radius-b: var(--radius-a); }", "circular"],
    [":root { --radius-a: var(--missing); }", "ausente"],
    [":root { --radius-a: 1px; --radius-a: 2px; }", "duplicado"],
    [":root { --unknown: nonsense; }", "não suportado"],
    [":root { --radius-a: var(--missing, 8px); }", "não suportada"],
    [":root { --radius-a: 1px; } :root { --radius-b: 2px; }", "único"],
  ])("rejeita entrada inválida: %s", (css, message) => {
    expect(() => tokenData(css)).toThrow(message);
  });
});
