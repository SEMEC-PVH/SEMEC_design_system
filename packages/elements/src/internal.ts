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
 * Posição vertical do popup (menu e listbox): o CSS (F1) põe o popup abaixo do
 * gatilho; aqui só marcamos `data-side="top"` quando ele não cabe embaixo e
 * cabe em cima. Mede com o popup já visível.
 */
export function placePopup(anchor: Element, popup: HTMLElement): void {
  popup.removeAttribute("data-side");
  const a = anchor.getBoundingClientRect();
  const height = popup.getBoundingClientRect().height;
  const below = window.innerHeight - a.bottom;
  const above = a.top;
  if (height > below && above > below && height <= above) popup.setAttribute("data-side", "top");
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
