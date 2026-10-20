/**
 * Utilitários compartilhados pelos elementos. Nada aqui é API pública.
 */

let counter = 0;

/** Garante um `id` no elemento (mantém o do autor) e o devolve. */
export function ensureId(el: Element, prefix: string): string {
  if (!el.id) {
    counter += 1;
    el.id = `semec-${prefix}-${counter}`;
  }
  return el.id;
}

/** Põe ou tira um atributo booleano (presença), como `data-highlighted` do Radix. */
export function toggleAttr(el: Element, name: string, on: boolean): void {
  if (on) {
    if (!el.hasAttribute(name)) el.setAttribute(name, "");
  } else if (el.hasAttribute(name)) {
    el.removeAttribute(name);
  }
}

/** Define o atributo só quando o autor não definiu. */
export function setDefaultAttr(el: Element, name: string, value: string): void {
  if (!el.hasAttribute(name)) el.setAttribute(name, value);
}

/** Desabilitado pelo atributo nativo ou por `aria-disabled="true"`. */
export function isDisabled(el: Element): boolean {
  return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
}

const TABBABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "summary",
  "[contenteditable]:not([contenteditable=false])",
  "[tabindex]",
].join(",");

/** Elementos alcançáveis por Tab dentro de `root`, na ordem do documento. */
export function tabbables(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => {
    if (el.tabIndex < 0) return false;
    if (el.closest("[hidden], [inert]")) return false;
    // Elementos sem caixa (display: none no CSS do app) não recebem foco.
    return el.getClientRects().length > 0;
  });
}

/** Evento próprio, que borbulha. */
export function emit<T>(target: EventTarget, type: string, detail: T, cancelable = false): boolean {
  return target.dispatchEvent(new CustomEvent<T>(type, { detail, bubbles: true, cancelable }));
}

/** Texto para comparação: minúsculo e sem acento ("São" casa com "sao"). */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Direção do texto efetiva do elemento. */
export function isRtl(el: Element): boolean {
  return getComputedStyle(el).direction === "rtl";
}

/**
 * Posição do popup (menu e listbox). O CSS (F1) põe o popup abaixo do gatilho,
 * alinhado ao início do wrapper; aqui só marcamos as exceções, com os mesmos
 * atributos do Radix, medindo com o popup já visível:
 * - `data-side="top"` quando ele não cabe embaixo e cabe em cima;
 * - `data-align="end"` quando ele passa da borda direita da janela e, alinhado
 *   ao fim do wrapper, passa menos da borda esquerda (o CSS ancora em `right: 0`).
 */
export function placePopup(anchor: Element, popup: HTMLElement): void {
  popup.removeAttribute("data-side");
  popup.removeAttribute("data-align");
  const a = anchor.getBoundingClientRect();
  const p = popup.getBoundingClientRect();
  const below = window.innerHeight - a.bottom;
  const above = a.top;
  if (p.height > below && above > below && p.height <= above) popup.setAttribute("data-side", "top");

  const viewport = document.documentElement.clientWidth;
  const overflowStart = p.right - viewport;
  if (overflowStart > 0.5) {
    const wrapper = (popup.offsetParent ?? anchor).getBoundingClientRect();
    const overflowEnd = Math.max(0, p.width - wrapper.right);
    if (overflowEnd < overflowStart) popup.setAttribute("data-align", "end");
  }
}

/** Tira as marcas de posição do popup fechado. */
export function clearPopupPlacement(popup: HTMLElement | null): void {
  popup?.removeAttribute("data-side");
  popup?.removeAttribute("data-align");
}

/** Elemento alvo de um fragmento (`#id`), ou `null`. */
function fragmentTarget(hash: string): Element | null {
  if (!hash || hash === "#") return null;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // fragmento malformado: usa como está
  }
  return document.getElementById(id);
}

