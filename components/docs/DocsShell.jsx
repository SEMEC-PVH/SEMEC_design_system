"use client";

import { useCallback, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DocsShell({ children }) {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <Header open={open} onToggle={() => setOpen((v) => !v)} />
      <div className="layout">
        <Sidebar open={open} onClose={onClose} />
        <main className="content" id="topo">
          <div className="container">{children}</div>
        </main>
      </div>
      <footer>
        Design System — SEMEC Digital · guia visual de referência
      </footer>
    </>
  );
}