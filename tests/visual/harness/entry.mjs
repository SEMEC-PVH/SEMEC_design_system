/**
 * Entrada da bancada visual (empacotada com esbuild e servida em .harness/).
 * Reaproveita as fixtures do gate:
 *   - getComponentElement (check-smoke-a11y.mjs): estado padrão de cada componente do manifest;
 *   - openStateCases (open-states.fixtures.mjs): camadas abertas pelo caminho do usuário;
 * e acrescenta só os estados que o gate não cobre (visual.fixtures.mjs).
 *
 * Expõe window.__visual.mount(code, state) -> Promise<{ ok, error? }>.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as ds from "../../../packages/react/dist/react/index.js";
import { getComponentElement } from "../../../scripts/gate/check-smoke-a11y.mjs";
import { openStateCases } from "../../../scripts/gate/open-states.fixtures.mjs";
import { extraStates } from "../visual.fixtures.mjs";

const container = document.getElementById("root");

window.__visual = {
  async mount(code, state) {
    try {
      if (state === "default") {
        const el = getComponentElement(code);
        if (!el) throw new Error(`sem fixture padrão para '${code}'`);
        render(el, { container });
      } else if (state === "open") {
        const testCase = openStateCases(ds).find((c) => c.code === code);
        if (!testCase) throw new Error(`sem caso aberto para '${code}'`);
        render(testCase.element, { container });
        // delay: null evita setTimeout entre teclas (o relógio é fixo no teste).
        const user = userEvent.setup({ delay: null });
        await testCase.open({ screen, user });
        await waitFor(() => {
          if (!testCase.findOpen({ screen })) throw new Error("camada não abriu");
        });
      } else {
        const make = extraStates[code]?.[state];
        if (!make) throw new Error(`sem estado '${state}' para '${code}'`);
        render(make(ds), { container });
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err?.message ?? err) };
    }
  },
};
window.__visualReady = true;
