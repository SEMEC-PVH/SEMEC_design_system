"use client";

import { useRef, useState } from "react";

const tabs = [
  { key: "todos", label: "Todos", count: 40 },
  { key: "servicos", label: "Serviços", count: 18 },
  { key: "requerimentos", label: "Requerimentos", count: 12 },
  { key: "informacoes", label: "Informações", count: 7 },
  { key: "acessos", label: "Acessos", count: 3 },
];

const chips = ["Todas", "IPTU", "ITBI", "Taxas", "Simples Nacional", "REFIS"];

export default function DemoControls() {
  const [tab, setTab] = useState(tabs[0].key);
  const [chip, setChip] = useState(chips[0]);
  const tablistRef = useRef(null);

  // Roving tabindex: a lista inteira é um único ponto de tabulação e as
  // setas percorrem as abas, como manda o padrão ARIA de tabs. O handler fica
  // em cada aba (e não no tablist), que é onde o foco realmente está.
  const onTabKeyDown = (e) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const current = tabs.findIndex((t) => t.key === tab);
    let next = current;
    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    setTab(tabs[next].key);
    tablistRef.current?.querySelectorAll("[role='tab']")[next]?.focus();
  };

  return (
    <div className="demo-controls">
      <div
        className="demo-tabs"
        role="tablist"
        aria-label="Categorias de serviços"
        ref={tablistRef}
      >
        {tabs.map((t) => {
          const selected = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={selected ? "active" : undefined}
              onClick={() => setTab(t.key)}
              onKeyDown={onTabKeyDown}
            >
              {t.label} <span className="count">{t.count}</span>
            </button>
          );
        })}
      </div>
      <div className="demo-search">
        <div className="field">
          <span className="icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            aria-label="Buscar serviço ou informação"
            placeholder="Buscar serviço ou informação… (ex.: IPTU, restituição, certidão)"
          />
        </div>
      </div>
      <div className="demo-chips">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className={"chip" + (c === chip ? " active" : "")}
            aria-pressed={c === chip}
            onClick={() => setChip(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
