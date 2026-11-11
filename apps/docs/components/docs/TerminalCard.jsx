"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";

function getTheme() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const SHIKI_THEMES = { light: "github-light", dark: "github-dark-default" };

export default function TerminalCard({
  tabs = [],
  title = "zsh",
  initialTab = 0,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState({});

  const currentTab = tabs[activeTab] || tabs[0] || { label: "bash", code: "" };
  const currentCode = currentTab.code || "";

  useEffect(() => {
    let cancelled = false;

    function highlightAll(theme) {
      import("shiki")
        .then(async ({ codeToHtml }) => {
          const results = {};
          for (let i = 0; i < tabs.length; i++) {
            const item = tabs[i];
            try {
              const html = await codeToHtml(item.code, {
                lang: item.lang || "bash",
                theme: SHIKI_THEMES[theme] || "github-dark-default",
              });
              results[i] = html;
            } catch {
              results[i] = "";
            }
          }
          if (!cancelled) {
            setHighlightedCode(results);
          }
        })
        .catch(() => {
          if (!cancelled) setHighlightedCode({});
        });
    }

    highlightAll(getTheme());

    const observer = new MutationObserver(() => {
      highlightAll(getTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [tabs]);

  async function handleCopy() {
    const ok = await copyText(currentCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-controls" aria-hidden="true">
          <span className="terminal-btn terminal-btn-close" />
          <span className="terminal-btn terminal-btn-minimize" />
          <span className="terminal-btn terminal-btn-maximize" />
        </div>
        <div className="terminal-title">
          <span>{title}</span>
        </div>
        <div className="terminal-actions">
          <button
            type="button"
            className="terminal-copy-btn"
            onClick={handleCopy}
            title={copied ? "Copiado!" : "Copiar comando"}
            aria-label={copied ? "Copiado!" : "Copiar comando"}
          >
            {copied ? (
              <Check className="terminal-copy-icon" aria-hidden="true" />
            ) : (
              <Copy className="terminal-copy-icon" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {tabs.length > 1 && (
        <div className="terminal-tabs" role="tablist" aria-label="Gerenciador de pacotes">
          {tabs.map((tab, idx) => {
            const isActive = idx === activeTab;
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={`terminal-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(idx)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="terminal-body" role="region" aria-label={`Comando para ${currentTab.label}`}>
        <div className="terminal-line">
          <span className="terminal-prompt" aria-hidden="true">$</span>
          <div className="terminal-code">
            {highlightedCode[activeTab] ? (
              <div
                className="terminal-shiki"
                dangerouslySetInnerHTML={{ __html: highlightedCode[activeTab] }}
              />
            ) : (
              <pre>
                <code>{currentCode}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
