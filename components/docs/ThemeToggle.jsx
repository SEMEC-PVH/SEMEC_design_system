"use client";

import { useSyncExternalStore } from "react";
import { safeSet } from "@/lib/storage";

const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.dataset.theme === "dark";

const serverIsDark = () => false;

function applyTheme(next) {
  document.documentElement.dataset.theme = next ? "dark" : "light";
  safeSet("theme", next ? "dark" : "light");
  listeners.forEach((l) => l());
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, serverIsDark);

  return (
    <button
      className="theme-toggle"
      onClick={() => applyTheme(!dark)}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}