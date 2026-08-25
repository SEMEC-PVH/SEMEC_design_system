import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Aviso" };

export default function AvisoPage() {
  return (
    <PatternPage
      title="Aviso"
      component="Banner de aviso"
      subtitle="Alertas sobre situações que exigem atenção, mas não são erros."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Usar avisos para situações que exigem atenção antes de prosseguir.",
            "Explicar a consequência de ignorar o aviso.",
            "Oferecer ação clara (continuar, cancelar, ajustar).",
            "Manter o tom informativo, não alarmista.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar avisos para tudo, desgastando a atenção do usuário.",
            "Não usar avisos sem ação ou sem saída.",
            "Não confundir aviso com erro ou com sucesso.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o aviso para leitores de tela.",
            "Garantir que as ações do aviso sejam acessíveis por teclado.",
            "Não depender apenas de cor para distinguir o aviso.",
          ],
        },
      ]}
      note="Aviso prepara o usuário para uma decisão; use com parcimônia para manter o valor."
    />
  );
}