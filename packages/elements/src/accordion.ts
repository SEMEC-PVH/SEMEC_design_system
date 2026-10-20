import { SemecElement, emit, ensureId, isDisabled, toggleAttr } from "./internal";

export interface SemecAccordionChangeDetail {
  /** `type="single"`: o valor aberto ("" = nenhum). `type="multiple"`: lista dos abertos. */
  value: string | string[];
}

interface Item {
  item: HTMLElement;
  header: HTMLElement | null;
  trigger: HTMLButtonElement;
  panel: HTMLElement | null;
  value: string;
}

/**
 * `<semec-accordion>`: padrão APG "Accordion", como o Accordion do Radix no
 * kit React. Cada item tem um `<button>` dentro de um heading, com
 * `aria-expanded`/`aria-controls`, e um painel `role="region"` rotulado pelo
 * botão. `type="single"` (padrão) abre um por vez; `collapsible` deixa fechar o
 * aberto; `type="multiple"` abre vários. ↑/↓ (com volta), Home/End entre os
 * botões. Sem JavaScript, todos os painéis ficam visíveis.
 */
export class SemecAccordion extends SemecElement {
  static observedAttributes = ["value"];

  #open = new Set<string>();
  #authorDisabled = new WeakSet<Element>();
  #syncing = false;
  #ready = false;

  get type(): "single" | "multiple" {
    return this.getAttribute("type") === "multiple" ? "multiple" : "single";
  }

  get collapsible(): boolean {
    return this.hasAttribute("collapsible");
  }

  /** Abertos, separados por espaço (`type="multiple"`) ou o único aberto. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  attributeChangedCallback(name: string, old: string | null, next: string | null): void {
    if (name !== "value" || old === next || !this.#ready || this.#syncing) return;
    this.#open = new Set((next ?? "").split(/\s+/).filter(Boolean));
    if (this.type === "single") this.#open = new Set([...this.#open].slice(0, 1));
    this.#render(false);
  }

  #rawItems(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>(".semec-accordion__item")).filter((el) => el.closest("semec-accordion") === this);
  }

  #items(): Item[] {
    const items = this.#rawItems();
    const out: Item[] = [];
    items.forEach((item, index) => {
      const trigger = item.querySelector<HTMLButtonElement>(".semec-accordion__trigger");
      if (!trigger) return;
      const header = item.querySelector<HTMLElement>(".semec-accordion__header");
      const panel = item.querySelector<HTMLElement>(".semec-accordion__panel");
      const value = item.dataset.value ?? panel?.id ?? String(index);
      out.push({ item, header, trigger, panel, value });
    });
    return out;
  }

  protected setup(): void {
    const signal = this.signal;
    // Valor estável de cada item: data-value, o id do painel escrito pelo autor ou a posição.
    this.#rawItems().forEach((item, index) => {
      if (item.dataset.value === undefined) item.dataset.value = item.querySelector(".semec-accordion__panel")?.id || String(index);
    });
    const items = this.#items();
    const attr = this.getAttribute("value");
    if (attr !== null) {
      this.#open = new Set(attr.split(/\s+/).filter(Boolean));
    } else {
      this.#open = new Set(items.filter((i) => i.item.getAttribute("data-state") === "open").map((i) => i.value));
    }
    if (this.type === "single") this.#open = new Set([...this.#open].slice(0, 1));

    for (const { item, header, trigger, panel } of items) {
      item.setAttribute("data-orientation", "vertical");
      header?.setAttribute("data-orientation", "vertical");
      trigger.setAttribute("data-orientation", "vertical");
      if (trigger.tagName === "BUTTON" && !trigger.hasAttribute("type")) trigger.type = "button";
      const triggerId = ensureId(trigger, "accordion-trigger");
      if (panel) {
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", triggerId);
        panel.setAttribute("data-orientation", "vertical");
        trigger.setAttribute("aria-controls", ensureId(panel, "accordion-panel"));
      }
      // aria-disabled posto por nós (item travado) não conta na reconexão.
      if (trigger.disabled || (!trigger.hasAttribute("aria-expanded") && isDisabled(trigger))) this.#authorDisabled.add(trigger);
      const disabled = this.#authorDisabled.has(trigger);
      toggleAttr(item, "data-disabled", disabled);
      toggleAttr(trigger, "data-disabled", disabled);
    }
    this.#ready = true;
    this.#render(false);

    this.addEventListener(
      "click",
      (event) => {
        const entry = this.#itemFrom(event.target);
        if (!entry || this.#authorDisabled.has(entry.trigger)) return;
        this.#toggle(entry.value);
      },
      { signal }
    );
    this.addEventListener("keydown", (event) => this.#onKeyDown(event), { signal });
  }

  #itemFrom(target: EventTarget | null): Item | undefined {
    const el = (target as Element | null)?.closest?.(".semec-accordion__trigger");
    return el ? this.#items().find((i) => i.trigger === el) : undefined;
  }

  #toggle(value: string): void {
    const isOpen = this.#open.has(value);
    if (this.type === "multiple") {
      if (isOpen) this.#open.delete(value);
      else this.#open.add(value);
    } else if (isOpen) {
      if (!this.collapsible) return;
      this.#open.clear();
    } else {
      this.#open = new Set([value]);
    }
    this.#render(true);
  }

  #render(notify: boolean): void {
    const single = this.type === "single";
    for (const { item, header, trigger, panel, value } of this.#items()) {
      const open = this.#open.has(value);
      const state = open ? "open" : "closed";
      item.setAttribute("data-state", state);
      header?.setAttribute("data-state", state);
      trigger.setAttribute("data-state", state);
      trigger.setAttribute("aria-expanded", String(open));
      // Radix: item aberto que não pode fechar (single sem collapsible) fica aria-disabled.
      const locked = single && open && !this.collapsible;
      if (locked) trigger.setAttribute("aria-disabled", "true");
      else if (!this.#authorDisabled.has(trigger)) trigger.removeAttribute("aria-disabled");
      if (panel) {
        panel.setAttribute("data-state", state);
        panel.hidden = !open;
      }
    }
    const value = single ? ([...this.#open][0] ?? "") : [...this.#open];
    this.#syncing = true;
    this.setAttribute("value", Array.isArray(value) ? value.join(" ") : value);
    this.#syncing = false;
    if (notify) emit<SemecAccordionChangeDetail>(this, "semec-change", { value });
  }

  #onKeyDown(event: KeyboardEvent): void {
    const current = this.#itemFrom(event.target);
    if (!current || event.altKey || event.ctrlKey || event.metaKey) return;
    const triggers = this.#items()
      .map((i) => i.trigger)
      .filter((t) => !t.disabled);
    const index = triggers.indexOf(current.trigger);
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = (index + 1) % triggers.length;
        break;
      case "ArrowUp":
        next = (index - 1 + triggers.length) % triggers.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = triggers.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    triggers[next]?.focus();
  }
}
