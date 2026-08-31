"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";

function CopyButton({ text, label }) {
  const [state, setState] = useState("idle");

  async function handleCopy() {
    const ok = await copyText(text);
    setState(ok ? "ok" : "fail");
    setTimeout(() => setState("idle"), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="proto-copy"
      aria-live="polite"
    >
      {state === "ok" ? "Copiado!" : state === "fail" ? "Falhou" : label}
    </button>
  );
}

export default function CodeBlock({ code, filename, prompt }) {
  return (
    <div className="proto-codeblock">
      <div className="proto-codeblock-head">
        {filename && <span className="proto-codeblock-file">{filename}</span>}
        <span className="proto-codeblock-actions">
          <CopyButton text={code} label="Copiar código" />
          {prompt && <CopyButton text={prompt} label="Copiar prompt" />}
        </span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
