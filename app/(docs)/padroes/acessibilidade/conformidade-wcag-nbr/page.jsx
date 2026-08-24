import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Conformidade WCAG e ABNT NBR 17225" };

export default function ConformidadeWcagNbrPage() {
  return (
    <PatternPage
      title="Conformidade WCAG e ABNT NBR 17225"
      subtitle="Normas que regem a acessibilidade digital e como aplicá-las nas interfaces SEMEC."
      sections={[
        {
          title: "WCAG 2.1/2.2",
          items: [
            "Seguir os critérios de sucesso nível AA como padrão mínimo.",
            "Organizar a conformidade pelos 4 princípios: perceptível, operável, compreensível e robusto.",
            "Documentar os critérios atendidos e os pendentes.",
            "Reavaliar a conformidade a cada mudança relevante de interface.",
          ],
        },
        {
          title: "ABNT NBR 17225",
          items: [
            "Aplicar a norma brasileira de acessibilidade em aplicações web.",
            "Usar a NBR 17225 como referência complementar à WCAG.",
            "Considerar os requisitos específicos para serviços públicos.",
            "Documentar as decisões de conformidade no guia.",
          ],
        },
        {
          title: "Processo",
          items: [
            "Realizar auditorias periódicas de acessibilidade.",
            "Testar com teclado, leitores de tela e ferramentas automáticas.",
            "Incluir pessoas com deficiência nos testes quando possível.",
            "Tratar pendências de acessibilidade como prioridade.",
          ],
        },
      ]}
      note="Conformidade não é um selo, é um processo contínuo de garantir que ninguém fique de fora."
    />
  );
}