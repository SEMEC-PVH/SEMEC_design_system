import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Busca" };

export default function BuscaPage() {
  return (
    <PatternPage
      title="Busca"
      subtitle="Mecanismo para localizar conteúdo por palavra-chave, complementar à navegação."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Posicionar a busca em local previsível (geralmente no cabeçalho).",
            "Fornecer placeholder que indique o que pode ser buscado.",
            "Exibir resultados com título, trecho e link para o destino.",
            "Tratar a ausência de resultados com mensagem clara e sugestões.",
            "Permitir busca por Enter e, quando útil, sugestões em tempo real.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não iniciar a busca sem que o usuário digite algo.",
            "Não exibir resultados vazios sem orientação.",
            "Não usar busca como única forma de acessar conteúdo importante.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Associar o campo a um <label> visível ou aria-label.",
            "Anunciar mudanças de resultados para leitores de tela (aria-live).",
            "Garantir navegação por teclado nos resultados.",
          ],
        },
      ]}
      note="Busca e navegação trabalham juntas: a busca encontra, a navegação orienta."
    />
  );
}
