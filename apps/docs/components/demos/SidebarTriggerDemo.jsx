"use client";

import { useState } from "react";
import { SidebarTrigger } from "semec-ds/react";

export default function SidebarTriggerDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <SidebarTrigger open={open} onToggle={() => setOpen((v) => !v)} />
        <span>
          Estado: <strong>{open ? "Aberta" : "Fechada"}</strong>
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-4)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <div>
          <p style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>Sidebar aberta</p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <SidebarTrigger open={true} onToggle={() => {}} />
            <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
              Ícone: PanelLeftClose
            </span>
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>Sidebar fechada</p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <SidebarTrigger open={false} onToggle={() => {}} />
            <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
              Ícone: PanelLeftOpen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
