import { SemecElement, emit, ensureId, fold, placePopup, toggleAttr } from "./internal";

export interface SemecComboboxChangeDetail {
  /** Valor escolhido ("" quando a escolha foi limpa). */
  value: string;
  /** Texto da opção escolhida. */
  label: string;
}

interface Option {
  value: string;
  label: string;
  disabled: boolean;
  el: HTMLLIElement;
}

const CHECK_SVG =
  '<svg class="semec-combobox__check" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

const DEFAULT_EMPTY = "Nenhum resultado";
const ANNOUNCE_DELAY = 400;

/**
 * `<semec-combobox>`: padrão APG "Editable Combobox With List Autocomplete",
 * com `aria-activedescendant`, a partir de um `<select>` nativo.
 *
 * O `<select>` filho é a fonte das opções e o valor do formulário: sem
 * JavaScript, ele funciona sozinho. Com o elemento, ele fica escondido (o
 * `name` continua indo no envio) e aparece um `<input role="combobox">` com o
 * `id`, a descrição e o estado de erro do select, mais o `listbox`.
 *
 * Digitar filtra (sem diferença de acento e caixa) e anuncia "N resultados";
 * ↓/↑ abrem e movem, Home/End vão ao primeiro/último, Enter escolhe, Esc
 * fecha e, com a lista fechada, limpa; Tab sai. A opção ativa tem
 * `aria-selected="true"` + `data-highlighted`; a escolhida, `data-state="checked"`.
 * Evento `semec-change`, e o
 * select dispara `change` como se o usuário tivesse escolhido nele.
 */
export class SemecCombobox extends SemecElement {
  #input: HTMLInputElement | null = null;
  #listbox: HTMLUListElement | null = null;
  #empty: HTMLElement | null = null;
  #status: HTMLElement | null = null;
  #options: Option[] = [];
  #filtered: Option[] = [];
  #active = -1;
  #open = false;
  #announceTimer: ReturnType<typeof setTimeout> | undefined;
  #observer: MutationObserver | null = null;

  get select(): HTMLSelectElement | null {
    return this.querySelector("select");
  }

  get input(): HTMLInputElement | null {
    return this.#input;
  }

  /** Valor escolhido (o do `<select>`). */
  get value(): string {
    return this.select?.value ?? "";
  }

  set value(next: string) {
    const select = this.select;
    if (!select) return;
    select.value = next;
    this.#syncInputFromSelect();
    this.#renderOptions();
  }

  get isOpen(): boolean {
    return this.#open;
  }

  protected setup(): void {
    const select = this.select;
    if (!select) return;
    const signal = this.signal;
    const uid = ensureId(this, "combobox");

    // Reconexão: reaproveita o que já foi criado.
    let input = this.querySelector<HTMLInputElement>(":scope > input[data-semec-combobox-input]");
    if (!input) {
      input = document.createElement("input");
      input.type = "text";
      input.className = "semec-combobox__input";
      input.setAttribute("data-semec-combobox-input", "");
      // O rótulo (<label for>) aponta para o id do select: o campo novo assume o id.
      if (select.id) {
        input.id = select.id;
        select.id = `${select.id}-nativo`;
      }
      for (const attr of ["aria-describedby", "aria-invalid", "aria-labelledby", "aria-label", "title"]) {
        const v = select.getAttribute(attr);
        if (v !== null) input.setAttribute(attr, v);
      }
      if (select.required) {
        input.required = true;
        select.required = false; // um select escondido e obrigatório trava o envio sem mensagem
      }
      input.disabled = select.disabled;
      select.before(input);
    }
    this.#input = input;
    input.setAttribute("role", "combobox");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    let listbox = this.querySelector<HTMLUListElement>(":scope > ul[data-semec-combobox-listbox]");
    if (!listbox) {
      listbox = document.createElement("ul");
      listbox.className = "semec-combobox__listbox";
      listbox.setAttribute("data-semec-combobox-listbox", "");
      listbox.setAttribute("role", "listbox");
      listbox.id = `${uid}-listbox`;
      input.after(listbox);
    }
    this.#listbox = listbox;
    const labelIds = input.getAttribute("aria-labelledby") ?? this.#labelIds(input);
    if (labelIds) listbox.setAttribute("aria-labelledby", labelIds);
    else listbox.setAttribute("aria-label", input.getAttribute("aria-label") ?? "Opções");
    input.setAttribute("aria-controls", listbox.id);

    let empty = this.querySelector<HTMLElement>(":scope > .semec-combobox__empty");
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "semec-combobox__empty";
      empty.textContent = this.getAttribute("empty-text") ?? DEFAULT_EMPTY;
      listbox.after(empty);
    }
    this.#empty = empty;

