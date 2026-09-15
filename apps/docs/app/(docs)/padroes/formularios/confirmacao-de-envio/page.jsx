import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Confirmação de envio" };

export default function ConfirmacaoDeEnvioPage() {
  return (
    <PatternPage
      title="Confirmação de envio"
      component="Confirmação de envio"
      subtitle="Feedback claro após o envio bem-sucedido de um formulário."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Confirmar o sucesso com mensagem clara e visível.",
            "Informar o que acontece a seguir (ex.: prazo de resposta).",
            "Oferecer próximo passo relevante (voltar, ver registro, nova ação).",
            "Evitar duplicar envios por clique repetido.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não deixar o usuário sem saber se o envio funcionou.",
            "Não redirecionar sem aviso antes da confirmação.",
            "Não permitir envio duplicado por duplo clique.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar a confirmação para leitores de tela (aria-live).",
            "Mover o foco para a mensagem de confirmação.",
            "Garantir contraste adequado da mensagem de sucesso.",
          ],
        },
      ]}
      note="A confirmação encerra o ciclo: o usuário sabe que a ação foi concluída."
    />
  );
}
