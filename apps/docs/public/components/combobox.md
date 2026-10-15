---
title: "Combobox"
code: "combobox"
slug: "combobox"
file: "src/components/combobox.tsx"
category: "formularios"
variants: "props: options · value · defaultValue · onChange · placeholder · searchPlaceholder · emptyText · name · required · disabled · labels · portalContainer · deprecadas: ariaLabel (use rótulo visível ou aria-labelledby) · emptyMessage (use emptyText)"
---

# Combobox — `combobox`

> Seleção com busca, no padrão APG combobox + listbox: uma parada de Tab, setas ↑/↓, Home/End, Enter seleciona, Esc fecha e devolve o foco. Opções via `options`; aceita `id`, `name`, `aria-*` e integra com FormField.

**Arquivo:** `src/components/combobox.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/combobox`

## Variantes

- **props**: options · value · defaultValue · onChange · placeholder · searchPlaceholder · emptyText · name · required · disabled · labels · portalContainer
- **deprecadas**: ariaLabel (use rótulo visível ou aria-labelledby) · emptyMessage (use emptyText)

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Combobox, FormField, Label } from "@semec/ds/react";

// Rótulo visível pelo FormField: nome acessível = rótulo + texto do gatilho (WCAG 2.5.3)
<FormField label="Tipo de documento" error={erro}>
  <Combobox
    name="tipoDocumento"
    placeholder="Selecione o tipo de documento"
    searchPlaceholder="Buscar tipo…"
    emptyText="Nenhum tipo encontrado."
    options={[{ value: "cnpj", label: "CNPJ" }, { value: "cpf", label: "CPF" }]}
    value={valor}
    onChange={setValor}
  />
</FormField>

// Ou com <Label htmlFor> + id (também aceita aria-labelledby)
<Label htmlFor="orgao">Órgão emissor</Label>
<Combobox id="orgao" options={orgaos} />
```

## Prompt para IA

```text
Use o componente `Combobox` (Combobox) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Seleção com busca, no padrão APG combobox + listbox: uma parada de Tab, setas ↑/↓, Home/End, Enter seleciona, Esc fecha e devolve o foco. Opções via `options`; aceita `id`, `name`, `aria-*` e integra com FormField. API e variantes: props: options · value · defaultValue · onChange · placeholder · searchPlaceholder · emptyText · name · required · disabled · labels · portalContainer · deprecadas: ariaLabel (use rótulo visível ou aria-labelledby) · emptyMessage (use emptyText). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormField, useFormFieldControl } from "./form-field";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxLabels {
  /**
   * Nome do campo de busca quando o Combobox não tem rótulo
   * (`<Label htmlFor>`, FormField ou `aria-labelledby`). Padrão: "Buscar opção".
   */
  search: string;
  /** Nome da camada flutuante quando não há rótulo. Padrão: "Opções". */
  list: string;
}

const defaultLabels: ComboboxLabels = {
  search: "Buscar opção",
  list: "Opções",
};

export interface ComboboxProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "value" | "defaultValue" | "name"
  > {
  options: ComboboxOption[];
  /** Valor selecionado (modo controlado). */
  value?: string;
  /** Valor inicial (modo não controlado). */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Texto do gatilho sem seleção. Padrão: "Selecione…". */
  placeholder?: string;
  /** Placeholder do campo de busca. Padrão: "Buscar…". */
  searchPlaceholder?: string;
  /** Texto quando a busca não encontra nada. Padrão: "Nenhum resultado.". */
  emptyText?: string;
  /** @deprecated Use `emptyText`. Mantida por compatibilidade. */
  emptyMessage?: string;
  /**
   * @deprecated Prefira rótulo visível (`<Label htmlFor={id}>` ou `FormField`)
   * ou `aria-labelledby`. Quando usada, vira um rótulo oculto somado ao texto
   * visível do gatilho (o nome acessível continua contendo o que se vê, 2.5.3).
   */
  ariaLabel?: string;
  /** Gera um `<input type="hidden" name>` com o valor, para envio em `<form>`. */
  name?: string;
  /**
   * Campo obrigatório: vira `aria-required` no campo de busca (o gatilho é um
   * botão, que não aceita `aria-required`). Mostre a obrigatoriedade no rótulo
   * (ex.: `FormField required`).
   */
  required?: boolean;
  /** Textos fixos (PT-BR por padrão). */
  labels?: Partial<ComboboxLabels>;
  /** Elemento onde o popover é portalado (ex.: body de um iframe de preview). */
  portalContainer?: HTMLElement | null;
}

