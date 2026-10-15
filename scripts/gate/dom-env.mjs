/**
 * Polyfills de DOM para a suíte Vitest do `@semec/ds` (packages/react/test),
 * que roda em jsdom.
 *
 * O jsdom não implementa APIs de layout e de ponteiro que os primitivos Radix
 * chamam ao abrir camadas (Popper, Select, Menu). Os polyfills abaixo são
 * no-ops: não simulam layout, só evitam exceções. Por isso `color-contrast`
 * fica desligado no axe em jsdom (não há CSS calculado).
 */

/** Instala polyfills mínimos numa `window` do jsdom. Idempotente. */
export function installDomPolyfills(win) {
  if (!win.ResizeObserver) {
    win.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  const proto = win.Element.prototype;
  if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
  if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
  if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
  if (!proto.scrollIntoView) proto.scrollIntoView = () => {};

  if (!win.matchMedia) {
    win.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    });
  }

  if (!win.document.documentElement.lang) win.document.documentElement.lang = "pt-BR";
  if (!win.document.title) win.document.title = "Teste @semec/ds";
}
