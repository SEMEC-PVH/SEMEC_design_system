import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Pesquisa" };

export default function PesquisaPage() {
  return (
    <PatternPage
      title="Pesquisa"
      component="Campo de pesquisa"
      subtitle="Localização de registros específicos por texto dentro de um conjunto de dados."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Buscar em campos relevantes (nome, código, documento).",
            "Exibir o termo buscado e permitir limpá-lo facilmente.",
            "Mostrar a contagem de resultados encontrados.",
            "Combinar pesquisa com filtros e ordenação.",
            "Tratar busca sem resultados com mensagem e sugestões.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não buscar apenas no início do texto quando a busca parcial ajuda.",
            "Não ignorar acentos quando o usuário digita sem eles.",
            "Não exibir resultados sem indicar o que foi buscado.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Associar o campo de busca a um rótulo claro.",
            "Anunciar a contagem de resultados para leitores de tela.",
            "Garantir navegação por teclado nos resultados.",
          ],
        },
      ]}
      note="Pesquisa em dados deve ser tolerante: acentos, maiúsculas e trechos parciais."
    />
  );
}