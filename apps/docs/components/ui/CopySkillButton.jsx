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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function CopySkillButton() {
  const [state, setState] = useState("idle");

  async function handleCopy() {
    try {
      const res = await fetch(`${basePath}/SEMEC-LITE.md`);
      const text = await res.text();
      const ok = await copyText(text);
      setState(ok ? "ok" : "fail");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="copy-skill-btn"
      aria-live="polite"
      aria-label={state === "ok" ? "Skill copiada!" : state === "fail" ? "Falhou ao copiar" : "Copiar skill lite"}
    >
      {state === "ok" ? <CheckIcon /> : <ClipboardIcon />}
      {state === "ok" ? " Copiado!" : state === "fail" ? " Falhou" : " Copiar skill lite"}
    </button>
  );
}
