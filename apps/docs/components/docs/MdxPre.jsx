"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function MdxPre({ children, ...props }) {
  const [state, setState] = useState("idle");

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
    <div className="mdx-pre-wrap">
      <button
        type="button"
        onClick={handleCopy}
        className="mdx-copy-btn"
        aria-live="polite"
        aria-label={state === "ok" ? "Copiado!" : state === "fail" ? "Falhou ao copiar" : "Copiar código"}
      >
        {state === "ok" ? <CheckIcon /> : state === "fail" ? <XIcon /> : <ClipboardIcon />}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}
