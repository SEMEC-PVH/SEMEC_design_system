import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Paginação" };

export default function PaginacaoPage() {
  return (
    <PatternPage
      title="Paginação"
      component="Paginação"
      subtitle="Divisão de listas longas em páginas numeradas para facilitar a navegação."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Exibir controles de página anterior e próxima.",
            "Mostrar a página atual em destaque e o total de páginas.",
            "Manter o usuário informado sobre a posição (ex.: 'Página 3 de 12').",
            "Preservar filtros e ordenação ao trocar de página.",
            "Considerar rolagem infinita apenas para conteúdo de leitura contínua.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não esconder o total de páginas ou resultados.",
            "Não reiniciar a posição da lista ao voltar de uma página.",
            "Não usar paginação quando a lista é curta o bastante para caber inteira.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Marcar a página atual com aria-current=\"page\".",
            "Garantir que os controles sejam operáveis por teclado.",
            "Anunciar a mudança de página para leitores de tela.",
          ],
        },
      ]}
      note="Paginação e ordenação/filtros devem trabalhar juntas sem perder o estado do usuário."
    />
  );
}
