"use client";

import { useEffect, useState } from "react";
import { safeGet, safeSet } from "@/lib/storage";

function currentTheme() {
  const root = document.documentElement;
  return root.dataset.theme === "dark" ? "dark" : "light";
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(currentTheme() === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    safeSet("theme", next ? "dark" : "light");
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}