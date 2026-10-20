import { SemecElement, emit, ensureId, lockScroll, setDefaultAttr, tabbables, unlockScroll } from "./internal";

export interface SemecDialogCloseDetail {
  /** `returnValue` do `<dialog>` (preenchido por `<form method="dialog">`). */
  returnValue: string;
}

const OPEN_ATTR = "data-semec-dialog-open";
const CLOSE_SELECTOR = "[data-semec-dialog-close], [data-semec-dialog-cancel]";

/**
 * `<semec-dialog>`: envolve um `<dialog class="semec-dialog">` nativo aberto
 * com `showModal()` (fundo inerte, camada superior). Padrão APG "Dialog
 * (Modal)" e o comportamento do Dialog/AlertDialog do Radix no kit React:
 *
 * - abre por `[data-semec-dialog-open="<id>"]` (botão ou link) ou `open()`;
 * - fecha por `[data-semec-dialog-close]`, Esc e clique no fundo (o clique
 *   no fundo não fecha com o atributo `alert`);
 * - foco inicial no primeiro elemento focável (ou `[autofocus]`); com `alert`,
 *   no botão de cancelar; Tab e Shift+Tab circulam dentro; ao fechar, o foco
 *   volta ao gatilho;
 * - `aria-labelledby`/`aria-describedby` a partir de `.semec-dialog__title` e
 *   `.semec-dialog__description`; trava a rolagem da página;
 * - eventos `semec-open` e `semec-close`.
 */
export class SemecDialog extends SemecElement {
  #returnFocus: HTMLElement | null = null;
  #locked = false;
  #pointerDownOnBackdrop = false;

  /** O `<dialog>` nativo filho. */
  get dialog(): HTMLDialogElement | null {
    return this.querySelector(":scope > dialog");
  }

  /** `true` com o atributo `alert` (role="alertdialog", sem fechar no fundo). */
  get alert(): boolean {
    return this.hasAttribute("alert");
  }

  /** O diálogo está aberto. */
  get isOpen(): boolean {
    return Boolean(this.dialog?.open);
  }

  protected setup(): void {
    const dialog = this.dialog;
    if (!dialog) return;
    const signal = this.signal;

    if (this.alert) {
      dialog.setAttribute("role", "alertdialog");
      // Sem aria-modal, leitores de tela e o axe não tratam o role sobrescrito como modal.
      dialog.setAttribute("aria-modal", "true");
    }
    const title = dialog.querySelector(".semec-dialog__title");
    if (title) setDefaultAttr(dialog, "aria-labelledby", ensureId(title, "dialog-title"));
    const description = dialog.querySelector(".semec-dialog__description");
    if (description) setDefaultAttr(dialog, "aria-describedby", ensureId(description, "dialog-description"));
    dialog.setAttribute("data-state", dialog.open ? "open" : "closed");
    this.#syncTriggers();

    // Gatilhos em qualquer lugar da página (delegação no documento).
    document.addEventListener(
      "click",
      (event) => {
        const trigger = this.#triggerFrom(event.target);
        if (!trigger) return;
        event.preventDefault();
        this.open(trigger);
      },
      { signal }
    );
    // Link como gatilho (role="button"): Espaço também ativa, no keyup como num botão
    // nativo; no keydown só impede a rolagem da página.
    for (const type of ["keydown", "keyup"] as const) {
      document.addEventListener(
        type,
        (event) => {
          if (event.key !== " ") return;
          const trigger = this.#triggerFrom(event.target);
          if (!trigger || trigger.tagName !== "A") return;
          event.preventDefault();
          if (type === "keyup") this.open(trigger);
        },
        { signal }
      );
    }

    dialog.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element | null;
        const closer = target?.closest?.(CLOSE_SELECTOR);
        if (closer && dialog.contains(closer)) {
          if (closer.tagName === "A") event.preventDefault();
          this.close();
          return;
        }
        // Clique no fundo: o alvo é o próprio <dialog>, fora da caixa do painel.
        if (target === dialog && this.#pointerDownOnBackdrop && !this.alert && this.#outside(event)) this.close();
        this.#pointerDownOnBackdrop = false;
      },
      { signal }
    );
    dialog.addEventListener(
      "pointerdown",
      (event) => {
        this.#pointerDownOnBackdrop = event.target === dialog && this.#outside(event);
      },
      { signal }
    );
    // Clique no fundo não tira o foco do elemento atual (no alerta, o diálogo continua aberto).
    dialog.addEventListener(
      "mousedown",
      (event) => {
        if (event.target === dialog && this.#outside(event)) event.preventDefault();
      },
      { signal }
    );
    dialog.addEventListener("keydown", (event) => this.#onKeyDown(event), { signal });
    // Esc nativo dispara "cancel": fechamos nós mesmos, para o foco voltar já (o evento
    // "close" é assíncrono). <form method="dialog"> continua chegando pelo "close".
    dialog.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        this.close();
      },
      { signal }
    );
    dialog.addEventListener("close", () => this.#afterClose(), { signal });
  }

