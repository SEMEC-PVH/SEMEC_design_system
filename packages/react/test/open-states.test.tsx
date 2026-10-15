import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import * as ds from "../src/index";
// @ts-expect-error módulo JS do gate, sem tipos
import { openStateCases, runOpenStateCase } from "../../../scripts/gate/open-states.fixtures.mjs";

interface OpenStateCase {
  code: string;
  disableRules?: string[];
}

/**
 * Mesmos casos do gate (check-open-states.mjs), rodando contra src/.
 * Cada camada é aberta pelo caminho do usuário e auditada com o axe aberta.
 * Única exceção: EXC-01 em Select, DropdownMenu e NavigationMenu (aria-hidden-focus).
 */
describe("a11y nos estados abertos (issue #34)", () => {
  const cases = openStateCases(ds) as OpenStateCase[];

  it("cobre as 10 camadas pedidas e só aplica a EXC-01 em Select, DropdownMenu e NavigationMenu", () => {
    expect(cases.map((c) => c.code).sort()).toEqual(
      [
        "alert-dialog",
        "combobox",
        "dialog",
        "drawer",
        "dropdown-menu",
        "navigation-menu",
        "popover",
        "select",
        "sheet",
        "tooltip",
      ].sort()
    );
    const withException = cases.filter((c) => (c.disableRules ?? []).length > 0).map((c) => c.code);
    expect(withException.sort()).toEqual(["dropdown-menu", "navigation-menu", "select"]);
  });

  it.each(cases.map((c) => [c.code, c] as const))("%s aberto: zero serious/critical", async (_code, testCase) => {
    const { opened, violations } = await runOpenStateCase(testCase, {
      render,
      screen,
      userEvent,
      axe,
      waitFor,
    });
    expect(opened, "a camada não abriu").toBe(true);
    expect(violations).toEqual([]);
  });

  // Nota: em jsdom o Select/DropdownMenu abertos NÃO disparam aria-hidden-focus
  // (a medição da EXC-01 foi em Chrome). A exceção continua declarada aqui para
  // o caso de o jsdom/axe passarem a reproduzi-la; nenhum outro caso a usa.
});