    let status = this.querySelector<HTMLElement>(":scope > [data-semec-combobox-status]");
    if (!status) {
      status = document.createElement("div");
      status.className = "semec-sr-only";
      status.setAttribute("role", "status");
      status.setAttribute("data-semec-combobox-status", "");
      this.append(status);
    }
    this.#status = status;

    // O select sai da árvore de acessibilidade e do Tab, mas continua no formulário.
    select.hidden = true;
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    this.#readOptions();
    this.#syncInputFromSelect();
    this.#setOpen(false);

    input.addEventListener("input", () => this.#onInput(), { signal });
    // Texto da opção escolhida fica selecionado: digitar substitui, como trocar a escolha num select.
    input.addEventListener("focus", () => this.#selectText(), { signal });
    input.addEventListener("keydown", (event) => this.#onKeyDown(event), { signal });
    input.addEventListener(
      "click",
      () => {
        if (this.#open) this.#setOpen(false);
        else {
          this.#openList("selected");
          this.#selectText();
        }
      },
      { signal }
    );
    input.addEventListener("blur", () => this.#onBlur(), { signal });
    listbox.addEventListener("mousedown", (event) => event.preventDefault(), { signal }); // foco fica no campo
    listbox.addEventListener(
      "click",
      (event) => {
        const li = (event.target as Element | null)?.closest?.("li[role=option]");
        const option = this.#filtered.find((o) => o.el === li);
        if (option && !option.disabled) this.#choose(option);
      },
      { signal }
    );
    listbox.addEventListener(
      "mousemove",
      (event) => {
        const li = (event.target as Element | null)?.closest?.("li[role=option]");
        const index = this.#filtered.findIndex((o) => o.el === li);
        if (index >= 0 && index !== this.#active && !this.#filtered[index]?.disabled) this.#setActive(index, false);
      },
      { signal }
    );
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (this.#open && !this.contains(event.target as Node)) this.#setOpen(false);
      },
      { signal, capture: true }
    );
    select.form?.addEventListener(
      "reset",
      () => setTimeout(() => this.#syncInputFromSelect()),
      { signal }
    );

    this.#observer = new MutationObserver(() => {
      this.#readOptions();
      this.#syncInputFromSelect();
    });
    this.#observer.observe(select, { childList: true, subtree: true, attributes: true, characterData: true });
  }

  protected teardown(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    clearTimeout(this.#announceTimer);
    if (this.#open) this.#setOpen(false);
  }

  #labelIds(input: HTMLInputElement): string {
    return Array.from(input.labels ?? [])
      .map((label) => ensureId(label, "combobox-label"))
      .join(" ");
  }

  #readOptions(): void {
    const select = this.select;
    const listbox = this.#listbox;
    if (!select || !listbox) return;
    const uid = this.id;
    const placeholder = Array.from(select.options).find((o) => o.value === "");
    if (placeholder && this.#input && !this.#input.placeholder) this.#input.placeholder = placeholder.text.trim();
    this.#options = Array.from(select.options)
      .filter((o) => o.value !== "" && !o.hidden)
      .map((o, index) => {
        const li = document.createElement("li");
        li.className = "semec-combobox__option";
        li.id = `${uid}-option-${index}`;
        li.setAttribute("role", "option");
        li.dataset.value = o.value;
        li.textContent = o.text.trim();
        if (o.disabled) {
          li.setAttribute("aria-disabled", "true");
          li.setAttribute("data-disabled", "");
        }
        return { value: o.value, label: o.text.trim(), disabled: o.disabled, el: li };
      });
    this.#filter(this.#open ? (this.#input?.value ?? "") : "");
  }

  #filter(query: string): void {
    const q = fold(query);
    const selected = this.#selectedOption();
    // Texto igual ao da opção escolhida = lista inteira (abriu de novo sem digitar).
    const all = !q || (selected && fold(selected.label) === q);
    this.#filtered = all ? this.#options : this.#options.filter((o) => fold(o.label).includes(q));
    this.#renderOptions();
  }

  #renderOptions(): void {
    const listbox = this.#listbox;
    if (!listbox) return;
    const chosen = this.value;
    listbox.replaceChildren(
      ...this.#filtered.map((o) => {
        const isChosen = o.value === chosen;
        // Escolhida = marcada (convenção do Radix); aria-selected fica com a opção ativa.
        o.el.setAttribute("data-state", isChosen ? "checked" : "unchecked");
        o.el.textContent = o.label;
        if (isChosen) o.el.insertAdjacentHTML("beforeend", CHECK_SVG);
        return o.el;
      })
    );
    this.#setActive(Math.min(this.#active, this.#filtered.length - 1), false);
    this.#syncVisibility();
  }

