import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @ts-expect-error módulo JS do gate, sem tipos
import { installDomPolyfills } from "../../../scripts/gate/dom-env.mjs";

installDomPolyfills(window);

afterEach(() => {
  cleanup();
  // Radix pode deixar `pointer-events: none` no body se um teste falhar com a camada aberta.
  document.body.removeAttribute("style");
});
