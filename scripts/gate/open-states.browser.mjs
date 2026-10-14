/**
 * Entrada empacotada (esbuild) e carregada no Chromium pelo gate de estados
 * abertos (check-open-states.mjs). Expõe `window.__semecOpenStates()`.
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import * as ds from "../../packages/react/dist/react/index.js";
import { openStateCases, runOpenStateCase } from "./open-states.fixtures.mjs";

window.__semecOpenStates = async () => {
  const results = [];
  for (const testCase of openStateCases(ds)) {
    try {
      const { opened, violations } = await runOpenStateCase(testCase, {
        render,
        screen,
        userEvent,
        axe,
        waitFor,
      });
      results.push({ code: testCase.code, opened, violations, disabledRules: testCase.disableRules ?? [] });
    } catch (err) {
      results.push({ code: testCase.code, opened: false, violations: [], disabledRules: [], error: String(err?.message ?? err) });
    } finally {
      cleanup();
      document.body.removeAttribute("style");
    }
  }
  return results;
};
