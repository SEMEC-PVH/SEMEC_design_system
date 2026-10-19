/**
 * Entrada empacotada (esbuild) e carregada no Chromium pelo gate de a11y com
 * layout real (check-layout-a11y.mjs). Expõe `window.__semecLayoutA11y(codes)`.
 *
 * Renderiza o fixture do smoke (smoke.fixtures.mjs) no navegador, confere que
 * o caso de layout acontece de fato (ex.: a ScrollArea transborda) e roda o axe.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import axe from "axe-core";

import { getComponentElement } from "./smoke.fixtures.mjs";

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

/** O que precisa ser verdade para o caso valer (senão o axe passaria "no vazio"). */
const preconditions = {
  "scroll-area": (root) => {
    const v = root.querySelector("[data-radix-scroll-area-viewport]");
    if (!v) return "viewport da ScrollArea não encontrada";
    if (v.scrollHeight <= v.clientHeight) return `sem overflow (scrollHeight ${v.scrollHeight} ≤ clientHeight ${v.clientHeight})`;
    return null;
  },
};

window.__semecLayoutA11y = async (codes) => {
  const results = [];
  for (const code of codes) {
    const host = document.createElement("main");
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      flushSync(() => root.render(React.createElement(React.StrictMode, null, getComponentElement(code))));
      await frame();
      const precondition = preconditions[code]?.(host) ?? null;
      const res = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
      const violations = res.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(" ")) }));
      results.push({ code, precondition, violations });
    } catch (err) {
      results.push({ code, precondition: null, violations: [], error: String(err?.message ?? err) });
    } finally {
      root.unmount();
      host.remove();
    }
  }
  return results;
};