  #syncVisibility(): void {
    const listbox = this.#listbox;
    const input = this.#input;
    const empty = this.#empty;
    if (!listbox || !input || !empty) return;
    const hasResults = this.#filtered.length > 0;
    listbox.hidden = !(this.#open && hasResults);
    empty.hidden = !(this.#open && !hasResults);
    // Como o kit: aria-expanded reflete a lista visível.
    input.setAttribute("aria-expanded", String(this.#open && hasResults));
    listbox.setAttribute("data-state", this.#open ? "open" : "closed");
    this.setAttribute("data-state", this.#open ? "open" : "closed");
  }

  #selectedOption(): Option | undefined {
    const v = this.value;
    return v ? this.#options.find((o) => o.value === v) : undefined;
  }

  #syncInputFromSelect(): void {
    const input = this.#input;
    if (!input) return;
    input.value = this.#selectedOption()?.label ?? "";
    input.setCustomValidity("");
  }

  #setOpen(open: boolean): void {
    this.#open = open;
    if (!open) this.#setActive(-1, false);
    this.#syncVisibility();
    const popup = this.#filtered.length ? this.#listbox : this.#empty;
    if (open && this.#input && popup) placePopup(this.#input, popup);
    if (!open) {
      this.#listbox?.removeAttribute("data-side");
      this.#empty?.removeAttribute("data-side");
    }
  }

  #openList(focus: "selected" | "first" | "last" | "none"): void {
    if (this.#input?.disabled) return;
    if (!this.#open) this.#filter(this.#input?.value ?? "");
    this.#setOpen(true);
    const enabled = this.#filtered.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const selected = this.#filtered.findIndex((o) => o.value === this.value);
    const target =
      focus === "selected" ? (selected >= 0 ? selected : (enabled[0] ?? -1)) : focus === "first" ? (enabled[0] ?? -1) : focus === "last" ? (enabled[enabled.length - 1] ?? -1) : -1;
    this.#setActive(target, true);
  }

  #setActive(index: number, scroll: boolean): void {
    this.#active = index;
    const input = this.#input;
    // APG com aria-activedescendant (e o kit React): aria-selected="true" na opção ativa,
    // que é a que o leitor de tela anuncia; a escolhida é marcada por data-state="checked".
    this.#filtered.forEach((o, i) => {
      toggleAttr(o.el, "data-highlighted", i === index);
      o.el.setAttribute("aria-selected", String(i === index && this.#open));
    });
    const option = this.#filtered[index];
    if (input) {
      if (option && this.#open) input.setAttribute("aria-activedescendant", option.el.id);
      else input.removeAttribute("aria-activedescendant");
    }
    if (scroll && option) option.el.scrollIntoView?.({ block: "nearest" });
  }

  #move(step: 1 | -1 | "first" | "last"): void {
    const enabled = this.#filtered.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    if (!enabled.length) return;
    const pos = enabled.indexOf(this.#active);
    let next: number;
    if (step === "first") next = enabled[0] as number;
    else if (step === "last") next = enabled[enabled.length - 1] as number;
    else if (pos < 0) next = (step === 1 ? enabled[0] : enabled[enabled.length - 1]) as number;
    // Como o kit React: para no primeiro e no último (sem volta).
    else next = enabled[Math.min(Math.max(pos + step, 0), enabled.length - 1)] as number;
    this.#setActive(next, true);
  }

  #choose(option: Option | null): void {
    const select = this.select;
    if (!select) return;
    const previous = select.value;
    select.value = option?.value ?? "";
    if (!option && select.value !== "") select.selectedIndex = -1;
    this.#syncInputFromSelect();
    this.#setOpen(false);
    this.#renderOptions();
    if (select.value !== previous) {
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      emit<SemecComboboxChangeDetail>(this, "semec-change", { value: select.value, label: option?.label ?? "" });
    }
  }

  #selectText(): void {
    const input = this.#input;
    const selected = this.#selectedOption();
    if (input && selected && input.value === selected.label) input.select();
  }

  #onInput(): void {
    const input = this.#input as HTMLInputElement;
    if (!this.#open) this.#setOpen(true);
    this.#filter(input.value);
    const first = this.#filtered.findIndex((o) => !o.disabled);
    this.#setActive(input.value.trim() ? first : -1, true);
    this.#announce();
  }

  #announce(): void {
    clearTimeout(this.#announceTimer);
    this.#announceTimer = setTimeout(() => {
      if (!this.#status || !this.#open) return;
      const n = this.#filtered.length;
      this.#status.textContent = n === 0 ? (this.#empty?.textContent ?? DEFAULT_EMPTY) : n === 1 ? "1 resultado" : `${n} resultados`;
    }, ANNOUNCE_DELAY);
  }

  #onBlur(): void {
    const input = this.#input as HTMLInputElement;
    this.#setOpen(false);
    // Texto digitado que não virou escolha: igual a uma opção, escolhe; senão volta ao escolhido.
    const typed = fold(input.value);
    const selected = this.#selectedOption();
    if (!typed) {
      if (selected) this.#choose(null);
      return;
    }
    if (selected && fold(selected.label) === typed) return;
    const exact = this.#options.find((o) => !o.disabled && fold(o.label) === typed);
    if (exact) this.#choose(exact);
    else this.#syncInputFromSelect();
  }

