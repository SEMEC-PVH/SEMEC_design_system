import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Textos de ajuda" };

export default function TextosDeAjudaPage() {
  return (
    <PatternPage
      title="Textos de ajuda"
      component="Textos de ajuda"
      subtitle="Orientação contextual sobre o que preencher em cada campo."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Usar textos de ajuda curtos e específicos, próximos ao campo.",
            "Explicar o formato esperado e o propósito do dado.",
            "Manter o texto de ajuda visível ou acessível sob demanda.",
            "Evitar repetir no texto de ajuda o que o rótulo já diz.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar placeholder como substituto de rótulo ou de texto de ajuda.",
            "Não escrever textos longos que poluam o formulário.",
            "Não usar jargão técnico incompreensível.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Associar o texto de ajuda ao campo com aria-describedby.",
            "Garantir que leitores de tela anunciem a ajuda quando relevante.",
            "Manter contraste adequado do texto de ajuda.",
          ],
        },
      ]}
      note="Ajuda deve reduzir dúvida, não criar mais texto para ler."
    />
  );
}
