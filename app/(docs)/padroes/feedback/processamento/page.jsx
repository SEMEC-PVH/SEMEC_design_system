import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Processamento" };

export default function ProcessamentoPage() {
  return (
    <PatternPage
      title="Processamento"
      component="Estado de processamento"
      subtitle="Estado de operações que rodam em segundo plano, sem bloquear o usuário."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Permitir que o usuário continue trabalhando durante o processamento.",
            "Indicar que há uma operação em andamento.",
            "Notificar a conclusão quando o processamento terminar.",
            "Tratar falhas do processamento com aviso e retry.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não bloquear a interface para processamentos que poderiam ser assíncronos.",
            "Não esquecer de avisar quando o processamento termina.",
            "Não deixar operações em segundo plano sem forma de acompanhar.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o início e o fim do processamento.",
            "Garantir que a notificação de conclusão seja acessível.",
            "Manter o foco estável durante o processamento.",
          ],
        },
      ]}
      note="Processamento assíncrono mantém o usuário produtivo; a notificação de conclusão fecha o ciclo."
    />
  );
}