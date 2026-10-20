import { SemecElement, clearPopupPlacement, emit, ensureId, fold, isDisabled, placePopup, setDefaultAttr, toggleAttr } from "./internal";

export interface SemecMenuSelectDetail {
  /** O item escolhido (`<button>` ou `<a>`). */
  item: HTMLElement;
  /** `data-value` do item ou, sem ele, o texto. */
  value: string;
}

const ITEM = ".semec-menu__item";
const GROUP = "[role=group], .semec-menu__group";

/**
 * `<semec-menu>`: padrão APG "Menu Button", como o DropdownMenu do Radix no kit
 * React. O gatilho é o `<button>` com `[data-semec-menu-trigger]` (ou o
 * primeiro botão filho) e o popup é o `.semec-menu`, com itens `<button>` ou
 * `<a>` de classe `.semec-menu__item`.
 *
 * Enter/Espaço/↓ abrem no primeiro item, ↑ abre no último; ↑/↓ com volta ao
 * início, Home/End, busca pela primeira letra; Esc fecha e devolve o foco ao
 * gatilho; Tab fecha e segue. Evento `semec-select` (cancelável: com
 * `preventDefault()` o menu fica aberto). Sem JavaScript, os itens aparecem
 * como uma lista comum de links e botões.
 *
 * Um `.semec-menu__label` seguido de itens vira um `role="group"` rotulado por
 * ele (os itens são envolvidos num `<div class="semec-menu__group">` quando o
 * autor não escreveu o grupo). Itens acrescentados depois recebem o papel.
 */
export class SemecMenu extends SemecElement {
  #typeahead = "";
  #typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  #observer: MutationObserver | null = null;

  get trigger(): HTMLElement | null {
    return (
      this.querySelector<HTMLElement>("[data-semec-menu-trigger]") ??
      Array.from(this.querySelectorAll<HTMLElement>(":scope > button")).find((b) => !b.closest(".semec-menu")) ??
      null
    );
  }

  get popup(): HTMLElement | null {
    return this.querySelector<HTMLElement>(".semec-menu");
  }

  get isOpen(): boolean {
    return this.popup ? !this.popup.hidden : false;
  }

