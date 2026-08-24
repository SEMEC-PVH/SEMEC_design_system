import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Etapas de preenchimento" };

export default function EtapasDePreenchimentoPage() {
  return (
    <PatternPage
      title="Etapas de preenchimento"
      subtitle="Divisão de formulários longos em passos sequenciais para reduzir fricção."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Dividir em etapas apenas formulários realmente longos.",
            "Mostrar o progresso (ex.: 'Etapa 2 de 4').",
            "Permitir voltar à etapa anterior sem perder os dados.",
            "Validar cada etapa antes de avançar.",
            "Manter cada etapa com um objetivo claro e único.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não dividir formulários curtos em etapas desnecessárias.",
            "Não impedir o usuário de revisar etapas anteriores.",
            "Não perder os dados ao voltar ou ao errar.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar a mudança de etapa para leitores de tela.",
            "Garantir navegação por teclado entre etapas.",
            "Marcar a etapa atual e as concluídas de forma perceptível.",
          ],
        },
      ]}
      note="Etapas organizam o fluxo; nunca devem esconder o que já foi feito ou o que falta."
    />
  );
}
