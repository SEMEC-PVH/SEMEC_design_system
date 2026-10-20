/**
 * @semec/ds-elements: Web Components acessíveis do Design System SEMEC.
 *
 * Light DOM e aprimoramento progressivo: o HTML usa as classes `.semec-*` do
 * `@semec/ds-css` e continua legível sem JavaScript; os elementos só
 * acrescentam comportamento e ARIA (padrões WAI-ARIA APG, com os mesmos
 * atributos de estado do Radix usado no kit React). ADR-029.
 */
import { SemecAccordion } from "./accordion";
import { SemecCombobox } from "./combobox";
import { SemecDialog } from "./dialog";
import { SemecMenu } from "./menu";
import { SemecTabs } from "./tabs";

export { SemecAccordion, SemecCombobox, SemecDialog, SemecMenu, SemecTabs };
export type { SemecAccordionChangeDetail } from "./accordion";
export type { SemecComboboxChangeDetail } from "./combobox";
export type { SemecDialogCloseDetail } from "./dialog";
export type { SemecMenuSelectDetail } from "./menu";
export type { SemecTabsChangeDetail } from "./tabs";

/** Nome da tag → classe. */
export const semecElements = {
  "semec-dialog": SemecDialog,
  "semec-tabs": SemecTabs,
  "semec-combobox": SemecCombobox,
  "semec-menu": SemecMenu,
  "semec-accordion": SemecAccordion,
} as const;

/**
 * Registra os elementos. Pode ser chamada mais de uma vez, e conviver com o
 * bundle do CDN na mesma página: uma tag já registrada é mantida.
 */
export function defineSemecElements(registry?: CustomElementRegistry): void {
  registry ??= typeof customElements === "undefined" ? undefined : customElements;
  if (!registry) return; // servidor: nada a registrar
  for (const [name, element] of Object.entries(semecElements)) {
    if (!registry.get(name)) registry.define(name, element);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "semec-dialog": SemecDialog;
    "semec-tabs": SemecTabs;
    "semec-combobox": SemecCombobox;
    "semec-menu": SemecMenu;
    "semec-accordion": SemecAccordion;
  }
}
