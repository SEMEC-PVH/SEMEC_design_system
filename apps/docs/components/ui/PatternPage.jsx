/**
 * Página de padrão de UI/UX — texto.
 *
 * Renderiza título, subtítulo e blocos de conteúdo (boas práticas,
 * anti-padrões, acessibilidade) como texto solto, sem caixas. O exemplo
 * visual, quando existe, entra como `children` — renderizado depois das
 * listas e antes da nota final. Padrões que não se beneficiam de demo
 * ficam só com o texto.
 *
 * Props:
 * - title: string — título da página (h1)
 * - subtitle: string — subtítulo de contexto
 * - sections: array de { title, items: string[] } — blocos com listas
 * - children: ReactNode (opcional) — <PatternDemo> com a demo do padrão
 * - note: string (opcional) — nota final em destaque
 */
import Link from "next/link";
import Note from "./Note";

export default function PatternPage({
  title,
  subtitle,
  sections,
  children,
  note,
  components = [],
}) {
  return (
    <>
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}

      {components && components.length > 0 && (
        <div className="my-4 rounded-md border border-border bg-surface-alt p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Componentes do kit utilizados neste padrão
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {components.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{c.label}</span>
                {c.code ? (
                  <code className="text-[11px] text-muted-foreground">&lt;{c.code} /&gt;</code>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      )}

      {sections.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      {children}

      {note && <Note>{note}</Note>}
    </>
  );
}

