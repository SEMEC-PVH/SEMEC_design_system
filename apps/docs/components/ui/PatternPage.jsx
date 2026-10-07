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
export default function PatternPage({ title, subtitle, sections, children, note }) {
  return (
    <>
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}

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

      {note && <p className="note">{note}</p>}
    </>
  );
}
