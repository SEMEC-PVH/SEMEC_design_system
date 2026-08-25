import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Ordenação" };

export default function OrdenacaoPage() {
  return (
    <PatternPage
      title="Ordenação"
      component="Colunas ordenáveis"
      subtitle="Reorganização dos dados por uma coluna, em ordem crescente ou decrescente."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Permitir ordenar por qualquer coluna relevante.",
            "Indicar a coluna ordenada e a direção com seta.",
            "Manter a ordenação ao navegar entre páginas.",
            "Oferecer uma ordenação padrão sensata (ex.: mais recente primeiro).",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não permitir ordenar por colunas sem sentido.",
            "Não esconder a direção da ordenação atual.",
            "Não reiniciar a ordenação ao trocar de página.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar aria-sort no cabeçalho da coluna ordenada.",
            "Garantir que o controle de ordenação seja operável por teclado.",
            "Anunciar a mudança de ordenação para leitores de tela.",
          ],
        },
      ]}
      note="Ordenação dá controle ao usuário sobre como ler os dados."
    />
  );
}