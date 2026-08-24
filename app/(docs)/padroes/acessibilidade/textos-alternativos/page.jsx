import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Textos alternativos" };

export default function TextosAlternativosPage() {
  return (
    <PatternPage
      title="Textos alternativos"
      subtitle="Descrição de imagens, ícones e elementos não textuais para tecnologias assistivas."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Descrever o conteúdo e a função da imagem, não apenas o que ela é.",
            "Usar alt vazio (alt=\"\") para imagens puramente decorativas.",
            "Fornecer texto alternativo para ícones com função.",
            "Descrever gráficos e infográficos com resumo textual.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar alt genérico como 'imagem' ou 'foto'.",
            "Não repetir no alt o texto que já está ao lado.",
            "Não deixar imagens com função sem texto alternativo.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 1.1.1 da WCAG (Texto alternativo).",
            "Garantir que ícones com função tenham nome acessível.",
            "Revisar o alt de cada imagem publicada.",
          ],
        },
      ]}
      note="Texto alternativo é a ponte entre o visual e quem não pode vê-lo."
    />
  );
}