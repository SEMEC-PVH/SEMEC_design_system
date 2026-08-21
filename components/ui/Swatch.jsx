"use client";

import { useRef } from "react";
import { copyText } from "@/lib/clipboard";

export default function Swatch({ token, hex }) {
  const colorRef = useRef(null);

  const onCopy = async () => {
    await copyText(hex);
    const c = colorRef.current;
    if (!c) return;
    const prev = c.style.outline;
    c.style.outline = "3px solid var(--pv-green-600)";
    setTimeout(() => {
      c.style.outline = prev;
    }, 700);
  };

  return (
    <div
      className="swatch"
      onClick={onCopy}
      role="button"
      tabIndex={0}
      aria-label={`Copiar ${hex}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCopy();
        }
      }}
    >
      <div className="color" style={{ background: hex }} ref={colorRef}></div>
      <span className="label">{token}</span>
      <span className="hex">{hex}</span>
    </div>
  );
}