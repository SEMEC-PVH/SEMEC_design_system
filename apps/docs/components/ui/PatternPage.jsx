/**
 * Página de padrão de UI/UX.
 *
 * Renderiza um título, subtítulo e blocos de conteúdo (boas práticas,
 * anti-padrões, acessibilidade) como texto solto, sem caixas. O único
 * elemento emoldurado é o placeholder do componente, que já tem borda
 * própria.
 *
 * Props:
 * - title: string — título da página (h1)
 * - subtitle: string — subtítulo de contexto
 * - sections: array de { title, items: string[] } — blocos com listas
 * - note: string (opcional) — nota final em destaque
 * - component: string (opcional) — nome do componente associado ao padrão;
 *   quando presente, renderiza um preview placeholder "em breve"
 */
export default function PatternPage({ title, subtitle, sections, note, component }) {
  return (
    <>
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}

      {component && (
        <div className="pattern-placeholder">
          <svg
            className="pattern-placeholder-icon"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="12" y="14" width="40" height="36" rx="5" />
            <circle cx="26" cy="28" r="4" />
            <path d="M20 44l10-10 8 8 6-6 8 8" />
          </svg>
          <p className="pattern-placeholder-title">Componente em desenvolvimento</p>
          <p className="pattern-placeholder-text">
            Exemplo visual de “{component}” em breve.
          </p>
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

      {note && <p className="note">{note}</p>}
    </>
  );
}