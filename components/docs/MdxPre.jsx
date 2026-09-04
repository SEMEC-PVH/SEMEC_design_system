"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";

export default function MdxPre({ children, ...props }) {
  const [state, setState] = useState("idle");

  // extrai texto puro de <code> shiki dentro de <pre>
  function extractText(node) {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node?.props?.children) return extractText(node.props.children);
    return "";
  }

  const codeText = extractText(children);

  async function handleCopy() {
    const ok = await copyText(codeText);
    setState(ok ? "ok" : "fail");
    setTimeout(() => setState("idle"), 1600);
  }

  return (
    <div className="mdx-pre-wrap" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleCopy}
        className="mdx-copy-btn"
        aria-live="polite"
        style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          zIndex: 1,
          border: "1px solid var(--color-border-default, #e5e7eb)",
          background: "var(--color-surface-default, #fff)",
          borderRadius: "0.375rem",
          fontSize: "0.75rem",
          padding: "0.2rem 0.5rem",
          cursor: "pointer",
        }}
      >
        {state === "ok" ? "Copiado!" : state === "fail" ? "Falhou" : "Copiar"}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}