const joinIds = (...ids: Array<string | undefined | null | false>) =>
  ids.filter(Boolean).join(" ") || undefined;

/**
 * Combobox no padrão APG "combobox com listbox popup": o gatilho (uma parada
 * de Tab) abre uma camada com o campo de busca (`role="combobox"`) e a lista
 * (`role="listbox"`). Setas ↑/↓, Home/End movem a opção ativa
 * (`aria-activedescendant`), Enter seleciona, Esc fecha e devolve o foco ao
 * gatilho, Tab fecha e segue para o próximo campo.
 */
const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Selecione…",
      searchPlaceholder = "Buscar…",
      emptyText,
      emptyMessage,
      disabled,
      ariaLabel,
      name,
      required,
      labels,
      className,
      portalContainer,
      onKeyDown,
      form,
      "aria-label": ariaLabelAttr,
      ...props
    },
    ref
  ) => {
    const text = { ...defaultLabels, ...labels };
    const empty = emptyText ?? emptyMessage ?? "Nenhum resultado.";
    const hiddenLabel = ariaLabel ?? ariaLabelAttr;

    const uid = React.useId();
    const valueId = `${uid}-value`;
    const hiddenLabelId = `${uid}-label`;
    const listboxId = `${uid}-listbox`;
    const optionId = (index: number) => `${uid}-option-${index}`;

    const ctx = useFormField();
    const field = useFormFieldControl(props);
    const triggerId = field.id ?? props.id;

    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
    const current = value !== undefined ? value : internalValue;

    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const listRef = React.useRef<HTMLUListElement | null>(null);
    const closingByTab = React.useRef(false);

    const setTriggerRef = React.useCallback(
      (el: HTMLButtonElement | null) => {
        triggerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref]
    );

    // <Label htmlFor={id}> fora de FormField: o rótulo nativo vira
    // aria-labelledby, para o nome somar o texto visível do gatilho.
    const [nativeLabelIds, setNativeLabelIds] = React.useState<string | undefined>(undefined);
    const explicitLabelledBy = props["aria-labelledby"];
    const needsNativeLabel = !explicitLabelledBy && !ctx?.labelId && !hiddenLabel;
    React.useEffect(() => {
      const el = triggerRef.current;
      if (!needsNativeLabel || !el?.labels?.length) {
        setNativeLabelIds(undefined);
        return;
      }
      const ids = Array.from(el.labels).map((label, i) => {
        if (!label.id) label.id = `${uid}-native-label-${i}`;
        return label.id;
      });
      setNativeLabelIds(ids.join(" "));
    }, [needsNativeLabel, triggerId, uid]);

    const labelIds =
      explicitLabelledBy ??
      ctx?.labelId ??
      nativeLabelIds ??
      (hiddenLabel ? hiddenLabelId : undefined);

    const selected = options.find((o) => o.value === current);
    const filtered = React.useMemo(() => {
      const q = query.trim().toLowerCase();
      const indexed = options.map((option, index) => ({ option, index }));
      if (!q) return indexed;
      return indexed.filter(({ option }) => option.label.toLowerCase().includes(q));
    }, [options, query]);

    const active = filtered.length ? Math.min(activeIndex, filtered.length - 1) : -1;
    const activeItem = active >= 0 ? filtered[active] : undefined;
    const activeId = activeItem ? optionId(activeItem.index) : undefined;

    const handleOpenChange = (next: boolean) => {
      if (next) {
        setQuery("");
        const selectedIndex = options.findIndex((o) => o.value === current);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
      setOpen(next);
    };

    const choose = (option: ComboboxOption) => {
      if (value === undefined) setInternalValue(option.value);
      onChange?.(option.value);
      setOpen(false);
    };

    React.useEffect(() => {
      if (!open || !activeId) return;
      const el = listRef.current?.querySelector<HTMLElement>(`[id="${activeId}"]`);
      el?.scrollIntoView?.({ block: "nearest" });
    }, [open, activeId]);

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled) return;
      if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        handleOpenChange(true);
      }
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const last = filtered.length - 1;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (last >= 0) setActiveIndex(Math.min(active + 1, last));
          break;
        case "ArrowUp":
          event.preventDefault();
          if (last >= 0) setActiveIndex(Math.max(active - 1, 0));
          break;
        case "Home":
          event.preventDefault();
          if (last >= 0) setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          if (last >= 0) setActiveIndex(last);
          break;
        case "Enter":
          // Não envia o formulário; seleciona a opção ativa.
          event.preventDefault();
          if (activeItem) choose(activeItem.option);
          break;
        case "Tab":
          // Uma parada de Tab: fecha e deixa o Tab seguir a partir do gatilho.
          closingByTab.current = true;
          triggerRef.current?.focus();
          setOpen(false);
          break;
        default:
          break;
      }
    };

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {hiddenLabel && !explicitLabelledBy && !ctx?.labelId ? (
          <span id={hiddenLabelId} className="sr-only">
            {hiddenLabel}
          </span>
        ) : null}
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
              className
            )}
            {...props}
            {...field}
            ref={setTriggerRef}
            // Nome = rótulo + texto visível (valor ou placeholder): nunca
            // substitui o que se vê (WCAG 2.5.3).
            aria-labelledby={labelIds ? joinIds(labelIds, valueId) : undefined}
            onKeyDown={handleTriggerKeyDown}
          >
            <span
              id={valueId}
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </button>
        </PopoverPrimitive.Trigger>
        {name ? (
          <input type="hidden" name={name} value={current ?? ""} form={form} />
        ) : null}
        <PopoverPrimitive.Portal container={portalContainer}>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            aria-labelledby={labelIds}
            aria-label={labelIds ? undefined : hiddenLabel ?? text.list}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              // Saída por Tab: o foco já seguiu para o próximo campo.
              if (closingByTab.current) {
                closingByTab.current = false;
                event.preventDefault();
              }
            }}
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[12rem] rounded-md border border-border bg-popover text-popover-foreground shadow-elevation-2 outline-none data-[state=open]:animate-in"
          >
            <div className="border-b border-border p-2">
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                autoComplete="off"
                aria-expanded={filtered.length > 0}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                aria-required={required || ctx?.required ? true : undefined}
                aria-labelledby={labelIds}
                aria-label={labelIds ? undefined : hiddenLabel ?? text.search}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
            {filtered.length > 0 ? (
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-labelledby={labelIds}
                aria-label={labelIds ? undefined : hiddenLabel ?? text.list}
                className="max-h-64 overflow-y-auto p-1"
              >
                {filtered.map(({ option, index }, position) => {
                  const isActive = position === active;
                  const isChosen = option.value === current;
                  return (
                    <li
                      key={option.value}
                      id={optionId(index)}
                      role="option"
                      // APG: aria-selected marca a opção ativa (a que Enter escolhe).
                      aria-selected={isActive}
                      // Mantém o foco no campo de busca ao clicar.
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseMove={() => {
                        if (!isActive) setActiveIndex(position);
                      }}
                      onClick={() => choose(option)}
                      className={cn(
                        "flex min-h-11 w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-2 text-sm text-foreground",
                        isActive && "bg-tint ring-2 ring-inset ring-ring",
                        isChosen && "font-medium"
                      )}
                    >
                      {option.label}
                      {isChosen ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {/* Sempre montado: anuncia "Nenhum resultado." ao filtrar. */}
            <p
              role="status"
              className={cn(
                "px-3 py-2 text-sm text-muted-foreground",
                filtered.length > 0 && "sr-only"
              )}
            >
              {filtered.length > 0 ? "" : empty}
            </p>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
Combobox.displayName = "Combobox";

export { Combobox };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
