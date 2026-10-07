"use client";

import { Breadcrumb } from "semec-ds/react";

/**
 * Trilha de navegação: raiz e níveis intermediários clicáveis, separadores
 * ocultos para leitor de tela e a página atual como texto com aria-current.
 */
export function BreadcrumbsDemo() {
  return (
    <div className="w-full max-w-2xl space-y-3 text-left">
      <div className="rounded-lg border border-border bg-surface px-4 py-3">
        <Breadcrumb
          items={[
            { label: "Início", href: "#proto" },
            { label: "Serviços", href: "#proto" },
            { label: "Tributos", href: "#proto" },
            { label: "IPTU 2026" },
          ]}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        A raiz e os níveis intermediários continuam clicáveis; o último nível é texto puro com
        aria-current=&quot;page&quot;, tudo dentro de um <code>&lt;nav&gt;</code> com aria-label.
      </p>
    </div>
  );
}
