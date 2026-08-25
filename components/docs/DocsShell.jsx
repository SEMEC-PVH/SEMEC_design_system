"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CookieBanner from "./CookieBanner";
import Footer from "./Footer";
import { breadcrumbsFor } from "@/lib/navigation";

export default function DocsShell({ children }) {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);
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
        <Sidebar open={open} onClose={onClose} />
        {open && (
          <div
            className="sidebar-backdrop"
            onClick={onClose}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        <main className="content" id="topo">
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
          <div className="container">
            <Footer />
          </div>
        </main>
      </div>
    </>
  );
}