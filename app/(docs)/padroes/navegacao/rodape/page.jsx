import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Rodapé" };

export default function RodapePage() {
  return (
    <PatternPage
      title="Rodapé"
      component="Rodapé"
      subtitle="Área inferior com informações institucionais, links complementares e contato."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Incluir informações institucionais, contato e links legais.",
            "Organizar os links em colunas com títulos claros.",
            "Manter o rodapé consistente em todas as páginas.",
            "Incluir dados de acessibilidade e políticas quando aplicável.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não duplicar no rodapé toda a navegação principal.",
            "Não usar o rodapé como depósito de links sem organização.",
            "Não omitir informações de contato e responsabilidade.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar <footer> como landmark.",
            "Garantir contraste dos textos sobre o fundo do rodapé.",
            "Manter links com rótulos descritivos.",
          ],
        },
      ]}
      note="O rodapé complementa a navegação; ele não deve ser o único caminho para conteúdo importante."
    />
  );
}
