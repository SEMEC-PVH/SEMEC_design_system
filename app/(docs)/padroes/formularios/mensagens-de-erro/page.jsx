import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Mensagens de erro" };

export default function MensagensDeErroPage() {
  return (
    <PatternPage
      title="Mensagens de erro"
      subtitle="Como comunicar o que deu errado e como o usuário pode corrigir."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Escrever mensagens específicas, indicando o campo e o problema.",
            "Explicar como corrigir, não apenas o que está errado.",
            "Exibir a mensagem próxima ao campo com erro.",
            "Usar linguagem simples, sem jargão técnico.",
            "Resumir os erros no topo do formulário para visão geral.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar mensagens genéricas como 'Dados inválidos'.",
            "Não depender apenas de cor para indicar o erro.",
            "Não apagar o que o usuário digitou ao mostrar o erro.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Associar a mensagem ao campo com aria-describedby.",
            "Anunciar o erro para leitores de tela.",
            "Garantir contraste e não usar só cor para sinalizar.",
          ],
        },
      ]}
      note="Uma boa mensagem de erro diz o que aconteceu, por quê e como resolver."
    />
  );
}
