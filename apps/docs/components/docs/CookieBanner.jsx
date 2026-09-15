"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { safeGet, safeSet } from "@/lib/storage";

const KEY = "cookie-consent";

const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const hasConsent = () =>
  typeof window !== "undefined" && safeGet(KEY) !== null;

const serverHasConsent = () => false;

export default function CookieBanner() {
  const [dismissed, setDismissed] = useState(false);
  const bannerRef = useRef(null);
  const lastFocused = useRef(null);
  const storedConsent = useSyncExternalStore(
    subscribe,
    hasConsent,
    serverHasConsent
  );
  const visible = !dismissed && !storedConsent;

  useEffect(() => {
    if (!visible) return;
    if (!lastFocused.current) lastFocused.current = document.activeElement;
    const node = bannerRef.current;
    node?.querySelector("button")?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setDismissed(true);
        lastFocused.current?.focus?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const focusables = node.querySelectorAll("button, a[href]");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  const decide = (value) => {
    safeSet(KEY, value);
    setDismissed(true);
    lastFocused.current?.focus?.();
  };

  if (!visible) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      ref={bannerRef}
    >
      <div className="cookie-banner-content">
        <h2 className="cookie-banner-title" id="cookie-banner-title">
          Cookies no Design System da SEMEC Porto Velho
        </h2>
        <p>
          Usamos cookies analíticos para entender como você utiliza o Design
          System e fazer melhorias.
        </p>
      </div>
      <div className="cookie-banner-actions">
        <button onClick={() => decide("accepted")}>
          Aceitar cookies analíticos
        </button>
        <button onClick={() => decide("declined")}>
          Recusar cookies analíticos
        </button>
        <Link
          href="/cookies"
          className="cookie-banner-view"
          onClick={() => setDismissed(true)}
        >
          Ver cookies
        </Link>
      </div>
    </div>
  );
}