  #onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!this.#open) {
          this.#openList(event.altKey ? "none" : "selected");
          this.#selectText();
        } else this.#move(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!this.#open) {
          this.#openList(event.altKey ? "none" : this.value ? "selected" : "last");
          this.#selectText();
        }
        else if (event.altKey) this.#setOpen(false);
        else this.#move(-1);
        return;
      case "Home":
        if (!this.#open) return; // fechado: o cursor do texto vai ao início
        event.preventDefault();
        this.#move("first");
        return;
      case "End":
        if (!this.#open) return;
        event.preventDefault();
        this.#move("last");
        return;
      case "Enter": {
        if (!this.#open) return; // fechado: Enter envia o formulário, como num campo comum
        event.preventDefault();
        const option = this.#filtered[this.#active];
        if (option && !option.disabled) this.#choose(option);
        return;
      }
      case "Escape":
        if (this.#open) {
          event.preventDefault();
          event.stopPropagation(); // não fecha um <dialog> em volta
          this.#setOpen(false);
          this.#syncInputFromSelect();
        } else if (this.#input?.value || this.value) {
          event.preventDefault();
          event.stopPropagation();
          this.#choose(null);
        }
        return;
      case "Tab":
        if (this.#open) this.#setOpen(false);
        return;
      default:
        return;
    }
  }
}
