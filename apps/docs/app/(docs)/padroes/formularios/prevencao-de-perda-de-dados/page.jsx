import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Prevenção de perda de dados" };

export default function PrevencaoDePerdaDeDadosPage() {
  return (
    <PatternPage
      title="Prevenção de perda de dados"
      component="Aviso de perda de dados"
      subtitle="Proteção do que o usuário digitou contra saídas acidentais ou erros."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Avisar antes de sair da página com dados não salvos.",
            "Salvar rascunhos automaticamente quando fizer sentido.",
            "Preservar os dados digitados ao mostrar erros de validação.",
            "Confirmar antes de ações destrutivas (cancelar, limpar, excluir).",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não descartar silenciosamente o que o usuário digitou.",
            "Não limpar o formulário inteiro por um único erro.",
            "Não permitir sair sem aviso quando há dados não salvos.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar avisos de dados não salvos para leitores de tela.",
            "Garantir que o aviso seja perceptível e acionável.",
            "Manter o foco ao retornar ao formulário.",
          ],
        },
      ]}
      note="Perder o trabalho do usuário é uma das falhas mais frustrantes; prevenir é essencial."
    />
  );
}
