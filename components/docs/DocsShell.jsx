"use client";

import { useCallback, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CookieBanner from "./CookieBanner";
import Footer from "./Footer";

export default function DocsShell({ children }) {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <a className="skip-link" href="#topo">
        Pular para o conteúdo
      </a>
      <CookieBanner />
      <Header open={open} onToggle={() => setOpen((v) => !v)} />
      <div className="layout">
        <Sidebar open={open} onClose={onClose} />
        <main className="content" id="topo">
          <div className="container">{children}</div>
        </main>
      </div>
      <Footer />
    </>
  );
}