  protected teardown(): void {
    const dialog = this.dialog;
    if (dialog?.open) dialog.close();
    this.#afterClose(false);
  }

  /** Abre o diálogo. `trigger` recebe o foco de volta ao fechar (padrão: o foco atual). */
  open(trigger?: HTMLElement | null): void {
    const dialog = this.dialog;
    if (!dialog || dialog.open || !this.isConnected) return;
    const active = document.activeElement;
    this.#returnFocus = trigger ?? (active instanceof HTMLElement && active !== document.body ? active : null);
    dialog.showModal();
    dialog.setAttribute("data-state", "open");
    if (!this.#locked) {
      lockScroll();
      this.#locked = true;
    }
    this.#syncTriggers();
    this.#initialFocus().focus();
    emit(this, "semec-open", {});
  }

  /** Fecha o diálogo e devolve o foco ao gatilho. */
  close(returnValue?: string): void {
    const dialog = this.dialog;
    if (!dialog?.open) return;
    dialog.close(returnValue);
    this.#afterClose();
  }

  #afterClose(restore = true): void {
    const dialog = this.dialog;
    if (!this.#locked) return;
    this.#locked = false;
    unlockScroll();
    dialog?.setAttribute("data-state", "closed");
    this.#syncTriggers();
    const target = this.#returnFocus;
    this.#returnFocus = null;
    if (restore && target?.isConnected) target.focus();
    emit<SemecDialogCloseDetail>(this, "semec-close", { returnValue: dialog?.returnValue ?? "" });
  }

  #triggers(): HTMLElement[] {
    const ids = [this.id, this.dialog?.id].filter(Boolean) as string[];
    if (!ids.length) return [];
    return ids.flatMap((id) => Array.from(document.querySelectorAll<HTMLElement>(`[${OPEN_ATTR}="${CSS.escape(id)}"]`)));
  }

  #triggerFrom(target: EventTarget | null): HTMLElement | null {
    const el = (target as Element | null)?.closest?.<HTMLElement>(`[${OPEN_ATTR}]`);
    if (!el) return null;
    const id = el.getAttribute(OPEN_ATTR);
    if (!id || (id !== this.id && id !== this.dialog?.id)) return null;
    if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return null;
    return el;
  }

  #syncTriggers(): void {
    const dialog = this.dialog;
    if (!dialog) return;
    const controls = ensureId(dialog, "dialog");
    for (const trigger of this.#triggers()) {
      if (trigger.tagName === "A") setDefaultAttr(trigger, "role", "button");
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-controls", controls);
      trigger.setAttribute("aria-expanded", String(dialog.open));
      trigger.setAttribute("data-state", dialog.open ? "open" : "closed");
    }
  }

  #initialFocus(): HTMLElement {
    const dialog = this.dialog as HTMLDialogElement;
    if (this.alert) {
      const cancel =
        dialog.querySelector<HTMLElement>("[data-semec-dialog-cancel]") ??
        Array.from(dialog.querySelectorAll<HTMLElement>("[data-semec-dialog-close]")).find((el) => !el.classList.contains("semec-dialog__close"));
      if (cancel) return cancel;
    }
    const auto = dialog.querySelector<HTMLElement>("[autofocus]");
    if (auto) return auto;
    const first = tabbables(dialog)[0];
    if (first) return first;
    dialog.tabIndex = -1;
    return dialog;
  }

  #onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Tab" || event.defaultPrevented) return;
    // Foco preso como no Radix: Tab no último volta ao primeiro, e vice-versa.
    const list = tabbables(this.dialog as HTMLDialogElement);
    if (!list.length) {
      event.preventDefault();
      return;
    }
    const first = list[0] as HTMLElement;
    const last = list[list.length - 1] as HTMLElement;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === this.dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  #outside(event: MouseEvent): boolean {
    const r = (this.dialog as HTMLDialogElement).getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  }
}
