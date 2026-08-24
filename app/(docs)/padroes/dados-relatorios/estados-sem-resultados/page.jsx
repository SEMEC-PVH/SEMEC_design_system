import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Estados sem resultados" };

export default function EstadosSemResultadosPage() {
  return (
    <PatternPage
      title="Estados sem resultados"
      subtitle="Como apresentar listas, buscas e filtros que não retornam dados."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Explicar por que não há resultados (busca, filtro ou dados vazios).",
            "Sugerir ações para resolver (limpar filtros, ajustar busca).",
            "Oferecer caminho para criar o primeiro registro quando aplicável.",
            "Manter o tom útil, não punitivo.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não mostrar apenas 'Nenhum resultado' sem contexto.",
            "Não deixar a tela em branco sem explicação.",
            "Não esconder os filtros que causaram o estado vazio.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o estado vazio para leitores de tela.",
            "Garantir que as ações sugeridas sejam acessíveis.",
            "Manter o foco em local útil após a mudança de estado.",
          ],
        },
      ]}
      note="Estado vazio é uma oportunidade de orientar, não um beco sem saída."
    />
  );
}