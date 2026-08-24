import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Progresso" };

export default function ProgressoPage() {
  return (
    <PatternPage
      title="Progresso"
      subtitle="Indicação do andamento de tarefas longas, com percentual ou etapas."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Mostrar progresso para tarefas que demoram mais que alguns segundos.",
            "Exibir percentual ou etapa atual quando o progresso é mensurável.",
            "Permitir cancelar quando a tarefa for longa e cancelável.",
            "Manter o usuário informado sobre o que está acontecendo.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar barras de progresso falsas que não refletem o real.",
            "Não bloquear o usuário sem indicar quanto falta.",
            "Não abandonar o progresso ao trocar de tela.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar role=\"progressbar\" com aria-valuenow e aria-valuemax.",
            "Anunciar mudanças significativas de progresso.",
            "Respeitar prefers-reduced-motion.",
          ],
        },
      ]}
      note="Progresso reduz a ansiedade: o usuário sabe que a tarefa está avançando."
    />
  );
}