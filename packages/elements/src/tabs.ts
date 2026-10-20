import { SemecElement, emit, ensureId, isDisabled, isRtl, toggleAttr } from "./internal";

export interface SemecTabsChangeDetail {
  value: string;
}

interface Tab {
  trigger: HTMLElement;
  panel: HTMLElement | null;
  value: string;
}

/**
 * `<semec-tabs>`: padrão APG "Tabs" com ativação automática, como o Tabs do
 * Radix no kit React.
 *
 * Sem JavaScript, a lista é um sumário de links (`<a href="#painel">`) e todos
 * os painéis ficam visíveis. Com o elemento: `role="tablist"`/`tab`/`tabpanel`,
 * roving tabindex, ←/→ (↑/↓ com `orientation="vertical"`) com volta ao início,
 * Home/End, `aria-controls`/`aria-labelledby`, painel focável e os estados
 * `data-state="active|inactive"`. Atributo `value` e evento `semec-change`.
 */
export class SemecTabs extends SemecElement {
  static observedAttributes = ["value"];

  #syncing = false;
  #ready = false;

  get orientation(): "horizontal" | "vertical" {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  /** Valor da aba ativa (o `data-value` do gatilho ou o `id` do painel). */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  attributeChangedCallback(name: string, old: string | null, next: string | null): void {
    if (name === "value" && old !== next && this.#ready && !this.#syncing) this.#select(next ?? "", false, false);
  }

  #list(): HTMLElement | null {
    return this.querySelector(".semec-tabs__list, [role=tablist]");
  }

  #tabs(): Tab[] {
    const list = this.#list();
    if (!list) return [];
    const triggers = Array.from(list.querySelectorAll<HTMLElement>(".semec-tabs__trigger, [role=tab]")).filter(
      (el) => el.closest("semec-tabs") === this
    );
    const panels = Array.from(this.querySelectorAll<HTMLElement>(".semec-tabs__panel, [role=tabpanel]")).filter(
      (el) => el.closest("semec-tabs") === this
    );
    return triggers.map((trigger, index) => {
      const target = trigger.getAttribute("aria-controls") ?? trigger.getAttribute("href")?.replace(/^#/, "") ?? "";
      const panel = (target && panels.find((p) => p.id === target)) || panels[index] || null;
      const value = trigger.dataset.value ?? panel?.id ?? String(index);
      return { trigger, panel, value };
    });
  }

  protected setup(): void {
    const list = this.#list();
    if (!list) return;
    const signal = this.signal;
    const orientation = this.orientation;
    list.setAttribute("role", "tablist");
    list.setAttribute("aria-orientation", orientation);
    list.setAttribute("data-orientation", orientation);

    // Valor estável de cada aba: data-value, o id do painel escrito pelo autor ou a posição.
    for (const { trigger, value } of this.#tabs()) {
      if (trigger.dataset.value === undefined) trigger.dataset.value = value;
    }
    const tabs = this.#tabs();
    for (const { trigger, panel } of tabs) {
      trigger.setAttribute("role", "tab");
      trigger.setAttribute("data-orientation", orientation);
      const triggerId = ensureId(trigger, "tab");
      toggleAttr(trigger, "data-disabled", isDisabled(trigger));
      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", triggerId);
        panel.setAttribute("tabindex", "0");
        panel.setAttribute("data-orientation", orientation);
        trigger.setAttribute("aria-controls", ensureId(panel, "tabpanel"));
      }
    }

    const enabled = tabs.filter((t) => !isDisabled(t.trigger));
    const fromHash = location.hash ? enabled.find((t) => t.panel && `#${t.panel.id}` === decodeURIComponent(location.hash)) : undefined;
    const initial =
      enabled.find((t) => t.value === this.getAttribute("value")) ??
      enabled.find((t) => t.trigger.getAttribute("aria-selected") === "true") ??
      fromHash ??
      enabled[0];
    this.#ready = true;
    if (initial) this.#select(initial.value, false, false);

    list.addEventListener(
      "click",
      (event) => {
        const tab = this.#tabFrom(event.target);
        if (!tab) return;
        event.preventDefault(); // link: não rola até a âncora
        if (isDisabled(tab.trigger)) return;
        this.#select(tab.value, true, false);
      },
      { signal }
    );
    list.addEventListener("keydown", (event) => this.#onKeyDown(event), { signal });
  }

  #tabFrom(target: EventTarget | null): Tab | undefined {
    const el = (target as Element | null)?.closest?.("[role=tab]");
    return el ? this.#tabs().find((t) => t.trigger === el) : undefined;
  }

  #select(value: string, notify: boolean, focus: boolean): void {
    const tabs = this.#tabs();
    const chosen = tabs.find((t) => t.value === value && !isDisabled(t.trigger));
    if (!chosen) return;
    const changed = this.getAttribute("value") !== value;
    for (const tab of tabs) {
      const active = tab === chosen;
      tab.trigger.setAttribute("aria-selected", String(active));
      tab.trigger.setAttribute("tabindex", active ? "0" : "-1");
      tab.trigger.setAttribute("data-state", active ? "active" : "inactive");
      if (tab.panel) {
        tab.panel.setAttribute("data-state", active ? "active" : "inactive");
        tab.panel.hidden = !active;
      }
    }
    this.#syncing = true;
    this.setAttribute("value", value);
    this.#syncing = false;
    if (focus) chosen.trigger.focus();
    if (notify && changed) emit<SemecTabsChangeDetail>(this, "semec-change", { value });
  }

  #onKeyDown(event: KeyboardEvent): void {
    const current = this.#tabFrom(event.target);
    if (!current || event.altKey || event.ctrlKey || event.metaKey) return;
    const enabled = this.#tabs().filter((t) => !isDisabled(t.trigger));
    const index = enabled.findIndex((t) => t.trigger === current.trigger);
    const vertical = this.orientation === "vertical";
    const rtl = !vertical && isRtl(this);
    let next: number | null = null;
    switch (event.key) {
      case vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight":
        next = (index + 1) % enabled.length;
        break;
      case vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft":
        next = (index - 1 + enabled.length) % enabled.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = enabled.length - 1;
        break;
      case "Enter":
      case " ":
        // Link com role="tab": Espaço não ativa sozinho; a aba já está ativa (ativação automática).
        event.preventDefault();
        if (!isDisabled(current.trigger)) this.#select(current.value, true, false);
        return;
      default:
        return;
    }
    event.preventDefault();
    const target = enabled[next];
    if (target) this.#select(target.value, true, true);
  }
}
