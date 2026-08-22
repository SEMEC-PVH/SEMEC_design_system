"use client";

import Link from "next/link";
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

const groupOf = (href) => {
  const found = allItems().find((r) => r.href === href);
  return found ? found.group : "Seções";
};

export default function Header({ open, onToggle }) {
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

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

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar seções"
        />
        {query.trim() && (
          <div className="results">
            {results.length > 0 ? (
              results.map((r) => (
                <Link key={r.href} href={r.href} onClick={() => setQuery("")}>
                  {r.label}{" "}
                  <span className="results-group">{r.group}</span>
                </Link>
              ))
            ) : (
              <span className="empty">Nada encontrado</span>
            )}
          </div>
        )}
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