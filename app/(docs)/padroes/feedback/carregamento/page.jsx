import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Carregamento" };

export default function CarregamentoPage() {
  return (
    <PatternPage
      title="Carregamento"
      subtitle="Indicação de que o sistema está processando uma solicitação do usuário."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Mostrar feedback imediato ao iniciar uma ação demorada.",
            "Usar indicadores consistentes (spinner, skeleton, barra).",
            "Exibir skeleton screens para conteúdo que substitui a página.",
            "Evitar bloqueios longos sem informação.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não deixar o usuário sem saber se a ação foi registrada.",
            "Não usar spinners infinitos sem limite de tempo.",
            "Não bloquear a interface inteira para ações rápidas.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o carregamento para leitores de tela (aria-busy, aria-live).",
            "Garantir que o indicador tenha texto alternativo quando relevante.",
            "Respeitar prefers-reduced-motion em animações de carregamento.",
          ],
        },
      ]}
      note="Carregamento comunica que o sistema está trabalhando; sem ele, o usuário duvida da ação."
    />
  );
}