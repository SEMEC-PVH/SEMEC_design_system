import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Leitores de tela" };

export default function LeitoresDeTelaPage() {
  return (
    <PatternPage
      title="Leitores de tela"
      subtitle="Compatibilidade da interface com tecnologias assistivas que leem o conteúdo."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Usar HTML semântico para que o leitor interprete a estrutura.",
            "Fornecer rótulos e descrições para todos os controles.",
            "Anunciar mudanças dinâmicas com aria-live.",
            "Testar com leitores de tela reais (NVDA, VoiceOver, TalkBack).",
            "Garantir que o conteúdo seja anunciado na ordem correta.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar divs e spans para tudo, sem semântica.",
            "Não anunciar conteúdo irrelevante ou duplicado.",
            "Não depender de interações que o leitor não consegue executar.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 4.1.2 da WCAG (Nome, função e valor).",
            "Atender ao critério 1.3.1 (Informação e relações).",
            "Testar os fluxos principais com leitor de tela.",
          ],
        },
      ]}
      note="Leitor de tela transforma a interface em áudio; semântica correta é o que torna isso possível."
    />
  );
}