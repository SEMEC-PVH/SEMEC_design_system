"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Iframe isolado para previews do DS.
 * - Carrega só public/proto/proto.css (sem globals.css), evita vazamento table/a.
 * - Copia variáveis L1 do documento pai (--bg, --fg etc.) e tema dark.
 * - Altura auto via ResizeObserver.
 */
export default function PreviewFrame({ children }) {
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Monta esqueleto do iframe
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/proto/proto.css"></head><body><div id="root"></div></body></html>`);
    doc.close();

    const root = doc.getElementById("root");
    // body reset isolado: remove margin/padding globais, mantém só preview
    doc.body.style.margin = "0";
    doc.body.style.padding = "0";
    doc.body.style.background = "transparent";

    // FIX 3: Injeta fallback CSS com valores L1 hardcoded.
    // Garante resolução mesmo se syncTheme() falhar (race com hydration).
    const fallbackStyle = doc.createElement("style");
    fallbackStyle.textContent = `:root{
      --color-action-primary:#3a6ca6;--color-action-primary-hover:#2f5a8a;--color-action-primary-active:#26476f;
      --color-text-on-brand:#fff;--color-text-primary:#14233a;--color-text-muted:#4b5563;--color-text-secondary:#374151;
      --color-surface-base:#fff;--color-surface-raised:#fff;--color-surface-sunken:#f5f5f5;
      --color-border-default:#e5e7eb;--color-border-strong:#78849a;--color-focus-ring:#223f99;
      --color-feedback-danger:#b91c1c;--color-feedback-danger-surface:#fef2f2;
      --color-feedback-success:#3a6420;--color-feedback-success-surface:#eef7e6;
      --color-feedback-warning:#8a5a00;--color-feedback-warning-surface:#fdf6e3;
      --color-feedback-info:#3a6ca6;--color-feedback-info-surface:#eef4fa;
      --bg:#f4f6f9;--fg:#14233a;--surface:#fff;--surface-alt:#f5f5f5;--border:#e5e7eb;
      --text-muted:#4b5563;--tint:#eef4fa;--text-strong:#14233a;--text-on-brand:#fff;
      --radius-sm:12px;--radius-md:16px;--radius-lg:24px;--radius-xl:32px;--radius-full:9999px;
    }
    [data-theme="dark"]{
      --bg:#111;--fg:#e2e8f0;--surface:#1a1a1a;--surface-alt:#222;--border:#2a2a2a;
      --text-muted:#9ca3af;--tint:#242424;--text-strong:#f1f5f9;
      --color-action-primary:#7ab3ff;--color-action-primary-hover:#9cc5ff;--color-action-primary-active:#b3d4ff;
      --color-text-on-brand:#fff;--color-text-primary:#e2e8f0;--color-text-muted:#9ca3af;
      --color-border-strong:#3f4756;--color-focus-ring:#7ab3ff;
      --color-feedback-danger:#f87171;--color-feedback-danger-surface:#2a1414;
      --color-feedback-success:#86c95b;--color-feedback-success-surface:#16261a;
      --color-feedback-warning:#f6d56e;--color-feedback-warning-surface:#2a2113;
      --color-feedback-info:#7ab3ff;--color-feedback-info-surface:#14203a;
    }`;
    doc.head.appendChild(fallbackStyle);

    // FIX 2 + FIX 1: syncTheme com variáveis expandidas + retry em 300ms
    const vars = [
      // L1 brutos
      "--bg", "--fg", "--surface", "--surface-alt", "--border",
      "--text-muted", "--tint", "--text-strong", "--text-on-brand",
      // L1 com prefixo --color-
      "--color-action-primary", "--color-action-primary-hover", "--color-action-primary-active",
      "--color-text-on-brand", "--color-text-primary", "--color-text-muted", "--color-text-secondary",
      "--color-surface-base", "--color-surface-raised", "--color-surface-sunken",
      "--color-border-default", "--color-border-strong", "--color-focus-ring",
      "--color-feedback-danger", "--color-feedback-danger-surface",
      "--color-feedback-success", "--color-feedback-success-surface",
      "--color-feedback-warning", "--color-feedback-warning-surface",
      "--color-feedback-info", "--color-feedback-info-surface",
      // shadcn theme tokens (usados por Card, Dialog, etc.)
      "--color-card", "--color-card-foreground",
      "--color-secondary", "--color-secondary-foreground",
      "--color-accent", "--color-accent-foreground",
      "--color-muted", "--color-muted-foreground",
      "--color-destructive", "--color-destructive-foreground",
      "--color-input", "--color-ring",
      // Primitivos
      "--pv-blue-50", "--pv-blue-900", "--pv-blue-hero", "--pv-blue-950",
      "--pv-green-500", "--pv-green-800",
      // Raios e fonte
      "--radius-sm", "--radius-md", "--radius-lg", "--radius-full",
      "--font-mono",
    ];
    const syncTheme = () => {
      const parentHtml = document.documentElement;
      const iframeHtml = doc.documentElement;
      iframeHtml.dataset.theme = parentHtml.dataset.theme || "light";
      const cs = getComputedStyle(parentHtml);
      vars.forEach((name) => {
        const v = cs.getPropertyValue(name);
        if (v) iframeHtml.style.setProperty(name, v.trim());
      });
    };
    syncTheme();
    // Retry: espera 300ms para garantir que CSS do pai já aplicou
    const retryTimer = setTimeout(syncTheme, 300);
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });

    setMountNode(root);

    // Auto altura
    let ro;
    const syncHeight = () => {
      if (!doc.body) return;
      iframe.style.height = doc.documentElement.scrollHeight + "px";
    };
    // espera proto.css carregar
    const link = doc.querySelector('link[href="/proto/proto.css"]');
    const onLoad = () => syncHeight();
    if (link) link.addEventListener("load", onLoad);
    // ResizeObserver no root
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(syncHeight);
      ro.observe(doc.body);
      ro.observe(doc.documentElement);
    }
    // fallback interval curto
    const iv = setInterval(syncHeight, 300);
    setTimeout(() => clearInterval(iv), 3000);

    return () => {
      observer.disconnect();
      clearTimeout(retryTimer);
      if (link) link.removeEventListener("load", onLoad);
      if (ro) ro.disconnect();
      clearInterval(iv);
    };
  }, []);

  return (
    <div className="proto-preview" style={{ padding: 0, overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        title="Preview isolado"
        style={{ width: "100%", border: 0, display: "block", background: "transparent" }}
        sandbox="allow-scripts allow-same-origin"
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </div>
  );
}
