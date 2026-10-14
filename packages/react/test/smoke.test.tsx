import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// @ts-expect-error manifest em JS, sem tipos
import { dsComponents } from "../manifest.js";
// Fixtures do gate (importam dist/; o vitest.config redireciona para src/).
// @ts-expect-error módulo JS do gate, sem tipos
import { getComponentElement } from "../../../scripts/gate/check-smoke-a11y.mjs";
// @ts-expect-error módulo JS do gate, sem tipos
import { EXC_01_RULES } from "../../../scripts/gate/open-states.fixtures.mjs";
import { severeViolations } from "./axe";

interface ManifestEntry {
  code: string;
}

/** EXC-01: só Select e DropdownMenu (o fixture do DropdownMenu já vem aberto). */
const EXC_01_CODES = new Set(["select", "dropdown-menu"]);

describe("smoke: cada componente do manifest renderiza no cliente sem violação serious/critical", () => {
  it.each((dsComponents as ManifestEntry[]).map((c) => c.code))("%s", async (code) => {
    const element = getComponentElement(code);
    expect(element, `sem fixture para '${code}' em scripts/gate/check-smoke-a11y.mjs`).not.toBeNull();

    const { container } = render(<main>{element}</main>);
    // Camadas abertas por padrão no fixture (Dialog, Sheet...) vão para um portal no body.
    expect(container.innerHTML.length + document.body.innerHTML.length).toBeGreaterThan(0);

    const violations = await severeViolations(EXC_01_CODES.has(code) ? EXC_01_RULES : []);
    expect(violations).toEqual([]);
  });
});
