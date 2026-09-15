import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Navegação lateral" };

export default function NavegacaoLateralPage() {
  return (
    <PatternPage
      title="Navegação lateral"
      component="Navegação lateral"
      subtitle="Menu em coluna que organiza as seções de um contexto, típico de áreas administrativas e documentação."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Usar para estruturas profundas ou com muitas seções no mesmo nível.",
            "Agrupar itens relacionados sob títulos de seção.",
            "Indicar claramente o item ativo e expandir o grupo correspondente.",
            "Permitir recolher grupos para reduzir ruído visual.",
            "Manter a navegação lateral visível e estável durante a navegação.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar navegação lateral para estruturas rasas (poucos itens).",
            "Não sobrecarregar com itens de níveis diferentes misturados.",
            "Não esconder a navegação lateral em telas largas sem motivo.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar <nav> com aria-label distinto do menu principal.",
            "Expor grupos recolhíveis com aria-expanded.",
            "Garantir que o estado ativo seja perceptível sem depender só de cor.",
          ],
        },
      ]}
      note="Em telas pequenas, a navegação lateral costuma virar um menu retrátil; preserve a mesma hierarquia."
    />
  );
}
