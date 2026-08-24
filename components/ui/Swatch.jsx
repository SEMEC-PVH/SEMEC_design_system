"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";

// Região viva sem classe CSS nova (o CSS é escopo de outro agente).
const srOnly = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

export default function Swatch({ token, hex }) {
  const colorRef = useRef(null);
  const timerRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onCopy = async () => {
    await copyText(hex);
    setCopied(true);
    const c = colorRef.current;
    const prev = c ? c.style.outline : null;
    if (c) c.style.outline = "3px solid var(--focus-ring)";
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (c) c.style.outline = prev;
      setCopied(false);
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
      <span style={srOnly} aria-live="polite" role="status">
        {copied ? `${hex} copiado` : ""}
      </span>
    </div>
  );
}
