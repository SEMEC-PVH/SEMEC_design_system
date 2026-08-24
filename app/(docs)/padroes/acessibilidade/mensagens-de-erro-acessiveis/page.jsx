import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Mensagens de erro acessíveis" };

export default function MensagensDeErroAcessiveisPage() {
  return (
    <PatternPage
      title="Mensagens de erro acessíveis"
      subtitle="Erros que são perceptíveis, compreensíveis e corrigíveis por todos."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Associar cada mensagem de erro ao campo correspondente.",
            "Anunciar erros para leitores de tela com aria-live.",
            "Explicar como corrigir, não apenas o que está errado.",
            "Não depender apenas de cor ou ícone para sinalizar o erro.",
            "Mover o foco para o primeiro campo com erro.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não mostrar erros apenas em tooltip que some ao focar.",
            "Não usar apenas borda vermelha para indicar erro.",
            "Não anunciar erros sem contexto do campo.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 3.3.1 da WCAG (Identificação de erros).",
            "Atender ao critério 3.3.3 (Sugestão de erro).",
            "Testar erros com leitor de tela e teclado.",
          ],
        },
      ]}
      note="Erro acessível é aquele que qualquer pessoa consegue perceber e corrigir."
    />
  );
}