"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findSequence } from "@/lib/prev-next";

/**
 * Par "anterior / próximo" no fim da página.
 *
 * Inserido uma única vez no DocsShell, depois do conteúdo. A rota atual é
 * procurada nas sequências de `lib/prev-next.js`; quando não está (home,
 * quem-somos, termos, cookies) o componente não renderiza nada — é o que
 * faz o par aparecer "quando conveniente", sem tocar em cada página.
 *
 * Na primeira posição sobra o `<span />` de reserva, para o "Próximo →"
 * continuar alinhado à direita (mesmo recurso do ComponentDoc).
 */
export default function PrevNextNav() {
  const pathname = usePathname();
  const found = findSequence(pathname);
  if (!found) return null;

  const { seq, index } = found;
  const prev = seq[index - 1];
  const next = seq[index + 1];

  return (
    <nav className="doc-nav" aria-label="Página anterior e próxima">
      {prev ? (
        <Link
          href={prev.href}
          rel="prev"
          aria-label={`Página anterior: ${prev.label}`}
        >
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} rel="next" aria-label={`Próxima página: ${next.label}`}>
          {next.label} →
        </Link>
      )}
    </nav>
  );
}
