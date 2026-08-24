import Card from "@/components/ui/Card";

/**
 * Página de padrão de UI/UX.
 *
 * Renderiza um título, subtítulo e blocos de conteúdo (boas práticas,
 * anti-padrões, acessibilidade) no estilo dos cards do guia.
 *
 * Props:
 * - title: string — título da página (h1)
 * - subtitle: string — subtítulo de contexto
 * - sections: array de { title, items: string[] } — blocos com listas
 * - note: string (opcional) — nota final em destaque
 */
export default function PatternPage({ title, subtitle, sections, note }) {
  return (
    <>
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}

      {sections.map((section) => (
        <Card key={section.title}>
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Card>
      ))}

      {note && <p className="note">{note}</p>}
    </>
  );
}
