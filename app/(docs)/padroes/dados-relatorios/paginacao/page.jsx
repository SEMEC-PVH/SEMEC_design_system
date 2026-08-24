import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Paginação" };

export default function PaginacaoPage() {
  return (
    <PatternPage
      title="Paginação"
      subtitle="Divisão de grandes conjuntos de dados em páginas para navegação eficiente."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Exibir controles de página anterior e próxima.",
            "Mostrar a página atual e o total de páginas.",
            "Indicar o intervalo exibido (ex.: '1–20 de 150').",
            "Preservar filtros, busca e ordenação ao trocar de página.",
            "Considerar rolagem infinita apenas quando a comparação entre páginas não importa.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não esconder o total de registros.",
            "Não reiniciar filtros ao navegar entre páginas.",
            "Não usar paginação em conjuntos pequenos.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Marcar a página atual com aria-current=\"page\".",
            "Garantir operação por teclado nos controles.",
            "Anunciar a mudança de página para leitores de tela.",
          ],
        },
      ]}
      note="Paginação em dados deve preservar o contexto de filtros e ordenação do usuário."
    />
  );
}