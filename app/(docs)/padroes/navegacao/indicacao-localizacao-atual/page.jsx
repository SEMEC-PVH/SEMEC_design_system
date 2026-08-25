import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Indicação da localização atual" };

export default function IndicacaoLocalizacaoPage() {
  return (
    <PatternPage
      title="Indicação da localização atual"
      component="Indicação de localização atual"
      subtitle="Como o usuário sabe onde está dentro da estrutura da interface."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Combinar breadcrumbs, item ativo no menu e título de página.",
            "Manter o item ativo destacado na navegação principal e lateral.",
            "Usar o título da página para confirmar o contexto atual.",
            "Garantir que a localização seja perceptível sem depender só de cor.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não deixar o usuário 'perdido' sem pistas de onde está.",
            "Não usar apenas cor para indicar o item ativo.",
            "Não mudar a estrutura de navegação entre páginas.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar aria-current=\"page\" no item ativo.",
            "Garantir que o título da página seja anunciado ao navegar.",
            "Manter landmarks consistentes entre páginas.",
          ],
        },
      ]}
      note="A orientação é responsabilidade de vários elementos trabalhando juntos, não de um único."
    />
  );
}
