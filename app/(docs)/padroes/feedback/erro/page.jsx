import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Erro" };

export default function ErroPage() {
  return (
    <PatternPage
      title="Erro"
      subtitle="Comunicação de falhas do sistema ou de ações do usuário."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Explicar o que aconteceu em linguagem simples.",
            "Indicar como resolver ou o que tentar em seguida.",
            "Oferecer ação de recuperação quando possível (tentar novamente).",
            "Evitar culpar o usuário.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar mensagens técnicas ou códigos sem explicação.",
            "Não mostrar erros genéricos sem contexto.",
            "Não deixar o usuário sem caminho de recuperação.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o erro para leitores de tela.",
            "Garantir contraste e não usar só cor para sinalizar.",
            "Manter o foco em local útil após o erro.",
          ],
        },
      ]}
      note="Erro bom diz o que aconteceu, por quê e como seguir; erro ruim apenas bloqueia."
    />
  );
}