  #items(): HTMLElement[] {
    const popup = this.popup;
    return popup ? Array.from(popup.querySelectorAll<HTMLElement>(ITEM)) : [];
  }

  #enabledItems(): HTMLElement[] {
    return this.#items().filter((i) => !isDisabled(i));
  }

  protected setup(): void {
    const trigger = this.trigger;
    const popup = this.popup;
    if (!trigger || !popup) return;
    const signal = this.signal;

    const popupId = ensureId(popup, "menu");
    const triggerId = ensureId(trigger, "menu-trigger");
    if (trigger.tagName === "BUTTON" && !trigger.hasAttribute("type")) (trigger as HTMLButtonElement).type = "button";
    trigger.setAttribute("aria-haspopup", "menu");
    popup.setAttribute("role", "menu");
    popup.setAttribute("aria-orientation", "vertical");
    popup.setAttribute("tabindex", "-1");
    if (!popup.hasAttribute("aria-label")) popup.setAttribute("aria-labelledby", triggerId);
    this.#setupItems(popup);
    this.#setOpen(false, popupId);

    trigger.addEventListener(
      "keydown",
      (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
          event.preventDefault();
          this.open("first");
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          this.open("last");
        }
      },
      { signal }
    );
    trigger.addEventListener(
      "click",
      (event) => {
        // O teclado é tratado no keydown. Um clique sintético do Espaço (detail 0) logo
        // depois da abertura pelo teclado não pode fechar o menu.
        if (event.detail === 0 && this.isOpen && popup.contains(document.activeElement)) return;
        // Clique do ponteiro ou de tecnologia assistiva: abre e foca o popup, como o Radix.
        if (this.isOpen) this.close(false);
        else this.open("menu");
      },
      { signal }
    );

    popup.addEventListener("keydown", (event) => this.#onKeyDown(event), { signal });
    popup.addEventListener(
      "click",
      (event) => {
        const item = (event.target as Element | null)?.closest?.<HTMLElement>(ITEM);
        if (!item || !popup.contains(item)) return;
        if (isDisabled(item)) {
          event.preventDefault();
          return;
        }
        const value = item.dataset.value ?? item.textContent?.trim() ?? "";
        const proceed = emit<SemecMenuSelectDetail>(this, "semec-select", { item, value }, true);
        if (proceed) this.close(true);
      },
      { signal }
    );
    popup.addEventListener(
      "pointermove",
      (event) => {
        const item = (event.target as Element | null)?.closest?.<HTMLElement>(ITEM);
        if (item && !isDisabled(item) && document.activeElement !== item) item.focus();
      },
      { signal }
    );
    popup.addEventListener(
      "pointerleave",
      () => {
        if (this.isOpen && popup.contains(document.activeElement)) popup.focus();
      },
      { signal }
    );
    popup.addEventListener("focusin", (event) => this.#highlight(event.target as Element), { signal });
    // Itens acrescentados depois (HTMX, script): papel e tabindex antes de entrar na navegação.
    this.#observer = new MutationObserver(() => this.#setupItems(popup));
    this.#observer.observe(popup, { childList: true, subtree: true });

    // Fecha ao clicar fora ou quando o foco sai do componente.
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (!this.isOpen || this.contains(event.target as Node)) return;
        const focusInside = popup.contains(document.activeElement);
        this.close(false);
        if (focusInside) trigger.focus();
      },
      { signal, capture: true }
    );
    this.addEventListener(
      "focusout",
      (event) => {
        const next = event.relatedTarget as Node | null;
        if (this.isOpen && next && !this.contains(next)) this.close(false);
      },
      { signal }
    );
  }

  protected teardown(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    clearTimeout(this.#typeaheadTimer);
    if (this.popup && this.isOpen) this.#setOpen(false);
  }

  /** Abre o menu. `focus`: "first" (padrão), "last" ou "menu" (o popup, sem item ativo). */
  open(focus: "first" | "last" | "menu" = "first"): void {
    const popup = this.popup;
    const trigger = this.trigger;
    if (!popup || !trigger || isDisabled(trigger)) return;
    this.#setupItems(popup);
    this.#setOpen(true);
    placePopup(trigger, popup);
    const items = this.#enabledItems();
    const target = focus === "first" ? items[0] : focus === "last" ? items[items.length - 1] : undefined;
    (target ?? popup).focus();
  }

  /** Fecha o menu. `restoreFocus` devolve o foco ao gatilho (padrão). */
  close(restoreFocus = true): void {
    if (!this.isOpen) return;
    this.#setOpen(false);
    if (restoreFocus) this.trigger?.focus();
  }

  #setOpen(open: boolean, popupId = this.popup?.id): void {
    const popup = this.popup;
    const trigger = this.trigger;
    if (!popup || !trigger) return;
    popup.hidden = !open;
    popup.setAttribute("data-state", open ? "open" : "closed");
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("data-state", open ? "open" : "closed");
    // Como o Radix: aria-controls só aponta para o popup aberto.
    if (open && popupId) trigger.setAttribute("aria-controls", popupId);
    else trigger.removeAttribute("aria-controls");
    if (!open) {
      clearPopupPlacement(popup);
      this.#highlight(null);
    }
  }

  /** Papéis dos itens, separadores e grupos. Idempotente: roda de novo para partes novas. */
  #setupItems(popup: HTMLElement): void {
    this.#groupSections(popup);
    for (const item of Array.from(popup.querySelectorAll<HTMLElement>(ITEM))) {
      item.setAttribute("role", "menuitem");
      item.setAttribute("tabindex", "-1");
      toggleAttr(item, "data-disabled", isDisabled(item));
      if (item.tagName === "BUTTON" && !item.hasAttribute("type")) (item as HTMLButtonElement).type = "button";
    }
    for (const sep of Array.from(popup.querySelectorAll(".semec-menu__separator"))) {
      sep.setAttribute("role", "separator");
    }
    // As mudanças acima são nossas: não precisam voltar ao observador.
    this.#observer?.takeRecords();
  }

  /**
   * Rótulo de seção (DropdownMenuLabel): dentro de `role="menu"`, só
   * `menuitem`, `group` e `separator` são filhos válidos, e o texto solto não é
   * lido em modo menu. O rótulo passa a dar nome a um `role="group"` com os
   * itens da seção (até o próximo separador ou rótulo) e sai da árvore de
   * acessibilidade, para não ser lido duas vezes.
   */
  #groupSections(popup: HTMLElement): void {
    for (const label of Array.from(popup.querySelectorAll<HTMLElement>(".semec-menu__label"))) {
      let group: Element | null = label.parentElement?.closest(GROUP) ?? null;
      if (!group || !popup.contains(group)) {
        group = label.nextElementSibling?.matches(GROUP) ? label.nextElementSibling : null;
      }
      if (!group) {
        const members: Element[] = [];
        for (let next = label.nextElementSibling; next?.matches(ITEM); next = next.nextElementSibling) members.push(next);
        if (!members.length) {
          label.setAttribute("role", "presentation");
          continue;
        }
        group = document.createElement("div");
        group.className = "semec-menu__group";
        label.after(group);
        group.append(...members);
      }
      group.setAttribute("role", "group");
      setDefaultAttr(group, "aria-labelledby", ensureId(label, "menu-label"));
      label.removeAttribute("role");
      label.setAttribute("aria-hidden", "true");
    }
  }

  #highlight(target: Element | null): void {
    for (const item of this.#items()) toggleAttr(item, "data-highlighted", item === target);
  }

  #onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const items = this.#enabledItems();
    const active = document.activeElement as HTMLElement | null;
    const index = active ? items.indexOf(active) : -1;
    const focusAt = (i: number) => items[i]?.focus();
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (items.length) focusAt(index < 0 ? 0 : (index + 1) % items.length);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (items.length) focusAt(index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length);
        return;
      case "Home":
        event.preventDefault();
        focusAt(0);
        return;
      case "End":
        event.preventDefault();
        focusAt(items.length - 1);
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation(); // não fecha um <dialog> em volta
        this.close(true);
        return;
      case "Tab":
        // Fecha e deixa o Tab seguir a partir do gatilho.
        this.trigger?.focus();
        this.close(false);
        return;
      case " ":
        // Espaço ativa também links (o <a> nativo só reage ao Enter).
        if (index >= 0) {
          event.preventDefault();
          items[index]?.click();
        }
        return;
      default:
        break;
    }
    if (event.key.length === 1 && event.key !== " ") this.#onTypeahead(event.key, items, index);
  }

  #onTypeahead(char: string, items: HTMLElement[], index: number): void {
    clearTimeout(this.#typeaheadTimer);
    this.#typeaheadTimer = setTimeout(() => (this.#typeahead = ""), 1000);
    this.#typeahead += fold(char);
    const search = this.#typeahead;
    // Mesma letra repetida: percorre os itens que começam com ela.
    const repeated = search.length > 1 && search.split("").every((c) => c === search[0]);
    const needle = repeated ? search[0] ?? "" : search;
    const ordered = [...items.slice(index + 1), ...items.slice(0, index + 1)];
    const startAtCurrent = !repeated && search.length > 1 && index >= 0;
    const pool = startAtCurrent ? [...items.slice(index), ...items.slice(0, index)] : ordered;
    const match = pool.find((item) => fold(item.textContent ?? "").startsWith(needle));
    match?.focus();
  }
}
