"use client";

import { useEffect, useState } from "react";
import { Bot, Check, ChevronDown, ChevronRight, Code2 } from "lucide-react";
import { copyText } from "@/lib/clipboard";

function ActionIconButton({ text, title, icon: Icon, successTitle = "Copiado!" }) {
  const [state, setState] = useState("idle");

  async function handleCopy(e) {
    e.stopPropagation();
    const ok = await copyText(text);
    setState(ok ? "ok" : "fail");
    setTimeout(() => setState("idle"), 1600);
  }

  const isCopied = state === "ok";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`proto-icon-btn ${isCopied ? "is-copied" : ""}`}
      title={isCopied ? successTitle : title}
      aria-label={isCopied ? successTitle : title}
    >
      {isCopied ? (
        <Check className="proto-btn-icon" aria-hidden="true" />
      ) : (
        <Icon className="proto-btn-icon" aria-hidden="true" />
      )}
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

export default function CodeBlock({ code, filename, prompt, defaultExpanded = false }) {
  const safeCode = typeof code === "string" ? code : "";
  const safePrompt = typeof prompt === "string" ? prompt : "";
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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
    <div className={`proto-codeblock ${isExpanded ? "is-expanded" : "is-collapsed"}`}>
      <div className="proto-codeblock-head">
        <button
          type="button"
          className="proto-codeblock-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          title={isExpanded ? "Recolher código" : "Expandir código"}
        >
          <span className="proto-expand-btn">
            {isExpanded ? (
              <ChevronDown className="proto-btn-icon" aria-hidden="true" />
            ) : (
              <ChevronRight className="proto-btn-icon" aria-hidden="true" />
            )}
          </span>
          {filename && <span className="proto-codeblock-file">{filename}</span>}
        </button>

        <div className="proto-codeblock-actions">
          <ActionIconButton
            text={safeCode}
            title="Copiar código"
            icon={Code2}
          />
          {safePrompt && (
            <ActionIconButton
              text={safePrompt}
              title="Copiar prompt do agente"
              icon={Bot}
            />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="proto-codeblock-content">
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
      )}
    </div>
  );
}
