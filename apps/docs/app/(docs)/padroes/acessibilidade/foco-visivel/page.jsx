import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Foco visível" };

export default function FocoVisivelPage() {
  return (
    <PatternPage
      title="Foco visível"
      subtitle="Indicação clara e perceptível do elemento que está ativo no teclado."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Manter um indicador de foco visível em todos os elementos interativos.",
            "Usar anel de foco com contraste suficiente sobre o fundo.",
            "Garantir que o foco seja visível em todos os estados (hover, ativo).",
            "Não remover o outline sem fornecer alternativa visível.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não remover o outline padrão do navegador sem substituição.",
            "Não usar apenas mudança de cor para indicar foco.",
            "Não esconder o foco em elementos essenciais.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 2.4.7 da WCAG (Foco visível).",
            "Atender ao critério 1.4.11 (Contraste do indicador de foco).",
            "Testar o foco em todos os componentes interativos.",
          ],
        },
      ]}
      note="Foco visível é o que permite ao usuário de teclado saber onde está."
    />
  );
}