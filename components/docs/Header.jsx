"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { navigation } from "@/lib/navigation";
import { searchIndex } from "@/lib/searchIndex";
import ThemeToggle from "./ThemeToggle";

const allItems = () =>
  navigation.flatMap((item) =>
    item.items
      ? item.items.map((s) => ({ label: s.label, href: s.href, group: item.label }))
      : [{ label: item.label, href: item.href, group: "Introdução" }]
  );

const LISTBOX_ID = "header-search-results";
const optionId = (index) => `${LISTBOX_ID}-opt-${index}`;

// Região viva sem classe CSS nova (o CSS é escopo de outro agente).
const srOnly = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

export default function Header({ open, onToggle }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set();
    const out = [];
    for (const r of allItems()) {
      if (r.label.toLowerCase().includes(q) || r.href.toLowerCase().includes(q)) {
        if (seen.has(r.href)) continue;
        seen.add(r.href);
        out.push(r);
      }
    }
    for (const idx of searchIndex) {
      if (idx.term.toLowerCase().includes(q)) {
        if (seen.has(idx.href)) continue;
        seen.add(idx.href);
        out.push({ label: idx.term, href: idx.href, group: groupOf(idx.href) });
      }
    }
    return out.slice(0, 8);
  }, [query]);

  const expanded = query.trim().length > 0;

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setQuery("");
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const closeResults = () => {
    setQuery("");
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      closeResults();
      return;
    }
    if (!expanded || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (e.key === "Enter") {
      const target = results[activeIndex];
      if (target) {
        e.preventDefault();
        closeResults();
        router.push(target.href);
      }
    }
  };

  const announcement = !expanded
    ? ""
    : results.length === 0
    ? "Nenhum resultado encontrado."
    : results.length === 1
    ? "1 resultado encontrado."
    : `${results.length} resultados encontrados.`;

  return (
    <header className="site-header">
      <div className="brand">
        <span className="brand-pixel">DEVSEMEC</span>
      </div>
      <div className="header-search" ref={wrapRef}>
        <input
          type="search"
          placeholder="Buscar seções…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          aria-label="Buscar no guia"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? optionId(activeIndex)
              : undefined
          }
        />
        {expanded && (
          <div
            className="results"
            id={LISTBOX_ID}
            role="listbox"
            aria-label="Resultados da busca"
          >
            {results.length > 0 ? (
              results.map((r, i) => (
                <Link
                  key={r.href}
                  href={r.href}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={closeResults}
                >
                  {r.label}{" "}
                  <span className="results-group">{r.group}</span>
                </Link>
              ))
            ) : (
              // O texto é anunciado pela região viva abaixo; aqui ele é
              // apenas visual (um listbox só pode conter opções).
              <span className="empty" aria-hidden="true">
                Nada encontrado
              </span>
            )}
          </div>
        )}
        <div style={srOnly} aria-live="polite" role="status">
          {announcement}
        </div>
      </div>
      <ThemeToggle />
      <button
        className="menu-btn"
        onClick={onToggle}
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        {open ? "✕ Fechar" : "☰ Menu"}
      </button>
    </header>
  );
}
