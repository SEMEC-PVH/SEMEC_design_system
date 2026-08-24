import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Sucesso" };

export default function SucessoPage() {
  return (
    <PatternPage
      title="Sucesso"
      subtitle="Confirmação de que uma ação do usuário foi concluída com êxito."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Confirmar o sucesso de forma clara e visível.",
            "Informar o que acontece a seguir, quando houver próximo passo.",
            "Usar tom positivo sem exageros.",
            "Oferecer ação de desfazer quando a ação for reversível.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não silenciar o sucesso de ações importantes.",
            "Não usar mensagens genéricas que não dizem o que foi feito.",
            "Não celebrar em excesso ações rotineiras.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o sucesso para leitores de tela (aria-live).",
            "Garantir contraste adequado da mensagem.",
            "Não depender apenas de cor ou ícone para comunicar o sucesso.",
          ],
        },
      ]}
      note="Sucesso confirma e orienta: o usuário sabe que terminou e o que vem depois."
    />
  );
}