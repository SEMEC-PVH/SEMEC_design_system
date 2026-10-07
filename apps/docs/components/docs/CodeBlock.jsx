"use client";

import { useEffect, useState } from "react";
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

function getTheme() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/* github-dark-default em vez de github-dark: o comentário do tema legado
   (#6a737d) dá 3,68:1 sobre o fundo do codeblock e reprovava no AA. */
const SHIKI_THEMES = { light: "github-light", dark: "github-dark-default" };

export default function CodeBlock({ code, filename, prompt }) {
  const safeCode = typeof code === "string" ? code : "";
  const safePrompt = typeof prompt === "string" ? prompt : "";
  const [highlighted, setHighlighted] = useState("");

  if (code !== undefined && !safeCode) {
    console.warn("[CodeBlock] `code` não é string (client reference?) para", filename);
  }

  useEffect(() => {
    if (!safeCode) return;
    let cancelled = false;

    function renderCode(theme) {
      import("shiki").then(({ codeToHtml }) => {
        return codeToHtml(safeCode, {
          lang: "tsx",
          theme: SHIKI_THEMES[theme] || "github-dark",
        });
      }).then((html) => {
        if (!cancelled) setHighlighted(html);
      }).catch(() => {
        if (!cancelled) setHighlighted("");
      });
    }

    renderCode(getTheme());

    const observer = new MutationObserver(() => {
      renderCode(getTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [safeCode]);

  return (
    <div className="proto-codeblock">
      <div className="proto-codeblock-head">
        {filename && <span className="proto-codeblock-file">{filename}</span>}
        <span className="proto-codeblock-actions">
          <CopyButton text={safeCode} label="Copiar código" />
          {safePrompt && <CopyButton text={safePrompt} label="Copiar prompt" />}
        </span>
      </div>
      {safeCode ? (
        highlighted ? (
          <div dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <pre>
            <code>{safeCode}</code>
          </pre>
        )
      ) : (
        <pre>
          <code className="proto-codeblock-empty">Snippet indisponível.</code>
        </pre>
      )}
    </div>
  );
}
