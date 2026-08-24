import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Tamanho das áreas clicáveis" };

export default function TamanhoDasAreasClicaveisPage() {
  return (
    <PatternPage
      title="Tamanho das áreas clicáveis"
      subtitle="Alvos de toque e clique grandes o suficiente para uso confortável."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Manter alvos de toque com pelo menos 44×44 px (WCAG 2.5.5).",
            "Garantir espaçamento adequado entre alvos próximos.",
            "Expandir a área clicável para além do elemento visível quando possível.",
            "Considerar o tamanho do alvo em telas de toque e com mouse.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não criar alvos minúsculos que exigem precisão.",
            "Não colocar alvos próximos demais, causando cliques errados.",
            "Não reduzir o alvo apenas por estética.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 2.5.5 da WCAG (Tamanho do alvo).",
            "Atender ao critério 2.5.8 (Tamanho do alvo mínimo, nível AAA).",
            "Testar em dispositivos de toque reais.",
          ],
        },
      ]}
      note="Alvo pequeno frustra todos; para quem tem limitação motora, pode inviabilizar o uso."
    />
  );
}