/**
 * Chama `reveal(alvo)` quando a página vai para um fragmento desta página: no
 * clique de um link `#id` (fase de captura, antes da navegação e de qualquer
 * script do link, como o resumo de erros que foca o campo) e no `hashchange`
 * (voltar/avançar, `location.hash`). `reveal` mostra o painel que contém o alvo
 * e devolve `true` se mudou algo; no `hashchange`, o alvo é rolado até a vista
 * (a navegação já aconteceu com ele escondido).
 */
export function onFragmentNavigation(signal: AbortSignal, reveal: (target: Element) => boolean): void {
  document.addEventListener(
    "click",
    (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
      if (!link || !link.hash) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const target = fragmentTarget(url.hash);
      if (target) reveal(target);
    },
    { signal, capture: true }
  );
  window.addEventListener(
    "hashchange",
    () => {
      const target = fragmentTarget(location.hash);
      if (target && reveal(target)) target.scrollIntoView?.({ block: "start" });
    },
    { signal }
  );
}

/**
 * Valor único para uma parte nova (aba ou item): `base`, ou `base-2`, `base-3`…
 * quando já existe. Evita que uma parte acrescentada depois herde o valor de
 * posição de outra.
 */
export function uniqueValue(base: string, taken: Set<string>): string {
  let value = base;
  for (let n = 2; taken.has(value); n += 1) value = `${base}-${n}`;
  taken.add(value);
  return value;
}

/** `true` se algum nó acrescentado ou removido é (ou contém) uma parte do seletor. */
export function touchesParts(records: MutationRecord[], selector: string): boolean {
  const hit = (node: Node) => node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null);
  return records.some((r) => Array.from(r.addedNodes).some(hit) || Array.from(r.removedNodes).some(hit));
}

/**
 * Trava de rolagem do documento para o diálogo modal, com contagem (diálogos
 * aninhados). Sem `style` inline: uma folha construída (`adoptedStyleSheets`)
 * com uma regra por atributo, que não depende do CSS do app nem esbarra em
 * Content-Security-Policy sem `unsafe-inline`.
 */
let lockCount = 0;
let lockSheet: CSSStyleSheet | null = null;
const LOCK_ATTR = "data-semec-scroll-lock";

function ensureLockSheet(): void {
  if (lockSheet || typeof CSSStyleSheet === "undefined" || !("adoptedStyleSheets" in Document.prototype)) return;
  try {
    lockSheet = new CSSStyleSheet();
    lockSheet.replaceSync(`html[${LOCK_ATTR}] { overflow: hidden; scrollbar-gutter: stable; }`);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, lockSheet];
  } catch {
    lockSheet = null;
  }
}

export function lockScroll(): void {
  ensureLockSheet();
  lockCount += 1;
  document.documentElement.setAttribute(LOCK_ATTR, "");
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.documentElement.removeAttribute(LOCK_ATTR);
}

/**
 * Base dos elementos: monta o comportamento ao conectar, desmonta ao
 * desconectar (todos os ouvintes usam o `signal`) e espera o HTML filho
 * existir quando o elemento é atualizado durante o parsing.
 */
// No servidor (SSR, Node) não há HTMLElement: importar o pacote não pode quebrar.
const Base = (typeof HTMLElement === "undefined" ? class {} : HTMLElement) as typeof HTMLElement;

export abstract class SemecElement extends Base {
  #controller: AbortController | null = null;

  protected get signal(): AbortSignal {
    if (!this.#controller) this.#controller = new AbortController();
    return this.#controller.signal;
  }

  connectedCallback(): void {
    if (this.#controller) return;
    this.#controller = new AbortController();
    const start = () => {
      if (!this.isConnected || this.#controller?.signal.aborted) return;
      this.setup();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true, signal: this.#controller.signal });
    } else {
      start();
    }
  }

  disconnectedCallback(): void {
    this.teardown();
    this.#controller?.abort();
    this.#controller = null;
  }

  /** Monta o comportamento. Pode rodar de novo depois de `teardown()` (reconexão). */
  protected abstract setup(): void;

  /** Desfaz o que não é ouvinte (estado global, timers). */
  protected teardown(): void {}
}
