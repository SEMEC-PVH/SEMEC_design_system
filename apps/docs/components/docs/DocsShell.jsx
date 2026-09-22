"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CookieBanner from "./CookieBanner";
import Footer from "./Footer";
import TableOfContents from "./TableOfContents";
import { breadcrumbsFor } from "@/lib/navigation";
import { safeGet, safeSet } from "@/lib/storage";

const COLLAPSED_KEY = "ds-sidebar-collapsed";

// Estado da sidebar colapsada persistido em localStorage, observado via
// useSyncExternalStore (mesmo padrão da Sidebar) — evita setState em efeito.
let collapsedValue = null;
const collapsedListeners = new Set();
const subscribeCollapsed = (cb) => {
  collapsedListeners.add(cb);
  return () => collapsedListeners.delete(cb);
};
const readCollapsed = () => {
  if (collapsedValue === null && typeof window !== "undefined") {
    collapsedValue = safeGet(COLLAPSED_KEY) === "1";
  }
  return collapsedValue;
};
const serverCollapsed = () => false;

export default function DocsShell({ children }) {
  const [open, setOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    serverCollapsed
  );
  const onClose = useCallback(() => setOpen(false), []);
  const onCollapse = useCallback(() => {
    const next = !readCollapsed();
    collapsedValue = next;
    safeSet(COLLAPSED_KEY, next ? "1" : "0");
    collapsedListeners.forEach((l) => l());
  }, []);
  const pathname = usePathname();
  const crumbs = breadcrumbsFor(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#topo">
        Pular para o conteúdo
      </a>
      <CookieBanner />
      <Header open={open} onToggle={() => setOpen((v) => !v)} />
      <div className="layout">
        <Sidebar open={open} onClose={onClose} collapsed={collapsed} onCollapse={onCollapse} />
        {open && (
          <div
            className="sidebar-backdrop"
            onClick={onClose}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        <main className="content" id="topo">
          <div className="content-inner">
            <div className="container">
              {crumbs.length > 1 && (
                <nav className="breadcrumbs" aria-label="Trilha de navegação">
                  {crumbs.map((c, i) => (
                    <span key={i} className="crumb">
                      {i > 0 && (
                        <span className="crumb-sep" aria-hidden="true">
                          ›
                        </span>
                      )}
                      {i < crumbs.length - 1 ? (
                        c.href ? (
                          <Link href={c.href}>{c.label}</Link>
                        ) : (
                          <span>{c.label}</span>
                        )
                      ) : (
                        <span aria-current="page">{c.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              {children}
            </div>
            <TableOfContents />
          </div>
          <Footer />
        </main>
      </div>
    </>
  );
}