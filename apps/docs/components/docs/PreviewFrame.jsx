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

    // Copia variáveis L1 e tema do pai
    const syncTheme = () => {
      const parentHtml = document.documentElement;
      const iframeHtml = doc.documentElement;
      iframeHtml.dataset.theme = parentHtml.dataset.theme || "light";
      // Copia propriedades custom relevantes do computedStyle
      const cs = getComputedStyle(parentHtml);
      const vars = [
        "--bg",
        "--fg",
        "--surface",
        "--surface-alt",
        "--border",
        "--text-muted",
        "--tint",
        "--text-strong",
        "--pv-blue-50",
        "--pv-blue-900",
        "--pv-blue-hero",
        "--pv-blue-950",
        "--pv-green-500",
        "--pv-green-800",
        "--color-action-primary",
        "--color-action-primary-hover",
        "--color-action-primary-active",
        "--color-text-on-brand",
        "--color-surface-base",
        "--color-surface-raised",
        "--color-surface-sunken",
        "--color-text-primary",
        "--color-text-muted",
        "--color-border-default",
        "--color-border-strong",
        "--color-focus-ring",
        "--color-feedback-danger",
        "--color-feedback-danger-surface",
        "--color-feedback-success",
        "--color-feedback-success-surface",
        "--color-feedback-warning",
        "--color-feedback-warning-surface",
        "--color-feedback-info",
        "--color-feedback-info-surface",
        "--radius-sm",
        "--radius-md",
        "--radius-lg",
        "--radius-full",
        "--font-mono",
      ];
      vars.forEach((name) => {
        const v = cs.getPropertyValue(name);
        if (v) iframeHtml.style.setProperty(name, v.trim());
      });
    };
    syncTheme();
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
