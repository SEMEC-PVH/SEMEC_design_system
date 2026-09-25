"use client";

import { useState } from "react";
import { SidebarToggleButton } from "semec-ds/react";

export default function SidebarTriggerDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="demo-stack">
      <div className="demo-row">
        <SidebarToggleButton open={open} onToggle={() => setOpen((v) => !v)} />
        <span>
          Estado: <strong>{open ? "Aberta" : "Fechada"}</strong>
        </span>
      </div>

      <div className="demo-grid-2col">
        <div>
          <p className="demo-label">Sidebar aberta</p>
          <div className="demo-row">
            <SidebarToggleButton open={true} onToggle={() => {}} />
            <span className="demo-hint">
              Ícone: PanelLeftClose
            </span>
          </div>
        </div>
        <div>
          <p className="demo-label">Sidebar fechada</p>
          <div className="demo-row">
            <SidebarToggleButton open={false} onToggle={() => {}} />
            <span className="demo-hint">
              Ícone: PanelLeftOpen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
