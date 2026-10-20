import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { version } from "react";

// @ts-expect-error módulo JS do gate, sem tipos
import { installDomPolyfills } from "../../../scripts/gate/dom-env.mjs";

installDomPolyfills(window);

if (process.env.SEMEC_REACT18_ROOT && version !== "18.3.1") {
  throw new Error(`Esperado React 18.3.1 no job de compatibilidade, recebido ${version}.`);
}

afterEach(() => {
  cleanup();
  // Radix pode deixar `pointer-events: none` no body se um teste falhar com a camada aberta.
  document.body.removeAttribute("style");
});
