import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Confirmação" };

export default function ConfirmacaoPage() {
  return (
    <PatternPage
      title="Confirmação"
      subtitle="Pedido de confirmação antes de ações importantes ou difíceis de reverter."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Confirmar ações destrutivas, irreversíveis ou de grande impacto.",
            "Explicar o que será feito e as consequências.",
            "Oferecer opções claras (confirmar, cancelar).",
            "Usar rótulos específicos na ação de confirmação (ex.: 'Excluir', não 'OK').",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não pedir confirmação para ações triviais e reversíveis.",
            "Não usar confirmações genéricas sem contexto.",
            "Não tornar a ação de confirmação ambígua.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar role=\"alertdialog\" para diálogos de confirmação.",
            "Mover o foco para o diálogo ao abrir.",
            "Garantir operação por teclado e fechamento com Escape.",
          ],
        },
      ]}
      note="Confirmação protege contra erros; excesso de confirmações também é um erro."
    />
  );
}